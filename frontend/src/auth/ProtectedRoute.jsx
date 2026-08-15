import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./AuthContext";


export default function ProtectedRoute() {
  const {
    user,
    loading,
  } = useAuth();

  const location = useLocation();


  if (loading) {
    return (
      <div className="auth-loading">
        <div className="brand__logo">CO</div>
        <span>Validando sesión...</span>
      </div>
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }


  return <Outlet />;
}
