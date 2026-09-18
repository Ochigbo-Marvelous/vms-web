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

export type DeskStats = {
  waiting: number;
  inside: number;
  out: number;
  week: { label: string; count: number }[];
  hosts: { name: string; count: number }[];
};

function unwrap(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, unknown>;
  }
  return row;
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

    const days =
      typeof billing.days_to_trial_end === "number"
        ? billing.days_to_trial_end
        : null;

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
    week: [],
    hosts: [],
  };

  try {
    const raw = unwrap(await http<unknown>("/api/analytics"));
    const totals =
      raw.totals && typeof raw.totals === "object"
        ? (raw.totals as Record<string, unknown>)
        : {};

    const byDay = Array.isArray(raw.by_day) ? raw.by_day : [];
    const week = lastSevenDays(byDay as { day?: string; total?: number }[]);

    const hosts = Array.isArray(raw.by_host)
      ? (raw.by_host as { name?: string; total?: number }[])
          .slice(0, 7)
          .map((row) => ({
            name: String(row.name ?? "Staff"),
            count: Number(row.total) || 0,
          }))
      : [];

    return {
      waiting: num(totals.pending),
      inside: num(totals.accepted),
      out: num(totals.checked_out),
      week,
      hosts,
    };
  } catch {
    return empty;
  }
}

function lastSevenDays(rows: { day?: string; total?: number }[]) {
  const map = new Map(
    rows.map((row) => [String(row.day).slice(0, 10), Number(row.total) || 0]),
  );

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