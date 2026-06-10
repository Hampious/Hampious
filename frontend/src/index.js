import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Wake up Render backend on app load (prevents cold-start delay on first action)
fetch((process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api").replace("/api", "") + "/")
  .catch(() => {});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
