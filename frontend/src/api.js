import axios from "axios";

// Base URL from ENV (fallback to localhost)
const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000/api",
  timeout: 15000, // 15s timeout safety
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

    // If token expired or unauthorized → logout user
    if (status === 401) {
      console.warn("Unauthorized — logging out");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Prevent redirect loop
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
