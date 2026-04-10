import React from "react";
import "../styles/toast.css";

function Toast({ type = "success", message, onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export default Toast;