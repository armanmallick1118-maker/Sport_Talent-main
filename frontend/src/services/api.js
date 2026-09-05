import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : "https://sporttalent-production.up.railway.app"),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the real JWT token from the backend to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && token !== "active") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Error Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest =
      requestUrl.includes("/api/v1/auth/login") ||
      requestUrl.includes("/api/v1/auth/register");

    if (error.response && error.response.status === 401 && !isAuthRequest) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("athleteProfile");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
