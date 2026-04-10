import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaMotorcycle, FaStore, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/LoginSwitcher.css";
import { useToast } from "../context/ToastContext";


export default function LoginSwitcher() {
  const [activeTab, setActiveTab] = useState("shop");
  const { showToast } = useToast();
  const [shopEmail, setShopEmail] = useState("");
  const [shopPassword, setShopPassword] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderPassword, setRiderPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // 👁️ password visibility states
  const [showShopPassword, setShowShopPassword] = useState(false);
  const [showRiderPassword, setShowRiderPassword] = useState(false);

  // 🔥 forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotValue, setForgotValue] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

    // 🔥 reset flow
    const [resetStep, setResetStep] = useState(1);
    const [resetCode, setResetCode] = useState("");
  
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
  
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  


  // 🔐 password validator
  const isStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  };

  const auth = useAuth();
  const nav = useNavigate();

  const handleShopLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await auth.login({
        email: shopEmail,
        password: shopPassword,
        role: "shop",
      });
      if (res.ok) nav("/shop/dashboard");
      else showToast("error", res.error || "Login failed");

    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRiderLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await auth.login({
        phone: riderPhone,
        password: riderPassword,
        role: "rider",
      });
      if (res.ok) nav("/rider/dashboard");
      else showToast("error", res.error || "Login failed");
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setErr(null);
    setForgotMsg("");
    setLoading(true);

    try {
      const res = await auth.forgotPassword({
        email: forgotValue,
        role: activeTab,
      });

      if (res.ok) {
        showToast("success", "If an account exists, reset instructions have been sent");
        setResetStep(2);
      } else {
        showToast("error", res.error || "Failed to send reset request");
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(newPassword)) {
      return showToast(
        "error",
        "Password must be 8+ chars, include uppercase, lowercase, number & special character"
      );
    }

    if (newPassword !== confirmPassword) {
      return showToast("error", "Passwords do not match");
    }

    setLoading(true);

    try {
      const res = await auth.resetPassword({
        email: forgotValue, // using forgotValue which holds email/phone based on role
        code: resetCode,
        newPassword,
        role: activeTab,
      });

      if (res.ok) {
        showToast("success", "Password reset successful");

        setForgotMode(false);
        setResetStep(1);
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast("error", res.error);
      }
    } catch {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-wrapper">
      <div className="bg-shapes">
        <div className="shape shape1" />
        <div className="shape shape2" />
        <div className="shape shape3" />
      </div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* LEFT PANEL */}
        <div className={`login-left ${activeTab === "rider" ? "order-right" : ""}`}>
          <h1>Welcome!</h1>
          <p>Manage deliveries or start your ride with ease.</p>

          {!forgotMode && (
            <div className="login-toggle">
              <div
                className="toggle-pill"
                style={{ left: activeTab === "shop" ? "0%" : "50%" }}
              />
              <button
                className={activeTab === "shop" ? "active" : ""}
                onClick={() => setActiveTab("shop")}
              >
                <FaStore /> Shop
              </button>
              <button
                className={activeTab === "rider" ? "active" : ""}
                onClick={() => setActiveTab("rider")}
              >
                <FaMotorcycle /> Rider
              </button>
            </div>
          )}

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

        {/* RIGHT PANEL */}
        <div className={`login-right ${activeTab === "rider" ? "order-left" : ""}`}>
          <AnimatePresence mode="wait">
              {/* ================= RESET FLOW ================= */}
              {forgotMode ? (
                resetStep === 1 ? (
                  <motion.form key="forgot1" onSubmit={handleForgot} className="login-form">
                    <h2>Reset Password</h2>
  
                    <div className="input-group">
                      <input type="text" placeholder=" " value={forgotValue} onChange={(e) => setForgotValue(e.target.value)} required />
                      <label>{activeTab === "shop" ? "Email Address" : "Phone Number"}</label>
                    </div>
  
                    <button className="btn-primary">
                      {loading ? "Sending..." : "Send Code"}
                    </button>
  
                    <p className="signup-link">
                      <button type="button" className="link-btn" onClick={() => setForgotMode(false)}>
                        Back to Login
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form key="forgot2" onSubmit={handleResetPassword} className="login-form">
                    <h2>Enter Reset Code</h2>
  
                    <div className="input-group">
                      <input type="text" placeholder=" " value={resetCode} onChange={(e) => setResetCode(e.target.value)} required />
                      <label>Reset Code</label>
                    </div>
  
                    {/* NEW PASSWORD */}
                    <div className="input-group password-group">
                      <input type={showNewPassword ? "text" : "password"} placeholder=" " value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                      <label>New Password</label>
                      <span 
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="password-toggle"
                        >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
  
                    {/* CONFIRM PASSWORD */}
                    <div className="input-group password-group">
                      <input type={showConfirmPassword ? "text" : "password"} placeholder=" " value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      <label>Confirm Password</label>
                      <span 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
  
                    <button className="btn-primary">
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </motion.form>
                )
              ) 
              : activeTab === "shop" ? (
              <motion.form key="shop" className="login-form" onSubmit={handleShopLogin}>
                <h2>Shop Login</h2>
                {err && <p className="error">{err}</p>}

                <div className="input-group">
                  <input type="email" placeholder=" " value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} required />
                  <label>Email Address</label>
                </div>

                {/* 👁️ PASSWORD FIELD */}
                <div className="input-group password-group">
                  <input
                    type={showShopPassword ? "text" : "password"}
                    placeholder=" "
                    value={shopPassword}
                    onChange={(e) => setShopPassword(e.target.value)}
                    required
                  />
                  <label>Password</label>
                  <span
                    className="password-toggle"
                    onClick={() => setShowShopPassword(!showShopPassword)}
                  >
                    {showShopPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="options">
                  <button type="button" className="link-btn" onClick={() => setForgotMode(true)}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>

                <p className="signup-link">
                  Not a member yet? <Link to="/shop/register">Sign up</Link>
                </p>
              </motion.form>
            ) : (
              <motion.form key="rider" className="login-form" onSubmit={handleRiderLogin}>
                <h2>Rider Login</h2>
                {err && <p className="error">{err}</p>}

                <div className="input-group">
                  <input type="text" placeholder=" " value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} required />
                  <label>Phone Number</label>
                </div>

                {/* 👁️ PASSWORD FIELD */}
                <div className="input-group password-group">
                  <input
                    type={showRiderPassword ? "text" : "password"}
                    placeholder=" "
                    value={riderPassword}
                    onChange={(e) => setRiderPassword(e.target.value)}
                    required
                  />
                  <label>Password</label>
                  <span
                    className="password-toggle"
                    onClick={() => setShowRiderPassword(!showRiderPassword)}
                  >
                    {showRiderPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <div className="options">
                  <button type="button" className="link-btn" onClick={() => setForgotMode(true)}>
                    Forgot password?
                  </button>
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