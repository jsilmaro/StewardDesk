import { useAuth } from "@workspace/replit-auth-web";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        backgroundImage: "url(/images/forest-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <Leaf className="w-10 h-10 text-green-300" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">
              Nature Kanban
            </h1>
            <p className="mt-2 text-lg text-green-200/90 font-medium">
              Cultivate your tasks. Grow your focus.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-sm">
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            Sign in to manage your personal task board. Admins can also manage columns and see all team tasks.
          </p>
          <button
            onClick={login}
            className="w-full py-3 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-green-500/30 active:scale-95"
          >
            Sign in to continue
          </button>
        </div>

        <p className="text-white/40 text-xs max-w-xs">
          Your tasks are private. Only admins can view all team tasks.
        </p>
      </div>
    </div>
  );
}
