import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { flattenFields, HttpError, http } from "../api/http";
import { clearSession, readSession } from "../session/store";

type Brand = {
  name: string;
  join_code?: string;
  logo_path: string | null;
  color_primary: string;
  color_secondary: string;
};

function fileUrl(path: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const root = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
  return `${root.replace(/\/$/, "")}/storage/${path.replace(/^\/+/, "")}?v=${Date.now()}`;
}

function paint(primary: string, secondary: string) {
  document.documentElement.style.setProperty("--red", primary);
  document.documentElement.style.setProperty("--org-2", secondary);
}

function organizationId() {
  const session = readSession();
  const membership = session?.memberships?.[0] as
    | { organizationId?: number; organization_id?: number }
    | undefined;
  return membership?.organizationId ?? membership?.organization_id ?? "";
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("#b71c1c");
  const [secondary, setSecondary] = useState("#2b2e33");
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const raw = await http<{ data: Brand }>("/api/organization/settings");
    const row = raw.data;
    setBrand(row);
    setName(row.name);
    setPrimary(row.color_primary || "#b71c1c");
    setSecondary(row.color_secondary || "#2b2e33");
    paint(row.color_primary || "#b71c1c", row.color_secondary || "#2b2e33");
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof HttpError ? err.message : "Request failed."));
  }, []);

  async function saveBrand(nextName: string, nextPrimary: string, nextSecondary: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await http("/api/organization/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: nextName.trim(),
          color_primary: nextPrimary,
          color_secondary: nextSecondary,
        }),
      });
      paint(nextPrimary, nextSecondary);
      setNotice("Saved.");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? flattenFields(err.fields) ?? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    const session = readSession();
    const orgId = organizationId();
    if (!session || !orgId) {
      setError("Sign in again, then upload the logo.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const body = new FormData();
    body.set("logo", file);
    const root = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
    const response = await fetch(`${root.replace(/\/$/, "")}/api/organization/logo`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.token}`,
        "X-Organization-Id": String(orgId),
      },
      body,
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(payload.message || "Logo was rejected. Use a jpg, png, or webp under 1 MB.");
      return;
    }
    setNotice("Logo saved.");
    await load();
  }

  async function resetCode() {
    if (!window.confirm("Reset the join code? The old code stops working now.")) return;
    setBusy(true);
    setError("");
    try {
      await http("/api/organization/join-code/reset", { method: "POST" });
      setNotice("New join code is ready.");
      await load();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function closeOrganization(event: React.FormEvent) {
    event.preventDefault();
    if (confirmName.trim() !== brand?.name) {
      setError("Type the organization name exactly.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await http("/api/organization", {
        method: "DELETE",
        body: JSON.stringify({ name: confirmName.trim() }),
      });
      clearSession();
      navigate("/signin", { replace: true });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : "Request failed.");
      setBusy(false);
    }
  }

  return (
    <section className="set">
      <h1>Settings</h1>
      {error ? <p className="ag-err">{error}</p> : null}
      {notice ? <p className="set-ok">{notice}</p> : null}

      <section className="set-card">
        <h2>Profile</h2>
        <div className="set-profile">
          {brand?.logo_path ? (
            <img className="set-logo" src={fileUrl(brand.logo_path)} alt="" />
          ) : (
            <span className="set-logo set-logo-empty">Logo</span>
          )}
          <label>
            Logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveBrand(name, primary, secondary);
          }}
        >
          <label>
            Organization name
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
          </label>
          <button className="dk-copy" type="submit" disabled={busy}>Save profile</button>
        </form>
      </section>

      <form
        className="set-card"
        onSubmit={(event) => {
          event.preventDefault();
          void saveBrand(name, primary, secondary);
        }}
      >
        <h2>Appearance</h2>
        <div className="set-colors">
          <label>
            Primary
            <input
              type="color"
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                paint(e.target.value, secondary);
              }}
            />
          </label>
          <label>
            Secondary
            <input
              type="color"
              value={secondary}
              onChange={(e) => {
                setSecondary(e.target.value);
                paint(primary, e.target.value);
              }}
            />
          </label>
          <span className="set-swatch" style={{ background: primary }} />
          <span className="set-swatch is-edge" style={{ background: secondary, color: "#fff" }}>Secondary</span>
        </div>
        <button className="dk-copy" type="submit" disabled={busy}>Save colors</button>
      </form>

      <section className="set-card">
        <h2>Access</h2>
        <b>{brand?.join_code || "Hidden"}</b>
        <div className="set-row">
          <button type="button" className="dk-copy" disabled={!brand?.join_code} onClick={() => navigator.clipboard.writeText(brand?.join_code || "")}>Copy</button>
          <button type="button" className="dk-no" disabled={busy} onClick={() => void resetCode()}>Reset code</button>
        </div>
      </section>

      <form className="set-card set-danger" onSubmit={closeOrganization}>
        <h2>Danger</h2>
        <p>Type the organization name to close it. Staff will no longer be able to open this desk.</p>
        <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={brand?.name || "Organization name"} />
        <button className="set-delete" type="submit" disabled={busy || confirmName.trim() !== brand?.name}>Delete organization</button>
      </form>
    </section>
  );
}