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
      const res = await auth.login({ email: shopEmail, password: shopPassword});
      if (res.ok) nav("/admin");
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
      
        <div className='login-right'>
          <AnimatePresence mode="wait">
              <motion.form
                key="shop"
                className="login-form"
                onSubmit={handleShopLogin}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2>Admin Login</h2>
                {err && <p className="error">{err}</p>}
                <div className="input-group">
                  <input type="email" placeholder=" " value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} required />
                  <label>Email Address</label>
                </div>
                <div className="input-group">
                  <input type="password" placeholder=" " value={shopPassword} onChange={(e) => setShopPassword(e.target.value)} required />
                  <label>Password</label>
                </div>
{/*                 <div className="options">
                  <a href="#">Forgot password?</a>
                </div> */}
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

              </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
