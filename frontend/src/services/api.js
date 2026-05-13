import axios from "axios";

const api = axios.create({
  // URL ini diambil dari file .env frontend yang kita buat sebelumnya
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
