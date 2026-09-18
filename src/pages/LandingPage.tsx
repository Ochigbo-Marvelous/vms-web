import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../landing.css";


function IconGate() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="3" width="4" height="18" rx="1" />
      <rect x="16" y="3" width="4" height="18" rx="1" />
      <path d="M8 8h8M8 16h8" />
    </svg>
  );
}
function IconHost() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.4-3.5 3.8-5 7-5s5.6 1.5 7 5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M10 18h4" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v6c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconAudit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function HangTrack({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, dragging: false, x: 0, left: 0 });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      dragging: false,
      x: e.clientX,
      left: el.scrollLeft,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!el || !drag.current.active) return;
    const delta = e.clientX - drag.current.x;
    if (!drag.current.dragging && Math.abs(delta) < 8) return;
    drag.current.dragging = true;
    el.scrollLeft = drag.current.left - delta;
  }

  function onPointerUp() {
    drag.current.active = false;
    drag.current.dragging = false;
  }

  return (
    <div className="hp-rail-wrap">
      <div className="hp-rail" />
      <div
        className="hp-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}

function useOnRope() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setOn(true);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, on };
}

function HangCard({
  title,
  detail,
  fix,
}: {
  title: string;
  detail: string;
  fix: string;
}) {
  const { ref, on } = useOnRope();

  return (
    <article ref={ref} className={`hp-hang${on ? " is-on" : ""}`}>
      <div className="hp-clip" />
      <div className="hp-card">
        <div className="hp-card-top">
          <h3>{title}</h3>
        </div>
        <div className="hp-card-body">
          <p className="label">Details</p>
          <p className="wound">{detail}</p>
          <p className="fix">
            <strong>HostPass</strong>
            {fix}
          </p>
        </div>
      </div>
    </article>
  );
}

function FaqCard({
  title,
  answer,
  open,
  onToggle,
}: {
  title: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { ref, on } = useOnRope();

  return (
    <article
      ref={ref}
      className={`hp-hang hp-faq-hang${on ? " is-on" : ""}${open ? " is-open" : ""}`}
    >
      <div className="hp-clip" />
      <button
        className="hp-card hp-faq-face"
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onToggle}
      >
        <div className="hp-card-top">
          <h3>{title}</h3>
          <span className="hp-faq-mark" aria-hidden>
            {open ? "−" : "+"}
          </span>
        </div>
        <div className="hp-card-body">
          <p className="label">HostPass</p>
          <p className="fix">{answer}</p>
        </div>
      </button>
    </article>
  );
}

function WaveBreak() {
  return (
    <div className="hp-wave" aria-hidden>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path d="M0 40 C180 80 360 0 540 40 C720 80 900 0 1080 40 C1260 80 1380 20 1440 40 L1440 80 L0 80 Z" />
      </svg>
    </div>
  );
}

function DeskCard({
  side,
  tab,
  title,
  copy,
}: {
  side: "left" | "right";
  tab: string;
  title: string;
  copy: string;
}) {
  const { ref, on } = useOnRope();

  return (
    <article
      ref={ref}
      className={`hp-desk hp-road hp-desk-${side}${on ? " is-on" : ""}`}
    >
      <div className="hp-desk-tab">{tab}</div>
      <div className="hp-desk-pin" />
      <div className="hp-desk-body">
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

function RoadCard({
  side,
  tab,
  tone,
  title,
  copy,
}: {
  side: "left" | "right";
  tab: string;
  tone: "now" | "next" | "later";
  title: string;
  copy: string;
}) {
  const { ref, on } = useOnRope();

  return (
    <article
      ref={ref}
      className={`hp-desk hp-road hp-desk-${side} hp-tone-${tone}${on ? " is-on" : ""}`}
    >
      <div className="hp-desk-tab">{tab}</div>
      <div className="hp-desk-pin" />
      <div className="hp-desk-body">
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </article>
  );
}

const FAQS = [
  {
    title: "How does staff get in?",
    answer:
      "They enter the organization code, fill the form, and wait. The admin approves. Nobody walks in on a shared password.",
  },
  {
    title: "Who sees a visitor request?",
    answer:
      "Only the host they came to see. The rest of the department does not get that card.",
  },
  {
    title: "Does the visitor enter on a phone call?",
    answer:
      "No. Security logs them. The host Accepts. Then the door opens.",
  },
  {
    title: "Do we need an app?",
    answer:
      "No. Security and staff open HostPass in the browser on the phone or the desk.",
  },
  {
    title: "What happens when the month ends?",
    answer:
      "Fourteen days of grace. Then the organization locks. Pay ₦60,000 or $50 for the year to unlock.",
  },
  {
    title: "Can one person belong to two organizations?",
    answer:
      "Yes, if each admin approves them. They sign in once and pick the organization.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="hp-page">
      <header className={`hp-header${menuOpen ? " is-open" : ""}`}>
        <a className="hp-brand" href="#top" onClick={() => setMenuOpen(false)}>
          <img src="/hostpass-logo.png" alt="" />
          <span>HostPass</span>
        </a>
        <button
          className="hp-menu"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
        <nav className="hp-nav">
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#desks" onClick={() => setMenuOpen(false)}>
            Desks
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <a href="#roadmap" onClick={() => setMenuOpen(false)}>
            Roadmap
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            Questions
          </a>
        </nav>
        <div className="hp-header-actions">
          <Link className="hp-link" to="/signin" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <Link
            className="hp-btn hp-btn-primary"
            to="/create"
            onClick={() => setMenuOpen(false)}
          >
            Create organization
          </Link>
        </div>
      </header>

      <section className="hp-hero" id="top">
        <h1>Know who is in the building.</h1>
        <p className="lede">
          Security logs the visitor. The host accepts, holds, or declines. The
          gate stays in control.
        </p>

        <div className="hp-orbit" aria-hidden>
          <svg className="hp-wires hp-wires-desk" viewBox="0 0 1280 520" preserveAspectRatio="none">
            <path className="hp-wire" d="M560 230 H300 V140 H170" />
            <path className="hp-wire" d="M560 290 H300 V380 H170" />
            <path className="hp-wire" d="M640 180 V70" />
            <path className="hp-wire" d="M640 340 V450" />
            <path className="hp-wire hp-wire-red" d="M720 210 H980 V140 H1110" />
            <path className="hp-wire" d="M720 310 H980 V380 H1110" />
            <circle className="hp-bead" r="4" fill="#b71c1c" style={{ offsetPath: "path('M560 230 H300 V140 H170')" }} />
            <circle className="hp-bead" r="4" fill="#c9a24a" style={{ offsetPath: "path('M560 290 H300 V380 H170')" }} />
            <circle className="hp-bead" r="4" fill="#b71c1c" style={{ offsetPath: "path('M640 180 V70')" }} />
            <circle className="hp-bead" r="4" fill="#c9a24a" style={{ offsetPath: "path('M640 340 V450')" }} />
            <circle className="hp-bead" r="4" fill="#b71c1c" style={{ offsetPath: "path('M720 210 H980 V140 H1110')" }} />
            <circle className="hp-bead" r="4" fill="#c9a24a" style={{ offsetPath: "path('M720 310 H980 V380 H1110')" }} />
          </svg>

          <svg className="hp-wires hp-wires-phone" viewBox="0 0 320 340" preserveAspectRatio="none">
            <path className="hp-wire" d="M108 155 H70 V58 H52" />
            <path className="hp-wire" d="M108 185 H70 V282 H52" />
            <path className="hp-wire" d="M160 108 V52" />
            <path className="hp-wire" d="M160 232 V288" />
            <path className="hp-wire hp-wire-red" d="M212 155 H250 V58 H268" />
            <path className="hp-wire" d="M212 185 H250 V282 H268" />

            <circle className="hp-bead" r="3.5" fill="#b71c1c" style={{ offsetPath: "path('M108 155 H70 V58 H52')" }} />
            <circle className="hp-bead" r="3.5" fill="#c9a24a" style={{ offsetPath: "path('M108 185 H70 V282 H52')" }} />
            <circle className="hp-bead" r="3.5" fill="#b71c1c" style={{ offsetPath: "path('M160 108 V52')" }} />
            <circle className="hp-bead" r="3.5" fill="#c9a24a" style={{ offsetPath: "path('M160 232 V288')" }} />
            <circle className="hp-bead" r="3.5" fill="#b71c1c" style={{ offsetPath: "path('M212 155 H250 V58 H268')" }} />
            <circle className="hp-bead" r="3.5" fill="#c9a24a" style={{ offsetPath: "path('M212 185 H250 V282 H268')" }} />
          </svg>

          <div className="hp-slot hp-n1">
            <div className="hp-node">
              <IconGate />
            </div>
            <span>Gate</span>
          </div>
          <div className="hp-slot hp-n2">
            <div className="hp-node">
              <IconHost />
            </div>
            <span>Host</span>
          </div>
          <div className="hp-slot hp-n3">
            <div className="hp-node">
              <IconPhone />
            </div>
            <span>Notify</span>
          </div>
          <div className="hp-slot hp-n4">
            <div className="hp-node">
              <IconCheck />
            </div>
            <span>Clear</span>
          </div>
          <div className="hp-slot hp-n5">
            <div className="hp-node">
              <IconShield />
            </div>
            <span>Admin</span>
          </div>
          <div className="hp-slot hp-n6">
            <div className="hp-node">
              <IconAudit />
            </div>
            <span>Audit</span>
          </div>

          <div className="hp-hub">
            <img src="/hostpass-logo.png" alt="HostPass" />
          </div>
        </div>

        <div className="hp-hero-actions">
          <Link className="hp-btn hp-btn-primary" to="/create">
            Create organization
          </Link>
          <Link className="hp-btn hp-btn-ghost" to="/signin">
            Sign in
          </Link>
          <Link className="hp-btn hp-btn-text" to="/join">
            Join →
          </Link>
        </div>
      </section>

      <section className="hp-problem" id="problem">
        <div className="hp-problem-head">
          <span className="hp-kicker">The gate problem</span>
          <h2>A visitor is at the door. Nobody can prove who said yes.</h2>
        </div>
        <HangTrack>
          <HangCard
            title="The book does not search"
            detail="A name in a register is not a host. Security guesses the spelling and waits."
            fix="Fuzzy host search at the gate. First or last name is enough."
          />
          <HangCard
            title="The host never hears"
            detail="The visitor is logged. The person they came to see is in a meeting and never gets the request."
            fix="The request reaches that host only. Accept, hold, or decline."
          />
          <HangCard
            title="Entry is a guess"
            detail="Security lets them in on a verbal “he said come.” There is no stamp."
            fix="The visitor enters only after Accept."
          />
          <HangCard
            title="Exit is a rumour"
            detail="Someone leaves. Nobody marks them out. The building still thinks they are inside."
            fix="Host clears. Security sees they are returning to the gate."
          />
          <HangCard
            title="Last week is fog"
            detail="Admin cannot say who visited, who approved, or who left."
            fix="One organization log. Later, export."
          />
        </HangTrack>
      </section>

      <WaveBreak />

      <section className="hp-problem" id="how">
        <div className="hp-problem-head">
          <span className="hp-kicker">How it works</span>
          <h2>Four moves. The gate stays in control.</h2>
        </div>
        <HangTrack>
          <HangCard
            title="Security logs the visitor"
            detail="Name, phone, purpose, and the host they came to see."
            fix="The host is found even if first and last name are swapped."
          />
          <HangCard
            title="The host decides"
            detail="The request sits with that person only. Nobody else in the department sees it."
            fix="Accept, hold, or decline from their phone or laptop."
          />
          <HangCard
            title="The gate waits for Accept"
            detail="A verbal “he said come” is not a stamp."
            fix="Security sees the status before they open the door."
          />
          <HangCard
            title="The host clears the visit"
            detail="When the meeting ends, the building must know they are leaving."
            fix="Clear marks them out. The gate sees they are returning."
          />
        </HangTrack>
      </section>

      <section className="hp-desks" id="desks">
        <div className="hp-problem-head">
          <span className="hp-kicker">Desks</span>
          <h2>Three seats. One organization.</h2>
        </div>

        <div className="hp-spine">
          <div className="hp-spine-line" />
          <DeskCard
            side="left"
            tab="Security"
            title="The gate logs the visitor."
            copy="Name, phone, purpose, host. Search first or last name. Watch the status before the door opens."
          />
          <DeskCard
            side="right"
            tab="Host"
            title="The request is only yours."
            copy="Accept, hold, or decline. When the meeting ends, you clear. The gate sees they are returning."
          />
          <DeskCard
            side="left"
            tab="Admin"
            title="You decide who is in the org."
            copy="Approve staff. See the log. The trial and the lock live on this desk only."
          />
        </div>

        <div className="hp-desk-cta">
          <h3>Ready to stand up a gate?</h3>
          <p>
            Create the organization. Staff join with the code. You approve who
            gets in.
          </p>
            <Link className="hp-btn hp-btn-primary" to="/create">
            Create organization
            </Link>
        </div>
      </section>

      <section className="hp-pricing" id="pricing">
        <div className="hp-problem-head">
          <span className="hp-kicker">Pricing</span>
          <h2>One month to try the gate. Then the year.</h2>
        </div>

        <div className="hp-price-well">
          <div className="hp-price-chip">
            <span className="hp-price-naira">₦60,000 / $50</span>
            <span className="hp-price-unit">per organization / year</span>
          </div>

          <ul className="hp-price-pips">
            <li>30 days free</li>
            <li>14-day grace</li>
            <li>Then the org locks</li>
          </ul>
        </div>
      </section>

      <section className="hp-roadmap" id="roadmap">
        <div className="hp-problem-head">
          <span className="hp-kicker">Roadmap</span>
          <h2>The gate is on the web first.</h2>
        </div>

        <div className="hp-spine hp-road-spine">
          <div className="hp-spine-line" />
          <RoadCard
            side="left"
            tab="Done"
            tone="later"
            title="Closed beta"
            copy="Invited organizations ran the gate on the web app. Check-in, host decision, and the lock were watched here."
          />
          <RoadCard
            side="right"
            tab="Now"
            tone="now"
            title="Web launch"
            copy="Any organization can create an account. The trial starts. Staff join with the code."
          />
          <RoadCard
            side="left"
            tab="Later"
            tone="later"
            title="Gate station"
            copy="A dedicated check-in desk that can hold the queue if the network drops. Phones still use the web app."
          />
          <div className="hp-rope-end">
            <span>The trial starts when you create the org.</span>
          </div>
        </div>
      </section>

      <section className="hp-problem hp-faq" id="faq">
        <div className="hp-problem-head">
          <span className="hp-kicker">Questions</span>
          <h2>Tap a ticket. The gate answers.</h2>
        </div>
        <HangTrack>
          {FAQS.map((item, index) => (
            <FaqCard
              key={item.title}
              title={item.title}
              answer={item.answer}
              open={openFaq === index}
              onToggle={() =>
                setOpenFaq((current) => (current === index ? null : index))
              }
            />
          ))}
        </HangTrack>
      </section>

      <footer className="hp-foot">
        <a className="hp-brand hp-foot-brand" href="#top">
          <img src="/hostpass-logo.png" alt="" />
          <span>HostPass</span>
        </a>
        <nav className="hp-foot-nav">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <p className="hp-foot-note">
          The gate keeps a record. The org owns its visitors.
        </p>
        <p className="hp-foot-copy">© 2026 HostPass. All rights reserved.</p>
        <Link className="hp-btn hp-btn-primary" to="/create">
          Create organization
        </Link>
      </footer>
    </div>
  );
}