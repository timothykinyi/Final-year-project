import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  FaMoon,
  FaSun,
  FaUser,
  FaStore,
  FaSignOutAlt,
  FaShieldAlt,
  FaSave,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import API from "../services/api";
import "../styles/Settings.css";
import { useToast } from "../context/ToastContext";


export default function ShopSettings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const auth = useAuth();
  const { showToast } = useToast();
  // ---------------- PROFILE ----------------
  const [profile, setProfile] = useState({
    name: user?.name || "",
    ownerName: user?.ownerName || "",
    address: user?.address || "",
  });

  // ---------------- PASSWORD ----------------
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
  const lettersOnlyRegex = /^[A-Za-z\s]+$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  // ---------------- HANDLERS ----------------
  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = async () => {
    await auth.logout();
  };

  // ---------------- SAVE PROFILE ----------------
  const handleSaveProfile = async () => {
    // validation
    if (!lettersOnlyRegex.test(profile.name)) {
      
      return showToast("error", "Shop name must contain letters only");
    }

    if (!lettersOnlyRegex.test(profile.ownerName)) {
      return showToast("error", "Owner name must contain letters only");
    }

/*     if (!profile.address.trim()) {
      return showToast("error", "Address cannot be empty");
    }
 */
    setSaving(true);

    try {
      await API.put("/api/shops/profile", profile);

      await auth.refreshUser();
      showToast("success", "Profile updated successfully!");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to update profile");
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
      await API.put("/api/shops/update-password", passwordData);

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

  return (
    <div className="settings-page">
      <h2 className="settings-title">
        <FaStore /> Shop Settings
      </h2>

      {message && (
        <div
          className={`settings-toast ${
            message.toLowerCase().includes("fail") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}

      {/* Appearance */}
      <div className="settings-section">
        <h3>
          <FaMoon /> Appearance
        </h3>

        <div className="theme-selector">
          <button
            className={`theme-option ${theme === "light" ? "active" : ""}`}
            onClick={() => setTheme("light")}
          >
            <FaSun /> Light
          </button>

          <button
            className={`theme-option ${theme === "dark" ? "active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            <FaMoon /> Dark
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <h3>
          <FaUser /> Shop Profile
        </h3>

        <div className="settings-form">
          {["name", "ownerName", "address"].map((field) => (
            <div className="form-row" key={field}>
              <label>{field}</label>

              <input
                name={field}
                value={profile[field]}
                onChange={handleProfileChange}
              />
            </div>
          ))}

          <button className="settings-save-btn" onClick={handleSaveProfile} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

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

      {/* Logout */}
      <div className="settings-section">
        <button className="settings-button" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
}