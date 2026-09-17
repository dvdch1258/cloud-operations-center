import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(
    () => location.pathname.startsWith("/seguridad"),
  );

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);

    if (location.pathname.startsWith("/seguridad")) {
      setSecurityOpen(true);
    }
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const username = user?.username || "Usuario";
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <NavLink
          to="/"
          end
          className="mobile-header__brand brand-link"
          aria-label="Ir al resumen"
        >
          <div className="brand__logo">
            <img src="/favicon.svg" alt="" />
          </div>

          <div className="brand__copy">
            <strong>Cloud Operations</strong>
            <span>Operations Center</span>
          </div>
        </NavLink>

        <button
          type="button"
          className="menu-button"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
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
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <NavLink
          to="/"
          end
          className="brand brand-link"
          aria-label="Ir al resumen"
        >
          <div className="brand__logo">
            <img src="/favicon.svg" alt="" />
          </div>

          <div className="brand__copy">
            <strong>Cloud Operations</strong>
            <span>Operations Center</span>
          </div>
        </NavLink>

        <nav className="navigation">
          <NavLink to="/" end className={navigationClass}>
            <NavIcon name="summary" />
            <span>Resumen</span>
          </NavLink>

          <NavLink to="/servicios" className={navigationClass}>
            <NavIcon name="services" />
            <span>Servicios</span>
          </NavLink>

          <NavLink to="/incidentes" className={navigationClass}>
            <NavIcon name="incidents" />
            <span>Incidentes</span>
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
                <span>Seguridad</span>
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
                  <strong>Actividad</strong>
                  <span>Autenticación, bloqueos y eventos.</span>
                </NavLink>

                <NavLink
                  to="/seguridad/vulnerabilidades"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  Vulnerabilidades
                </NavLink>

                <NavLink
                  to="/seguridad/alertas"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  Alertas
                </NavLink>

                <NavLink
                  to="/seguridad/compliance"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  Compliance
                </NavLink>

                <NavLink
                  to="/seguridad/policies"
                  className={({ isActive }) =>
                    isActive
                      ? "navigation__subitem navigation__subitem--active"
                      : "navigation__subitem"
                  }
                >
                  Policies
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/operaciones" className={navigationClass}>
            <NavIcon name="operations" />
            <span>Operaciones</span>
          </NavLink>

          <NavLink to="/automatizaciones" className={navigationClass}>
            <NavIcon name="automations" />
            <span>Automatizaciones</span>
          </NavLink>

          <NavLink to="/observabilidad" className={navigationClass}>
            <NavIcon name="observability" />
            <span>Observabilidad</span>
          </NavLink>

          <NavLink to="/sistema" className={navigationClass}>
            <NavIcon name="system" />
            <span>Sistema</span>
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
                  Cerrar sesión
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
    </div>
  );
}
