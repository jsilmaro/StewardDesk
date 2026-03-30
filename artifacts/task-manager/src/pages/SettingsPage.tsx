import { useState } from "react";
import { useAuth } from "@workspace/auth-web";
import { Leaf, ArrowLeft, Loader2, Check } from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const { user, refetch } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setProfileMsg({ ok: false, text: data.error ?? "Failed to save" }); return; }
      await refetch();
      setProfileMsg({ ok: true, text: "Profile updated" });
    } catch {
      setProfileMsg({ ok: false, text: "Network error" });
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg({ ok: false, text: "Passwords don't match" }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setPwMsg({ ok: false, text: data.error ?? "Failed to update" }); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPwMsg({ ok: true, text: "Password updated" });
    } catch {
      setPwMsg({ ok: false, text: "Network error" });
    } finally {
      setPwSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all";
  const inputStyle = { background: "var(--task-bg)", borderColor: "var(--task-border)", color: "var(--task-title)" };

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ backgroundImage: "url(/images/forest-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 z-0" style={{ background: "var(--board-overlay)" }} />

      {/* Header */}
      <header
        className="relative z-10 flex items-center gap-3 px-5 h-15 border-b backdrop-blur-md"
        style={{ background: "var(--header-bg)", borderColor: "var(--header-border)", height: "60px" }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm transition-opacity opacity-70 hover:opacity-100"
          style={{ color: "var(--column-title)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-600/80 text-white">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--column-title)" }}>Settings</span>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Profile */}
        <section
          className="rounded-2xl p-6 border backdrop-blur-md"
          style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--column-title)" }}>Profile</h2>
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                className={`${inputCls} flex-1 min-w-0`} style={inputStyle}
                placeholder="First name" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={`${inputCls} flex-1 min-w-0`} style={inputStyle}
                placeholder="Last name" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              type="email" className={inputCls} style={inputStyle}
              placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {profileMsg && (
              <p className={`text-xs flex items-center gap-1 ${profileMsg.ok ? "text-green-500" : "text-red-500"}`}>
                {profileMsg.ok && <Check className="w-3 h-3" />}{profileMsg.text}
              </p>
            )}
            <button
              type="submit" disabled={profileSaving}
              className="self-end px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-all"
            >
              {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save changes
            </button>
          </form>
        </section>

        {/* Password */}
        <section
          className="rounded-2xl p-6 border backdrop-blur-md"
          style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--column-title)" }}>Change password</h2>
          <form onSubmit={savePassword} className="flex flex-col gap-3">
            <input
              type="password" className={inputCls} style={inputStyle}
              placeholder="Current password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)} required
            />
            <input
              type="password" className={inputCls} style={inputStyle}
              placeholder="New password (min. 8 chars)" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required
            />
            <input
              type="password" className={inputCls} style={inputStyle}
              placeholder="Confirm new password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required
            />
            {pwMsg && (
              <p className={`text-xs flex items-center gap-1 ${pwMsg.ok ? "text-green-500" : "text-red-500"}`}>
                {pwMsg.ok && <Check className="w-3 h-3" />}{pwMsg.text}
              </p>
            )}
            <button
              type="submit" disabled={pwSaving}
              className="self-end px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 transition-all"
            >
              {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Update password
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}
