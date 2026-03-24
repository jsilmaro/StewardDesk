import { useAuth } from "@workspace/replit-auth-web";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-colors duration-300"
        style={{ background: "var(--board-overlay)" }}
      />

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-6 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center w-18 h-18 rounded-2xl shadow-2xl border"
            style={{
              background: "var(--column-bg)",
              borderColor: "var(--column-border)",
              width: "72px",
              height: "72px",
            }}
          >
            <Leaf className="w-9 h-9 text-green-500 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold drop-shadow-lg tracking-tight text-white">
              Nature Kanban
            </h1>
            <p className="mt-2 text-base text-green-300 dark:text-green-300 font-medium drop-shadow">
              Cultivate your tasks. Grow your focus.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="w-full rounded-2xl p-8 shadow-2xl border backdrop-blur-md"
          style={{
            background: "var(--column-bg)",
            borderColor: "var(--column-border)",
          }}
        >
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: "var(--task-desc)" }}
          >
            Sign in to manage your personal task board. Admins can monitor all tasks and manage columns.
          </p>
          <button
            onClick={login}
            className="w-full py-3 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-green-600/25 active:scale-95"
          >
            Sign in to continue
          </button>
        </div>

        <p
          className="text-xs max-w-xs"
          style={{ color: "var(--task-meta)" }}
        >
          Your tasks are private. Only you can view and edit them.
        </p>
      </div>
    </div>
  );
}
