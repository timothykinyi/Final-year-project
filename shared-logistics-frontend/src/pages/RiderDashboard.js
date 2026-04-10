// src/pages/RiderDashboard.jsx
import React, { useState } from "react";
import AvailableDeliveries from "../components/AvailableDeliveries";
import MyDeliveries from "../components/MyDeliveries";
import Analytics from "../components/RAnalytics";
import Customization from "../components/Customization";
import "../styles/RiderDashboard.css";
import { FaBox, FaChartBar, FaCog, FaUserCircle, FaSignOutAlt } from "react-icons/fa";

function RiderDashboard() {
  const [activeTab, setActiveTab] = useState("available");

  const renderContent = () => {
    switch (activeTab) {
      case "available": return <AvailableDeliveries />;
      case "myDeliveries": return <MyDeliveries />;
      case "analytics": return <Analytics />;
      case "customization": return <Customization />;
      default: return <AvailableDeliveries />;
    }
  };

    const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/shop/login";
  };

  return (
    <div className="rider-dashboard">
      <div className="sidebar">
        <button onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
        <h2>Rider Panel</h2>
        <ul>
          <li className={activeTab === "available" ? "active" : ""}
              onClick={() => setActiveTab("available")}>
            Available Deliveries
          </li>
          <li className={activeTab === "myDeliveries" ? "active" : ""}
              onClick={() => setActiveTab("myDeliveries")}>
            My Deliveries
          </li>
          <li className={activeTab === "analytics" ? "active" : ""}
              onClick={() => setActiveTab("analytics")}>
            Analytics
          </li>
          <li className={activeTab === "customization" ? "active" : ""}
              onClick={() => setActiveTab("customization")}>
            Customization
          </li>
        </ul>
      </div>
      <div className="content">{renderContent()}</div>
    </div>
  );
}

export default RiderDashboard;
