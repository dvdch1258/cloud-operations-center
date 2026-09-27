import {
  lazy,
  Suspense,
} from "react";

import { useTranslation } from "react-i18next";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import "./App.css";


const IncidentsPage = lazy(
  () => import("./pages/IncidentsPage"),
);

const IncidentDetailPage = lazy(
  () => import("./pages/IncidentDetailPage"),
);

const LoginPage = lazy(
  () => import("./pages/LoginPage"),
);

const LandingPage = lazy(
  () => import("./pages/LandingPage"),
);

const ServiceDetailPage = lazy(
  () => import("./pages/ServiceDetailPage"),
);

const ServicesPage = lazy(
  () => import("./pages/ServicesPage"),
);

const SecurityPage = lazy(
  () => import("./pages/SecurityPage"),
);

const VulnerabilitiesPage = lazy(
  () => import("./pages/VulnerabilitiesPage"),
);

const AlertsPage = lazy(
  () => import("./pages/AlertsPage"),
);

const CompliancePage = lazy(
  () => import("./pages/CompliancePage"),
);

const PoliciesPage = lazy(
  () => import("./pages/PoliciesPage"),
);

const ObservabilityPage = lazy(
  () => import("./pages/ObservabilityPage"),
);

const OperationsPage = lazy(
  () => import("./pages/OperationsPage"),
);

const AutomationsPage = lazy(
  () => import("./pages/AutomationsPage"),
);

const SummaryPage = lazy(
  () => import("./pages/SummaryPage"),
);

const SystemPage = lazy(
  () => import("./pages/SystemPage"),
);


function FullPageFallback() {
  const { t } = useTranslation();

  return (
    <div
      className="auth-loading"
      role="status"
      aria-live="polite"
    >
      <div
        className="brand__logo"
        aria-hidden="true"
      >
        CO
      </div>

      <span>{t("common.loading")}</span>
    </div>
  );
}


export default function App() {
  const hostname =
    window.location.hostname.toLowerCase();

  const marketingHost =
    hostname === "cloudopscenter.es" ||
    hostname === "www.cloudopscenter.es";


  if (marketingHost) {
    return (
      <Suspense fallback={<FullPageFallback />}>
        <LandingPage />
      </Suspense>
    );
  }


  return (
    <Routes>
      <Route
        path="/landing"
        element={
          <Suspense fallback={<FullPageFallback />}>
            <LandingPage />
          </Suspense>
        }
      />

      <Route
        path="/login"
        element={
          <Suspense fallback={<FullPageFallback />}>
            <LoginPage />
          </Suspense>
        }
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
            path="incidentes/:incidentId"
            element={<IncidentDetailPage />}
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
            path="seguridad/compliance"
            element={<CompliancePage />}
          />

          <Route
            path="seguridad/policies"
            element={<PoliciesPage />}
          />

          <Route
            path="operaciones"
            element={<OperationsPage />}
          />

          <Route
            path="automatizaciones"
            element={<AutomationsPage />}
          />

          <Route
            path="observabilidad"
            element={<ObservabilityPage />}
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
