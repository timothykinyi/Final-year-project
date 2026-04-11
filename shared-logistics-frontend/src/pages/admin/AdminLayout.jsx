import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaBox,
  FaMoneyBill,
  FaChartBar,
  FaUserPlus,
  FaSignOutAlt
} from "react-icons/fa";
import "../../styles/Admin.css";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const location = useLocation();
  const auth = useAuth();
    const handleLogout = async () => {
      await auth.logout();
    };
  const menu = [
    { name: "Dashboard", path: "/admin", icon: <FaTachometerAlt /> },
    { name: "Users", path: "/admin/users", icon: <FaUsers /> },
    { name: "Deliveries", path: "/admin/deliveries", icon: <FaBox /> },
    { name: "New admin", path: "/admin/register", icon: <FaUserPlus /> },
    //{ name: "Transactions", path: "/admin/transactions", icon: <FaMoneyBill /> },
    //{ name: "Reports", path: "/admin/reports", icon: <FaChartBar /> },
  ];

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>Admin</h2>
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={location.pathname === item.path ? "active" : ""}
          >
            {item.icon} {item.name}
          </Link>
        ))}
        <button onClick={handleLogout} style={{ marginTop: "auto", background: "red", color: "#fff", cursor: "pointer" }}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}