import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "../api/client";
import AuthContext from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    localStorage.removeItem(
      "cloud_ops_access_token"
    );

    async function restoreSession() {
      try {
        const currentUser =
          await api.getMe();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized,
      );
    };
  }, []);

  async function login(username, password) {
    const currentUser =
      await api.login(username, password);

    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
