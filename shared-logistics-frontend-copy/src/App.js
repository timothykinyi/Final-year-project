// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ShopLogin from "./pages/ShopLogin";
import ShopRegister from "./pages/ShopRegister";
import ShopDashboard from "./pages/ShopDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RiderRegister from "./pages/RiderRegister";
import RiderDashboard from "./pages/RiderDashboard";
import TrackDelivery from "./components/TrackDelivery";
import ClientTracking from "./pages/ClientTracking";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop/dashboard" replace />} />
      <Route path="/shop/login" element={<ShopLogin />} />
      <Route path="/shop/register" element={<ShopRegister />} />
      <Route path="/rider/register" element={<RiderRegister />} />
      <Route path="/rider/track" element={<TrackDelivery />} />
      <Route path="/track/:deliveryId" element={<ClientTracking />} />

      {/* Protected shop routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/shop/dashboard" element={<ShopDashboard />} />
         <Route path="/rider/dashboard" element={<RiderDashboard />} />
        
      </Route>

      {/* catch-all */}
      <Route path="*" element={<div className="p-6">404 - Not found</div>} />
    </Routes>
  );
}

export default App;
