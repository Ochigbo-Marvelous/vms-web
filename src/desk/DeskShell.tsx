import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../landing.css";
import "./desk.css";
import { clearSession, readSession } from "../session/store";
import { http } from "../api/http";
import { activeMembership, deskKind, homePath, type DeskKind } from "./deskKind";

type Brand = {
  name: string;
  logoPath: string | null;
  colorPrimary: string;
  colorSecondary: string;
};

const NAV: Record<DeskKind, { to: string; label: string; end?: boolean }[]> = {
  admin: [
    { to: "/admin", label: "Home", end: true },
    { to: "/admin/visitors", label: "Visitors" },
    { to: "/admin/audit", label: "Audit" },
    { to: "/admin/people", label: "People" },
    { to: "/admin/settings", label: "Settings" },
  ],
  security: [{ to: "/gate", label: "Gate", end: true }],
  staff: [{ to: "/staff", label: "Visitors", end: true }],
};

function fileUrl(path: string | null) {
  if (!path) return "/hostpass-logo.png";
  if (path.startsWith("http")) return path;
  const root = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
  return `${root.replace(/\/$/, "")}/storage/${path.replace(/^\/+/, "")}`;
}

export function DeskShell({ allow }: { allow: DeskKind }) {
  const navigate = useNavigate();
  const session = readSession();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);

  const membership = useMemo(() => activeMembership(session), [session]);
  const kind = deskKind(membership);
  const links = NAV[kind];
  const homeTo = homePath(kind);

  useEffect(() => {
    if (!session || !membership) {
      navigate("/signin", { replace: true });
      return;
    }
    if (kind !== allow) {
      navigate(homeTo, { replace: true });
    }
  }, [session, membership, kind, allow, homeTo, navigate]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const raw = await http<{ data?: Record<string, unknown> } & Record<string, unknown>>(
          "/api/organization/settings",
        );
        const row = (raw.data ?? raw) as Record<string, unknown>;
        if (!live) return;
        const next: Brand = {
          name: String(row.name ?? ""),
          logoPath: typeof row.logo_path === "string" ? row.logo_path : null,
          colorPrimary: String(row.color_primary ?? "#b71c1c"),
          colorSecondary: String(row.color_secondary ?? "#2b2e33"),
        };
        setBrand(next);
        document.documentElement.style.setProperty("--red", next.colorPrimary);
        document.documentElement.style.setProperty("--org-2", next.colorSecondary);
      } catch {
        /* defaults */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const orgName = brand?.name || membership?.organizationName || "Desk";

  if (!session || !membership || kind !== allow) return null;

  return (
    <div className="hp-page dk-page">
      <header className={`hp-header${open ? " is-open" : ""}`}>
        <NavLink to={homeTo} className="hp-brand" onClick={() => setOpen(false)}>
          <img src="/hostpass-logo.png" alt="" width={36} height={36} />
          <span>HostPass</span>
          <span className="dk-brand-org">
            {brand?.logoPath ? (
              <img src={fileUrl(brand.logoPath)} alt="" width={28} height={28} />
            ) : null}
            <em className="dk-org">{orgName}</em>
          </span>
        </NavLink>
        <button type="button" className="hp-menu" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          <span />
          <span />
        </button>
        <nav className="hp-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "is-on" : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hp-header-actions">
          <button
            type="button"
            className="hp-link"
            onClick={() => {
              clearSession();
              navigate("/signin", { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="dk-main">
        <Outlet />
      </main>
    </div>
  );
}