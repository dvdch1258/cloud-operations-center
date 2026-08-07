import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import SummaryPage from "./pages/SummaryPage";
import ServicesPage from "./pages/ServicesPage";
import IncidentsPage from "./pages/IncidentsPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SummaryPage />} />
        <Route path="servicios" element={<ServicesPage />} />
        <Route path="incidentes" element={<IncidentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
