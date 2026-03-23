import { Board } from "@/components/kanban/Board";
import { useAuth } from "@workspace/replit-auth-web";
import { Leaf, LogOut, Shield, User } from "lucide-react";

export default function BoardPage() {
  const { user, logout } = useAuth();

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
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/55 z-0" />

      {/* Header */}
      <header className="relative z-10 flex-shrink-0 flex items-center justify-between px-6 h-16 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-600/80 shadow-lg text-white">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight tracking-tight">
              Nature Kanban
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isAdmin
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-green-500/20 text-green-300 border border-green-500/30"
          }`}>
            {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {isAdmin ? "Admin" : "Member"}
          </div>

          {/* User avatar + name */}
          <div className="flex items-center gap-2">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-600/60 border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-white/80 font-medium hidden sm:block">
              {displayName}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <Board />
      </main>
    </div>
  );
}
