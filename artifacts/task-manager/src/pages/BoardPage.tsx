import { useState } from "react";
import { Board } from "@/components/kanban/Board";
import { useAuth } from "@workspace/auth-web";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Leaf, LogOut, Shield, User, Settings, PanelLeftClose, PanelLeftOpen, Share2, Check } from "lucide-react";
import { useLocation } from "wouter";

export default function BoardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  async function shareBoard() {
    // create or fetch workspace for this user
    const res = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: "My Board" }) });
    if (!res.ok) return;
    const ws = await res.json() as { inviteToken: string };
    const link = `${window.location.origin}/join/${ws.inviteToken}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          <button
            onClick={shareBoard}
            className={sidebarBtn}
            style={sidebarBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Link copied!" : "Share board"}
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
        </div>

        <main className="flex-1 overflow-hidden">
          <Board />
        </main>
      </div>
    </div>
  );
}
