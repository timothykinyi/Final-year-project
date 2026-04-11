// src/components/DeviceGuard.js
import React, { useEffect, useState } from "react";

export default function DeviceGuard({ children }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // You can tweak this breakpoint
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (isMobile) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>🚫 Desktop Only</h2>
          <p>
            This system is only available on desktop devices.
            <br />
            Please switch to a laptop or desktop for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "#fff",
  },
  card: {
    textAlign: "center",
    padding: "30px",
    background: "#1e293b",
    borderRadius: "12px",
    maxWidth: "400px",
  },
};