// src/components/rider/Customization.jsx
import React, { useState } from "react";

function Customization() {
  const [theme, setTheme] = useState("light");

  return (
    <div>
      <h2>Customization</h2>
      <p>Adjust your dashboard preferences.</p>
      <label>
        Theme:
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}

export default Customization;
