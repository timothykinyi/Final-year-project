import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  FaMoon,
  FaSun,
  FaUser,
  FaMotorcycle,
  FaBell,
  FaShieldAlt,
  FaSave,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import API from "../services/api";
import "../styles/Settings.css";
import { useToast } from "../context/ToastContext";


export default function RiderSettings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  // ---------------- STATE ----------------
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    vehicleType: user?.vehicleType || "",
  });

  const [availability, setAvailability] = useState(user?.availability ?? true);

  const [notifications, setNotifications] = useState({
    newDeliveries: true,
    deliveryUpdates: true,
    earningsAlerts: true,
    pushNotifications: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // ---------------- REGEX ----------------
  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[0-9]{10,15}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  // ---------------- HELPERS ----------------
  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // ---------------- HANDLERS ----------------
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleNotifToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSaveProfile = async () => {
    if (!nameRegex.test(profile.name)) {
      return showToast("error", "Name must contain letters only");
    }

    if (!emailRegex.test(profile.email)) {
      return showToast("error", "Invalid email format");
    }

    if (!phoneRegex.test(profile.phone)) {
      return showToast("error", "Phone must be valid numbers (10-15 digits)")
    }

    if (!profile.vehicleType) {
      return showToast("error", "Please select a vehicle type")

    }

    setSaving(true);

    try {
      await API.put("/api/riders/profile", profile);

      const updatedUser = { ...user, ...profile };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      showToast("success", "Profile updated successfully!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SAVE AVAILABILITY ----------------
  const handleSaveAvailability = async () => {
    setSaving(true);

    try {
      await API.put("/api/riders/availability", { availability });
      showToast("success", "Availability updated!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to update availability");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- SAVE NOTIFICATIONS ----------------
  const handleSaveNotifications = async () => {
    setSaving(true);

    try {
      await API.put("/api/riders/notifications", notifications);
      showToast("success", "Notification settings updated!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to update notifications");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UPDATE PASSWORD ----------------
  const handleUpdatePassword = async () => {
    if (!strongPasswordRegex.test(passwordData.newPassword)) {
      return showToast("error", "Password must be 8+ chars, include uppercase, lowercase, number & symbol");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast("error", "Passwords do not match");
    }

    setSaving(true);

    try {
      await API.put("/api/riders/update-password", passwordData);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("success", "Password updated successfully!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="settings-page">
      <h2 className="settings-title">
        <FaMotorcycle /> Rider Settings
      </h2>

      {message && (
        <div className={`settings-toast ${message.includes("Failed") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {/* Appearance */}
      <div className="settings-section">
        <h3><FaMoon /> Appearance</h3>
        <div className="theme-selector">
          <button className={`theme-option ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")}>
            <FaSun size={20} />
            <span>Light</span>
          </button>
          <button className={`theme-option ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
            <FaMoon size={20} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <h3><FaUser /> Rider Profile</h3>

        <div className="settings-form">
          <div className="form-row">
            <label>Full Name</label>
            <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Full name" />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input name="email" value={profile.email} onChange={handleProfileChange} placeholder="Email" />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input name="phone" value={profile.phone} onChange={handleProfileChange} placeholder="Phone" />
          </div>
          <div className="form-row">
            <label>Vehicle Type</label>
            <select name="vehicleType" value={profile.vehicleType} onChange={handleProfileChange}>
              <option value="">Select Vehicle</option>
              <option value="boda">Boda</option>
              <option value="tuktuk">TukTuk</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
            </select>
          </div>

          <button className="settings-save-btn"  onClick={handleSaveProfile} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Availability */}
{/*       <div className="settings-section">
        <h3><FaMapMarkerAlt /> Availability</h3>

        <div className="toggle-row">
          <span>Available for deliveries</span>
          <button onClick={() => setAvailability(!availability)}>
            {availability ? "ON" : "OFF"}
          </button>
        </div>

        <button onClick={handleSaveAvailability}>
          <FaSave /> Save Availability
        </button>
      </div>
 */}
      {/* Notifications */}
{/*       <div className="settings-section">
        <h3><FaBell /> Notifications</h3>

        {Object.entries(notifications).map(([key, val]) => (
          <div key={key}>
            <span>{key}</span>
            <button onClick={() => handleNotifToggle(key)}>
              {val ? "ON" : "OFF"}
            </button>
          </div>
        ))}

        <button onClick={handleSaveNotifications}>
          <FaSave /> Save Notifications
        </button>
      </div>
 */}
      {/* Security */}
      <div className="settings-section">
        <h3>
          <FaShieldAlt /> Security
        </h3>

        <div className="settings-form">
          {["currentPassword", "newPassword", "confirmPassword"].map(
            (field) => (
              <div className="form-row" key={field}>
                <label>{field}</label>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type={
                      showPassword[
                        field === "currentPassword"
                          ? "current"
                          : field === "newPassword"
                          ? "new"
                          : "confirm"
                      ]
                        ? "text"
                        : "password"
                    }
                    name={field}
                    value={passwordData[field]}
                    onChange={handlePasswordChange}
                  />

                  <span
                    onClick={() =>
                      togglePassword(
                        field === "currentPassword"
                          ? "current"
                          : field === "newPassword"
                          ? "new"
                          : "confirm"
                      )
                    }
                    style={{ cursor: "pointer", marginLeft: "8px" }}
                  >
                    {showPassword[
                      field === "currentPassword"
                        ? "current"
                        : field === "newPassword"
                        ? "new"
                        : "confirm"
                    ] ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </span>
                </div>
              </div>
            )
          )}

          <button className="settings-save-btn" onClick={handleUpdatePassword} disabled={saving}>
            <FaShieldAlt /> {saving ? "Updating..." : "Update Password"}
          </button>

          
        </div>
      </div>
    </div>
  );
}