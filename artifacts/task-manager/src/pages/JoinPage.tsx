import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Leaf, Loader2 } from "lucide-react";
import { useAuth } from "@workspace/auth-web";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "joining" | "done" | "error">("loading");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      // store token and redirect to login
      sessionStorage.setItem("pendingInvite", token);
      navigate("/");
      return;
    }
    // preview workspace
    fetch(`/api/workspaces/join/${token}`)
      .then((r) => r.json())
      .then((d: { name?: string; error?: string }) => {
        if (d.error) { setError(d.error); setStatus("error"); return; }
        setWorkspaceName(d.name ?? "Board");
        setStatus("joining");
      })
      .catch(() => { setError("Network error"); setStatus("error"); });
  }, [isLoading, isAuthenticated, token, navigate]);

  async function join() {
    setStatus("loading");
    const res = await fetch(`/api/workspaces/join/${token}`, { method: "POST", credentials: "include" });
    const d = await res.json() as { workspaceId?: number; error?: string };
    if (!res.ok) { setError(d.error ?? "Failed to join"); setStatus("error"); return; }
    navigate(`/?workspace=${d.workspaceId}`);
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{ backgroundImage: "url(/images/forest-bg.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0" style={{ background: "var(--board-overlay)" }} />
      <div
        className="relative z-10 rounded-2xl p-8 border backdrop-blur-md flex flex-col items-center gap-5 w-full max-w-sm mx-4"
        style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-600/80 text-white">
          <Leaf className="w-6 h-6" />
        </div>
        {status === "loading" && <Loader2 className="w-6 h-6 animate-spin text-green-500" />}
        {status === "joining" && (
          <>
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: "var(--task-desc)" }}>You've been invited to</p>
              <h2 className="text-xl font-bold" style={{ color: "var(--column-title)" }}>{workspaceName}</h2>
            </div>
            <button
              onClick={join}
              className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all"
            >
              Join board
            </button>
          </>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
