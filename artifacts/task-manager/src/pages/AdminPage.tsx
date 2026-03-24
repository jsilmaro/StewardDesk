import { useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAdminStats, useAdminUsers, useAdminTasks, useChangeUserRole } from "@/hooks/use-admin";
import { useColumns, useCreateColumn, useDeleteColumn } from "@/hooks/use-kanban";
import {
  LayoutDashboard, Users, ListTodo, Columns3, LogOut, Leaf,
  Plus, Trash2, RefreshCw, Shield, User, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "overview" | "tasks" | "users" | "columns";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>("overview");

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email?.split("@")[0] ?? "Admin");

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "tasks", label: "Task Monitor", icon: <ListTodo className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "columns", label: "Columns", icon: <Columns3 className="w-4 h-4" /> },
  ];

  return (
    <div
      className="h-screen w-full flex relative overflow-hidden"
      style={{
        backgroundImage: "url(/images/forest-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 z-0" style={{ background: "var(--board-overlay)" }} />

      {/* ── Sidebar ── */}
      <aside
        className="relative z-10 flex flex-col w-56 flex-shrink-0 h-full border-r"
        style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-[60px] border-b flex-shrink-0" style={{ borderColor: "var(--column-divider)" }}>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-600/80 text-white flex-shrink-0">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold leading-none" style={{ color: "var(--column-title)" }}>Nature Kanban</p>
            <p className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold mt-0.5">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                section === item.id
                  ? "bg-green-600/20 text-green-500 dark:text-green-400 border border-green-600/25"
                  : "border border-transparent"
              )}
              style={section === item.id ? {} : { color: "var(--icon-muted)" }}
            >
              {item.icon}
              {item.label}
              {section === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>

        {/* User + actions */}
        <div className="flex-shrink-0 px-3 pb-4 pt-3 border-t space-y-2" style={{ borderColor: "var(--column-divider)" }}>
          <div className="flex items-center gap-2 px-2">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} className="w-7 h-7 rounded-full border border-white/20 object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-600/50 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--column-title)" }}>{displayName}</p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">Administrator</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <ThemeToggle compact />
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: "var(--icon-muted)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(128,128,128,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Section header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 h-[60px] border-b backdrop-blur-md"
          style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
        >
          <div>
            <h1 className="font-bold text-base" style={{ color: "var(--column-title)" }}>
              {navItems.find((n) => n.id === section)?.label}
            </h1>
            <p className="text-xs" style={{ color: "var(--task-meta)" }}>
              {section === "overview" && "Site-wide activity summary"}
              {section === "tasks" && "All tasks across all users — read only"}
              {section === "users" && "Registered users and role management"}
              {section === "columns" && "Manage kanban columns for all users"}
            </p>
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === "overview" && <OverviewSection />}
          {section === "tasks" && <TasksSection />}
          {section === "users" && <UsersSection />}
          {section === "columns" && <ColumnsSection />}
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Overview
────────────────────────────────────────────────────────── */
function OverviewSection() {
  const { data: stats, isLoading, refetch } = useAdminStats();
  const { data: tasks } = useAdminTasks();

  const priorityColor = { low: "text-emerald-500", medium: "text-amber-500", high: "text-red-500" };

  const recentTasks = tasks?.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: isLoading ? "—" : stats?.users, icon: <Users className="w-5 h-5" />, accent: "text-blue-500 dark:text-blue-400" },
          { label: "Total Tasks", value: isLoading ? "—" : stats?.tasks, icon: <ListTodo className="w-5 h-5" />, accent: "text-green-500 dark:text-green-400" },
          { label: "Columns", value: isLoading ? "—" : stats?.columns, icon: <Columns3 className="w-5 h-5" />, accent: "text-amber-500 dark:text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
            <div className={`${s.accent} mb-3`}>{s.icon}</div>
            <div className="text-3xl font-bold mb-1" style={{ color: "var(--column-title)" }}>{String(s.value)}</div>
            <div className="text-xs font-medium" style={{ color: "var(--task-meta)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Priority breakdown */}
      {stats?.tasksByPriority && stats.tasksByPriority.length > 0 && (
        <div className="rounded-2xl border p-5 backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--column-title)" }}>Tasks by Priority</h3>
          <div className="flex gap-6">
            {stats.tasksByPriority.map((p) => (
              <div key={p.priority} className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${priorityColor[p.priority as keyof typeof priorityColor] ?? "text-gray-400"}`}>{p.count}</span>
                <span className="text-xs capitalize" style={{ color: "var(--task-meta)" }}>{p.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="rounded-2xl border overflow-hidden backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--column-divider)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--column-title)" }}>Recent Activity</h3>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--icon-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)"; }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--column-divider)" }}>
          {recentTasks?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                t.priority === "high" ? "bg-red-500" : t.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--task-title)" }}>{t.title}</p>
                <p className="text-xs" style={{ color: "var(--task-meta)" }}>
                  {t.ownerFirstName ?? t.ownerEmail ?? "Unknown user"} · {t.columnTitle ?? "Unknown column"}
                </p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--task-meta)" }}>
                {new Date(t.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {!recentTasks?.length && (
            <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--task-meta)" }}>No tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Task Monitor
────────────────────────────────────────────────────────── */
function TasksSection() {
  const { data: tasks, isLoading, refetch } = useAdminTasks();
  const [filter, setFilter] = useState<string>("all");

  const columns = [...new Set(tasks?.map((t) => t.columnTitle).filter(Boolean))];
  const filtered = filter === "all" ? tasks : tasks?.filter((t) => t.columnTitle === filter);

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {["all", ...columns].map((col) => (
          <button
            key={col ?? "all"}
            onClick={() => setFilter(col ?? "all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              filter === col
                ? "bg-green-600/20 text-green-500 dark:text-green-400 border-green-600/25"
                : "border-transparent"
            )}
            style={filter === col ? {} : { color: "var(--task-meta)", borderColor: "var(--column-border)" }}
          >
            {col === "all" ? "All Columns" : col}
          </button>
        ))}
        <button onClick={() => refetch()} className="ml-auto p-1.5 rounded-lg transition-colors" style={{ color: "var(--icon-muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--icon-muted)"; }}>
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
        {/* Header */}
        <div className="grid grid-cols-[1fr_140px_100px_90px_90px] gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--column-divider)", color: "var(--task-meta)" }}>
          <span>Task</span><span>Owner</span><span>Column</span><span>Priority</span><span>Date</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--task-meta)" }}>Loading tasks…</div>
        ) : filtered?.length ? (
          <div className="divide-y" style={{ borderColor: "var(--column-divider)" }}>
            {filtered.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_140px_100px_90px_90px] gap-4 items-center px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--task-title)" }}>{t.title}</p>
                  {t.description && <p className="text-xs truncate" style={{ color: "var(--task-meta)" }}>{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {t.ownerImageUrl ? (
                    <img src={t.ownerImageUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-green-700/40 flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold">
                      {(t.ownerFirstName ?? t.ownerEmail ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs truncate" style={{ color: "var(--task-desc)" }}>
                    {t.ownerFirstName ?? t.ownerEmail ?? "—"}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--task-desc)" }}>{t.columnTitle ?? "—"}</span>
                <span className={`text-xs font-medium capitalize ${
                  t.priority === "high" ? "text-red-500 dark:text-red-400" :
                  t.priority === "medium" ? "text-amber-500 dark:text-amber-400" :
                  "text-emerald-500 dark:text-emerald-400"
                }`}>{t.priority}</span>
                <span className="text-xs" style={{ color: "var(--task-meta)" }}>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm" style={{ color: "var(--task-meta)" }}>No tasks found</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Users
────────────────────────────────────────────────────────── */
function UsersSection() {
  const { data: users, isLoading } = useAdminUsers();
  const { mutate: changeRole, isPending } = useChangeUserRole();
  const { user: me } = useAuth();

  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border overflow-hidden backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
        <div className="grid grid-cols-[1fr_120px_80px_90px] gap-4 px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--column-divider)", color: "var(--task-meta)" }}>
          <span>User</span><span>Tasks</span><span>Joined</span><span>Role</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--task-meta)" }}>Loading users…</div>
        ) : users?.length ? (
          <div className="divide-y" style={{ borderColor: "var(--column-divider)" }}>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_120px_80px_90px] gap-4 items-center px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${u.role === "admin" ? "bg-amber-600/60" : "bg-green-700/50"}`}>
                      {(u.firstName ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--task-title)" }}>
                      {u.firstName ? `${u.firstName}${u.lastName ? " " + u.lastName : ""}` : "—"}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--task-meta)" }}>{u.email ?? "—"}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--task-title)" }}>{u.taskCount}</span>
                <span className="text-xs" style={{ color: "var(--task-meta)" }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                <div>
                  {u.id === me?.id ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/25">
                      <Shield className="w-3 h-3" /> You
                    </span>
                  ) : (
                    <button
                      disabled={isPending}
                      onClick={() => changeRole({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all",
                        u.role === "admin"
                          ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/25"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                      style={u.role !== "admin" ? { color: "var(--task-meta)" } : {}}
                      title={u.role === "admin" ? "Click to demote to user" : "Click to promote to admin"}
                    >
                      {u.role === "admin" ? <><Shield className="w-3 h-3" /> Admin</> : <><User className="w-3 h-3" /> Member</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm" style={{ color: "var(--task-meta)" }}>No users found</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Columns
────────────────────────────────────────────────────────── */
function ColumnsSection() {
  const { data: columns, isLoading } = useColumns();
  const { mutate: deleteColumn, isPending: isDeleting } = useDeleteColumn();
  const { mutate: createColumn, isPending: isCreating } = useCreateColumn();
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createColumn({ data: { title: newTitle.trim(), position: columns?.length ?? 0 } }, {
      onSuccess: () => setNewTitle(""),
    });
  };

  return (
    <div className="max-w-xl space-y-4">
      {/* Add column form */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New column name…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-green-500/30 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 bg-white border-black/10 text-gray-900"
        />
        <button
          type="submit"
          disabled={isCreating || !newTitle.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Add Column
        </button>
      </form>

      {/* Column list */}
      <div className="rounded-2xl border overflow-hidden backdrop-blur-sm" style={{ background: "var(--column-bg)", borderColor: "var(--column-border)" }}>
        {isLoading ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--task-meta)" }}>Loading…</p>
        ) : columns?.length ? (
          <div className="divide-y" style={{ borderColor: "var(--column-divider)" }}>
            {columns.map((col) => (
              <div key={col.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--task-title)" }}>{col.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--task-meta)" }}>Position {col.position + 1}</p>
                </div>
                <button
                  onClick={() => deleteColumn({ id: col.id })}
                  disabled={isDeleting}
                  className="p-2 rounded-lg transition-colors text-red-500 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  title="Delete column"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm" style={{ color: "var(--task-meta)" }}>No columns yet</p>
        )}
      </div>

      <p className="text-xs px-1" style={{ color: "var(--task-meta)" }}>
        Columns are shared across all users. Deleting a column removes it from everyone's board.
      </p>
    </div>
  );
}
