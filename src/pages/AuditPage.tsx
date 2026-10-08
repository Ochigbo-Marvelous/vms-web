import { useEffect, useMemo, useState } from "react";
import { HttpError, http } from "../api/http";
import { listAudit } from "../api/visits";
import type { VisitRow } from "../api/types";

type Option = { id: number; name: string };
type StaffForm = {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  role_id: string;
  department_id: string;
};

const emptyForm: StaffForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  role_id: "",
  department_id: "",
};

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function clearance(row: VisitRow) {
  if (row.status === "checked_out" && row.checked_out_at) return `Cleared exit at ${when(row.checked_out_at)}`;
  if (row.status === "accepted") return "Active on campus";
  if (row.status === "returning") return "Returning to gate";
  if (row.status === "declined") return "Entry refused";
  if (row.status === "on_hold") return row.hold_reason || "On hold";
  return "Awaiting response";
}

function departmentOf(row: VisitRow) {
  const host = row.host as (VisitRow["host"] & { department?: string | null }) | null;
  return host?.department || "—";
}

function download(rows: VisitRow[]) {
  const head = ["Visitor", "Phone", "Host", "Department", "Host phone", "Purpose", "Check-in", "Clearance", "Status"];
  const body = rows.map((row) => [
    row.visitor_name,
    row.visitor_phone ?? "",
    row.host?.name ?? "",
    departmentOf(row),
    row.host?.phone ?? "",
    row.purpose ?? "",
    row.created_at,
    clearance(row),
    row.status,
  ]);
  const csv = [head, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hostpass-audit.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [roles, setRoles] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [saving, setSaving] = useState(false);
  const [issued, setIssued] = useState("");

  useEffect(() => {
    let live = true;
    listAudit(q, status)
      .then((data) => {
        if (live) setRows(data);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof HttpError ? err.message : "Request failed.");
      });
    return () => {
      live = false;
    };
  }, [q, status]);

  useEffect(() => {
    if (!open) return;
    http<{ data: Option[] }>("/api/roles").then((raw) => setRoles(raw.data ?? [])).catch(() => setRoles([]));
    http<{ data: Option[] }>("/api/departments").then((raw) => setDepartments(raw.data ?? [])).catch(() => setDepartments([]));
  }, [open]);

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((row) => row.status === "pending").length,
    campus: rows.filter((row) => row.status === "accepted" || row.status === "returning").length,
    cleared: rows.filter((row) => row.status === "checked_out").length,
    refused: rows.filter((row) => row.status === "declined").length,
  }), [rows]);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await http("/api/staff", {
        method: "POST",
        body: {
          ...form,
          role_id: Number(form.role_id),
          department_id: form.department_id ? Number(form.department_id) : null,
          password_confirmation: form.password,
        },
      });
      setIssued(form.username);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Could not register staff.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="au">
      <header className="au-head">
        <div>
          <h1>Audit</h1>
          <p>Every visitor this organization has logged.</p>
        </div>
      </header>

      <div className="au-stats">
        <article><span>Total logs</span><strong>{counts.total}</strong></article>
        <article className="is-wait"><span>Awaiting response</span><strong>{counts.pending}</strong></article>
        <article className="is-campus"><span>Still inside</span><strong>{counts.campus}</strong></article>
        <article className="is-cleared"><span>Cleared out by security</span><strong>{counts.cleared}</strong></article>
        <article className="is-refused"><span>Refused / declined</span><strong>{counts.refused}</strong></article>
      </div>

      <div className="au-panel">
        <div className="au-bar">
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search visitor, host, or department" />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All visit statuses</option>
            <option value="pending">Awaiting</option>
            <option value="accepted">On campus</option>
            <option value="checked_out">Cleared</option>
            <option value="declined">Refused</option>
          </select>
          <div className="au-actions-inline">
            <button type="button" className="au-red" onClick={() => { setOpen(true); setIssued(""); }}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" /></svg>
              Register new staff
            </button>
            <button type="button" className="au-export" onClick={() => download(rows)}>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M5 7l3 3 3-3M3 13h10" /></svg>
              Export audit logs
            </button>
          </div>
        </div>

        {error ? <p className="au-error">{error}</p> : null}

        <div className="au-table">
          <table>
            <thead>
              <tr>
                <th>Visitor name</th>
                <th>Visitor phone</th>
                <th>Host staff</th>
                <th>Host department</th>
                <th>Host phone</th>
                <th>Purpose</th>
                <th>Check-in time</th>
                <th>Security clearance</th>
                <th>Audit status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.visitor_name}</td>
                  <td>{row.visitor_phone || "—"}</td>
                  <td>{row.host?.name || "—"}</td>
                  <td>{departmentOf(row)}</td>
                  <td className="au-phone">{row.host?.phone || "—"}</td>
                  <td>{row.purpose || "—"}</td>
                  <td>{when(row.created_at)}</td>
                  <td className={row.status === "declined" ? "is-bad" : "is-ok"}>{clearance(row)}</td>
                  <td><span className={`au-pill is-${row.status}`}>{row.status.replaceAll("_", " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="au-empty">No logs for this filter.</p> : null}
        </div>
      </div>

      {open ? (
        <div className="au-modal" role="dialog" aria-modal="true">
          <form onSubmit={register}>
            <h2>Register staff</h2>
            <p>They join this organization as approved. Give them the username and password once.</p>
            <input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input required placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input required placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input required type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <select required value={form.role_id} onChange={(event) => setForm({ ...form, role_id: event.target.value })}>
              <option value="">Role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            <select value={form.department_id} onChange={(event) => setForm({ ...form, department_id: event.target.value })}>
              <option value="">Department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
            {issued ? <p>Created. Username {issued}. Password was the one you just typed. It will not be shown again.</p> : null}
            <div className="au-actions">
              <button type="button" onClick={() => setOpen(false)}>Close</button>
              <button className="au-red" disabled={saving}>{saving ? "Saving" : "Create login"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}