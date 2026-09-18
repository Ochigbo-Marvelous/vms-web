import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AtSign,
  BadgeCheck,
  Camera,
  Eye,
  EyeOff,
  Hash,
  Layers,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import "../auth/auth.css";
import { HangRail } from "../auth/HangRail";
import { AshDoodles } from "../auth/AshDoodles";
import { AgSelect } from "../auth/AgSelect";
import {
  joinOrganization,
  lookupOrganization,
  requestEmailChallenge,
} from "../api/auth";
import { flattenFields, HttpError } from "../api/http";
import type { JoinLookup } from "../api/types";

function passwordChecks(value: string) {
  return {
    length: value.length >= 8,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
  };
}

function usernameChecks(value: string) {
  const trimmed = value.trim();
  return {
    length: trimmed.length >= 3,
    charset: trimmed.length === 0 || /^[A-Za-z0-9_]+$/.test(trimmed),
  };
}

export default function JoinPage() {
  const [beat, setBeat] = useState<1 | 2 | 3 | 4>(1);
  const [code, setCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [lookup, setLookup] = useState<JoinLookup | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role_id: "",
    department_id: "",
    password: "",
    password_confirmation: "",
  });

  const checks = passwordChecks(form.password);
  const passwordOk = checks.length && checks.letter && checks.number;
  const passwordsMatch =
    form.password_confirmation.length > 0 &&
    form.password === form.password_confirmation;
  const userChecks = usernameChecks(form.username);
  const usernameOk = userChecks.length && userChecks.charset;

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError("Enter the code your admin sent.");
      return;
    }

    setBusy(true);
    try {
      const data = await lookupOrganization(trimmed);
      setLookup(data);
      setCode(trimmed);
      setBeat(2);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Could not find that organization.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSendCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!usernameOk) {
      setError("Username can only use letters, numbers, and underscore.");
      return;
    }
    if (!passwordOk) {
      setError("Password is not strong enough yet.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.department_id || !form.role_id) {
      setError("Pick a department and a role.");
      return;
    }

    setBusy(true);
    try {
      await requestEmailChallenge(form.email.trim(), "join");
      setEmailCode("");
      setBeat(4);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Could not send the code.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (emailCode.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setBusy(true);
    try {
      await joinOrganization({
        join_code: code.trim().toUpperCase(),
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        role_id: Number(form.role_id),
        department_id: Number(form.department_id),
        email_code: emailCode.trim(),
      });
      setBeat(3);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Request failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ag-page">
      <div className="ag-ambient" aria-hidden>
        <svg viewBox="0 0 1280 800" preserveAspectRatio="none">
          <path className="ag-wire" d="M80 120 H320 V400 H80" />
          <path className="ag-wire ag-wire-red" d="M1200 160 H960 V520 H1200" />
          <path className="ag-wire" d="M640 40 V180" />
          <circle
            className="ag-bead"
            r="4"
            fill="#b71c1c"
            style={{ offsetPath: "path('M80 120 H320 V400 H80')" }}
          />
          <circle
            className="ag-bead"
            r="4"
            fill="#c9a24a"
            style={{ offsetPath: "path('M1200 160 H960 V520 H1200')" }}
          />
        </svg>
      </div>
      <AshDoodles />

      <div className="ag-top">
        <Link to="/" className="ag-brand">
          <img src="/hostpass-logo.png" alt="" />
          <span>HostPass</span>
        </Link>
      </div>

      <div className="ag-wrap">
        <HangRail>
          <div className="ag-card ag-card-join">
            {beat === 1 ? (
              <form className="ag-pane" onSubmit={onLookup}>
                <h1>Join an organization</h1>
                <p className="lead">
                  Enter the code. You wait until the admin lets you in.
                </p>

                <label className="ag-field">
                  <Hash />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Join code"
                    autoCapitalize="characters"
                    autoComplete="off"
                    required
                  />
                </label>

                {error ? <p className="ag-err">{error}</p> : null}

                <button className="ag-submit" disabled={busy}>
                  {busy ? "Looking…" : "Find organization"}
                </button>

                <p className="ag-alt">
                  Already approved? <Link to="/signin">Sign in</Link>
                </p>
              </form>
            ) : beat === 2 ? (
              <form className="ag-pane" onSubmit={onSendCode}>
                <h1>Apply to {lookup?.organization.name}</h1>
                <p className="lead">
                  Code accepted. Next we prove the inbox, then admin approves.
                </p>

                <label className="ag-field">
                  <User />
                  <input
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label className="ag-field">
                  <AtSign />
                  <input
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    autoComplete="username"
                    required
                  />
                </label>
                <div className="ag-rules">
                  <span className={userChecks.length ? "is-ok" : ""}>
                    <i /> 3+ characters
                  </span>
                  <span className={userChecks.charset ? "is-ok" : ""}>
                    <i /> letters, numbers, _
                  </span>
                </div>

                <label className="ag-field">
                  <Mail />
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </label>
                <label className="ag-field">
                  <Phone />
                  <input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </label>

                <AgSelect
                  icon={<Layers />}
                  value={form.department_id}
                  placeholder="Select department"
                  required
                  options={(lookup?.departments ?? []).map((row) => ({
                    value: String(row.id),
                    label: row.name,
                  }))}
                  onChange={(department_id) =>
                    setForm({ ...form, department_id })
                  }
                />

                <AgSelect
                  icon={<BadgeCheck />}
                  value={form.role_id}
                  placeholder="Select role"
                  required
                  options={(lookup?.roles ?? []).map((row) => ({
                    value: String(row.id),
                    label: row.name,
                  }))}
                  onChange={(role_id) => setForm({ ...form, role_id })}
                />

                <label className="ag-field">
                  <Lock />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    className="ag-eye"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>
                <div className="ag-rules">
                  <span className={checks.length ? "is-ok" : ""}>
                    <i /> 8+ characters
                  </span>
                  <span className={checks.letter ? "is-ok" : ""}>
                    <i /> letter
                  </span>
                  <span className={checks.number ? "is-ok" : ""}>
                    <i /> number
                  </span>
                </div>

                <label className="ag-field">
                  <Lock />
                  <input
                    type={showPw2 ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.password_confirmation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password_confirmation: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    className="ag-eye"
                    onClick={() => setShowPw2((v) => !v)}
                    aria-label={showPw2 ? "Hide password" : "Show password"}
                  >
                    {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>
                {form.password_confirmation ? (
                  <p className={passwordsMatch ? "ag-hint" : "ag-err"}>
                    {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                  </p>
                ) : null}

                <label className="ag-photo-pick">
                  <Camera size={16} />
                  <span>{photoName || "Add a photo"}</span>
                  <em>optional</em>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPhotoName(e.target.files?.[0]?.name ?? "")
                    }
                  />
                </label>
                <p className="ag-hint">Saved later. Initials if you skip.</p>

                {error ? <p className="ag-err">{error}</p> : null}

                <button
                  className="ag-submit"
                  disabled={busy || !passwordOk || !usernameOk}
                >
                  {busy ? "Sending code…" : "Send email code"}
                </button>

                <p className="ag-alt">
                  <button
                    type="button"
                    onClick={() => {
                      setBeat(1);
                      setError("");
                    }}
                  >
                    Different org code
                  </button>
                </p>
              </form>
            ) : beat === 4 ? (
              <form className="ag-pane" onSubmit={onJoin}>
                <h1>Enter email code</h1>
                <p className="lead">
                  A 6-digit code was sent to {form.email}. It expires in 10 minutes.
                </p>

                <label className="ag-field">
                  <Mail />
                  <input
                    value={emailCode}
                    onChange={(e) =>
                      setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </label>

                {error ? <p className="ag-err">{error}</p> : null}

                <button
                  className="ag-submit"
                  disabled={busy || emailCode.length !== 6}
                >
                  {busy ? "Checking…" : "Confirm and apply"}
                </button>

                <p className="ag-alt">
                  <button
                    type="button"
                    onClick={() => {
                      setBeat(2);
                      setError("");
                    }}
                  >
                    Back to form
                  </button>
                </p>
              </form>
            ) : (
              <div className="ag-pane">
                <h1>Request sent</h1>
                <p className="lead">
                  {lookup?.organization.name} has you in pending. Sign in only
                  after an admin approves you.
                </p>
                <Link
                  to="/signin"
                  className="ag-submit"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    textDecoration: "none",
                  }}
                >
                  Go to sign in
                </Link>
              </div>
            )}
          </div>
        </HangRail>
      </div>
    </div>
  );
}