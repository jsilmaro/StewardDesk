import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── types ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: number;
  tasks: number;
  columns: number;
  tasksByPriority: { priority: string; count: number }[];
}

export interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "admin" | "user";
  createdAt: string;
  taskCount: number;
}

export interface AdminTask {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  columnId: number;
  columnTitle: string | null;
  userId: string | null;
  ownerEmail: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerImageUrl: string | null;
  createdAt: string;
}

// ── fetchers ───────────────────────────────────────────────────────────────

async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(`/api/admin${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── hooks ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchAdmin<AdminStats>("/stats"),
    refetchInterval: 30_000,
  });
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => fetchAdmin<AdminUser[]>("/users"),
    refetchInterval: 60_000,
  });
}

export function useAdminTasks() {
  return useQuery<AdminTask[]>({
    queryKey: ["admin", "tasks"],
    queryFn: () => fetchAdmin<AdminTask[]>("/tasks"),
    refetchInterval: 30_000,
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }).then((r) => {
        if (!r.ok) throw new Error("Role change failed");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
