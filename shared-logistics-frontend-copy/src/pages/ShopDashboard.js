// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  FaBox,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaStore,
  FaBoxes
} from "react-icons/fa";
import API from "../services/api";
import CreateOrder from "../components/CreateOrder";
import OrdersList from "../components/OrdersList";
import Analytics from "../components/Analytics";
import ShopSettings from "../components/ShopSettings";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const auth = useAuth();
  const { user } = useAuth();

  const shopId = user?.id || user?._id;

  const fetchDeliveries = async (filters = {}) => {
    try {
      setLoadingDeliveries(true);
      let url = `/api/deliveries`;

      if (Object.keys(filters).length) {
        const qs = new URLSearchParams(filters).toString();
        url = `/api/deliveries/filter?${qs}`;
      }

      const res = await API.get(url);

      setDeliveries(
        Array.isArray(res.data)
          ? res.data
          : res.data.deliveries || []
      );
    } catch (err) {
      console.error("fetchDeliveries:", err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analysis" || activeTab === "myorders") {
      fetchDeliveries();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await auth.logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return <CreateOrder/>;

      case "myorders":
        return (
          <>
            <OrdersList
              deliveries={deliveries}
              loading={loadingDeliveries}
              fetchDeliveries={fetchDeliveries}
            />
          </>
        );

      case "analysis":
        return (

            <Analytics shopId={shopId} deliveries={deliveries} />

        );

      case "settings":
        return <ShopSettings />;

      default:
        return <CreateOrder/>;
    }
  };

  return (
    <div className="shop-dashboard">

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="mobile-topbar">
        <h2>Shop's Panel</h2>
        <button onClick={handleLogout}>
          <FaSignOutAlt />
        </button>
      </div>

      {/* Sidebar */}
      <div className="shop-sidebar">
        <h2><FaStore /> Shop Panel</h2>

        <ul>
          <li
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            <FaBox /> Orders
          </li>


          <li
            className={activeTab === "myorders" ? "active" : ""}
            onClick={() => setActiveTab("myorders")}
          >
            <FaBoxes /> My Orders
          </li>
          <li
            className={activeTab === "analysis" ? "active" : ""}
            onClick={() => setActiveTab("analysis")}
          >
            <FaChartBar /> Analytics
          </li>


          <li
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog /> Settings
          </li>
        </ul>

        <button onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Content */}
      <div className="shop-content">
        {renderContent()}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mobile-nav">
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <FaBox />
        </button>


        <button
          className={activeTab === "myorders" ? "active" : ""}
          onClick={() => setActiveTab("myorders")}
        >
          <FaBoxes />
        </button>

        <button
          className={activeTab === "analysis" ? "active" : ""}
          onClick={() => setActiveTab("analysis")}
        >
          <FaChartBar />
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