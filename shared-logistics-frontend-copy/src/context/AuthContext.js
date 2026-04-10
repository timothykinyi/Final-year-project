// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete API.defaults.headers.common["Authorization"];
  }, [token]);

const login = async ({ email, phone, password, role = "shop" }) => {
  try {
    const endpoint = role === "shop" ? "/api/shops/login" : "/api/riders/login";
    const payload = role === "shop" ? { email, password } : { phone, password };

    const res = await API.post(endpoint, payload);
    const tok = res.data.token;

    // pick ID explicitly (works for both shop/rider)
    const id = res.data._id || res.data.id;

    // build user profile
    const profile = {
      ...(res.data.user || {}),
      ...(res.data.rider || {}),
      ...(res.data.shop || {}),
      ...res.data,
      role,
      id, // make sure id is always there
    };
    delete profile.token;

    // persist
    localStorage.setItem("token", tok);
    localStorage.setItem("user", JSON.stringify(profile));
    setToken(tok);
    setUser(profile);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.response?.data?.message || err.message };
  }
};

  const logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    return { ok: true };
  };


  const forgotPassword = async ({ email, role = "shop" }) => {
    try {
      const endpoint = role === "shop" ? "/api/shops/forgot-password" : "/api/riders/forgot-password";
      const payload = role === "shop" ? { email } : { phone: email }; // using email variable for both cases

      const res = await API.post(endpoint, payload);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || err.message };
    }
  };


    const resetPassword = async ({email, code, newPassword, role = "shop" }) => {
    try {
      const endpoint = role === "shop" ? "/api/shops/reset-password" : "/api/riders/reset-password";
      const payload = role === "shop" ? { email, code, newPassword } : { phone: email, code, newPassword }; // using email variable for both cases

      const res = await API.post(endpoint, payload);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.message || err.message };
    }
  };
  

  return (
    <AuthContext.Provider value={{ user, token, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};



export const useAuth = () => useContext(AuthContext);
