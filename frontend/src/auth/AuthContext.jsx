import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../api/client";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = getAccessToken();

      if (!token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.getMe();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        clearAccessToken();

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
      clearAccessToken();
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
    const result = await api.login(username, password);

    setAccessToken(result.access_token);

    try {
      const currentUser = await api.getMe();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearAccessToken();
      setUser(null);
      throw error;
    }
  }


  function logout() {
    clearAccessToken();
    setUser(null);
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


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  return context;
}
