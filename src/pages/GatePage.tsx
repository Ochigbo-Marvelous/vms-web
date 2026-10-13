import { useEffect, useState } from "react";
import { checkIn, checkoutVisit, listVisits, searchHosts } from "../api/visits";
import type { HostHit, VisitRow } from "../api/types";

export default function GatePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [query, setQuery] = useState("");
  const [hosts, setHosts] = useState<HostHit[]>([]);
  const [host, setHost] = useState<HostHit | null>(null);
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const list = await listVisits();
    setRows(list);
  }

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHosts([]);
      return;
    }
    const id = window.setTimeout(async () => {
      const hits = await searchHosts(q);
      setHosts(hits);
    }, 200);
    return () => window.clearTimeout(id);
  }, [query]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!host) return;
    setBusy(true);
    setError(null);
    try {
      await checkIn({
        visitor_name: name.trim(),
        visitor_phone: phone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        host_id: host.id,
      });
      setName("");
      setPhone("");
      setPurpose("");
      setQuery("");
      setHost(null);
      setHosts([]);
      await load();
    } catch {
      setError("Could not log visitor.");
    } finally {
      setBusy(false);
    }
  }

  async function checkout(id: number) {
    await checkoutVisit(id);
    await load();
  }

  return (
    <section className="gate">
      <header className="gate-top">
        <div>
          <h1>Gate</h1>
          <p>Log visitors and clear them out.</p>
        </div>
      </header>

      <form className="gate-form" onSubmit={submit}>
        <label>
          Visitor name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          Purpose
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </label>
        <label>
          Host
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHost(null);
            }}
            placeholder="Search staff name"
          />
        </label>
        {hosts.length > 0 && !host ? (
          <ul className="gate-hits">
            {hosts.map((h) => (
              <li key={h.id}>
                <button type="button" onClick={() => { setHost(h); setQuery(h.name); setHosts([]); }}>
                  {h.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {host ? <p className="gate-picked">Host: {host.name}</p> : null}
        {error ? <p className="gate-err">{error}</p> : null}
        <button type="submit" className="gate-submit" disabled={busy || !host}>
          {busy ? "Logging…" : "Log visitor"}
        </button>
      </form>

      <div className="gate-list">
        {rows.length === 0 ? <p className="quiet">No visitors today.</p> : null}
        {rows.map((row) => (
          <article key={row.id} className="gate-card">
            <header>
              <strong>{row.visitor_name}</strong>
              <em className={`pill is-${row.status}`}>{row.status.replace("_", " ")}</em>
            </header>
            <p>{row.visitor_phone || "—"}</p>
            <p>Host: {row.host?.name || "—"}</p>
            {row.purpose ? <p>Purpose: {row.purpose}</p> : null}
            {row.host?.phone ? (
              <a className="gate-call" href={`tel:${row.host.phone}`}>Call host</a>
            ) : null}
            {row.status !== "checked_out" ? (
              <button type="button" onClick={() => void checkout(row.id)}>Confirm exit</button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}