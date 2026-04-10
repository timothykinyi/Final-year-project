// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { FaBox, FaChartBar, FaCog, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import CreateOrder from "../components/CreateOrder";
import OrdersList from "../components/OrdersList";
import Analytics from "../components/Analytics";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const shopId = user?.id || user?._id;

  // fetch deliveries (with optional filters)
  const fetchDeliveries = async (filters = {}) => {
    try {
      setLoadingDeliveries(true);
      let url = `${API_BASE}/api/deliveries`;
      if (Object.keys(filters).length) {
        const qs = new URLSearchParams(filters).toString();
        url = `${API_BASE}/api/deliveries/filter?${qs}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeliveries(Array.isArray(res.data) ? res.data : res.data.deliveries || []);
    } catch (err) {
      console.error("fetchDeliveries:", err);
      alert("Failed to load deliveries");
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analysis") {
      fetchDeliveries();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/shop/login";
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h2 className="logo">ShopDash</h2>

        <nav className="top-nav">
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <FaBox /> <span>Orders</span>
          </button>
          <button
            className={activeTab === "analysis" ? "active" : ""}
            onClick={() => setActiveTab("analysis")}
          >
            <FaChartBar /> <span>Analysis</span>
          </button>
          <button
            className={activeTab === "customization" ? "active" : ""}
            onClick={() => setActiveTab("customization")}
          >
            <FaCog /> <span>Settings</span>
          </button>
        </nav>

        <div className="profile">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="profile-btn"
          >
            <FaUserCircle size={24} />
          </button>
          {menuOpen && (
            <div className="profile-menu">
              <button onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="dashboard-content">
        {/* Orders Tab */}
        {activeTab === "orders" && (
          <section className="tab-panel">
            <CreateOrder token={token} />

          </section>
        )}

        {/* Analysis Tab */}
        {activeTab === "analysis" && (
          <section className="tab-panel">
            <OrdersList
              deliveries={deliveries}
              loading={loadingDeliveries}
              fetchDeliveries={fetchDeliveries}
              token={token}
            />
            <Analytics shopId={shopId} deliveries={deliveries} />
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === "customization" && (
          <section className="tab-panel">
            <h1>⚙️ Customization</h1>
            <p>Edit shop profile, delivery fees and other settings here.</p>
          </section>
        )}
      </main>
    </div>
  );
}
