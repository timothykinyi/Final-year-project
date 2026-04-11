// src/components/LoadingScreen.js
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing system...");
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const messages = [
    "Initializing system...",
    "Connecting to server...",
    "Securing your session...",
    "Loading your dashboard...",
    "Almost there...",
  ];

  // Fake progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        return next >= 100 ? 100 : next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Change messages dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Mouse interaction
  useEffect(() => {
    const handleMove = (e) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div style={styles.container}>
      {/* Interactive glow */}
      <div
        style={{
          ...styles.glow,
          left: position.x - 100,
          top: position.y - 100,
        }}
      />

      <div style={styles.card}>
        <h1 style={styles.title}>🚀 Loading</h1>

        <p style={styles.message}>{message}</p>

        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`,
            }}
          />
        </div>

        <p style={styles.percent}>{Math.floor(progress)}%</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    background: "#020617",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    color: "#fff",
  },
  glow: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, #3b82f6, transparent 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    transition: "0.1s",
  },
  card: {
    textAlign: "center",
    padding: "40px",
    borderRadius: "16px",
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 40px rgba(59,130,246,0.3)",
    zIndex: 2,
    width: "320px",
  },
  title: {
    marginBottom: "10px",
  },
  message: {
    fontSize: "14px",
    opacity: 0.8,
    marginBottom: "20px",
  },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#1e293b",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    transition: "width 0.4s ease",
  },
  percent: {
    marginTop: "10px",
    fontSize: "12px",
    opacity: 0.7,
  },
};