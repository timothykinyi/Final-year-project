// src/components/rider/MyDeliveries.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaPhone, FaMapMarkerAlt, FaMoneyBill } from "react-icons/fa";
import "../styles/MyDeliveries.css";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

function MyDeliveries() {
  const [myDeliveries, setMyDeliveries] = useState([]);
  const { showToast } = useToast();
  // store watcher + interval IDs per delivery
  const locationWatchers = useRef({});
  const locationIntervals = useRef({});
  const lastKnownPosition = useRef({}); // save last coords

  // fetch deliveries (used in polling + manual updates)
  const fetchMyDeliveries = async () => {
    try {
      const res = await API.get(`/api/riders/my-deliveries`)


      if (Array.isArray(res.data.deliveries)) {
        setMyDeliveries(res.data.deliveries);
      } else {
        setMyDeliveries([]);
      }
    } catch (err) {
      console.error("Error fetching my deliveries", err);
      setMyDeliveries([]);
    }
  };

  // 🚀 Poll deliveries every 10s to auto-refresh
  useEffect(() => {
    let intervalId;
    fetchMyDeliveries(); // fetch immediately
    intervalId = setInterval(fetchMyDeliveries, 10000); // then poll every 10s
    return () => clearInterval(intervalId); // cleanup
  }, []);

  const updateDeliveryStatus = async (id, action) => {
    try {
      const res = await API.put(`/api/riders/${action}/${id}`, {})

      if (res.data && res.data.updatedDelivery) {
        setMyDeliveries((prev) =>
          prev.map((d) => (d._id === id ? res.data.updatedDelivery : d))
        );
      }

      showToast("success", `Delivery ${action} confirmed!`);

      if (action === "Deliveryintransit") {
        startLocationTracking(id);
      }
      if (action === "Deliveryarrival") {
        stopLocationTracking(id);
      }

      // refresh after action
      fetchMyDeliveries();
    } catch (err) {
      console.error("Update error", err);
      showToast("error", `Failed to confirm ${action}`);
    }
  };

  const startLocationTracking = (deliveryId) => {
    if (!navigator.geolocation) {
      showToast("error", "Geolocation is not supported by your browser.");

      return;
    }

    // Watch position (real-time updates)
    const watcherId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        lastKnownPosition.current[deliveryId] = { latitude, longitude };

        try {
          const res = await API.post(`/api/riders/update-location/${deliveryId}`, { latitude, longitude });
        } catch (err) {
          console.error("Failed to update location", err);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    locationWatchers.current[deliveryId] = watcherId;

    // Fallback interval (ping last known location every 60s)
    const intervalId = setInterval(async () => {
      const pos = lastKnownPosition.current[deliveryId];
      if (pos) {
        try {
          const res = await API.post(`/api/riders/update-location/${deliveryId}`, pos);
        } catch (err) {
          console.error("Fallback update failed", err);
        }
      }
    }, 60000);

    locationIntervals.current[deliveryId] = intervalId;
  };

  const stopLocationTracking = (deliveryId) => {
    if (locationWatchers.current[deliveryId]) {
      navigator.geolocation.clearWatch(locationWatchers.current[deliveryId]);
      delete locationWatchers.current[deliveryId];
    }
    if (locationIntervals.current[deliveryId]) {
      clearInterval(locationIntervals.current[deliveryId]);
      delete locationIntervals.current[deliveryId];
    }
    delete lastKnownPosition.current[deliveryId];
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "assigned":
        return "33%";
      case "in_transit":
        return "66%";
      case "delivered":
        return "100%";
      default:
        return "0%";
    }
  };

  return (
    <div className="my-deliveries">
      <h2>My Deliveries</h2>
      {myDeliveries.length === 0 ? (
        <p className="empty">You have no deliveries assigned.</p>
      ) : (
        <div className="deliveries-grid">
          {myDeliveries.map((d) => (
            <div
              key={d._id}
              className={`delivery-card ${
                d.status === "delivered" ? "delivered" : ""
              }`}
            >
              <div className="card-header">
                <p>
                  <strong>Customer:</strong> {d.customerName}
                </p>
                <span className={`status-badge status-${d.status}`}>
                  {d.status.replace("_", " ")}
                </span>
              </div>

              <p><FaPhone /> {d.customerPhone}</p>
              <p><FaMapMarkerAlt /> {d.customerAddress}</p>
              <p>
                <FaMoneyBill />{" "}
                <span className="delivery-fee">KES {d.deliveryFee}</span>
              </p>
              <p>
                <strong>Paid:</strong>{" "}
                {d.paymentStatus === "paid" ? "✅ Yes" : "❌ No"}
              </p>

              {/* Progress */}
              <div className="progress-labels">
                <span>Assigned</span>
                <span>In-Transit</span>
                <span>Delivered</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: getProgressWidth(d.status) }}
                />
              </div>

              {/* Actions */}
              <div className="actions">
                {d.status === "assigned" && (
                  <button
                    onClick={() =>
                      updateDeliveryStatus(d._id, "Deliveryintransit")
                    }
                  >
                    Confirm Pickup & Start Tracking
                  </button>
                )}
                {d.status === "in_transit" && (
                  <button
                    onClick={() =>
                      updateDeliveryStatus(d._id, "Deliveryarrival")
                    }
                  >
                    Confirm Delivered & Stop Tracking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyDeliveries;
