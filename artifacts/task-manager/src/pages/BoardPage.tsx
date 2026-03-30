import { Board } from "@/components/kanban/Board";
import { useAuth } from "@workspace/auth-web";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Leaf, LogOut, Shield, User, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function BoardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const isAdmin = user?.role === "admin";
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "User");

  return (
    <div
      className="flex flex-col h-screen w-full relative overflow-hidden"
      style={{
        backgroundImage: "url(/images/forest-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Theme-aware dark overlay */}
      <div
        className="absolute inset-0 z-0 transition-colors duration-300"
        style={{ background: "var(--board-overlay)" }}
      />

      {/* Header */}
      <header
        className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 h-15 border-b backdrop-blur-md transition-colors duration-300"
        style={{
          background: "var(--header-bg)",
          borderColor: "var(--header-border)",
          height: "60px",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-600/80 shadow-lg text-white flex-shrink-0">
            <Leaf className="w-4 h-4" />
          </div>
          <h1
            className="font-bold text-base tracking-tight hidden sm:block"
            style={{ color: "var(--column-title)" }}
          >
            StewardDesk
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Role badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isAdmin
                ? "bg-amber-500/20 text-amber-400 border-amber-500/25"
                : "bg-green-500/20 text-green-400 border-green-500/25"
            }`}
          >
            {isAdmin ? (
              <Shield className="w-3 h-3" />
            ) : (
              <User className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{isAdmin ? "Admin" : "Member"}</span>
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="w-7 h-7 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full bg-green-700/50 border-2 border-white/15 flex items-center justify-center text-white text-xs font-bold"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="text-sm font-medium hidden md:block"
              style={{ color: "var(--column-title)" }}
            >
              {displayName}
            </span>
          </div>

          {/* Theme toggle */}
          <ThemeToggle compact />

          {/* Settings */}
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all"
            style={{ color: "var(--icon-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(128,128,128,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-all"
            style={{ color: "var(--icon-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(128,128,128,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <Board />
      </main>
    </div>
  );
}
