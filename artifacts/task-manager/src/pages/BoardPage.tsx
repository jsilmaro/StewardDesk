import { useState } from "react";
import { Board } from "@/components/kanban/Board";
import { useAuth } from "@workspace/auth-web";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Leaf, LogOut, Shield, User, Settings, PanelLeftClose, PanelLeftOpen, Share2, Check, Copy, Eye, Pencil, X } from "lucide-react";
import { useLocation } from "wouter";

type ShareRole = "editor" | "viewer";

export default function BoardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRole, setShareRole] = useState<ShareRole>("editor");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  async function generateLink(role: ShareRole) {
    setShareLoading(true);
    setShareRole(role);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: `${user?.firstName ?? "My"}'s Board` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ws = await res.json() as { inviteToken?: string; viewerToken?: string };
      const token = role === "editor" ? ws.inviteToken : (ws.viewerToken ?? ws.inviteToken);
      if (!token) throw new Error("No token returned");
      setShareLink(`${window.location.origin}/join/${token}`);
    } catch (e) {
      console.error("Share failed:", e);
      setShareLink("Error generating link — please try again");
    } finally {
      setShareLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function openShare() {
    setShareLink("");
    setCopied(false);
    setShowShareModal(true);
    generateLink("editor");
  }

  const isAdmin = user?.role === "admin";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "User");

  const sidebarBtn = "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all";
  const sidebarBtnStyle = { color: "var(--task-desc)" };

  return (
    <div
      className="flex h-screen w-full relative overflow-hidden"
      style={{
        backgroundImage: "url(/images/forest-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 z-0 transition-colors duration-300" style={{ background: "var(--board-overlay)" }} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-30 lg:z-10 h-full flex-shrink-0 flex flex-col
          border-r backdrop-blur-md transition-all duration-300
          ${sidebarOpen ? "translate-x-0 lg:w-[220px]" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:overflow-hidden"}
        `}
        style={{
          width: sidebarOpen ? "220px" : undefined,
          background: "var(--header-bg)",
          borderColor: "var(--header-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--header-border)" }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600/80 shadow-lg text-white flex-shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-base tracking-tight" style={{ color: "var(--column-title)" }}>
            StewardDesk
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <button className={sidebarBtn} style={{ ...sidebarBtnStyle, background: "var(--task-bg)" }}>
            <Leaf className="w-4 h-4 text-green-500" />
            Board
          </button>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t flex flex-col gap-1" style={{ borderColor: "var(--header-border)" }}>
          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} className="w-8 h-8 rounded-full border-2 border-white/20 object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-700/50 border-2 border-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" style={{ color: "var(--column-title)" }}>{displayName}</span>
              <div className={`flex items-center gap-1 text-xs ${isAdmin ? "text-amber-400" : "text-green-400"}`}>
                {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {isAdmin ? "Admin" : "Member"}
              </div>
            </div>
          </div>

          <ThemeToggle />

          <button
            onClick={() => navigate("/settings")}
            className={sidebarBtn}
            style={sidebarBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <button
            onClick={logout}
            className={sidebarBtn}
            style={sidebarBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Topbar — mobile menu + desktop sidebar toggle when collapsed */}
        <div
          className="flex items-center gap-3 px-4 border-b backdrop-blur-md flex-shrink-0"
          style={{ height: "56px", background: "var(--header-bg)", borderColor: "var(--header-border)" }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg transition-opacity opacity-70 hover:opacity-100"
            style={{ color: "var(--column-title)" }}
            title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          {!sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-green-600/80 text-white">
                <Leaf className="w-3 h-3" />
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--column-title)" }}>StewardDesk</span>
            </div>
          )}

          {/* Share button in topbar */}
          <button
            onClick={openShare}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
            style={{
              color: "var(--column-title)",
              borderColor: "var(--task-border)",
              background: "var(--task-bg)",
            }}
            title="Share board"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        <main className="flex-1 overflow-hidden">
          <Board />
        </main>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShareModal(false)} />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl p-6 border shadow-2xl"
            style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--column-title)" }}>Share board</h2>
              <button onClick={() => setShowShareModal(false)} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--column-title)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role picker */}
            <p className="text-xs mb-3" style={{ color: "var(--task-desc)" }}>Choose what invited people can do:</p>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => generateLink("editor")}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${shareRole === "editor" ? "border-green-500/50 bg-green-500/10 text-green-400" : ""}`}
                style={shareRole !== "editor" ? { borderColor: "var(--task-border)", color: "var(--task-desc)", background: "var(--task-bg)" } : {}}
              >
                <Pencil className="w-4 h-4" />
                Can edit
              </button>
              <button
                onClick={() => generateLink("viewer")}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${shareRole === "viewer" ? "border-green-500/50 bg-green-500/10 text-green-400" : ""}`}
                style={shareRole !== "viewer" ? { borderColor: "var(--task-border)", color: "var(--task-desc)", background: "var(--task-bg)" } : {}}
              >
                <Eye className="w-4 h-4" />
                Can view
              </button>
            </div>

            {/* Link */}
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLoading ? "Generating link…" : shareLink}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs outline-none"
                style={{ background: "var(--task-bg)", borderColor: "var(--task-border)", color: "var(--task-desc)" }}
              />
              <button
                onClick={copyLink}
                disabled={shareLoading || !shareLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: copied ? "rgba(34,197,94,0.15)" : "var(--task-bg)", color: copied ? "rgb(34,197,94)" : "var(--column-title)", border: "1px solid", borderColor: copied ? "rgba(34,197,94,0.4)" : "var(--task-border)" }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
