import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/CreateOrder.css";

// Fix leaflet icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// 🔹 Utility: recenter map when address searched
function RecenterMap({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 14);
  return null;
}

// 🔹 Marker component for user selection
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
    deliveryFee: "",
  });

  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]); // default Nairobi
  const [location, setLocation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Search address → move map
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
        alert("Could not find location, please refine address");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Reverse geocode to show name for confirmation
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

  // 🔹 Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) return alert("Please confirm the location first");

    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerAddress: form.customerAddress,
      customerLocation: { type: "Point", coordinates: [location.lng, location.lat] },
      deliveryFee: Number(form.deliveryFee),
    };

    try {
      setLoading(true);
      const authToken = token || localStorage.getItem("token");
      await axios.post(`${API_BASE}/api/deliveries`, payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      alert("Order created ✅");
      setForm({ customerName: "", customerPhone: "", customerAddress: "", deliveryFee: "" });
      setLocation(null);
      setConfirmed(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

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
        />
        <input
          name="customerPhone"
          value={form.customerPhone}
          onChange={handleChange}
          placeholder="Customer phone (07/01...)"
          required
        />

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            name="customerAddress"
            value={form.customerAddress}
            onChange={handleChange}
            placeholder="Enter town/direction"
            required
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
        />

        <div className="map-wrapper">
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


        {/* Confirm card */}
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
