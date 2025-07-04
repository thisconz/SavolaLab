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
    console.error("API response error:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
