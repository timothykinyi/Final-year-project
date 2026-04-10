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
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    location: { type: "Point", coordinates: [] },
  });

  const [locationName, setLocationName] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = [longitude, latitude];
        setFormData((prev) => ({
          ...prev,
          location: { type: "Point", coordinates: coords },
        }));

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocationName(data.display_name || "Unknown location");
        } catch (err) {
          setLocationName("Location unavailable");
        }
        setLoadingLocation(false);
      },
      () => {
        alert("Location access denied. Location is required for registration.");
        setLoadingLocation(false);
      }
    );
  };

  const handleConfirmLocation = () => {
    if (!formData.location.coordinates.length) {
      alert("No location detected yet!");
      return;
    }
    setLocationConfirmed(true);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Shop name required";
      if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name required";
    }
    if (step === 2) {
      if (!/^(07|01)\d{8}$/.test(formData.phone))
        newErrors.phone = "Phone must be a valid Kenyan number";
      if (!formData.password) newErrors.password = "Password required";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }
    if (step === 3) {
      if (!formData.address.trim()) newErrors.address = "Address required";
      if (!formData.location.coordinates.length)
        newErrors.location = "Location required";
      if (!locationConfirmed)
        newErrors.locationConfirm = "Confirm your location before proceeding";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(step + 1);
    setProgress(progress + 33);
  };

  const prevStep = () => {
    setStep(step - 1);
    setProgress(progress - 33);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      console.log("::::::::::******:::::::::::")
      console.log(API_URL)
      console.log("::::::::::******:::::::::::")
      //await axios.post(`${API_URL}/api/shops/register`, formData);
      await api.post("/api/shops/register", formData);

      alert("Shop registered successfully!");
      navigate("/shop/login");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="register-wrapper">
        {/* Left panel */}


      <div className="register-card">
        {/* Progress Bar */}

        <div className="register-left">
            <h1>Join Us 🚀</h1>
            <p>
            Create an account to manage your deliveries, track orders,
            and grow with us.
            </p>
            <button className="btn-alt">Learn More</button>
        </div>
        
        <form className="register-form" onSubmit={handleSubmit}>
                  <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
          <h2>Register Your Shop</h2>

          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Shop Name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="error">{errors.name}</p>}

              <input
                type="text"
                name="ownerName"
                placeholder="Owner Name"
                value={formData.ownerName}
                onChange={handleChange}
              />
              {errors.ownerName && <p className="error">{errors.ownerName}</p>}
            </>
          )}

          {step === 2 && (
            <>
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

          {step === 3 && (
            <>
              <input
                type="text"
                name="address"
                placeholder="Shop Address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <p className="error">{errors.address}</p>}

              <div className="location-section">
                {loadingLocation ? (
                  <p>Fetching location...</p>
                ) : (
                  <p>📍 {locationName || "Waiting for location..."}</p>
                )}
                {!locationConfirmed ? (
                  <button
                    type="button"
                    className="btn-alt"
                    onClick={handleConfirmLocation}
                  >
                    Confirm Location
                  </button>
                ) : (
                  <p className="success">✅ Location Confirmed</p>
                )}
                {errors.location && <p className="error">{errors.location}</p>}
                {errors.locationConfirm && (
                  <p className="error">{errors.locationConfirm}</p>
                )}
              </div>
            </>
          )}

          <div className="form-nav">
            {step > 1 && (
              <button type="button" className="btn-alt" onClick={prevStep}>
                Back
              </button>
            )}
            {step < 3 && (
              <button type="button" className="btn-primary" onClick={nextStep}>
                Next
              </button>
            )}
            {step === 3 && (
              <button type="submit" className="btn-primary">
                Submit
              </button>
            )}
          </div>

          <p className="login-link">
            Already have an account? <Link to="/shop/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
