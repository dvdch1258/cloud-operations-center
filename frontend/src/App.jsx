import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import IncidentsPage from "./pages/IncidentsPage";
import LoginPage from "./pages/LoginPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ServicesPage from "./pages/ServicesPage";
import SecurityPage from "./pages/SecurityPage";
import VulnerabilitiesPage from "./pages/VulnerabilitiesPage";
import AlertsPage from "./pages/AlertsPage";
import SummaryPage from "./pages/SummaryPage";
import SystemPage from "./pages/SystemPage";
import "./App.css";


export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route
            index
            element={<SummaryPage />}
          />

          <Route
            path="servicios"
            element={<ServicesPage />}
          />

          <Route
            path="servicios/:serviceId"
            element={<ServiceDetailPage />}
          />

          <Route
            path="incidentes"
            element={<IncidentsPage />}
          />

          <Route
            path="seguridad"
            element={<SecurityPage />}
          />

          <Route
            path="seguridad/vulnerabilidades"
            element={<VulnerabilitiesPage />}
          />

          <Route
            path="seguridad/alertas"
            element={<AlertsPage />}
          />

          <Route
            path="sistema"
            element={<SystemPage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
