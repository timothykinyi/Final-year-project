import React, { useState, useEffect } from "react";
import "../styles/Register.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { api } from "../utility/axios";
function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };


  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Admin name required";
      if (!/^(07|01)\d{8}$/.test(formData.phone))
        newErrors.phone = "Phone must be a valid Kenyan number";
      if (!formData.password) newErrors.password = "Password required";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      //await axios.post(`${API_URL}/api/shops/register`, formData);
      await api.post("/admin/register", formData);

      alert("Admin registered successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="register-wrapper">
        {/* Left panel */}


      <div className="register-card">
        {/* Progress Bar */}
        
        <form className="register-form" onSubmit={handleSubmit}>
          <h2>Register An Admin</h2>

          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Admin Name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="error">{errors.name}</p>}
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <p className="error">{errors.phone}</p>}

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="error">{errors.password}</p>}

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="error">{errors.confirmPassword}</p>
              )}

            </>
          )}

          <div className="form-nav">
            {step === 1 && (
              <button type="submit" className="btn-primary">
                Submit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
