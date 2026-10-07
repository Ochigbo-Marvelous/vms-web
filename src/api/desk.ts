import { http } from "./http";

export type OrgDesk = {
  name: string;
  joinCode: string;
  billingStatus: string;
  trialEndsAt: string | null;
  daysToTrialEnd: number | null;
  showSevenDayWarning: boolean;
  showThreeDayWarning: boolean;
};

export type DeskNeed = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type DeskVisit = {
  id: string;
  name: string;
  host: string;
  status: string;
  createdAt: string | null;
};

export type DeskStats = {
  waiting: number;
  inside: number;
  out: number;
  pendingStaff: number;
  week: { label: string; count: number }[];
  needs: DeskNeed[];
  latest: DeskVisit[];
  hostsToday: string[];
  longestWait: DeskVisit | null;
};

function unwrap(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, unknown>;
  }
  return row;
}

function list(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRow);
  if (!raw || typeof raw !== "object") return [];
  const row = raw as Record<string, unknown>;
  if (Array.isArray(row.data)) return row.data.filter(isRow);
  const page = row.data;
  if (page && typeof page === "object" && Array.isArray((page as Record<string, unknown>).data)) {
    return ((page as Record<string, unknown>).data as unknown[]).filter(isRow);
  }
  return [];
}

function isRow(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function str(v: unknown) {
  return typeof v === "string" ? v : null;
}

function num(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function fetchOrganization(): Promise<OrgDesk | null> {
  try {
    const [settingsRaw, billingRaw] = await Promise.all([
      http<unknown>("/api/organization/settings"),
      http<unknown>("/api/billing/status"),
    ]);
    const settings = unwrap(settingsRaw);
    const billing = unwrap(billingRaw);
    const days = typeof billing.days_to_trial_end === "number" ? billing.days_to_trial_end : null;

    return {
      name: str(settings.name) ?? "",
      joinCode: str(settings.join_code) ?? str(settings.joinCode) ?? "",
      billingStatus: str(billing.billing_status) ?? "trial",
      trialEndsAt: str(billing.trial_ends_at),
      daysToTrialEnd: days,
      showSevenDayWarning: Boolean(billing.show_seven_day_warning),
      showThreeDayWarning: Boolean(billing.show_three_day_warning),
    };
  } catch {
    return null;
  }
}

export async function fetchDeskStats(): Promise<DeskStats> {
  const empty: DeskStats = {
    waiting: 0,
    inside: 0,
    out: 0,
    pendingStaff: 0,
    week: lastSevenDays([]),
    needs: [],
    latest: [],
    hostsToday: [],
    longestWait: null,
  };

  try {
    const [analyticsRaw, pendingRaw, visitsRaw] = await Promise.all([
      http<unknown>("/api/analytics"),
      http<unknown>("/api/memberships/pending"),
      http<unknown>("/api/visits"),
    ]);
    const raw = unwrap(analyticsRaw);
    const totals = isRow(raw.totals) ? raw.totals : {};
    const byDay = Array.isArray(raw.by_day) ? (raw.by_day as { day?: string; total?: number }[]) : [];
    const pending = list(pendingRaw);
    const visits = list(visitsRaw).map(toVisit);

    return {
      waiting: num(totals.pending),
      inside: num(totals.accepted),
      out: num(totals.checked_out),
      pendingStaff: pending.length,
      week: lastSevenDays(byDay),
      needs: needsFrom(pending, visits),
      latest: visits.slice(0, 5),
      hostsToday: hostsFrom(visits),
      longestWait: longestPending(visits),
    };
  } catch {
    return empty;
  }
}

function toVisit(row: Record<string, unknown>): DeskVisit {
  const host = isRow(row.host) ? str(row.host.name) : str(row.host_name);
  return {
    id: String(row.id ?? ""),
    name: str(row.visitor_name) ?? "Visitor",
    host: host ?? "Unassigned",
    status: str(row.status) ?? "pending",
    createdAt: str(row.created_at),
  };
}

function needsFrom(pending: Record<string, unknown>[], visits: DeskVisit[]): DeskNeed[] {
  const staff = pending.slice(0, 4).map((row) => ({
    id: `staff-${String(row.id ?? "")}`,
    title: str(row.name) ?? str(unwrap(row.user).name) ?? "Staff request",
    detail: "Waiting for approval",
    href: "/admin/people",
  }));
  const waiting = visits
    .filter((row) => row.status === "pending" || row.status === "held")
    .slice(0, 4)
    .map((row) => ({
      id: `visit-${row.id}`,
      title: row.name,
      detail: row.status === "held" ? "On hold at the gate" : "Waiting on a host",
      href: "/admin/visitors",
    }));
  return [...waiting, ...staff].slice(0, 6);
}

function hostsFrom(visits: DeskVisit[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const names = visits
    .filter((row) => row.createdAt && new Date(row.createdAt).getTime() >= start.getTime())
    .map((row) => row.host)
    .filter((name) => name !== "Unassigned");
  return [...new Set(names)].slice(0, 6);
}

function longestPending(visits: DeskVisit[]) {
  return visits
    .filter((row) => row.status === "pending" && row.createdAt)
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())[0] ?? null;
}

function lastSevenDays(rows: { day?: string; total?: number }[]) {
  const map = new Map(rows.map((row) => [String(row.day).slice(0, 10), Number(row.total) || 0]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      count: map.get(key) ?? 0,
    };
  });
}