// src/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/OrdersList.css";
import TrackDelivery from "./TrackDelivery";
import { api } from "../utility/axios";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

function OrdersList() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [trackOrder, setTrackOrder] = useState(null);

  // NEW state for sharing
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareOption, setShareOption] = useState("whatsapp");
  const [shareInput, setShareInput] = useState("");
  const [shareOrderId, setShareOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelId, setCancelId] = useState(null);

  const fetchDeliveries = async (filters = {}) => {
    setLoading(true);
    try {
      let url = "/api/deliveries";
      if (filters.status || filters.paymentStatus) {
        const query = new URLSearchParams(filters).toString();
        url = `/api/deliveries/filter?${query}`;
      }

      const res = await API.get(url);

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

  const handleCancelOrder = async () => {
    try {
      setShowCancelModal(false)
      const response = await API.patch(`/api/deliveries/${cancelId}/cancel`);

      showToast("success", response.data.message || "Order cancelled successfully ✅");
      fetchDeliveries();
      setShowCancelModal(false);
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to cancel order ❌");
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
      showToast("error", `Enter a valid M-Pesa number (e.g., 07XXXXXXXX or 2547XXXXXXXX)`);
      return;
    }

    try {
      console.log("Initiating payment for order:", selectedOrder._id);
      const mpesadata = {
        mpesaNumber,
        amount: selectedOrder.deliveryFee,
        deliveryId: selectedOrder._id,
      };

      console.log("Payment data:", mpesadata);  
      const response = await API.post("/api/mesa/stkpush", mpesadata);
      
      showToast("success", "Payment initiated ✅");
      setShowPaymentModal(false);
      fetchDeliveries();
    } catch (err) {
      showToast("error", "Payment failed ❌");
    }
  };

  // === NEW Share handling ===
  const handleOpenShare = (deliveryId) => {
    setShareOrderId(deliveryId);
    setShareOption("whatsapp");
    setShareInput("");
    setShowShareModal(true);
  };



  async function sendMessage(phone, text) {
    try {

      const ROUTE_API = 'https://api-gateway-platform.onrender.com/route/69c49f562dc40d1396e9aae3';
      const API_KEY = process.env.REACT_APP_API_KEY;

      const routeRes = await fetch(ROUTE_API);
      const routeData = await routeRes.json();

      const serverUrl = routeData?.serverUrl;
      if (!serverUrl) throw new Error("No active server");

      const response = await fetch(`${serverUrl}/api/whatsapp/send/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: phone,
          text: text,
          botApiKey: API_KEY
        })
      });

      console.log(await response.json());
    } catch (err) {
      console.error(err.message);
    }
  }

const handleShareSubmit = async (e) => {
  e.preventDefault();
  const link = `${window.location.origin}/track/${shareOrderId}`;

  try {
    if (shareOption === "whatsapp") {
      if (!/^((?:254|0)(7\d{8}))$/.test(shareInput)) {
        showToast("error", `Enter a valid M-Pesa number (e.g., 07XXXXXXXX or 2547XXXXXXXX)`);
        return;
      }
      const message = `
Hi you can track your order using the link below
Link: ${link}

Thank you.      
`

      const formattedNumber = shareInput.replace(/^0/, "254");
      await sendMessage(formattedNumber, message)
      showToast("success", "sent to WhatsApp ✅");
    } else if (shareOption === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shareInput)) {
        showToast("error", "Invalid email address");
        return;
      }
      const res = await API.post("/api/share/email", {
        email: shareInput,
        link,
      });
      showToast("success", res.data.message);

      
    }

    setShowShareModal(false);
  } catch (error) {
    console.error(error);
    showToast("error", `Failed to share, try again. ${error}`);
  }
};


  return (
    <section className="tab-panel">
      <h1 className="orders-title">📊 Analysis & Deliveries</h1>
{/* un_grouped", "pending", "assigned", "in_transit", "delivered */}
      <div className="orders-actions">
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "un_grouped", paymentStatus: "" })
          }
        >Un Grouped</button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "pending", paymentStatus: "" })
          }
        >
          Pending
        </button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "assigned", paymentStatus: "" })
          }
        >Assigned</button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "in_transit", paymentStatus: "" })
          }
        >In Transit</button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "delivered", paymentStatus: "" })
          }
        >Delivered</button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "", paymentStatus: "paid" })
          }
        >Paid</button>
        <button
          className="btn-alt"
          onClick={() =>
            fetchDeliveries({ status: "", paymentStatus: "unpaid" })
          }
        >Not Paid</button>
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
                {d.status === "un_grouped"  && (
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setCancelId(d._id);
                      setShowCancelModal(true);
                    }}
                  >
                    Cancel
                  </button>
                )}

                {/* Always show Pay Now if unpaid */}
                {d.paymentStatus !== "paid" && d.deliveryFee > 0 && (
                  <button
                    className="btn-pay"
                    onClick={() => handleOpenPayment(d)}
                  >
                    Pay Now
                  </button>
                )}

                {/* Track + Share if NOT pending or cancelled */}
                {d.status !== "pending" && d.status !== "cancelled" && d.status !== "delivered" && d.status !== "un_grouped" &&  (
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

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Confirm Cancel</h3>
            <p>Are you sure you want to cancel this order?</p>

            <div className="modal-actions">
              <button onClick={() => setShowCancelModal(false)}>
                No
              </button>

              <button className="btn-cancel" onClick={handleCancelOrder}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default OrdersList;
