import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AtSign,
  Building2,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import "./auth.css";
import { HangRail } from "./HangRail";
import { AshDoodles } from "./AshDoodles";
import { login, registerOrganization, requestEmailChallenge } from "../api/auth";
import { flattenFields, HttpError } from "../api/http";
import { writeSession } from "../session/store";

type Mode = "sign" | "create";

function Ambient() {
  return (
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
  );
}

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

export function AuthGate({ initialMode }: { initialMode: Mode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showSignPw, setShowSignPw] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [showCreatePw2, setShowCreatePw2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailCode, setEmailCode] = useState("");

  const [sign, setSign] = useState({ login: "", password: "" });
  const [org, setOrg] = useState({
    organization_name: "",
    department_name: "",
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const checks = passwordChecks(org.password);
  const passwordOk = checks.length && checks.letter && checks.number;
  const passwordsMatch =
    org.password_confirmation.length > 0 &&
    org.password === org.password_confirmation;
  const userChecks = usernameChecks(org.username);
  const usernameOk = userChecks.length && userChecks.charset;

  async function onSign(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const session = await login({
        login: sign.login.trim(),
        password: sign.password,
      });
      writeSession(session);
      navigate("/desk", { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Sign in failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
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

      setBusy(true);
      try {
        await requestEmailChallenge(org.email.trim(), "register");
        setEmailCode("");
        setStep(3);
      } catch (err) {
        if (err instanceof HttpError) {
          setError(flattenFields(err.fields) ?? err.message);
        } else {
          setError("Could not send the code.");
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    if (emailCode.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setBusy(true);
    try {
      const session = await registerOrganization({
        organization_name: org.organization_name.trim(),
        department_name: org.department_name.trim(),
        name: org.name.trim(),
        username: org.username.trim(),
        email: org.email.trim(),
        phone: org.phone.trim(),
        password: org.password,
        password_confirmation: org.password_confirmation,
        email_code: emailCode.trim(),
      });
      writeSession(session);
      navigate("/desk", { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        setError(flattenFields(err.fields) ?? err.message);
      } else {
        setError("Create failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ag-page">
      <Ambient />
      <AshDoodles />

      <div className="ag-top">
        <Link to="/" className="ag-brand">
          <img src="/hostpass-logo.png" alt="" />
          <span>HostPass</span>
        </Link>
      </div>

      <div className="ag-wrap">
        <HangRail>
          <div className={`ag-card ${mode === "create" ? "is-create" : ""}`}>
            <form className="ag-pane ag-pane-sign" onSubmit={onSign}>
              <h1>Sign in</h1>
              <p className="lead">Use the desk you were approved for.</p>

              <label className="ag-field">
                <AtSign />
                <input
                  name="login"
                  autoComplete="username"
                  placeholder="Email or username"
                  value={sign.login}
                  onChange={(e) => setSign({ ...sign, login: e.target.value })}
                  required
                />
              </label>

              <label className="ag-field">
                <Lock />
                <input
                  name="password"
                  type={showSignPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={sign.password}
                  onChange={(e) => setSign({ ...sign, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="ag-eye"
                  onClick={() => setShowSignPw((v) => !v)}
                  aria-label={showSignPw ? "Hide password" : "Show password"}
                >
                  {showSignPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>

              {error && mode === "sign" ? <p className="ag-err">{error}</p> : null}

              <button className="ag-submit" disabled={busy}>
                {busy && mode === "sign" ? "Checking…" : "Sign in"}
              </button>

              <p className="ag-alt">
                Have a join code? <Link to="/join">Join an organization</Link>
              </p>
            </form>

            <form className="ag-pane ag-pane-create" onSubmit={onCreate}>
              <h1>Create organization</h1>
              <p className="lead">
                {step === 3
                  ? `A 6-digit code was sent to ${org.email}.`
                  : "You become Admin. Trial starts after the email code."}
              </p>

              <div className="ag-steps">
                <span>{step === 1 ? <b>1. The gate</b> : "1. The gate"}</span>
                <span>→</span>
                <span>{step === 2 ? <b>2. You</b> : "2. You"}</span>
                <span>→</span>
                <span>{step === 3 ? <b>3. Code</b> : "3. Code"}</span>
              </div>

              {step === 1 ? (
                <>
                  <label className="ag-field">
                    <Building2 />
                    <input
                      placeholder="Organization name"
                      value={org.organization_name}
                      onChange={(e) =>
                        setOrg({ ...org, organization_name: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="ag-field">
                    <Layers />
                    <input
                      placeholder="First department"
                      value={org.department_name}
                      onChange={(e) =>
                        setOrg({ ...org, department_name: e.target.value })
                      }
                      required
                    />
                  </label>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <label className="ag-field">
                    <User />
                    <input
                      placeholder="Full name"
                      value={org.name}
                      onChange={(e) => setOrg({ ...org, name: e.target.value })}
                      required
                    />
                  </label>
                  <label className="ag-field">
                    <AtSign />
                    <input
                      placeholder="Username"
                      value={org.username}
                      onChange={(e) => setOrg({ ...org, username: e.target.value })}
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
                      placeholder="Work email"
                      value={org.email}
                      onChange={(e) => setOrg({ ...org, email: e.target.value })}
                      required
                    />
                  </label>
                  <label className="ag-field">
                    <Phone />
                    <input
                      placeholder="Phone"
                      value={org.phone}
                      onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                      required
                    />
                  </label>
                  <label className="ag-field">
                    <Lock />
                    <input
                      type={showCreatePw ? "text" : "password"}
                      placeholder="Password"
                      value={org.password}
                      onChange={(e) => setOrg({ ...org, password: e.target.value })}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="ag-eye"
                      onClick={() => setShowCreatePw((v) => !v)}
                      aria-label={showCreatePw ? "Hide password" : "Show password"}
                    >
                      {showCreatePw ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      type={showCreatePw2 ? "text" : "password"}
                      placeholder="Confirm password"
                      value={org.password_confirmation}
                      onChange={(e) =>
                        setOrg({
                          ...org,
                          password_confirmation: e.target.value,
                        })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="ag-eye"
                      onClick={() => setShowCreatePw2((v) => !v)}
                      aria-label={showCreatePw2 ? "Hide password" : "Show password"}
                    >
                      {showCreatePw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </label>
                  {org.password_confirmation ? (
                    <p className={passwordsMatch ? "ag-hint" : "ag-err"}>
                      {passwordsMatch ? "Passwords match." : "Passwords do not match."}
                    </p>
                  ) : null}
                </>
              ) : null}

              {step === 3 ? (
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
              ) : null}

              {error && mode === "create" ? <p className="ag-err">{error}</p> : null}

              <button
                className="ag-submit"
                disabled={
                  busy ||
                  (step === 2 && (!passwordOk || !usernameOk)) ||
                  (step === 3 && emailCode.length !== 6)
                }
              >
                {step === 1
                  ? "Continue"
                  : step === 2
                    ? busy
                      ? "Sending code…"
                      : "Send email code"
                    : busy
                      ? "Opening…"
                      : "Create organization"}
              </button>

              {step > 1 ? (
                <p className="ag-alt">
                  <button type="button" onClick={() => setStep(step === 3 ? 2 : 1)}>
                    Back
                  </button>
                </p>
              ) : null}
            </form>

            <aside className="ag-blade">
              {mode === "sign" ? (
                <>
                  <h2>New gate?</h2>
                  <p>Set up an organization. You approve who comes in.</p>
                  <button type="button" onClick={() => setMode("create")}>
                    Create organization
                  </button>
                </>
              ) : (
                <>
                  <h2>Already inside?</h2>
                  <p>Sign in to the desk you already have.</p>
                  <button type="button" onClick={() => setMode("sign")}>
                    Sign in
                  </button>
                </>
              )}
            </aside>
          </div>
        </HangRail>
      </div>
    </div>
  );
}