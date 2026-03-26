import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {}); // non-critical
  });
}

createRoot(document.getElementById("root")).render(<App />);
