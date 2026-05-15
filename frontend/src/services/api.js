import axios from "axios";

const api = axios.create({
  // URL ini diambil dari file .env frontend yang kita buat sebelumnya
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// --- TAMBAHAN INTERCEPTOR ---
// Fungsi ini akan berjalan otomatis SEBELUM request dikirim ke backend
api.interceptors.request.use(
  (config) => {
    // Ambil token dari penyimpanan lokal browser
    const token = localStorage.getItem("token");

    // Jika token ada, sisipkan ke dalam Header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
