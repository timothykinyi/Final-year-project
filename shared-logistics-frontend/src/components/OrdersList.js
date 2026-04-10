// src/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/OrdersList.css";
import TrackDelivery from "./TrackDelivery";

function OrdersList() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [trackOrder, setTrackOrder] = useState(null);

  // NEW state for sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareOption, setShareOption] = useState("whatsapp");
  const [shareInput, setShareInput] = useState("");
  const [shareOrderId, setShareOrderId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchDeliveries = async (filters = {}) => {
    setLoading(true);
    try {
      let url = "http://localhost:5000/api/deliveries";
      if (filters.status || filters.paymentStatus) {
        const query = new URLSearchParams(filters).toString();
        url = `http://localhost:5000/api/deliveries/filter?${query}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeliveries(res.data);
      setError(null);
    } catch (err) {
      setError("⚠️ Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleCancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await axios.patch(
        `http://localhost:5000/api/deliveries/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Order cancelled ✅");
      fetchDeliveries();
    } catch (err) {
      alert("Failed to cancel order ❌");
    }
  };

  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setMpesaNumber("");
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!/^((?:254|0)(7\d{8}))$/.test(mpesaNumber)) {
      alert("Enter a valid M-Pesa number (e.g., 07XXXXXXXX or 2547XXXXXXXX)");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/deliveries/${selectedOrder._id}/pay`,
        { mpesaNumber, amount: selectedOrder.deliveryFee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Payment initiated ✅");
      setShowPaymentModal(false);
      fetchDeliveries();
    } catch (err) {
      alert("Payment failed ❌");
    }
  };

  // === NEW Share handling ===
  const handleOpenShare = (deliveryId) => {
    setShareOrderId(deliveryId);
    setShareOption("whatsapp");
    setShareInput("");
    setShowShareModal(true);
  };



const handleShareSubmit = async (e) => {
  e.preventDefault();
  const link = `${window.location.origin}/track/${shareOrderId}`;

  try {
    if (shareOption === "whatsapp") {
      if (!/^((?:254|0)(7\d{8}))$/.test(shareInput)) {
        alert("Enter a valid WhatsApp number (07XXXXXXXX or 2547XXXXXXXX)");
        return;
      }
      const message = `
Hi you can track your order using the link below
Link: ${link}

Thank you.      
`

      const formattedNumber = shareInput.replace(/^0/, "254");

      const res = await axios.post("https://bot-nq3f.onrender.com/api/whatsapp/send", {
        number: formattedNumber,
        text: message,
      });

      alert(res.data.message);
    } else if (shareOption === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareInput)) {
        alert("Enter a valid email address");
        return;
      }

      const res = await axios.post("http://localhost:5000/api/share/email", {
        email: shareInput,
        link,
      });

      alert(res.data.message);
    }

    setShowShareModal(false);
  } catch (error) {
    console.error(error);
    alert(`❌ Failed to share, try again. ${error}`);
  }
};


  return (
    <section className="tab-panel">
      <h1 className="orders-title">📊 Analysis & Deliveries</h1>

      <div className="orders-actions">
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "pending", paymentStatus: "unpaid" })
          }
        >
          Pending & Unpaid
        </button>
        <button className="btn-alt" onClick={() => fetchDeliveries()}>
          Show All
        </button>
      </div>

      {loading ? (
        <p className="info-text">⏳ Loading deliveries...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : deliveries.length ? (
        <div className="orders-grid">
          {deliveries.map((d) => (
            <div className="order-card" key={d._id}>
              <div className="order-header">
                <h3>{d.customerName}</h3>
                <span
                  className={`status-badge ${
                    d.status === "completed"
                      ? "completed"
                      : d.status === "pending"
                      ? "pending"
                      : d.status === "un_grouped"
                      ? "pending"
                      :"in-progress"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              <p>📞 {d.customerPhone}</p>
              <p>📍 {d.customerAddress}</p>

              <div className="order-footer">
                <span
                  className={`payment-badge ${
                    d.paymentStatus === "paid" ? "paid" : "unpaid"
                  }`}
                >
                  {d.paymentStatus}
                </span>
                <span className="fee">KES {d.deliveryFee}</span>
              </div>

              {/* === Actions === */}
              <div className="order-actions">
                {d.status === "pending" && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelOrder(d._id)}
                  >
                    Cancel
                  </button>
                )}

                {/* Always show Pay Now if unpaid */}
                {d.paymentStatus !== "paid" && (
                  <button
                    className="btn-pay"
                    onClick={() => handleOpenPayment(d)}
                  >
                    Pay Now
                  </button>
                )}

                {/* Track + Share if NOT pending or cancelled */}
                {d.status !== "pending" && d.status !== "cancelled" && d.status !== "un_grouped" &&  (
                  <>
                    <button
                      className="btn-track"
                      onClick={() => setTrackOrder(d._id)}
                    >
                      Track 🚚
                    </button>
                    <button
                      className="btn-share"
                      onClick={() => handleOpenShare(d._id)}
                    >
                      🔗 Share
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="info-text">No deliveries found 🚫</p>
      )}

      {/* === Payment Modal === */}
      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>💳 Pay for Delivery</h3>
            <p>
              <strong>Amount:</strong> KES {selectedOrder.deliveryFee}
            </p>
            <form onSubmit={handlePaymentSubmit}>
              <input
                type="text"
                placeholder="Enter M-Pesa number"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-pay">
                  Confirm Pay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Share Modal === */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>🔗 Share Tracking Link</h3>
            <form onSubmit={handleShareSubmit}>
              <div className="share-options">
                <label>
                  <input
                    type="radio"
                    value="whatsapp"
                    checked={shareOption === "whatsapp"}
                    onChange={(e) => setShareOption(e.target.value)}
                  />
                  WhatsApp
                </label>
                <label>
                  <input
                    type="radio"
                    value="email"
                    checked={shareOption === "email"}
                    onChange={(e) => setShareOption(e.target.value)}
                  />
                  Email
                </label>
              </div>
              <input
                type="text"
                placeholder={
                  shareOption === "whatsapp"
                    ? "Enter WhatsApp number"
                    : "Enter Email address"
                }
                value={shareInput}
                onChange={(e) => setShareInput(e.target.value)}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowShareModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-share">
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === Tracking Modal === */}
      {trackOrder && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>📍 Tracking Delivery</h3>
              <button className="close-btn" onClick={() => setTrackOrder(null)}>
                ✖
              </button>
            </div>
            <div className="map-container">
              <TrackDelivery deliveryId={trackOrder} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OrdersList;
