import React, { useEffect, useState } from "react";
import API from "../../services/api";
import "../../styles/Admin.css";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeRiders: 0,
    totalShops: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  const chartData = [
    { name: "Deliveries", value: stats.totalDeliveries },
    { name: "Riders", value: stats.activeRiders },
    { name: "Shops", value: stats.totalShops },
    { name: "Revenue", value: stats.totalRevenue },
  ];

  return (
    <div className="dashboard-container">
      <h2 className="title">Admin Dashboard</h2>

      <div className="cards">
        <div className="card">
          <h3>Total Deliveries</h3>
          <p>{stats.totalDeliveries}</p>
        </div>

        <div className="card">
          <h3>Active Riders</h3>
          <p>{stats.activeRiders}</p>
        </div>

        <div className="card">
          <h3>Shops</h3>
          <p>{stats.totalShops}</p>
        </div>

        <div className="card">
          <h3>Revenue</h3>
          <p>KES {stats.totalRevenue}</p>
        </div>
      </div>

      <div className="chart-section">
        <h3>Platform Overview</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}