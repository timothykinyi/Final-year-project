// src/components/rider/Analytics.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBox, FaCheckCircle, FaClock, FaMoneyBill } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import "../styles/RAnalytics.css";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const token = localStorage.getItem("token");
  const { showToast } = useToast();

  const fetchAnalytics = async () => {
    try {
      let url = `/api/riders/analytics`;
      if (range.startDate && range.endDate) {
        url += `?startDate=${range.startDate}&endDate=${range.endDate}`;
      }
      const res = await API.get(url);
      setAnalytics(res.data.overview);
    } catch (err) {
      console.error("Error fetching analytics", err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line
  }, []);

  const pieData = analytics
    ? [
        { name: "Completed", value: analytics.completedDeliveries },
        { name: "Pending", value: analytics.pendingDeliveries },
      ]
    : [];

  const COLORS = ["#4caf50", "#ff9800"];

  return (
    <div className="analytics">
      <h2>Rider Analytics</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="date"
          value={range.startDate}
          onChange={(e) => setRange({ ...range, startDate: e.target.value })}
        />
        <input
          type="date"
          value={range.endDate}
          onChange={(e) => setRange({ ...range, endDate: e.target.value })}
        />
        <button onClick={fetchAnalytics}>Filter</button>
        <button
          className="reset"
          onClick={() => {
            setRange({ startDate: "", endDate: "" });
            fetchAnalytics();
          }}
        >
          Reset
        </button>
      </div>

      {/* Overview Cards */}
      {analytics ? (
        <div className="analytics-grid">
          <div className="card">
            <FaBox className="icon total" />
            <p>Total Deliveries</p>
            <h3>{analytics.totalDeliveries}</h3>
          </div>
          <div className="card">
            <FaCheckCircle className="icon success" />
            <p>Completed</p>
            <h3>{analytics.completedDeliveries}</h3>
          </div>
          <div className="card">
            <FaClock className="icon pending" />
            <p>Pending</p>
            <h3>{analytics.pendingDeliveries}</h3>
          </div>
          <div className="card">
            <FaMoneyBill className="icon earnings" />
            <p>Total Earnings</p>
            <h3>KES {analytics.totalEarnings}</h3>
          </div>
        </div>
      ) : (
        <p className="empty">No analytics available</p>
      )}

      {/* Charts */}
      {analytics && (
        <div className="charts">
          {/* Pie Chart */}
          <div className="chart-box">
            <h4>Delivery Status</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="chart-box">
            <h4>Deliveries Breakdown</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0077cc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
