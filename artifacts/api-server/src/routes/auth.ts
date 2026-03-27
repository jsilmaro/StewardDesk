import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function buildSessionUser(user: typeof usersTable.$inferSelect): SessionData["user"] {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
  };
}

// ─── Current User ──────────────────────────────────────────────────────────

router.get("/auth/user", (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated()
        ? {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profileImageUrl: req.user.profileImageUrl,
            role: req.user.role,
          }
        : null,
    }),
  );
});

// ─── Logout ────────────────────────────────────────────────────────────────

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

// ─── Email / Password ──────────────────────────────────────────────────────

router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body as Record<string, string>;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      firstName: firstName || null,
      lastName: lastName || null,
      passwordHash,
    })
    .returning();

  const sid = await createSession({ user: buildSessionUser(user) });
  setSessionCookie(res, sid);
  res.status(201).json({ user: buildSessionUser(user) });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as Record<string, string>;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sid = await createSession({ user: buildSessionUser(user) });
  setSessionCookie(res, sid);
  res.json({ user: buildSessionUser(user) });
});

// ─── Google OAuth ──────────────────────────────────────────────────────────

router.get("/auth/google", (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.status(503).json({ error: "Google login is not configured" });
    return;
  }

  const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;
  const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });

  res.redirect(url);
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    res.redirect("/?error=google_not_configured");
    return;
  }

  const { code } = req.query as Record<string, string>;
  if (!code) {
    res.redirect("/?error=google_no_code");
    return;
  }

  try {
    const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, callbackUrl);

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      res.redirect("/?error=google_invalid_token");
      return;
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase() ?? null;

    let user = (await db.select().from(usersTable).where(eq(usersTable.googleId, googleId)).limit(1))[0];

    if (!user && email) {
      user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0];
    }

    if (user) {
      const [updated] = await db
        .update(usersTable)
        .set({
          googleId,
          profileImageUrl: payload.picture ?? user.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, user.id))
        .returning();
      user = updated;
    } else {
      const nameParts = (payload.name || "").split(" ");
      const [inserted] = await db
        .insert(usersTable)
        .values({
          email,
          googleId,
          firstName: payload.given_name || nameParts[0] || null,
          lastName: payload.family_name || nameParts.slice(1).join(" ") || null,
          profileImageUrl: payload.picture ?? null,
        })
        .returning();
      user = inserted;
    }

    const sid = await createSession({ user: buildSessionUser(user) });
    setSessionCookie(res, sid);
    res.redirect("/");
  } catch (err) {
    req.log?.error?.({ err }, "Google OAuth callback error");
    res.redirect("/?error=google_auth_failed");
  }
});

// ─── Mobile logout (kept for backward compat) ──────────────────────────────

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.json({ success: true });
});

export default router;
