import { Link } from "react-router-dom";
import { clearSession, readSession } from "../session/store";

export default function DeskPage() {
  const session = readSession();

  if (!session) {
    return (
      <div className="ag-page">
        <p>Session missing.</p>
        <Link to="/signin">Sign in</Link>
      </div>
    );
  }

  const org = session.memberships.find(
    (row) => row.organizationId === session.activeOrganizationId
  );

  return (
    <div className="ag-page" style={{ padding: 40 }}>
      <p>Desk</p>
      <h1>{session.user.name}</h1>
      <p>
        {org
          ? `${org.organizationName} · ${org.role} · ${org.billingStatus}`
          : "No organization on this session."}
      </p>
      <button
        type="button"
        onClick={() => {
          clearSession();
          window.location.assign("/signin");
        }}
      >
        Sign out
      </button>
    </div>
  );
}