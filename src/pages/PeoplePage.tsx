import { useEffect, useState } from "react";
import {
  approveMembership,
  listMemberships,
  listPendingMemberships,
  rejectMembership,
  removeMembership,
  type DeskPerson,
} from "../api/memberships";
import { flattenFields, HttpError } from "../api/http";

export default function PeoplePage() {
  const [waiting, setWaiting] = useState<DeskPerson[]>([]);
  const [inside, setInside] = useState<DeskPerson[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [pending, all] = await Promise.all([
        listPendingMemberships(),
        listMemberships(),
      ]);
      setWaiting(pending.filter((row) => row.status === "pending"));
      setInside(all.filter((row) => row.status === "approved"));
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Could not load people.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(
    id: number,
    fn: (id: number) => Promise<unknown>,
  ) {
    setBusyId(id);
    setError("");
    try {
      await fn(id);
      await load();
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("That action failed.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <h1>People</h1>
      <p className="dk-lead">They wait until you say yes.</p>
      {error ? <p className="dk-err">{error}</p> : null}

      <section className="dk-block">
        <h2>Waiting</h2>
        <div className="dk-well">
          {loading ? (
            <>
              <div className="dk-skel" />
              <div className="dk-skel" />
            </>
          ) : waiting.length === 0 ? (
            <p className="dk-empty">Nobody waiting.</p>
          ) : (
            waiting.map((row) => (
              <div className="dk-row" key={row.id}>
                <div>
                  <strong>{row.name}</strong>
                  <small>
                    {row.username} · {row.role} · {row.department}
                  </small>
                </div>
                <div className="dk-actions">
                  <button
                    className="dk-yes"
                    disabled={busyId === row.id}
                    onClick={() => act(row.id, approveMembership)}
                  >
                    {busyId === row.id ? "…" : "Approve"}
                  </button>
                  <button
                    className="dk-no"
                    disabled={busyId === row.id}
                    onClick={() => act(row.id, rejectMembership)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="dk-block">
        <h2>In</h2>
        <div className="dk-well">
          {loading ? (
            <div className="dk-skel" />
          ) : inside.length === 0 ? (
            <p className="dk-empty">Only you so far.</p>
          ) : (
            inside.map((row) => (
              <div className="dk-row" key={row.id}>
                <div>
                  <strong>{row.name}</strong>
                  <small>
                    {row.username} · {row.role} · {row.department}
                  </small>
                </div>
                <div className="dk-actions">
                  <button
                    className="dk-no"
                    disabled={busyId === row.id}
                    onClick={() => act(row.id, removeMembership)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}