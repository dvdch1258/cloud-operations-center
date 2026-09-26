import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

function navigationClass({ isActive }) {
  return isActive
    ? "navigation__item navigation__item--active"
    : "navigation__item";
}

function NavIcon({ name }) {
  const paths = {
    summary: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    services: (
      <>
        <rect x="4" y="4" width="16" height="6" rx="2" />
        <rect x="4" y="14" width="16" height="6" rx="2" />
        <path d="M8 7h.01M8 17h.01" />
      </>
    ),
    incidents: (
      <>
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    security: (
      <>
        <path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.6 1.6 3.6-3.7" />
      </>
    ),
    operations: (
      <>
        <path d="M4 12h4l2-5 4 10 2-5h4" />
      </>
    ),
    automations: (
      <>
        <path d="M6 7h7" />
        <path d="M11 4l3 3-3 3" />
        <path d="M18 17h-7" />
        <path d="M13 14l-3 3 3 3" />
      </>
    ),
    system: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    observability: (
      <>
        <path d="M4 18V9" />
        <path d="M10 18V5" />
        <path d="M16 18v-7" />
        <path d="M22 18V3" />
      </>
    ),
  };

  return (
    <svg
      className="navigation__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION || "1.0.1";

const BUILD_SHA =
  import.meta.env.VITE_BUILD_SHA || "development";

const SHORT_BUILD =
  BUILD_SHA === "development"
    ? "dev"
    : BUILD_SHA.replace(/^sha-/, "").slice(0, 7);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.localStorage.getItem("cloudops.sidebar.hidden") === "true";
    } catch {
      return false;
    }
  });
  const [securityOpen, setSecurityOpen] = useState(
    () => location.pathname.startsWith("/seguridad"),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "cloudops.sidebar.hidden",
        String(sidebarHidden),
      );
    } catch {
      // La aplicación sigue funcionando aunque el almacenamiento esté bloqueado.
    }
  }, [sidebarHidden]);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);

    if (location.pathname.startsWith("/seguridad")) {
      setSecurityOpen(true);
    }
  }, [location.pathname]);

  // MOBILE_ROUTE_VIEWPORT_RESET
  useEffect(() => {
    const resetViewport = () => {
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });

      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;

      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    };

    resetViewport();

    const frame = window.requestAnimationFrame(resetViewport);
    const timer = window.setTimeout(resetViewport, 180);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const username = user?.username || t("common.user");
  const initial = username.charAt(0).toUpperCase();

  const mobileSection = (() => {
    const path = location.pathname;

    if (path.startsWith("/servicios")) {
      return t("nav.services");
    }

    if (path.startsWith("/incidentes")) {
      return t("nav.incidents");
    }

    if (path.startsWith("/seguridad")) {
      return t("nav.security");
    }

    if (path.startsWith("/operaciones")) {
      return t("nav.operations");
    }

    if (path.startsWith("/automatizaciones")) {
      return t("nav.automations");
    }

    if (path.startsWith("/observabilidad")) {
      return t("nav.observability");
    }

    if (path.startsWith("/sistema")) {
      return t("nav.system");
    }

    return t("nav.overview");
  })();

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div
      className={`app-shell ${
        sidebarHidden ? "app-shell--sidebar-hidden" : ""
      }`}
    >
      <header className="mobile-header">
        <NavLink
          to="/"
          end
          className="mobile-header__brand brand-link"
          aria-label={t("actions.goToOverview")}
        >
          <span className="mobile-header__logo">
            <img src="/favicon.svg" alt="" />
          </span>
          <strong>COC</strong>
        </NavLink>

        <div className="mobile-header__section" aria-live="polite">
          {mobileSection}
        </div>

        <button
          type="button"
          className={`menu-button ${menuOpen ? "menu-button--open" : ""}`}
          aria-label={
            menuOpen
              ? t("actions.closeMenu")
              : t("actions.openMenu")
          }
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label={t("actions.closeMenu")}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {sidebarHidden && (
        <button
          type="button"
          className="sidebar-restore-button"
          aria-label={t("actions.showSidebar")}
          title={t("actions.showSidebar")}
          onClick={() => setSidebarHidden(false)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      <aside
        className={`sidebar ${menuOpen ? "sidebar--open" : ""} ${
          sidebarHidden ? "sidebar--desktop-hidden" : ""
        }`}
      >
        <button
          type="button"
          className="sidebar__collapse-button"
          aria-label={t("actions.hideSidebar")}
          title={t("actions.hideSidebar")}
          onClick={() => {
            setSidebarHidden(true);
            setAccountOpen(false);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <NavLink
          to="/"
          end
          className="brand brand-link"
          aria-label={t("actions.goToOverview")}
        >
          <div className="brand__logo">
            <img src="/favicon.svg" alt="" />
          </div>

          <div className="brand__copy">
            <strong>Cloud Operations</strong>
            <span>Operations Center</span>
          </div>
        </NavLink>

        <LanguageSwitcher />

        <nav className="navigation">
          <NavLink to="/" end className={navigationClass}>
            <NavIcon name="summary" />
            <span>{t("nav.overview")}</span>
          </NavLink>

          <NavLink to="/servicios" className={navigationClass}>
            <NavIcon name="services" />
            <span>{t("nav.services")}</span>
          </NavLink>

          <NavLink to="/incidentes" className={navigationClass}>
            <NavIcon name="incidents" />
            <span>{t("nav.incidents")}</span>
          </NavLink>

          <div className="navigation__group">
            <button
              type="button"
              className={
                "navigation__item navigation__group-button" +
                (
                  location.pathname.startsWith("/seguridad")
                    ? " navigation__item--active"
                    : ""
                )
              }
              aria-expanded={securityOpen}
              onClick={() =>
                setSecurityOpen((current) => !current)
              }
            >
              <span className="navigation__item-main">
                <NavIcon name="security" />
                <span>{t("nav.security")}</span>
              </span>

              <span
                className={
                  "navigation__chevron" +
                  (
                    securityOpen
                      ? " navigation__chevron--open"
                      : ""
                  )
                }
              >
                ▾
              </span>
            </button>

            {securityOpen && (
              <div className="navigation__submenu">
                <NavLink
                  to="/seguridad"
                  end
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  <strong>{t("nav.activity")}</strong>
                  <span>{t("nav.activityDescription")}</span>
                </NavLink>

                <NavLink
                  to="/seguridad/vulnerabilidades"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  {t("nav.vulnerabilities")}
                </NavLink>

                <NavLink
                  to="/seguridad/alertas"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  {t("nav.alerts")}
                </NavLink>

                <NavLink
                  to="/seguridad/compliance"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  {t("nav.compliance")}
                </NavLink>

                <NavLink
                  to="/seguridad/policies"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  {t("nav.policies")}
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/operaciones" className={navigationClass}>
            <NavIcon name="operations" />
            <span>{t("nav.operations")}</span>
          </NavLink>

          <NavLink to="/automatizaciones" className={navigationClass}>
            <NavIcon name="automations" />
            <span>{t("nav.automations")}</span>
          </NavLink>

          <NavLink to="/observabilidad" className={navigationClass}>
            <NavIcon name="observability" />
            <span>{t("nav.observability")}</span>
          </NavLink>

          <NavLink to="/sistema" className={navigationClass}>
            <NavIcon name="system" />
            <span>{t("nav.system")}</span>
          </NavLink>
        </nav>

        <div className="sidebar__bottom">
          <div className="account-menu">
            <button
              type="button"
              className={`account-menu__trigger ${
                accountOpen ? "account-menu__trigger--open" : ""
              }`}
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((current) => !current)}
            >
              <span className="account-menu__avatar">{initial}</span>

              <span className="account-menu__identity">
                <small>Sesión iniciada</small>
                <strong>{username}</strong>
              </span>

              <span
                className={`account-menu__chevron ${
                  accountOpen ? "account-menu__chevron--open" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {accountOpen && (
              <div className="account-menu__dropdown">
                <div className="account-menu__status">
                  <span className="connection-dot" />
                  <span>Conexión segura</span>
                </div>

                <button
                  type="button"
                  className="account-menu__logout"
                  onClick={handleLogout}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
                  </svg>
                  {t("actions.logout")}
                </button>
              </div>
            )}
          </div>

          <div className="sidebar__footer">
            <span className="connection-dot" />
            TLS · v{APP_VERSION} · {SHORT_BUILD}
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>

      <nav
        className="mobile-bottom-nav"
        aria-label={t("nav.mobileNavigationAria")}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${
              isActive ? "mobile-bottom-nav__item--active" : ""
            }`
          }
        >
          <NavIcon name="summary" />
          <span>{t("nav.overview")}</span>
        </NavLink>

        <NavLink
          to="/servicios"
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${
              isActive ? "mobile-bottom-nav__item--active" : ""
            }`
          }
        >
          <NavIcon name="services" />
          <span>{t("nav.services")}</span>
        </NavLink>

        <NavLink
          to="/incidentes"
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${
              isActive ? "mobile-bottom-nav__item--active" : ""
            }`
          }
        >
          <NavIcon name="incidents" />
          <span>{t("nav.incidents")}</span>
        </NavLink>

        <NavLink
          to="/seguridad"
          className={({ isActive }) =>
            `mobile-bottom-nav__item ${
              isActive ? "mobile-bottom-nav__item--active" : ""
            }`
          }
        >
          <NavIcon name="security" />
          <span>{t("nav.security")}</span>
        </NavLink>

        <button
          type="button"
          className={`mobile-bottom-nav__item mobile-bottom-nav__more ${
            menuOpen ? "mobile-bottom-nav__item--active" : ""
          }`}
          aria-label={t("nav.openMoreSectionsAria")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="currentColor"
          >
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
          <span>{t("nav.more")}</span>
        </button>
      </nav>
    </div>
  );
}
