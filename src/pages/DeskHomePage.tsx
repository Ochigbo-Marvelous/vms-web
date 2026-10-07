import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDeskStats, fetchOrganization, type DeskStats, type OrgDesk } from "../api/desk";

const NOTE_SEEN = "hostpass.notes.seen";

export default function DeskHomePage() {
  const [org, setOrg] = useState<OrgDesk | null>(null);
  const [stats, setStats] = useState<DeskStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    async function load() {
      const [o, s] = await Promise.all([fetchOrganization(), fetchDeskStats()]);
      if (!live) return;
      setOrg(o);
      setStats(s);
    }
    void load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 20000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      live = false;
      window.clearInterval(poll);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!org) return;
    const seen = JSON.parse(localStorage.getItem(NOTE_SEEN) ?? "{}") as Record<string, boolean>;
    if (org.showThreeDayWarning && !seen.d3) {
      setToast("Three days left. Pay or this desk is archived.");
      localStorage.setItem(NOTE_SEEN, JSON.stringify({ ...seen, d3: true }));
    } else if (org.showSevenDayWarning && !seen.d7) {
      setToast("Seven days left on the trial.");
      localStorage.setItem(NOTE_SEEN, JSON.stringify({ ...seen, d7: true }));
    }
  }, [org]);

  const waiting = stats?.waiting ?? 0;
  const inside = stats?.inside ?? 0;
  const out = stats?.out ?? 0;
  const pending = stats?.pendingStaff ?? 0;
  const moved = waiting + inside + out;
  const cleared = moved === 0 ? 0 : Math.round((out / moved) * 100);
  const week = stats?.week?.length ? stats.week : emptyWeek();
  const weekTotal = week.reduce((sum, day) => sum + day.count, 0);
  const todayCount = week.at(-1)?.count ?? 0;
  const todayShare = weekTotal === 0 ? 0 : Math.round((todayCount / weekTotal) * 100);
  const maxWeek = Math.max(1, ...week.map((d) => d.count));
  const clock = useMemo(() => countdown(org?.trialEndsAt, now), [org?.trialEndsAt, now]);
  const waitClock = useMemo(
    () => elapsed(stats?.longestWait?.createdAt, now),
    [stats?.longestWait?.createdAt, now],
  );
  const inviteLink = org?.joinCode ? `${window.location.origin}/join/${org.joinCode}` : "";

  async function copyCode() {
    if (!org?.joinCode) return;
    await navigator.clipboard.writeText(org.joinCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function copyInvite() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1200);
  }

  return (
    <section className="bento">
      <header className="bento-top">
        <div>
          <h1>{org?.name || "Desk"}</h1>
          <p>Today at the gate</p>
        </div>
        <div className="bento-actions">
          <span className="join-pill">{org?.joinCode || "No code"}</span>
          <button type="button" className="copy-btn" onClick={() => void copyCode()} disabled={!org?.joinCode}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="copy-btn" onClick={() => setInviteOpen(true)} disabled={!org?.joinCode}>
            Invite
          </button>
          <Link to="/admin/visitors" className="bento-add">Open gate</Link>
        </div>
      </header>

      <div className="bento-metrics">
        <article className="metric is-fill"><span>Waiting</span><strong>{waiting}</strong></article>
        <article className="metric"><span>Inside</span><strong>{inside}</strong></article>
        <article className="metric"><span>Left today</span><strong>{out}</strong></article>
        <article className="metric"><span>Pending staff</span><strong>{pending}</strong></article>
      </div>

      <div className="bento-grid">
        <article className="panel ring-card">
          <h2>Visitors this week</h2>
          <Ring value={todayShare} label={String(weekTotal)} />
          <div className="bars mini">
            {week.map((d, i) => (
              <div className="bar" key={`${d.label}-${i}`}>
                <i className={i === week.length - 1 ? "is-today" : undefined} style={{ height: `${Math.max(12, Math.round((d.count / maxWeek) * 100))}%` }} />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Needs you</h2>
          {stats?.needs.length ? (
            <ul className="needs">
              {stats.needs.map((item) => (
                <li key={item.id}>
                  <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                  <Link to={item.href}>Open</Link>
                </li>
              ))}
            </ul>
          ) : <p className="quiet">No one is waiting.</p>}
        </article>

        <article className="panel wait-card">
          <h2>At the gate</h2>
          <strong className="wait-clock">{waitClock}</strong>
          <p className="quiet">{stats?.longestWait ? stats.longestWait.name : "Gate clear"}</p>
        </article>

        <article className="panel ring-card">
          <h2>Cleared today</h2>
          <Ring value={cleared} label={`${cleared}%`} />
          <p className="quiet">{out} of {moved} visitors have left</p>
        </article>

        <article className="panel">
          <h2>Latest visitors</h2>
          {stats?.latest.length ? (
            <ul className="needs">
              {stats.latest.map((row) => (
                <li key={row.id}>
                  <div><strong>{row.name}</strong><small>{row.host}</small></div>
                  <em className={`pill is-${row.status}`}>{row.status.replace("_", " ")}</em>
                </li>
              ))}
            </ul>
          ) : <p className="quiet">No visitors yet.</p>}
        </article>

        <article className="panel">
          <h2>Hosts today</h2>
          {stats?.hostsToday.length ? (
            <div className="faces">
              {stats.hostsToday.map((name) => (
                <div key={name}><b>{initials(name)}</b><small>{name.split(" ")[0]}</small></div>
              ))}
            </div>
          ) : <p className="quiet">No hosts yet.</p>}
        </article>
      </div>

      {inviteOpen ? (
        <div className="invite-mask" onClick={() => setInviteOpen(false)}>
          <div className="invite-modal" onClick={(event) => event.stopPropagation()}>
            <h2>Invite a staff member</h2>
            <p>They open this link, pick a role, and wait for your approval.</p>
            <code>{inviteLink}</code>
            <div className="bento-actions">
              <button type="button" className="copy-btn" onClick={() => void copyInvite()}>
                {linkCopied ? "Copied" : "Copy link"}
              </button>
              <button type="button" className="copy-btn is-quiet" onClick={() => setInviteOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="clock" aria-live="polite">
        <span>Trial left</span>
        <strong>{clock}</strong>
      </aside>
      {toast ? <aside className="dk-toast"><strong>HostPass</strong><p>{toast}</p></aside> : null}
    </section>
  );
}

function Ring({ value, label }: { value: number; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} />
        <circle cx="60" cy="60" r={r} style={{ strokeDasharray: c, strokeDashoffset: offset }} />
      </svg>
      <b>{label}</b>
    </div>
  );
}

function emptyWeek() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), count: 0 };
  });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function countdown(iso: string | null | undefined, now: number) {
  if (!iso) return "—";
  const end = new Date(iso).getTime();
  if (!Number.isFinite(end)) return "—";
  return format(Math.max(0, end - now), true);
}

function elapsed(iso: string | null | undefined, now: number) {
  if (!iso) return "00:00:00";
  const start = new Date(iso).getTime();
  if (!Number.isFinite(start)) return "00:00:00";
  return format(Math.max(0, now - start), false);
}

function format(ms: number, withDays: boolean) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return withDays ? `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}