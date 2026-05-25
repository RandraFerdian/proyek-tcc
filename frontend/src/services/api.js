import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// TAMBAHKAN KODE INTERCEPTOR INI:
api.interceptors.request.use(
  (config) => {
    // Mengambil token dengan kunci 'token' sesuai yang disimpan saat login
    const token = localStorage.getItem("token");

    if (token) {
      // Menyuntikkan token ke dalam header HTTP Authorization Bearer
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
