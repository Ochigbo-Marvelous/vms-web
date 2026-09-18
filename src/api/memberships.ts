import { http } from "./http";

export type DeskPerson = {
  id: number;
  status: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department: string;
};

type RawRow = {
  id?: number;
  status?: string;
  user?: {
    name?: string;
    username?: string;
    email?: string;
  };
  role?: { name?: string } | string;
  department?: { name?: string } | string;
};

function asPerson(row: RawRow): DeskPerson | null {
  if (typeof row.id !== "number") return null;
  return {
    id: row.id,
    status: row.status ?? "pending",
    name: row.user?.name ?? "Unknown",
    username: row.user?.username ?? "",
    email: row.user?.email ?? "",
    role: typeof row.role === "string" ? row.role : row.role?.name ?? "Staff",
    department:
      typeof row.department === "string"
        ? row.department
        : row.department?.name ?? "—",
  };
}

function bag(raw: unknown): DeskPerson[] {
  const body = raw as { data?: RawRow[] } | RawRow[];
  const rows = Array.isArray(body) ? body : body.data ?? [];
  return rows.map(asPerson).filter((row): row is DeskPerson => row !== null);
}

export function listMemberships() {
  return http<unknown>("/api/memberships").then(bag);
}

export function listPendingMemberships() {
  return http<unknown>("/api/memberships/pending").then(bag);
}

export function approveMembership(id: number) {
  return http<{ message?: string }>(`/api/memberships/${id}/approve`, {
    method: "POST",
  });
}

export function rejectMembership(id: number) {
  return http<{ message?: string }>(`/api/memberships/${id}/reject`, {
    method: "POST",
  });
}

export function removeMembership(id: number) {
  return http<{ message?: string }>(`/api/memberships/${id}/remove`, {
    method: "POST",
  });
}