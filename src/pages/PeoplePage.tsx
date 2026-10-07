import { useEffect, useState } from "react";
import { http } from "../api/http";

type Role = { id: number; name: string; is_system?: boolean };
type Department = { id: number; name: string };
type Permission = { id: number; name: string; slug: string };
type Person = {
  id: number;
  name: string;
  status: string;
  role: string;
  department: string;
};

function rows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRow);
  if (!raw || typeof raw !== "object") return [];
  const data = (raw as { data?: unknown }).data;
  if (Array.isArray(data)) return data.filter(isRow);
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return ((data as { data: unknown[] }).data).filter(isRow);
  }
  return [];
}

function isRow(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function text(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function reason(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function PeoplePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [pending, setPending] = useState<Person[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  async function load() {
    setError("");
    try {
      const [roleRaw, deptRaw, memberRaw, pendingRaw, permissionRaw] = await Promise.all([
        http<unknown>("/api/roles"),
        http<unknown>("/api/departments"),
        http<unknown>("/api/memberships"),
        http<unknown>("/api/memberships/pending"),
        http<unknown>("/api/permissions"),
      ]);
      setRoles(rows(roleRaw).map(toRole));
      setDepartments(rows(deptRaw).map(toDepartment));
      setPeople(rows(memberRaw).map(toPerson));
      setPending(rows(pendingRaw).map(toPerson));
      setPermissions(rows(permissionRaw).map(toPermission));
    } catch (err) {
      setError(reason(err, "Could not load people."));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const permission_slugs = data.getAll("permission_slugs").map(String);
    if (!name || permission_slugs.length === 0) {
      setFormError("Enter a role name and pick at least one permission.");
      return;
    }
    try {
      await http("/api/roles", { method: "POST", body: { name, permission_slugs } });
      form.reset();
      await load();
    } catch (err) {
      setFormError(reason(err, "Role was not saved."));
    }
  }

  async function addDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) return;
    try {
      await http("/api/departments", { method: "POST", body: { name } });
      form.reset();
      await load();
    } catch (err) {
      setFormError(reason(err, "Department was not saved."));
    }
  }

  async function decide(id: number, action: "approve" | "reject" | "remove") {
    setFormError("");
    try {
      await http(`/api/memberships/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setFormError(reason(err, "That action failed."));
    }
  }

  return (
    <section className="bento people">
      <header className="bento-top">
        <div>
          <h1>People</h1>
          <p>Who can use this desk</p>
        </div>
      </header>
      {error ? <p className="quiet">{error}</p> : null}
      {formError ? <p className="quiet">{formError}</p> : null}

      <div className="people-grid">
        <article className="panel">
          <h2>Roles</h2>
          <form onSubmit={addRole} className="add-stack">
            <div className="add-row">
              <input name="name" placeholder="Add a role" maxLength={80} required />
              <button className="copy-btn" type="submit">Add</button>
            </div>
            <div className="perm-list">
              {permissions.map((permission) => (
                <label key={permission.id}>
                  <input type="checkbox" name="permission_slugs" value={permission.slug} />
                  <span>{permission.name}</span>
                </label>
              ))}
            </div>
          </form>
          <ul className="desk-list">
            {roles.map((role) => (
              <li key={role.id}>
                <strong>{role.name}</strong>
                <small>{role.is_system ? "System" : "Custom"}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Departments</h2>
          <form onSubmit={addDepartment} className="add-row">
            <input name="name" placeholder="Add a department" maxLength={80} required />
            <button className="copy-btn" type="submit">Add</button>
          </form>
          <ul className="desk-list">
            {departments.map((dept) => (
              <li key={dept.id}>
                <strong>{dept.name}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Waiting</h2>
          {pending.length ? (
            <ul className="desk-list">
              {pending.map((person) => (
                <li key={person.id}>
                  <div>
                    <strong>{person.name}</strong>
                    <small>{person.role} · {person.department}</small>
                  </div>
                  <span className="row-actions">
                    <button className="copy-btn" type="button" onClick={() => void decide(person.id, "approve")}>Approve</button>
                    <button className="copy-btn is-quiet" type="button" onClick={() => void decide(person.id, "reject")}>Reject</button>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="quiet">No one is waiting.</p>}
        </article>
      </div>

      <article className="panel staff-panel">
        <h2>On this desk</h2>
        {people.length ? (
          <ul className="desk-list">
            {people.map((person) => (
              <li key={person.id}>
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.role} · {person.department}</small>
                </div>
                <button className="copy-btn is-quiet" type="button" onClick={() => void decide(person.id, "remove")}>Remove</button>
              </li>
            ))}
          </ul>
        ) : <p className="quiet">No approved staff yet.</p>}
      </article>
    </section>
  );
}

function toRole(row: Record<string, unknown>): Role {
  return { id: Number(row.id), name: text(row.name, "Role"), is_system: Boolean(row.is_system) };
}

function toDepartment(row: Record<string, unknown>): Department {
  return { id: Number(row.id), name: text(row.name, "Department") };
}

function toPermission(row: Record<string, unknown>): Permission {
  return { id: Number(row.id), name: text(row.name, "Permission"), slug: text(row.slug) };
}

function toPerson(row: Record<string, unknown>): Person {
  const user = isRow(row.user) ? row.user : row;
  const role = isRow(row.role) ? row.role : {};
  const department = isRow(row.department) ? row.department : {};
  return {
    id: Number(row.id),
    name: text(user.name, "Staff"),
    status: text(row.status, "pending"),
    role: text(role.name, "No role"),
    department: text(department.name, "No department"),
  };
}