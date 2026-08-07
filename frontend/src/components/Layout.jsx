import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

function navigationClass({ isActive }) {
  return isActive
    ? "navigation__item navigation__item--active"
    : "navigation__item";
}

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
            <span>Control Center</span>
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
            <span>Control Center</span>
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
            href={`${window.location.protocol}//${window.location.hostname}:3002`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Observabilidad
          </a>
        </nav>

        <div className="sidebar__footer">
          <span className="connection-dot" />
          Conectado mediante NetBird
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
