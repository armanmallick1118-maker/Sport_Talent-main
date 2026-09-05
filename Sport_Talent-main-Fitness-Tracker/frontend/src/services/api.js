import axios from "axios";

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "https://sporttalent-production.up.railway.app").startsWith('http') 
    ? (import.meta.env.VITE_API_URL || "https://sporttalent-production.up.railway.app") 
    : `https://${import.meta.env.VITE_API_URL}`,
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

export default API;