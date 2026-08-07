import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import SummaryPage from "./pages/SummaryPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import IncidentsPage from "./pages/IncidentsPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SummaryPage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route
          path="servicios/:serviceId"
          element={<ServiceDetailPage />}
        />
        <Route path="incidentes" element={<IncidentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
