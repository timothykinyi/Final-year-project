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
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
