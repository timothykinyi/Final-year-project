import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />; // 🔥 replace boring loader
  }

  if (!user) {
    return <Navigate to="/shop/login" replace />;
  }

  return children ? children : <Outlet />;
}