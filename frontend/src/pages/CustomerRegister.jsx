import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const CustomerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/customer/register", formData);

      if (response.data) {
        setSuccess("Pendaftaran berhasil. Mengarahkan ke halaman login...");
        setTimeout(() => navigate("/customer/login"), 700);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Terjadi kesalahan saat mendaftar. Pastikan semua data valid.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] px-4 py-12 font-sans overflow-y-auto relative flex justify-center items-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] -left-[5%] w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] -right-[5%] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[500px] my-auto">
        {/* Back Button */}
        <Link
          to="/customer/login"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:-translate-x-1 transition-transform">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold">Kembali ke Login</span>
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-[800] text-slate-900 tracking-tight leading-tight">
              Buat Akun <br />
              <span className="text-emerald-600">Baru.</span>
            </h1>
            <p className="text-slate-500 mt-3 font-medium">
              Lengkapi detail di bawah untuk mulai memesan katering eksklusif.
            </p>
          </div>

          {/* Error Message Section */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                Nama Lengkap
              </label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={19}
                />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nama Panjang Anda"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Perusahaan */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                Nama Perusahaan (Opsional)
              </label>
              <div className="relative group">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={19}
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Nama Perusahaan (Boleh dikosongkan)"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Phone + Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                  No. Telepon
                </label>
                <div className="relative group">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                    size={19}
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                  Email
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                    size={19}
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@mail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={19}
                />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Password akun"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-bold text-base shadow-xl shadow-slate-900/10 hover:bg-emerald-600 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Sudah memiliki akun?{" "}
              <Link
                to="/customer/login"
                className="text-emerald-600 font-bold hover:underline underline-offset-4"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Note Secure Element */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            Koneksi Aman
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div>Terenkripsi</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;
