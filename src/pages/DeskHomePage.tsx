import { useEffect, useState } from "react";
import {
  fetchDeskStats,
  fetchOrganization,
  type DeskStats,
  type OrgDesk,
} from "../api/desk";

const NOTE_SEEN = "hostpass.notes.seen";

const EMPTY_WEEK = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map(
  (label) => ({ label, count: 0 }),
);

export default function DeskHomePage() {
  const [org, setOrg] = useState<OrgDesk | null>(null);
  const [stats, setStats] = useState<DeskStats>({
    waiting: 0,
    inside: 0,
    out: 0,
    week: [],
    hosts: [],
  });
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const [o, s] = await Promise.all([fetchOrganization(), fetchDeskStats()]);
      if (!live) return;
      setOrg(o);
      setStats(s);
    })();
    return () => {
      live = false;
    };
  }, []);

  const left = org?.daysToTrialEnd ?? null;
  const week = stats.week.length ? stats.week : EMPTY_WEEK;
  const maxWeek = Math.max(1, ...week.map((d) => d.count));
  const maxHost = Math.max(1, ...stats.hosts.map((d) => d.count));

  useEffect(() => {
    if (!org) return;
    const seen = JSON.parse(localStorage.getItem(NOTE_SEEN) ?? "{}") as Record<
      string,
      boolean
    >;
    if (org.showThreeDayWarning && !seen.d3) {
      setToast("Three days left. Pay or this desk is archived.");
      localStorage.setItem(NOTE_SEEN, JSON.stringify({ ...seen, d3: true }));
    } else if (org.showSevenDayWarning && !seen.d7) {
      setToast("Seven days left on the trial.");
      localStorage.setItem(NOTE_SEEN, JSON.stringify({ ...seen, d7: true }));
    }
  }, [org]);

  async function copyCode() {
    if (!org?.joinCode) return;
    await navigator.clipboard.writeText(org.joinCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <>
      {org?.joinCode ? (
        <div className="dk-code">
          <div>
            <small>Join code</small>
            <b>{org.joinCode}</b>
          </div>
          <button type="button" className="dk-copy" onClick={() => void copyCode()}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}

      <div className="dk-grid">
        <div className="dk-stat">
          <b>{stats.waiting}</b>
          <span>Waiting</span>
        </div>
        <div className="dk-stat">
          <b>{stats.inside}</b>
          <span>In</span>
        </div>
        <div className="dk-stat">
          <b>{stats.out}</b>
          <span>Out</span>
        </div>
      </div>

      <p className="dk-lead">Visitors this week</p>
      <div className="dk-bars">
        {week.map((d) => (
          <div className="dk-bar" key={d.label}>
            <i style={{ height: `${Math.max(6, Math.round((d.count / maxWeek) * 100))}%` }} />
            <span>{d.label}</span>
          </div>
        ))}
      </div>

      <p className="dk-lead">Staff on the desk</p>
      <div className="dk-bars">
        {(stats.hosts.length ? stats.hosts : [{ name: "—", count: 0 }]).map((d) => (
          <div className="dk-bar" key={d.name}>
            <i style={{ height: `${Math.max(6, Math.round((d.count / maxHost) * 100))}%` }} />
            <span>{d.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>

      {left !== null ? (
        <div className={`dk-days${left <= 7 ? " is-warn" : ""}`}>
          {org?.billingStatus === "archived"
            ? "Archived. Unlock to open the gate."
            : left < 0
              ? "Trial ended."
              : `${left} day${left === 1 ? "" : "s"} left`}
        </div>
      ) : null}

      {toast ? (
        <aside className="dk-toast">
          <strong>HostPass</strong>
          <p>{toast}</p>
        </aside>
      ) : null}
    </>
  );
}