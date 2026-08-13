import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

function navigationClass({ isActive }) {
  return isActive
    ? "navigation__item navigation__item--active"
    : "navigation__item";
}

const APP_VERSION =
  import.meta.env.VITE_APP_VERSION || "1.0.0";

const BUILD_SHA =
  import.meta.env.VITE_BUILD_SHA || "development";

const SHORT_BUILD =
  BUILD_SHA === "development"
    ? "dev"
    : BUILD_SHA.replace(/^sha-/, "").slice(0, 7);

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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

          <a
            className="navigation__item"
            href="https://grafana.cloudopscenter.es"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Observabilidad
          </a>
        </nav>

        <div className="sidebar__footer">
          <span className="connection-dot" />
          Acceso seguro · NetBird · v{APP_VERSION} · {SHORT_BUILD}
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
