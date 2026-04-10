import React, { useState } from "react";
import AvailableDeliveries from "../components/AvailableDeliveries";
import MyDeliveries from "../components/MyDeliveries";
import Analytics from "../components/RAnalytics";
import RiderSettings from "../components/RiderSettings";
import RiderWallet from "../components/RiderWallet";
import { useAuth } from "../context/AuthContext";
import "../styles/RiderDashboard.css";
import {
  FaBox,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTruck,
  FaMoneyBillWave
} from "react-icons/fa";

function RiderDashboard() {
  const [activeTab, setActiveTab] = useState("available");
  const auth = useAuth();
  const renderContent = () => {
    switch (activeTab) {
      case "available":
        return <AvailableDeliveries />;
      case "myDeliveries":
        return <MyDeliveries />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <RiderSettings />;
      case "wallet":
        return <RiderWallet />;
      default:
        return <AvailableDeliveries />;
    }
  };

  const handleLogout = async () => {
    await auth.logout();
  };

  return (
    <div className="rider-dashboard">

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="mobile-topbar">
        <h2>🏍 Rider Panel</h2>
        <button onClick={handleLogout}>
          <FaSignOutAlt />
        </button>
      </div>

      {/* ===== SIDEBAR (DESKTOP) ===== */}
      <div className="sidebar">

        <h2>🏍️ Rider Panel</h2>

        <ul>
          <li
            className={activeTab === "available" ? "active" : ""}
            onClick={() => setActiveTab("available")}
          >
            <FaBox />
            <span>Available</span>
          </li>

          <li
            className={activeTab === "myDeliveries" ? "active" : ""}
            onClick={() => setActiveTab("myDeliveries")}
          >
            <FaTruck />
            <span>My Deliveries</span>
          </li>

          <li
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            <FaChartBar />
            <span>Stats</span>
          </li>

          <li
            className={activeTab === "wallet" ? "active" : ""}
            onClick={() => setActiveTab("wallet")}
          >
            <FaMoneyBillWave />
            <span>Wallet</span>
          </li>

          <li
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog />
            <span>Settings</span>
          </li>
        </ul>

        <button onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="content">{renderContent()}</div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <div className="mobile-nav">
        <button
          className={activeTab === "available" ? "active" : ""}
          onClick={() => setActiveTab("available")}
        >
          <FaBox />
        </button>

        <button
          className={activeTab === "myDeliveries" ? "active" : ""}
          onClick={() => setActiveTab("myDeliveries")}
        >
          <FaTruck />
        </button>

        <button
          className={activeTab === "analytics" ? "active" : ""}
          onClick={() => setActiveTab("analytics")}
        >
          <FaChartBar />
        </button>

        <button
          className={activeTab === "wallet" ? "active" : ""}
          onClick={() => setActiveTab("wallet")}
        >
          <FaMoneyBillWave />
        </button>

        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          <FaCog />
        </button>
      </div>
    </div>
  );
}

export default RiderDashboard;