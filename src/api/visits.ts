import { http } from "./http";
import type { HostHit, VisitRow } from "./types";

export async function searchHosts(q: string): Promise<HostHit[]> {
  const raw = await http<{ data: HostHit[] }>(`/api/hosts/search?q=${encodeURIComponent(q)}`);
  return raw.data ?? [];
}

export async function listVisits(status?: string): Promise<VisitRow[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  const raw = await http<{ data: VisitRow[] | { data: VisitRow[] } }>(`/api/visits${suffix}`);
  const inner = raw.data;
  return Array.isArray(inner) ? inner : inner?.data ?? [];
}

export async function listAudit(q: string, status: string): Promise<VisitRow[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (status && status !== "all") params.set("status", status);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const raw = await http<{ data: VisitRow[] | { data: VisitRow[] } }>(`/api/visits${suffix}`);
  const inner = raw.data;
  return Array.isArray(inner) ? inner : inner?.data ?? [];
}

export async function checkIn(body: {
  visitor_name: string;
  visitor_phone?: string;
  purpose?: string;
  host_id: number;
}) {
  return http<{ visit: VisitRow; host_phone: string | null }>("/api/visits", {
    method: "POST",
    body,
  });
}

export function acceptVisit(id: number) {
  return http<{ visit: VisitRow }>(`/api/visits/${id}/accept`, { method: "POST" });
}

export function declineVisit(id: number) {
  return http<{ visit: VisitRow }>(`/api/visits/${id}/decline`, { method: "POST" });
}

export function holdVisit(id: number, reason: string) {
  return http<{ visit: VisitRow }>(`/api/visits/${id}/hold`, {
    method: "POST",
    body: { reason },
  });
}

export function clearVisit(id: number) {
  return http<{ visit: VisitRow }>(`/api/visits/${id}/clear`, { method: "POST" });
}

export function checkoutVisit(id: number) {
  return http<{ visit: VisitRow }>(`/api/visits/${id}/checkout`, { method: "POST" });
}