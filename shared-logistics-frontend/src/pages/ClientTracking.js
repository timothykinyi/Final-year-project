import React from "react";
import { useParams } from "react-router-dom";
import TrackDelivery from "../components/TrackDelivery";
import "../styles/ClientTracking.css";

function ClientTracking() {
  const { deliveryId } = useParams();

  return (
    <div className="client-tracking">
      <header className="tracking-header">
        <h1>🚚 Live Delivery Tracking</h1>
        <p>Follow your rider in real-time until your package arrives.</p>
      </header>

      <section className="tracking-main">
        <div className="tracking-card">
          <TrackDelivery deliveryId={deliveryId} />
        </div>
      </section>
    </div>
  );
}

export default ClientTracking;
