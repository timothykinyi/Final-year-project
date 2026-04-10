import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import "../styles/Analytics.css";
import API from "../services/api";

function Analytics({ shopId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/shops/${shopId}/analytics`;
      if (startDate || endDate) {
        const query = new URLSearchParams({ startDate, endDate }).toString();
        url += `?${query}`;
      }
      const res = await API.get(url)

      setAnalytics(res.data);
      setError(null);
    } catch (err) {
      setError("⚠️ Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  return (
    <section className="analytics-panel">
      <h1 className="analytics-title">📈 Shop Analytics</h1>

      {/* === Date Filters === */}
      <div className="filters">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="btn-alt" onClick={fetchAnalytics}>
          Apply
        </button>
      </div>

      {loading ? (
        <p className="info-text">⏳ Loading analytics...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : analytics ? (
        <>
          {/* === Overview Cards === */}
          <div className="overview-grid">
            {Object.entries(analytics.overview).map(([key, value]) => (
              <motion.div
                key={key}
                className="overview-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h3>{key.replace(/([A-Z])/g, " $1")}</h3>
                <p>{value}</p>
              </motion.div>
            ))}
          </div>

          {/* === Charts === */}
          <div className="charts-grid">
            <motion.div
              className="chart-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3>📅 Deliveries Per Day</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.trends.perDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1565c0" />
                  {/* <Line type="monotone" dataKey="count" stroke="#1565c0" /> */}
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              className="chart-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h3>📊 Deliveries Per Week</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.trends.perWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#43a047" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              className="chart-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
            >
              <h3>🗓 Deliveries Per Month</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.trends.perMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#f57c00" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* === Peak Days === */}
          {analytics.trends.peakDays.length > 0 && (
            <motion.div
              className="peak-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h3>🔥 Peak Day</h3>
              <p>
                {analytics.trends.peakDays[0]._id} —{" "}
                {analytics.trends.peakDays[0].count} deliveries
              </p>
            </motion.div>
          )}
        </>
      ) : (
        <p className="info-text">No analytics data available 🚫</p>
      )}
    </section>
  );
}

export default Analytics;
