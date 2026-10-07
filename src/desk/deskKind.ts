import type { DeskKind, Membership, Session } from "../api/types";

export type { DeskKind };

export function deskKind(row: Membership | undefined): DeskKind {
  if (!row) return "staff";

  const role = (row.role ?? "").trim().toLowerCase();
  const slug = (row.roleSlug ?? "").trim().toLowerCase();

  if (row.canViewAll || slug === "admin" || role === "admin") return "admin";
  if (row.canCheckIn || slug === "security" || role === "security" || role.includes("gate")) {
    return "security";
  }
  return "staff";
}

export function activeMembership(session: Session | null): Membership | undefined {
  if (!session) return undefined;
  return (
    session.memberships.find(
      (row) =>
        row.organizationId === session.activeOrganizationId &&
        row.status === "approved",
    ) ?? session.memberships.find((row) => row.status === "approved")
  );
}

export function homePath(kind: DeskKind): string {
  if (kind === "admin") return "/admin";
  if (kind === "security") return "/gate";
  return "/staff";
}