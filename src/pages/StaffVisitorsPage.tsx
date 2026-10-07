import { useEffect, useState } from "react";
import {
  acceptVisit,
  clearVisit,
  declineVisit,
  holdVisit,
  listVisits,
} from "../api/visits";
import { flattenFields, HttpError } from "../api/http";
import type { VisitRow } from "../api/types";

export default function StaffVisitorsPage() {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [holdId, setHoldId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    try {
      setRows(await listVisits());
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
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

  return (
    <>
      <h1>Visitors</h1>
      <p className="dk-lead">Your queue. Refreshes every 10 seconds.</p>
      {error ? <p className="ag-err">{error}</p> : null}

      <div className="dk-well">
        {rows.length === 0 ? (
          <p className="dk-empty">No visitors yet.</p>
        ) : (
          rows.map((row) => (
            <div className="dk-row" key={row.id}>
              <div>
                <strong>{row.visitor_name}</strong>
                <small>
                  {row.status}
                  {row.purpose ? ` · ${row.purpose}` : ""}
                  {row.hold_reason ? ` · ${row.hold_reason}` : ""}
                </small>
              </div>
              <div className="dk-actions">
                {row.status === "pending" || row.status === "on_hold" ? (
                  <>
                    <button
                      className="dk-yes"
                      disabled={busy === row.id}
                      onClick={() => run(row.id, () => acceptVisit(row.id))}
                    >
                      Accept
                    </button>
                    <button
                      className="dk-no"
                      disabled={busy === row.id}
                      onClick={() => {
                        setHoldId(row.id);
                        setReason("");
                      }}
                    >
                      Hold
                    </button>
                    <button
                      className="dk-no"
                      disabled={busy === row.id}
                      onClick={() => run(row.id, () => declineVisit(row.id))}
                    >
                      Decline
                    </button>
                  </>
                ) : null}
                {row.status === "accepted" ? (
                  <button
                    className="dk-yes"
                    disabled={busy === row.id}
                    onClick={() => run(row.id, () => clearVisit(row.id))}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

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
          <button className="dk-copy" type="submit">
            Hold
          </button>
        </form>
      ) : null}
    </>
  );
}