import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaSearch, FaMapMarkerAlt, FaCheckCircle, FaCrosshairs } from "react-icons/fa";
import "../styles/LocationPicker.css";

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
  useEffect(() => {
    if (coords) map.setView(coords, 14);
  }, [coords, map]);
  return null;
}

function ClickMarker({ onSelect }) {
  const [pos, setPos] = useState(null);
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      onSelect(e.latlng);
    },
  });
  return pos ? <Marker position={pos} /> : null;
}

export default function LocationPicker({
  locationName,
  setLocationName,
  coordinates,
  setCoordinates,
  locationConfirmed,
  setLocationConfirmed,
  loadingLocation,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([-1.2921, 36.8219]);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (coordinates && coordinates.length === 2) {
      setMapCenter([coordinates[1], coordinates[0]]);
    }
  }, [coordinates]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ke&limit=5`
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setShowMap(true);
        setLocationName(data[0].display_name);
      } else {
        alert("Location not found. Try a different search term.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleMapSelect = async (latlng) => {
    setCoordinates([latlng.lng, latlng.lat]);
    setLocationConfirmed(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await res.json();
      setLocationName(data.display_name || "Selected location");
    } catch {
      setLocationName("Selected location");
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates([longitude, latitude]);
        setMapCenter([latitude, longitude]);
        setShowMap(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setLocationName(data.display_name || "Current location");
        } catch {
          setLocationName("Current location");
        }
      },
      () => alert("Location access denied")
    );
  };

  return (
    <div className="location-picker">
      <div className="location-picker-header">
        <FaMapMarkerAlt className="location-icon" />
        <span>Set Your Location</span>
      </div>

      {/* Current detected location */}
      {loadingLocation ? (
        <p className="location-status loading">Detecting your location...</p>
      ) : locationName ? (
        <p className="location-status detected">📍 {locationName}</p>
      ) : (
        <p className="location-status waiting">Waiting for location...</p>
      )}

      {/* Search bar */}
      <div className="location-search">
        <input
          type="text"
          placeholder="Search town or area (e.g. Westlands, Nairobi)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button type="button" onClick={handleSearch} disabled={searching}>
          <FaSearch /> {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Quick actions */}
      <div className="location-actions">
        <button type="button" className="loc-btn-outline" onClick={handleUseCurrentLocation}>
          <FaCrosshairs /> Use My Location
        </button>
        <button type="button" className="loc-btn-outline" onClick={() => setShowMap(!showMap)}>
          <FaMapMarkerAlt /> {showMap ? "Hide Map" : "Pick on Map"}
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div className="location-map-container">
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap coords={mapCenter} />
            <ClickMarker onSelect={handleMapSelect} />
          </MapContainer>
          <p className="map-hint">Tap on the map to select your exact location</p>
        </div>
      )}

      {/* Confirm */}
      {coordinates && coordinates.length === 2 && !locationConfirmed && (
        <button type="button" className="loc-confirm-btn" onClick={() => setLocationConfirmed(true)}>
          <FaCheckCircle /> Confirm This Location
        </button>
      )}

      {locationConfirmed && (
        <div className="location-confirmed">
          <FaCheckCircle /> Location Confirmed
        </div>
      )}
    </div>
  );
}
