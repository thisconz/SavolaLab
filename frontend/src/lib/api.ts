import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",  // removed trailing slash
  // withCredentials: true,           // temporarily disable
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with status code outside 2xx
      console.error("API response error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error("No response received:", error.request);
    } else {
      // Something else happened while setting up the request
      console.error("Error setting up request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
