import React, { useState, useEffect } from "react";
import "../styles/Register.css";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../utility/axios";
import LocationPicker from "../components/LocationPicker";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";


function Register() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
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
        } catch {
          setLocationName("Location unavailable");
        }

        setLoadingLocation(false);
      },
      () => setLoadingLocation(false)
    );
  };

  // ✅ FIXED REGEX
  const phoneRegex = /^(?:\+254|0)(7\d{8}|1\d{8})$/;
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const nameRegex = /^[A-Za-z\s]+$/;

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Shop name required";
      } else if (!nameRegex.test(formData.name)) {
        newErrors.name = "Shop name must contain only letters";
      }

      if (!formData.ownerName.trim()) {
        newErrors.ownerName = "Owner name required";
      } else if (!nameRegex.test(formData.ownerName)) {
        newErrors.ownerName = "Owner name must contain only letters";
      }
    }

    if (step === 2) {
      if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email";

      if (!phoneRegex.test(formData.phone))
        newErrors.phone = "Use valid Kenyan number";

      if (!passwordRegex.test(formData.password))
        newErrors.password =
          "Min 8 chars, uppercase, number & special char required";

      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    if (step === 3) {
      if (!formData.address.trim())
        newErrors.address = "Address required";

      if (!formData.location.coordinates.length)
        newErrors.location = "Location required";

      if (!locationConfirmed)
        newErrors.locationConfirm = "Confirm location first";
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

    setLoading(true);

    try {
      const response = await api.post("/api/shops/register", formData);

      if (!response.data.success) {
        showToast("error", response.data.message);
      }else {
        showToast("success", response.data.message);

        // wait 30 seconds before login
        setTimeout(async () => {
          const res = await auth.login({
            email: formData.email,
            password: formData.password,
            role: "shop",
          });

          console.log("Login response after registration:", res);

          if (res.ok) navigate("/shop/dashboard");
        }, 3000); // 3,000 ms = 3 seconds
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Something went wrong";

      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* ✅ POPUP (uses your styling system) */}
      {popup.show && (
        <div className={`error`} style={{ textAlign: "center", marginBottom: "10px" }}>
          {popup.message}
        </div>
      )}

      <div className="register-card">
        <div className="register-left">
          <h1>Join Us 🚀</h1>
          <p>
            Create an account to manage your deliveries, track orders, and grow
            with us.
          </p>
          <button className="btn-alt">Learn More</button>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${progress}%` }}
            ></div>
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
              {errors.ownerName && (
                <p className="error">{errors.ownerName}</p>
              )}
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
              {errors.email && <p className="error">{errors.email}</p>}

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
                placeholder="Shop's Main town/area"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <p className="error">{errors.address}</p>}

              <LocationPicker
                locationName={locationName}
                setLocationName={setLocationName}
                coordinates={formData.location.coordinates}
                setCoordinates={(coords) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { type: "Point", coordinates: coords },
                  }))
                }
                locationConfirmed={locationConfirmed}
                setLocationConfirmed={setLocationConfirmed}
                loadingLocation={loadingLocation}
              />

              {errors.location && <p className="error">{errors.location}</p>}
              {errors.locationConfirm && (
                <p className="error">{errors.locationConfirm}</p>
              )}
            </>
          )}

          <div className="form-nav">
            {step > 1 && (
              <button
                type="button"
                className="btn-alt"
                onClick={prevStep}
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                className="btn-primary"
                onClick={nextStep}
              >
                Next
              </button>
            )}

            {step === 3 && (
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Submit"}
              </button>
            )}
          </div>

          <p className="login-link">
            Already have an account?{" "}
            <Link to="/shop/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;