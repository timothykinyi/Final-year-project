import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/CreateOrder.css";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

// Fix leaflet icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function RecenterMap({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 14);
  return null;
}

function LocationMarker({ onSelect }) {
  const [pos, setPos] = useState(null);
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      onSelect(e.latlng);
    },
  });
  return pos ? <Marker position={pos} /> : null;
}

export default function CreateOrder({ token }) {
  const API_BASE = process.env.REACT_APP_API_URL;

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    deliveryFee: "", // Used as package weight in UI
  });

  const [errors, setErrors] = useState({});
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]);
  const [location, setLocation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const validateForm = () => {
    let newErrors = {};

    // Name validation: Letters and spaces only
    if (!/^[A-Za-z\s]+$/.test(form.customerName.trim())) {
      newErrors.customerName = "Name must contain only letters.";
    }

    // Phone validation: Valid Kenyan formats
    if (!/^(?:07|01|2547|2541)\d{8}$/.test(form.customerPhone.trim())) {
      newErrors.customerPhone = "Invalid format. Use 07..., 01..., 2547..., or 2541...";
    }

    // Weight validation: Max 1000
    const weight = Number(form.deliveryFee);
    if (!weight || weight <= 0 || weight > 1000) {
      newErrors.deliveryFee = "Weight must be between 1 and 1000 kg.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleAddressSearch = async () => {
    if (!form.customerAddress.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          form.customerAddress
        )}`
      );
      const data = await res.json();
      if (data[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        showToast("error", "Could not find location, please refine address");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name;
    } catch {
      return "Unknown location";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!confirmed) return showToast("error", "Please confirm the location first");

    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerAddress: form.customerAddress,
      customerLocation: { type: "Point", coordinates: [location.lng, location.lat] },
      deliveryFee: Number(form.deliveryFee),
    };

    try {
      setLoading(true);
      const res = await API.post(`/api/deliveries`, payload )

      showToast("success", "Order created successfully!");

      setForm({ customerName: "", customerPhone: "", customerAddress: "", deliveryFee: "" });
      setLocation(null);
      setConfirmed(false);
      setErrors({});
    } catch (err) {
      console.error(err);
      showToast("error", err.response?.data?.message || "Failed to create order");

    } finally {
      setLoading(false);
    }
  };

  const errorStyle = { color: "#ff4d4f", fontSize: "12px", marginTop: "-8px", marginBottom: "8px", display: "block" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="create-order-component"
    >
      <h2>📦 Create Delivery Order</h2>

      <form className="order-form" onSubmit={handleSubmit}>
        <input
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          placeholder="Customer name"
          required
          style={{ borderColor: errors.customerName ? "#ff4d4f" : "" }}
        />
        {errors.customerName && <span style={errorStyle}>{errors.customerName}</span>}

        <input
          name="customerPhone"
          value={form.customerPhone}
          onChange={handleChange}
          placeholder="Customer phone (07/01/254...)"
          required
          style={{ borderColor: errors.customerPhone ? "#ff4d4f" : "" }}
        />
        {errors.customerPhone && <span style={errorStyle}>{errors.customerPhone}</span>}

        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input
            name="customerAddress"
            value={form.customerAddress}
            onChange={handleChange}
            placeholder="Enter town/direction"
            required
            style={{ width: "100%", margin: 0 }}
          />
          <button type="button" onClick={handleAddressSearch} className="btn-alt">
            🔍
          </button>
        </div>

        <input
          name="deliveryFee"
          value={form.deliveryFee}
          onChange={handleChange}
          placeholder="Package weight in kg"
          type="number"
          required
          style={{ borderColor: errors.deliveryFee ? "#ff4d4f" : "" }}
        />
        {errors.deliveryFee && <span style={errorStyle}>{errors.deliveryFee}</span>}

        <div className="map-wrapper" style={{ marginTop: "10px" }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap coords={mapCenter} />
            <LocationMarker
              onSelect={async (latlng) => {
                setLocation(latlng);
                const place = await reverseGeocode(latlng.lat, latlng.lng);
                setForm({ ...form, customerAddress: place });
                setConfirmed(false);
              }}
            />
          </MapContainer>
        </div>

        {location && !confirmed && (
          <div className="confirm-card">
            <p>📍 {form.customerAddress}</p>
            <p>Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}</p>
            <button type="button" className="btn-primary" onClick={() => setConfirmed(true)}>
              ✅ Confirm Location
            </button>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading || !confirmed}>
          {loading ? "Creating..." : "Create Order"}
        </button>
      </form>
    </motion.div>
  );
}