// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "../../shared-logistics-frontend/src/pages/admin/AdminLayout";
import AdminDashboard from "../../shared-logistics-frontend/src/pages/admin/AdminDashboard";
import AdminUsers from "../../shared-logistics-frontend/src/pages/admin/AdminUsers";
import AdminDeliveries from "../../shared-logistics-frontend/src/pages/admin/AdminDeliveries";
import AdminTransactions from "../../shared-logistics-frontend/src/pages/admin/AdminTransactions";


function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />


      {/* Protected shop routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="deliveries" element={<AdminDeliveries />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="register" element={<AdminRegister />} />

        </Route>
      </Route>

              

      
      {/* catch-all */}
      <Route path="*" element={<div className="p-6">404 - Not found</div>} />
    </Routes>
  );
}

export default App;
