// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DeviceGuard from "./components/DeviceGuard";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <DeviceGuard>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DeviceGuard>
    </AuthProvider>
  </React.StrictMode>
);
