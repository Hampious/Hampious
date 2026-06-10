import axios from "axios";

// Base URL from ENV (fallback to localhost)
const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api",
  timeout: 60000, // 60s — allows for Render cold start (~50s on free tier)
});

// ==============================
// REQUEST INTERCEPTOR (Attach Token)
// ==============================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// RESPONSE INTERCEPTOR (Handle Auth Errors)
// ==============================
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    // Only redirect on 401 if user was actually logged in (token existed)
    // Guests hitting a protected endpoint should NOT be redirected
    if (status === 401) {
      const token = localStorage.getItem("token");
      if (token) {
        console.warn("Token expired — logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/auth") {
          window.location.href = "/auth";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
