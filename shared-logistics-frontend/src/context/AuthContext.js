// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Restore user on refresh
    useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await API.get("/api/auth/me");
          setUser(res.data);
        } catch (err) {
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }, []);

  const refreshUser = async () => {
    try {
      const res = await API.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  };

  // 🔐 LOGIN
  const login = async ({ email, password}) => {
    try {
    const endpoint = "/admin/login";
    const payload = { email, password };

    const res = await API.post(endpoint, payload);

      // build profile
      const profile = {
        ...(res.data.rider || {}),
        ...(res.data.shop || {}),
        ...res.data,
      };

      setUser(profile);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  // 🚪 LOGOUT
  const logout = async () => {
    try {
      await API.post("/api/auth/logout"); // backend clears cookie
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
    }

    return { ok: true };
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

