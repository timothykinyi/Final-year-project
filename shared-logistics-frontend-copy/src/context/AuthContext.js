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
          console.log("::::::::::::::::::::::::::::::::")
          console.log("AuthContext fetchUser:", res.data);
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
  const login = async ({ email, phone, password, role = "shop" }) => {
    try {
      const endpoint =
        role === "shop" ? "/api/shops/login" : "/api/riders/login";

      const payload =
        role === "shop" ? { email, password } : { phone, password };

      const res = await API.post(endpoint, payload);

      // build profile
      const profile = {
        ...(res.data.rider || {}),
        ...(res.data.shop || {}),
        ...res.data,
        role,
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
      await API.post("/api/shops/logout"); // backend clears cookie
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
    }

    return { ok: true };
  };

  // 🔑 FORGOT PASSWORD
  const forgotPassword = async ({ email, role = "shop" }) => {
    try {
      const endpoint =
        role === "shop"
          ? "/api/shops/forgot-password"
          : "/api/riders/forgot-password";

      const payload =
        role === "shop" ? { email } : { phone: email };

      await API.post(endpoint, payload);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  // 🔁 RESET PASSWORD
  const resetPassword = async ({
    email,
    code,
    newPassword,
    role = "shop",
  }) => {
    try {
      const endpoint =
        role === "shop"
          ? "/api/shops/reset-password"
          : "/api/riders/reset-password";

      const payload =
        role === "shop"
          ? { email, code, newPassword }
          : { phone: email, code, newPassword };

      await API.post(endpoint, payload);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || err.message,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);