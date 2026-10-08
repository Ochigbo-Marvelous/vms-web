import { useEffect, useMemo, useState } from "react";
import {
  acceptVisit,
  clearVisit,
  declineVisit,
  holdVisit,
  listVisits,
} from "../api/visits";
import { flattenFields, HttpError } from "../api/http";
import type { VisitRow } from "../api/types";

type Filter = "all" | "pending" | "accepted" | "cleared" | "declined";

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "cleared", label: "Cleared" },
  { id: "declined", label: "Declined" },
];

export default function StaffVisitorsPage() {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [holdId, setHoldId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    try {
      setRows(await listVisits());
      setFailed(false);
      setError("");
    } catch (err) {
      setFailed(true);
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Request failed.");
      }
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, []);

  async function run(id: number, fn: () => Promise<unknown>) {
    setBusy(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      }
    } finally {
      setBusy(null);
    }
  }

  const visible = useMemo(
    () => rows.filter((row) => matches(row.status, filter)),
    [rows, filter],
  );

  return (
    <>
      <header className="vq-top">
        <div>
          <h1>Visitors</h1>
          <p className="dk-lead">Your queue. Refreshes every 10 seconds.</p>
        </div>
        <div className="sv-switch" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              className={filter === tab.id ? "sv-switch-btn is-on" : "sv-switch-btn"}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <p className="ag-err">{error}</p> : null}

      {failed ? null : visible.length === 0 ? (
        <p className="dk-empty">No visitors yet.</p>
      ) : (
        <div className="vq-grid">
          {visible.map((row) => (
            <article className="vq-card" key={row.id}>
              <div className="vq-head">
                <strong>{row.visitor_name}</strong>
                <em className={`pill is-${row.status}`}>{label(row.status)}</em>
              </div>
              <p className="vq-phone">{row.visitor_phone || "No phone"}</p>
              <div className="vq-purpose">
                <span>Purpose of visit</span>
                <p>{row.purpose || "Not stated"}</p>
              </div>
              <p className="vq-time">Arrived {when(row.created_at)}</p>
              {row.checked_out_at ? <p className="vq-time">Cleared {when(row.checked_out_at)}</p> : null}
              {row.hold_reason ? <p className="vq-time">Hold: {row.hold_reason}</p> : null}

              {row.status === "pending" || row.status === "on_hold" ? (
                <div className="vq-actions">
                  <button className="dk-yes" disabled={busy === row.id} onClick={() => run(row.id, () => acceptVisit(row.id))}>
                    Accept
                  </button>
                  <button className="dk-no" disabled={busy === row.id} onClick={() => { setHoldId(row.id); setReason(""); }}>
                    Hold
                  </button>
                  <button className="dk-no" disabled={busy === row.id} onClick={() => run(row.id, () => declineVisit(row.id))}>
                    Decline
                  </button>
                </div>
              ) : null}
              {row.status === "accepted" ? (
                <div className="vq-actions">
                  <button className="dk-yes" disabled={busy === row.id} onClick={() => run(row.id, () => clearVisit(row.id))}>
                    Clear
                  </button>
                </div>
              ) : null}
              {row.status === "declined" ? <p className="vq-closed">Session archived</p> : null}
            </article>
          ))}
        </div>
      )}

      {holdId ? (
        <form
          className="dk-code"
          onSubmit={(e) => {
            e.preventDefault();
            const id = holdId;
            void run(id, () => holdVisit(id, reason.trim()));
            setHoldId(null);
          }}
        >
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for hold"
            required
            minLength={3}
          />
          <button className="dk-copy" type="submit">Hold</button>
        </form>
      ) : null}
    </>
  );
}

function matches(status: string, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "pending") return status === "pending" || status === "on_hold";
  if (filter === "cleared") return status === "checked_out";
  return status === filter;
}

function label(status: string) {
  if (status === "checked_out") return "Cleared";
  if (status === "on_hold") return "On hold";
  return status.replace("_", " ");
}

function when(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}