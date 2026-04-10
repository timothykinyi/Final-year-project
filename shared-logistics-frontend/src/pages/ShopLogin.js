import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaMotorcycle, FaStore } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/LoginSwitcher.css";

export default function LoginSwitcher() {
  const [activeTab, setActiveTab] = useState("shop");
  const [shopEmail, setShopEmail] = useState("");
  const [shopPassword, setShopPassword] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderPassword, setRiderPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = useAuth();
  const nav = useNavigate();

  const handleShopLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await auth.login({ email: shopEmail, password: shopPassword, role: "shop" });
      if (res.ok) nav("/shop/dashboard");
      else setErr(res.error || "Login failed");
    } catch {
      setErr("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRiderLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await auth.login({ phone: riderPhone, password: riderPassword, role: "rider" });
      if (res.ok) nav("/rider/dashboard");
      else setErr(res.error || "Login failed");
    } catch {
      setErr("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Animated background blobs */}
      <div className="bg-shapes">
        <div className="shape shape1" />
        <div className="shape shape2" />
        <div className="shape shape3" />
      </div>

      {/* Glass card */}
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left panel */}
        <div className={`login-left ${activeTab === "rider" ? "order-right" : ""}`}>
          <h1>Welcome!</h1>
          <p>Manage deliveries or start your ride with ease.</p>

          {/* Toggle */}
          <div className="login-toggle">
            <div className="toggle-pill" style={{ left: activeTab === "shop" ? "0%" : "50%" }} />
            <button className={activeTab === "shop" ? "active" : ""} onClick={() => setActiveTab("shop")}>
              <FaStore /> Shop
            </button>
            <button className={activeTab === "rider" ? "active" : ""} onClick={() => setActiveTab("rider")}>
              <FaMotorcycle /> Rider
            </button>
          </div>

          {/* Animated icon */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="icon-wrapper"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            >
              {activeTab === "shop" ? (
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <FaStore size={80} />
                </motion.div>
              ) : (
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <FaMotorcycle size={80} />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div className={`login-right ${activeTab === "rider" ? "order-left" : ""}`}>
          <AnimatePresence mode="wait">
            {activeTab === "shop" ? (
              <motion.form
                key="shop"
                className="login-form"
                onSubmit={handleShopLogin}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2>Shop Login</h2>
                {err && <p className="error">{err}</p>}
                <div className="input-group">
                  <input type="email" placeholder=" " value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} required />
                  <label>Email Address</label>
                </div>
                <div className="input-group">
                  <input type="password" placeholder=" " value={shopPassword} onChange={(e) => setShopPassword(e.target.value)} required />
                  <label>Password</label>
                </div>
                <div className="options">
                  <label><input type="checkbox" /> Remember me</label>
                  <a href="#">Forgot password?</a>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
                <p className="signup-link">
                  Not a member yet? <Link to="/shop/register">Sign up</Link>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="rider"
                className="login-form"
                onSubmit={handleRiderLogin}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2>Rider Login</h2>
                {err && <p className="error">{err}</p>}
                <div className="input-group">
                  <input type="text" placeholder=" " value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} required />
                  <label>Phone Number</label>
                </div>
                <div className="input-group">
                  <input type="password" placeholder=" " value={riderPassword} onChange={(e) => setRiderPassword(e.target.value)} required />
                  <label>Password</label>
                </div>
                <div className="options">
                  <label><input type="checkbox" /> Remember me</label>
                  <a href="#">Forgot password?</a>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
                <p className="signup-link">
                  Not a member yet? <Link to="/rider/register">Sign up</Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
