import { useEffect, useState, type FormEvent } from "react";
import {
  checkIn,
  checkoutVisit,
  listVisits,
  searchHosts,
} from "../api/visits";
import { flattenFields, HttpError } from "../api/http";
import type { HostHit, VisitRow } from "../api/types";

export default function GatePage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<HostHit[]>([]);
  const [host, setHost] = useState<HostHit | null>(null);
  const [visitor, setVisitor] = useState({ name: "", phone: "", purpose: "" });
  const [today, setToday] = useState<VisitRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadToday() {
    try {
      setToday(await listVisits());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void loadToday();
    const timer = window.setInterval(() => void loadToday(), 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void searchHosts(q.trim())
        .then(setHits)
        .catch(() => setHits([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [q]);

  async function onCheckIn(e: FormEvent) {
    e.preventDefault();
    if (!host) {
      setError("Pick a host.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await checkIn({
        visitor_name: visitor.name.trim(),
        visitor_phone: visitor.phone.trim() || undefined,
        purpose: visitor.purpose.trim() || undefined,
        host_id: host.id,
      });
      setVisitor({ name: "", phone: "", purpose: "" });
      setHost(null);
      setQ("");
      setHits([]);
      await loadToday();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Gate</h1>
      <p className="dk-lead">Check in, then the form resets.</p>
      {error ? <p className="ag-err">{error}</p> : null}

      <form className="dk-well" onSubmit={onCheckIn}>
        <input
          placeholder="Visitor name"
          value={visitor.name}
          onChange={(e) => setVisitor({ ...visitor, name: e.target.value })}
          required
        />
        <input
          placeholder="Visitor phone"
          value={visitor.phone}
          onChange={(e) => setVisitor({ ...visitor, phone: e.target.value })}
        />
        <input
          placeholder="Purpose"
          value={visitor.purpose}
          onChange={(e) => setVisitor({ ...visitor, purpose: e.target.value })}
        />
        <input
          placeholder="Search host"
          value={host ? host.name : q}
          onChange={(e) => {
            setHost(null);
            setQ(e.target.value);
          }}
        />
        {hits.map((row) => (
          <button
            type="button"
            key={row.id}
            className="dk-row"
            onClick={() => {
              setHost(row);
              setHits([]);
              setQ(row.name);
            }}
          >
            <div>
              <strong>{row.name}</strong>
              <small>
                {row.role ?? "Staff"}
                {row.department ? ` · ${row.department}` : ""}
                {row.phone ? ` · ${row.phone}` : ""}
              </small>
            </div>
          </button>
        ))}
        {host?.phone ? <p className="dk-lead">Call host: {host.phone}</p> : null}
        <button className="dk-copy" disabled={busy} type="submit">
          {busy ? "Saving…" : "Check in"}
        </button>
      </form>

      <h2>Today</h2>
      <div className="dk-well">
        {today.map((row) => (
          <div className="dk-row" key={row.id}>
            <div>
              <strong>{row.visitor_name}</strong>
              <small>
                {row.status} · {row.host?.name}
                {row.hold_reason ? ` · ${row.hold_reason}` : ""}
              </small>
            </div>
            {row.status === "returning" || row.status === "accepted" ? (
              <button
                className="dk-yes"
                type="button"
                onClick={() => void checkoutVisit(row.id).then(loadToday)}
              >
                Gate clear
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}