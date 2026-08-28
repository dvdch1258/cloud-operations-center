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

  const [menuOpen, setMenuOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(
    () => location.pathname.startsWith("/seguridad"),
  );

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMenuOpen(false);

    if (location.pathname.startsWith("/seguridad")) {
      setSecurityOpen(true);
    }
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <div className="mobile-header__brand">
          <div className="brand__logo">CO</div>

          <div>
            <strong>Cloud Operations</strong>
            <span>Observabilidad · Operaciones</span>
          </div>
        </div>

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
        <div className="brand">
          <div className="brand__logo">CO</div>

          <div>
            <strong>Cloud Operations</strong>
            <span>Observabilidad · Operaciones</span>
          </div>
        </div>

        <nav className="navigation">
          <NavLink to="/" end className={navigationClass}>
            Resumen
          </NavLink>

          <NavLink to="/servicios" className={navigationClass}>
            Servicios
          </NavLink>

          <NavLink to="/incidentes" className={navigationClass}>
            Incidentes
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
              <span>Seguridad</span>

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

                  <span>
                    Autenticación, bloqueos y eventos de seguridad.
                  </span>
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

          <NavLink
            to="/sistema"
            className={navigationClass}
          >
            Sistema
          </NavLink>

          <NavLink
            to="/observabilidad"
            className={navigationClass}
          >
            Observabilidad
          </NavLink>
        </nav>

        <div className="sidebar__account">
          <div>
            <span>Sesión iniciada</span>
            <strong>{user?.username}</strong>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>

        <div className="sidebar__footer">
          <span className="connection-dot" />
          Conexión segura · TLS · v{APP_VERSION} · {SHORT_BUILD}
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
