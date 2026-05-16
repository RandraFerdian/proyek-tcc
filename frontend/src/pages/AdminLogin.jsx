import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  User,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";

const AdminLogin = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await api.post("/employees/", { name, email, password, role: "admin" });
        setIsRegister(false);
        setError("Registrasi berhasil! Silakan login.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(`/auth/login?role_hint=admin`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("user_role", response.data.role);
        localStorage.setItem("user_id", response.data.user_id);
        navigate("/admin");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        err.response?.data?.detail ||
          "Terjadi kesalahan. Periksa kembali data Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-indigo-100/30 rounded-full blur-[100px]" />
      </div>

      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors font-semibold text-sm group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>Beranda</span>
      </Link>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="pt-12 pb-6 px-8 text-center bg-gradient-to-b from-blue-50/60 to-transparent">
            <div className="w-16 h-16 bg-blue-50 ring-1 ring-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={32} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isRegister ? "Daftar Admin" : "Admin Panel"}
            </h1>
            <p className="text-slate-500 mt-1.5 font-medium">
              {isRegister
                ? "Buat akun administrator baru"
                : "Akses kontrol penuh sistem"}
            </p>

            <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Admin Portal
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-4">
            {error && (
              <div
                className={`p-3 border text-xs font-bold rounded-xl ${
                  error.includes("berhasil")
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : "bg-rose-50 border-rose-100 text-rose-600"
                }`}
              >
                {error}
              </div>
            )}

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nama Lengkap
                </label>
                <div className="relative group">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Administrator"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@katering-stich.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70"
            >
              {loading
                ? "Menghubungkan..."
                : isRegister
                ? "Buat Akun Admin"
                : "Masuk ke Dashboard"}
              {!loading && (
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 font-medium">
                {isRegister
                  ? "Sudah punya akun admin?"
                  : "Belum punya akun admin?"}{" "}
                <span
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                  }}
                  className="text-blue-600 cursor-pointer font-bold hover:underline"
                >
                  {isRegister ? "Login di sini" : "Daftar sekarang"}
                </span>
              </p>
            </div>
          </form>
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
            <ShieldCheck size={14} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Akses terbatas untuk personel terotorisasi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
