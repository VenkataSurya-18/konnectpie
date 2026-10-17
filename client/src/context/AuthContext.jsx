import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verify token on initial application load and refresh
  const verifySession = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }

    try {
      const res = await api.get("/auth/me");
      if (res.data && res.data.id) {
        setUser(res.data);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(res.data));
        return true;
      } else {
        throw new Error("Invalid session response");
      }
    } catch (err) {
      console.warn("Session verification failed, logging out:", err?.response?.status || err?.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", {
      email: email.trim(),
      password,
    });

    const data = res.data;
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    const userData = {
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email || email.trim(),
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const register = async (name, email, password, role) => {
    const res = await api.post("/auth/register", {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });

    const data = res.data;
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    const userData = {
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email || email.trim(),
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout network errors
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        verifySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
