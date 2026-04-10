import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "../styles/TrackDelivery.css";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// custom icons
const riderIcon = new L.Icon({
  iconUrl: "/rider.png",
  iconSize: [35, 35],
  iconAnchor: [17, 34],
});
const destIcon = new L.Icon({
  iconUrl: "/destination.png",
  iconSize: [35, 35],
  iconAnchor: [17, 34],
});

// helper for smooth animation
function interpolatePos(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
}

// recenter button
function RecenterButton({ position }) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        if (position) map.setView([position[1], position[0]], 15);
      }}
      className="circle-btn recenter-btn"
    >
      📍
    </button>
  );
}

// zoom-to-fit button
function ZoomToFitButton({ rider, dest }) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        if (rider && dest) {
          const bounds = L.latLngBounds(
            [rider[1], rider[0]],
            [dest[1], dest[0]]
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }}
      className="circle-btn zoomfit-btn"
    >
      🔎
    </button>
  );
}

// routing component
function Routing({ from, to, setEta, setDistance }) {
  const map = useMap();
  const routeLayerRef = useRef([]);

  useEffect(() => {
    if (!from || !to || !map) return;

    const router = L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
      profile: "driving",
    });

    const waypoints = [
      L.Routing.waypoint(L.latLng(from[1], from[0])),
      L.Routing.waypoint(L.latLng(to[1], to[0])),
    ];

    let cancelled = false;

    router.route(
      waypoints,
      (err, routes) => {
        if (cancelled) return;
        if (err || !routes || routes.length === 0) return;

        // clear old routes
        routeLayerRef.current.forEach((layer) => {
          try {
            map.removeLayer(layer);
          } catch {}
        });
        routeLayerRef.current = [];

        // pick shortest route
        let shortest = routes.reduce((a, b) =>
          a.summary.totalDistance < b.summary.totalDistance ? a : b
        );

        // update ETA & distance
        const km = (shortest.summary.totalDistance / 1000).toFixed(1);
        const minutes = Math.round(shortest.summary.totalTime / 60);
        setDistance(km);
        setEta(minutes);

        // draw routes
        routes.forEach((r) => {
          const coords = r.coordinates.map((c) =>
            c.lat !== undefined ? [c.lat, c.lng] : [c[1], c[0]]
          );
          const poly = L.polyline(coords, {
            color: r === shortest ? "#4caf50" : "#999",
            weight: r === shortest ? 5 : 3,
            opacity: r === shortest ? 0.95 : 0.4,
            dashArray: r === shortest ? null : "5,10",
          }).addTo(map);
          routeLayerRef.current.push(poly);
        });

        // fit map bounds
        const bounds = L.polyline(
          shortest.coordinates.map((c) =>
            c.lat !== undefined ? [c.lat, c.lng] : [c[1], c[0]]
          )
        ).getBounds();
        map.fitBounds(bounds, { padding: [50, 50] });
      },
      null,
      { alternatives: true }
    );

    return () => {
      cancelled = true;
      routeLayerRef.current.forEach((layer) => {
        try {
          map.removeLayer(layer);
        } catch {}
      });
      routeLayerRef.current = [];
    };
  }, [from, to, map, setEta, setDistance]);

  return null;
}

function TrackDelivery({ deliveryId }) {
  const [riderLocation, setRiderLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [status, setStatus] = useState("fetching...");
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [trail, setTrail] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [satellite, setSatellite] = useState(false); // toggle

  const markerRef = useRef(null);
  const animFrame = useRef(null);
  const socketRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // initial fetch
  const fetchInitial = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/riders/track/${deliveryId}`
      );
      const rider = res.data.location?.coordinates || null;
      const dest = res.data.customerLocation?.coordinates || null;
      setStatus(res.data.status || "Not available");
      if (rider) {
        setRiderLocation(rider);
        setTrail([rider]);
      }
      if (dest) setDestination(dest);
    } catch (err) {
      console.error("initial fetch error", err);
      setStatus("Not available");
    }
  };

  // smooth animation
  const animateTo = (from, to, duration = 1200) => {
    if (!from) {
      setRiderLocation(to);
      setTrail((p) => [...p, to]);
      return;
    }
    let start = from;
    let end = to;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const pos = interpolatePos(start, end, t);
      try {
        if (markerRef.current) {
          markerRef.current.setLatLng([pos[1], pos[0]]);
        }
      } catch (e) {}
      if (t < 1) {
        animFrame.current = requestAnimationFrame(step);
      } else {
        setRiderLocation(end);
        setTrail((p) => {
          const last = p[p.length - 1];
          if (!last || last[0] !== end[0] || last[1] !== end[1]) {
            const updated = [...p, end];
            return updated.length > 100 ? updated.slice(-100) : updated;
          }
          return p;
        });
      }
    };

    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    fetchInitial();

    const token = localStorage.getItem("token");
    const socket = io(API_BASE, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.emit("joinDelivery", { deliveryId });

    socket.on("connect", () => setIsOnline(true));
    socket.on("disconnect", () => setIsOnline(false));

    socket.on("deliveryLocationUpdate", (payload) => {
      if (!payload || payload.deliveryId !== deliveryId) return;

      const newLoc = payload.location?.coordinates || null;
      const cust = payload.customerLocation?.coordinates || null;
      if (payload.status) setStatus(payload.status);
      if (cust) setDestination(cust);

      if (
        newLoc &&
        (!riderLocation ||
          newLoc[0] !== riderLocation[0] ||
          newLoc[1] !== riderLocation[1])
      ) {
        animateTo(riderLocation, newLoc, 1200);
      }
      if (payload.eta !== undefined) setEta(payload.eta);
      if (payload.distance !== undefined) setDistance(payload.distance);
    });

    return () => {
      try {
        socket.emit("leaveDelivery", { deliveryId });
        socket.disconnect();
      } catch (e) {}
      cancelAnimationFrame(animFrame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  return (
    <div className="track-container">
      <div className={`track-info ${status.toLowerCase()}`}>
        <h3>Delivery #{deliveryId}</h3>

        <p>
          Status:{" "}
          <span
            className={`status-pill ${
              status?.toLowerCase().replace(/\s+/g, "-") || "pending"
            }`}
          >
            {status}
          </span>
        </p>

        {eta && distance && <p>ETA: {eta} mins • Distance: {distance} km</p>}
        <p className="track-connection">
          {isOnline ? "🟢 Live" : "🔴 Offline"}
        </p>

        {/* Toggle Map Type */}
        <button
          className="circle-btn map-toggle-btn"
          onClick={() => setSatellite((prev) => !prev)}
        >
          {satellite ? "🗺️ Map" : "🛰️ Satellite"}
        </button>
      </div>

      {riderLocation && destination ? (
        <MapContainer
          center={[riderLocation[1], riderLocation[0]]}
          zoom={14}
          className="track-map"
        >
          <TileLayer
            url={
              satellite
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={
              satellite
                ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                : "&copy; OpenStreetMap contributors"
            }
          />

          <Marker
            position={[riderLocation[1], riderLocation[0]]}
            icon={riderIcon}
            ref={markerRef}
          >
            <Popup>Rider 🚴</Popup>
          </Marker>

          <Marker position={[destination[1], destination[0]]} icon={destIcon}>
            <Popup>Destination 📍</Popup>
          </Marker>

          {trail.length > 1 && (
            <Polyline
              positions={trail.map((c) => [c[1], c[0]])}
              pathOptions={{ color: "#007bff", weight: 3 }}
            />
          )}

          <Routing
            from={riderLocation}
            to={destination}
            setEta={setEta}
            setDistance={setDistance}
          />

          <RecenterButton position={riderLocation} />
          <ZoomToFitButton rider={riderLocation} dest={destination} />
        </MapContainer>
      ) : (
        <p className="track-waiting">Waiting for location...</p>
      )}
    </div>
  );
}

export default TrackDelivery;
