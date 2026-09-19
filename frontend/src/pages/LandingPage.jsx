import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./LandingPage.css";


const PRODUCT_NAME =
  "Cloud Operations Center";

const PRODUCT_APP_ORIGIN =
  "https://app.cloudopscenter.es";


function getApplicationOrigin() {
  const hostname =
    window.location.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    return window.location.origin;
  }

  return PRODUCT_APP_ORIGIN;
}


function Brand() {
  return (
    <div className="landing-brand">
      <span className="landing-brand__mark">
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
        />
      </span>

      <span className="landing-brand__text">
        <strong>
          {PRODUCT_NAME}
        </strong>

        <small>
          Operations Intelligence
        </small>
      </span>
    </div>
  );
}


function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}


function CapabilityIcon({
  type,
}) {
  if (type === "visibility") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 18V9" />
        <path d="M9 18V5" />
        <path d="M14 18v-7" />
        <path d="M19 18V3" />
      </svg>
    );
  }

  if (type === "incident") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 3 3 19h18L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    );
  }

  if (type === "security") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 3 5 6v5c0 5 2.7 8.1 7 10 4.3-1.9 7-5 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.8-4" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 7h11" />
      <path d="m13 4 3 3-3 3" />
      <path d="M19 17H8" />
      <path d="m11 14-3 3 3 3" />
    </svg>
  );
}


function HeroCommandSurface() {
  return (
    <div className="hero-visual">
      <div className="hero-visual__halo" />

      <div className="hero-orbit hero-orbit--one">
        <span />
        <span />
      </div>

      <div className="hero-orbit hero-orbit--two">
        <span />
        <span />
        <span />
      </div>

      <section className="command-surface">
        <header className="command-surface__header">
          <div className="command-surface__brand">
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
            />

            <div>
              <strong>
                Operations Command
              </strong>

              <span>
                Live environment
              </span>
            </div>
          </div>

          <span className="command-live">
            <i />
            LIVE
          </span>
        </header>

        <div className="command-overview">
          <div className="command-health">
            <span>
              OPERATIONAL STATE
            </span>

            <strong>
              Systems healthy
            </strong>

            <p>
              Unified operational visibility
              across your environment.
            </p>
          </div>

          <div className="command-health__signal">
            <span className="command-ring command-ring--1" />
            <span className="command-ring command-ring--2" />

            <span className="command-health__core">
              99.9
              <small>%</small>
            </span>
          </div>
        </div>

        <div className="command-kpis">
          <article>
            <span>
              SERVICES
            </span>

            <strong>
              12
            </strong>

            <small className="status-positive">
              All operational
            </small>
          </article>

          <article>
            <span>
              ACTIVE EVENTS
            </span>

            <strong>
              03
            </strong>

            <small>
              Being analyzed
            </small>
          </article>

          <article>
            <span>
              RESPONSE
            </span>

            <strong>
              142
              <small> ms</small>
            </strong>

            <small className="status-positive">
              Normal range
            </small>
          </article>
        </div>

        <div className="command-chart">
          <div className="command-chart__heading">
            <div>
              <span>
                SYSTEM ACTIVITY
              </span>

              <strong>
                Live signal volume
              </strong>
            </div>

            <span>
              Last 6 hours
            </span>
          </div>

          <svg
            viewBox="0 0 700 190"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="commandArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#5088f5"
                  stopOpacity=".32"
                />

                <stop
                  offset="100%"
                  stopColor="#5088f5"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <line
              x1="0"
              y1="45"
              x2="700"
              y2="45"
            />

            <line
              x1="0"
              y1="95"
              x2="700"
              y2="95"
            />

            <line
              x1="0"
              y1="145"
              x2="700"
              y2="145"
            />

            <path
              className="command-chart__area"
              d="M0 146 C45 142 70 98 110 112 S170 157 215 112 S270 62 320 89 S380 137 428 92 S490 49 535 70 S595 82 630 55 S675 53 700 37 L700 190 L0 190Z"
            />

            <path
              id="command-activity-path"
              className="command-chart__line"
              d="M0 146 C45 142 70 98 110 112 S170 157 215 112 S270 62 320 89 S380 137 428 92 S490 49 535 70 S595 82 630 55 S675 53 700 37"
            />

            <circle
              className="command-chart__pulse"
              cx="0"
              cy="0"
              r="4"
            >
              <animateMotion
                dur="14s"
                repeatCount="indefinite"
              >
                <mpath href="#command-activity-path" />
              </animateMotion>

              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.04;0.94;1"
                dur="14s"
                repeatCount="indefinite"
              />

              <animate
                attributeName="r"
                values="3.5;4.5;3.5"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        <div className="command-event">
          <div className="command-event__indicator">
            <span />
          </div>

          <div>
            <span>
              CORRELATED EVENT
            </span>

            <strong>
              Service degradation detected
            </strong>
          </div>

          <span className="command-event__state">
            Investigating
          </span>
        </div>
      </section>
    </div>
  );
}


function VisibilityGraphic() {
  return (
    <div className="capability-graphic visibility-graphic">
      <div className="visibility-graph__header">
        <span>
          SYSTEM BEHAVIOR
        </span>

        <span className="visual-live">
          <i />
          LIVE
        </span>
      </div>

      <div className="visibility-graph">
        <svg
          viewBox="0 0 720 280"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="visibilityFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#557feb"
                stopOpacity=".27"
              />

              <stop
                offset="100%"
                stopColor="#557feb"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {[55, 110, 165, 220].map(
            (y) => (
              <line
                key={y}
                className="visual-grid-line"
                x1="0"
                y1={y}
                x2="720"
                y2={y}
              />
            ),
          )}

          <path
            className="visibility-area"
            d="M0 220 C50 215 62 146 120 165 S200 235 255 165 S327 97 380 142 S465 188 515 111 S590 76 640 102 S685 70 720 54 L720 280 L0 280Z"
          />

          <path
            className="visibility-line visibility-line--primary"
            d="M0 220 C50 215 62 146 120 165 S200 235 255 165 S327 97 380 142 S465 188 515 111 S590 76 640 102 S685 70 720 54"
          />

          <path
            className="visibility-line visibility-line--secondary"
            d="M0 235 C65 232 95 220 145 225 S235 212 280 220 S355 188 410 200 S500 218 555 174 S630 190 720 156"
          />
        </svg>

        <span className="visibility-cursor">
          <i />
          <small>
            live
          </small>
        </span>
      </div>

      <div className="visibility-metrics">
        <span>
          <small>
            Signal health
          </small>

          <strong>
            Stable
          </strong>
        </span>

        <span>
          <small>
            Anomalies
          </small>

          <strong>
            2
          </strong>
        </span>

        <span>
          <small>
            Coverage
          </small>

          <strong>
            Complete
          </strong>
        </span>
      </div>
    </div>
  );
}


function IncidentGraphic() {
  return (
    <div className="capability-graphic incident-graphic">
      <div className="incident-map">
        <div className="incident-node incident-node--source">
          <span className="incident-node__pulse" />

          <small>
            SIGNAL
          </small>

          <strong>
            Latency spike
          </strong>
        </div>

        <div className="incident-path incident-path--one">
          <i />
        </div>

        <div className="incident-node incident-node--context">
          <small>
            CONTEXT
          </small>

          <strong>
            Service impact
          </strong>
        </div>

        <div className="incident-path incident-path--two">
          <i />
        </div>

        <div className="incident-node incident-node--incident">
          <small>
            INCIDENT
          </small>

          <strong>
            Investigation
          </strong>
        </div>
      </div>

      <div className="incident-timeline">
        <div>
          <span className="timeline-dot timeline-dot--done" />

          <span>
            Detected
          </span>

          <time>
            00:00
          </time>
        </div>

        <div>
          <span className="timeline-dot timeline-dot--done" />

          <span>
            Correlated
          </span>

          <time>
            +00:08
          </time>
        </div>

        <div>
          <span className="timeline-dot timeline-dot--active" />

          <span>
            Investigating
          </span>

          <time>
            +00:23
          </time>
        </div>

        <div>
          <span className="timeline-dot" />

          <span>
            Resolution
          </span>

          <time>
            pending
          </time>
        </div>
      </div>
    </div>
  );
}


function SecurityGraphic() {
  return (
    <div className="capability-graphic security-graphic">
      <div className="security-radar">
        <span className="security-radar__ring security-radar__ring--1" />
        <span className="security-radar__ring security-radar__ring--2" />
        <span className="security-radar__ring security-radar__ring--3" />

        <span className="security-radar__axis security-radar__axis--x" />
        <span className="security-radar__axis security-radar__axis--y" />

        <span className="security-radar__scan" />

        <span className="security-radar__point security-radar__point--1" />
        <span className="security-radar__point security-radar__point--2" />
        <span className="security-radar__point security-radar__point--3" />

        <div className="security-radar__core">
          <strong>
            Protected
          </strong>

          <small>
            posture
          </small>
        </div>
      </div>

      <div className="security-signals">
        <article>
          <span>
            RISK SIGNALS
          </span>

          <strong>
            Monitored
          </strong>

          <i className="security-status security-status--good" />
        </article>

        <article>
          <span>
            POLICY STATE
          </span>

          <strong>
            Enforced
          </strong>

          <i className="security-status security-status--good" />
        </article>

        <article>
          <span>
            EXPOSURE
          </span>

          <strong>
            Low
          </strong>

          <i className="security-status security-status--good" />
        </article>
      </div>
    </div>
  );
}


function AutomationGraphic() {
  return (
    <div className="capability-graphic automation-graphic">
      <div className="automation-flow">
        <div className="automation-node automation-node--trigger">
          <span>
            01
          </span>

          <div>
            <small>
              TRIGGER
            </small>

            <strong>
              Event detected
            </strong>
          </div>
        </div>

        <div className="automation-connector">
          <i />
        </div>

        <div className="automation-node automation-node--decision">
          <span>
            02
          </span>

          <div>
            <small>
              DECISION
            </small>

            <strong>
              Context evaluated
            </strong>
          </div>
        </div>

        <div className="automation-connector">
          <i />
        </div>

        <div className="automation-node automation-node--action">
          <span>
            03
          </span>

          <div>
            <small>
              ACTION
            </small>

            <strong>
              Response executed
            </strong>
          </div>
        </div>
      </div>

      <div className="automation-result">
        <span className="automation-result__icon">
          ✓
        </span>

        <div>
          <small>
            WORKFLOW COMPLETED
          </small>

          <strong>
            Operational response delivered
          </strong>
        </div>

        <span className="automation-result__time">
          1.8s
        </span>
      </div>
    </div>
  );
}


function LoginModal({
  onClose,
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const appOrigin =
        getApplicationOrigin();

      const response =
        await fetch(
          `${appOrigin}/api/auth/login`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username:
                username.trim(),

              password,
            }),
          },
        );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Too many attempts. Access is temporarily locked.",
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Invalid username or password.",
          );
        }

        throw new Error(
          "Authentication could not be completed.",
        );
      }

      window.location.assign(
        `${appOrigin}/`,
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Authentication could not be completed.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div
      className="landing-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="landing-modal landing-login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          className="landing-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="landing-modal__brand">
          <Brand />
        </div>

        <p className="landing-eyebrow">
          SECURE ACCESS
        </p>

        <h2 id="login-modal-title">
          Sign in
        </h2>

        <p className="landing-modal__intro">
          Access your operations command
          center.
        </p>

        {error && (
          <div className="landing-login-error">
            <strong>
              Sign-in failed
            </strong>

            <span>
              {error}
            </span>
          </div>
        )}

        <form
          className="landing-login-form"
          onSubmit={handleSubmit}
        >
          <label>
            <span>
              Username
            </span>

            <input
              type="text"
              value={username}
              autoComplete="username"
              maxLength={100}
              autoFocus
              required
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Password
            </span>

            <input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
            />
          </label>

          <button
            type="submit"
            className="landing-button landing-button--primary landing-login-submit"
            disabled={submitting}
          >
            {submitting
              ? "Authenticating..."
              : "Enter platform"}
          </button>
        </form>

        <div className="landing-login-security">
          <span />

          Encrypted connection
        </div>
      </section>
    </div>
  );
}


function AccessModal({
  onClose,
}) {
  const [submitted, setSubmitted] =
    useState(false);


  return (
    <div
      className="landing-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="landing-modal landing-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-modal-title"
      >
        <button
          type="button"
          className="landing-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <p className="landing-eyebrow">
          EARLY ACCESS
        </p>

        <h2 id="access-modal-title">
          Request access
        </h2>

        {!submitted ? (
          <>
            <p className="landing-modal__intro">
              Join the early access list
              and be among the first to
              experience the platform.
            </p>

            <form
              className="landing-access-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label>
                <span>
                  Work email
                </span>

                <input
                  type="email"
                  placeholder="you@company.com"
                  required
                />
              </label>

              <label>
                <span>
                  Organization
                </span>

                <input
                  type="text"
                  placeholder="Company name"
                  required
                />
              </label>

              <button
                type="submit"
                className="landing-button landing-button--primary landing-login-submit"
              >
                Join early access
              </button>
            </form>
          </>
        ) : (
          <div className="landing-access-success">
            <span>
              ✓
            </span>

            <div>
              <strong>
                Request captured
              </strong>

              <p>
                Early access onboarding
                will be enabled soon.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


export default function LandingPage() {
  const rootRef =
    useRef(null);

  const [modal, setModal] =
    useState(null);


  useEffect(() => {
    const root =
      rootRef.current;

    if (!root) {
      return undefined;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    const handlePointerMove = (event) => {
      root.style.setProperty(
        "--pointer-x",
        `${event.clientX}px`,
      );

      root.style.setProperty(
        "--pointer-y",
        `${event.clientY}px`,
      );
    };

    if (!reducedMotion) {
      window.addEventListener(
        "pointermove",
        handlePointerMove,
        {
          passive: true,
        },
      );
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "is-visible",
              );

              observer.unobserve(
                entry.target,
              );
            }
          });
        },
        {
          threshold: 0.14,
        },
      );

    root
      .querySelectorAll(
        "[data-reveal]",
      )
      .forEach((element) => {
        observer.observe(element);
      });

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      observer.disconnect();
    };
  }, []);


  useEffect(() => {
    if (!modal) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setModal(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [modal]);


  function scrollToCapabilities() {
    document
      .getElementById(
        "capabilities",
      )
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }


  return (
    <main
      ref={rootRef}
      className="product-landing"
    >
      <div className="landing-pointer-light" />

      <div className="landing-noise" />

      <header className="landing-header">
        <div className="landing-shell landing-header__inner">
          <a
            href="#top"
            className="landing-header__brand"
            aria-label={PRODUCT_NAME}
          >
            <Brand />
          </a>

          <nav
            className="landing-nav"
            aria-label="Primary navigation"
          >
            <a href="#platform">
              Platform
            </a>

            <a href="#capabilities">
              Capabilities
            </a>

            <a href="#workflow">
              Workflow
            </a>

            <a href="#security">
              Security
            </a>
          </nav>

          <div className="landing-header__actions">
            <button
              type="button"
              className="landing-button landing-button--ghost"
              onClick={() =>
                setModal("login")
              }
            >
              Sign in
            </button>

            <button
              type="button"
              className="landing-button landing-button--primary"
              onClick={() =>
                setModal("access")
              }
            >
              Request access

              <ArrowIcon />
            </button>
          </div>
        </div>
      </header>

      <section
        id="top"
        className="landing-hero landing-shell"
      >
        <div
          className="landing-hero__content"
          data-reveal
        >
          <div className="landing-hero__badge">
            <span />

            Operations intelligence,
            unified
          </div>

          <h1>
            Operate every signal.
            <br />

            <span>
              Resolve every incident.
            </span>
          </h1>

          <p className="landing-hero__lead">
            A unified command layer for
            understanding system behavior,
            investigating operational
            events and turning context into
            action.
          </p>

          <div className="landing-hero__actions">
            <button
              type="button"
              className="landing-button landing-button--primary landing-button--large"
              onClick={scrollToCapabilities}
            >
              Explore the platform

              <ArrowIcon />
            </button>

            <button
              type="button"
              className="landing-button landing-button--outline landing-button--large"
              onClick={() =>
                setModal("access")
              }
            >
              Request access
            </button>
          </div>

          <div className="landing-hero__proof">
            <span>
              <i />
              Unified visibility
            </span>

            <span>
              <i />
              Incident intelligence
            </span>

            <span>
              <i />
              Automated response
            </span>
          </div>
        </div>

        <div
          className="landing-hero__visual"
          data-reveal
        >
          <HeroCommandSurface />
        </div>
      </section>

      <section
        id="platform"
        className="platform-intro"
      >
        <div className="landing-shell">
          <div
            className="platform-intro__heading"
            data-reveal
          >
            <p className="landing-eyebrow">
              ONE OPERATIONAL LAYER
            </p>

            <h2>
              From fragmented signals
              <br />

              <span>
                to operational clarity.
              </span>
            </h2>

            <p>
              Move from detection to
              understanding and response
              without losing context between
              systems, teams or workflows.
            </p>
          </div>

          <div
            className="platform-topology"
            data-reveal
          >
            <div className="topology-core">
              <span className="topology-core__pulse" />

              <img
                src="/favicon.svg"
                alt=""
                aria-hidden="true"
              />

              <strong>
                Operations
                <br />
                Intelligence
              </strong>
            </div>

            <div className="topology-ring topology-ring--one" />
            <div className="topology-ring topology-ring--two" />

            <div className="topology-node topology-node--signals">
              <span />
              Signals
            </div>

            <div className="topology-node topology-node--services">
              <span />
              Services
            </div>

            <div className="topology-node topology-node--events">
              <span />
              Events
            </div>

            <div className="topology-node topology-node--risk">
              <span />
              Risk
            </div>

            <div className="topology-node topology-node--actions">
              <span />
              Actions
            </div>

            <div className="topology-node topology-node--context">
              <span />
              Context
            </div>
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="capabilities-section landing-shell"
      >
        <header
          className="section-heading"
          data-reveal
        >
          <p className="landing-eyebrow">
            PLATFORM CAPABILITIES
          </p>

          <h2>
            Built for the moment
            <br />

            <span>
              operations become complex.
            </span>
          </h2>
        </header>

        <article
          className="capability-showcase"
          data-reveal
        >
          <div className="capability-copy">
            <span className="capability-number">
              01
            </span>

            <div className="capability-icon">
              <CapabilityIcon type="visibility" />
            </div>

            <p className="landing-eyebrow">
              OBSERVABILITY
            </p>

            <h3>
              See the system
              as it behaves.
            </h3>

            <p>
              Understand health, behavior
              and change from a unified
              operational view designed for
              investigation, not noise.
            </p>

            <div className="capability-pills">
              <span>
                Live behavior
              </span>

              <span>
                Signal correlation
              </span>

              <span>
                Service context
              </span>
            </div>
          </div>

          <VisibilityGraphic />
        </article>

        <article
          className="capability-showcase capability-showcase--reverse"
          data-reveal
        >
          <div className="capability-copy">
            <span className="capability-number">
              02
            </span>

            <div className="capability-icon capability-icon--violet">
              <CapabilityIcon type="incident" />
            </div>

            <p className="landing-eyebrow landing-eyebrow--violet">
              INCIDENT INTELLIGENCE
            </p>

            <h3>
              Turn signals
              into understanding.
            </h3>

            <p>
              Build the incident narrative
              automatically by connecting
              affected services, events,
              investigation context and
              response progress.
            </p>

            <div className="capability-pills">
              <span>
                Context
              </span>

              <span>
                Timeline
              </span>

              <span>
                Investigation
              </span>
            </div>
          </div>

          <IncidentGraphic />
        </article>

        <article
          id="security"
          className="capability-showcase"
          data-reveal
        >
          <div className="capability-copy">
            <span className="capability-number">
              03
            </span>

            <div className="capability-icon capability-icon--green">
              <CapabilityIcon type="security" />
            </div>

            <p className="landing-eyebrow landing-eyebrow--green">
              SECURITY POSTURE
            </p>

            <h3>
              Make risk operational.
            </h3>

            <p>
              Bring exposure, policy state
              and security signals into the
              same operational context used
              to understand the rest of the
              environment.
            </p>

            <div className="capability-pills">
              <span>
                Exposure
              </span>

              <span>
                Policy state
              </span>

              <span>
                Risk signals
              </span>
            </div>
          </div>

          <SecurityGraphic />
        </article>

        <article
          className="capability-showcase capability-showcase--reverse"
          data-reveal
        >
          <div className="capability-copy">
            <span className="capability-number">
              04
            </span>

            <div className="capability-icon capability-icon--orange">
              <CapabilityIcon type="automation" />
            </div>

            <p className="landing-eyebrow landing-eyebrow--orange">
              AUTOMATION
            </p>

            <h3>
              Turn context
              into action.
            </h3>

            <p>
              Connect operational events to
              controlled workflows so the
              right response can happen
              faster and with less manual
              coordination.
            </p>

            <div className="capability-pills">
              <span>
                Triggers
              </span>

              <span>
                Decisions
              </span>

              <span>
                Actions
              </span>
            </div>
          </div>

          <AutomationGraphic />
        </article>
      </section>

      <section
        id="workflow"
        className="workflow-section"
      >
        <div className="landing-shell">
          <header
            className="section-heading section-heading--center"
            data-reveal
          >
            <p className="landing-eyebrow">
              OPERATIONAL LOOP
            </p>

            <h2>
              One continuous path
              <br />

              <span>
                from signal to action.
              </span>
            </h2>
          </header>

          <div
            className="workflow-track"
            data-reveal
          >
            <span className="workflow-track__line">
              <i />
            </span>

            <article>
              <span className="workflow-step">
                01
              </span>

              <strong>
                Observe
              </strong>

              <p>
                Understand current system
                behavior.
              </p>
            </article>

            <article>
              <span className="workflow-step">
                02
              </span>

              <strong>
                Correlate
              </strong>

              <p>
                Connect signals with
                operational context.
              </p>
            </article>

            <article>
              <span className="workflow-step">
                03
              </span>

              <strong>
                Investigate
              </strong>

              <p>
                Build a clear incident
                narrative.
              </p>
            </article>

            <article>
              <span className="workflow-step">
                04
              </span>

              <strong>
                Act
              </strong>

              <p>
                Execute the right response
                with confidence.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-final landing-shell">
        <div
          className="landing-final__panel"
          data-reveal
        >
          <div className="landing-final__glow" />

          <div>
            <p className="landing-eyebrow">
              OPERATE WITH CLARITY
            </p>

            <h2>
              Your cloud should tell
              one story.
            </h2>

            <p>
              Bring visibility, incidents,
              security and response into
              one operational experience.
            </p>
          </div>

          <div className="landing-final__actions">
            <button
              type="button"
              className="landing-button landing-button--primary landing-button--large"
              onClick={() =>
                setModal("access")
              }
            >
              Request access

              <ArrowIcon />
            </button>

            <button
              type="button"
              className="landing-button landing-button--ghost landing-button--large"
              onClick={() =>
                setModal("login")
              }
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer__inner">
          <Brand />

          <span>
            Operational intelligence
            for modern cloud systems.
          </span>

          <small>
            © 2026 {PRODUCT_NAME}
          </small>
        </div>
      </footer>

      {modal === "login" && (
        <LoginModal
          onClose={() =>
            setModal(null)
          }
        />
      )}

      {modal === "access" && (
        <AccessModal
          onClose={() =>
            setModal(null)
          }
        />
      )}
    </main>
  );
}
