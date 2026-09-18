import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "../landing.css";
import "./desk.css";
import { clearSession, readSession } from "../session/store";
import { http } from "../api/http";

const links = [
  { to: "/desk", label: "Home", end: true },
  { to: "/desk/people", label: "People" },
  { to: "/desk/rooms", label: "Rooms" },
  { to: "/desk/keys", label: "Keys" },
  { to: "/desk/look", label: "Look" },
  { to: "/desk/log", label: "Log" },
  { to: "/desk/gate", label: "Gate" },
];

type Brand = {
  name: string;
  logoPath: string | null;
  colorPrimary: string;
  colorSecondary: string;
};

function fileUrl(path: string | null) {
  if (!path) return "/hostpass-logo.png";
  if (path.startsWith("http")) return path;
  const root = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
  return `${root.replace(/\/$/, "")}/storage/${path.replace(/^\/+/, "")}`;
}

export function DeskShell() {
  const navigate = useNavigate();
  const session = readSession();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);

  useEffect(() => {
    if (!session) navigate("/signin", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const raw = await http<{ data?: Record<string, unknown> }>("/api/organization/settings");
        const row = raw.data ?? {};
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
        /* keep HostPass defaults */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const orgName = useMemo(() => {
    if (brand?.name) return brand.name;
    const id = session?.activeOrganizationId;
    return (
      session?.memberships.find((row) => row.organizationId === id)
        ?.organizationName ?? "Desk"
    );
  }, [brand, session]);

  if (!session) return null;

  return (
    <div className="hp-page dk-page">
      <header className={`hp-header${open ? " is-open" : ""}`}>
        <NavLink to="/desk" className="hp-brand" onClick={() => setOpen(false)}>
          <img src="/hostpass-logo.png" alt="" width={36} height={36} />
          <span>HostPass</span>
          <span className="dk-brand-org">
            {brand?.logoPath ? (
              <img src={fileUrl(brand.logoPath)} alt="" width={28} height={28} />
            ) : null}
            <em className="dk-org">{orgName}</em>
          </span>
        </NavLink>

        <button
          type="button"
          className="hp-menu"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
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
          <NavLink to="/desk/notes" className="dk-bell" aria-label="Notes" onClick={() => setOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M10 18a2 2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </NavLink>
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

      <footer className="hp-foot dk-foot">
        <NavLink to="/desk" className="hp-foot-brand hp-brand">
          <img src={fileUrl(brand?.logoPath ?? null)} alt="" width={28} height={28} />
          <span>HostPass</span>
        </NavLink>
        <nav className="hp-foot-nav">
          <NavLink to="/desk/gate">Gate</NavLink>
          <NavLink to="/desk/log">Log</NavLink>
          <NavLink to="/desk/look">Look</NavLink>
        </nav>
        <p className="hp-foot-note">{orgName} keeps its own visitors.</p>
        <p className="hp-foot-copy">© {new Date().getFullYear()} HostPass</p>
        <NavLink to="/desk/gate" className="hp-btn hp-btn-primary">
          Open gate
        </NavLink>
      </footer>
    </div>
  );
}