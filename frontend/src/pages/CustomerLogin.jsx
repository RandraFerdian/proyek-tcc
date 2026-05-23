import { useState } from "react";
import { Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/customer/login", formData);
      if (response.data && (response.data.token || response.data.access_token)) {
        localStorage.clear();
        localStorage.setItem(
          "token",
          response.data.token || response.data.access_token,
        );
        localStorage.setItem("user_role", response.data.role || "user");
        localStorage.setItem("user_id", response.data.user_id);
        localStorage.setItem("user_name", response.data.name || "Pelanggan");
        navigate("/customer/home");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FB] p-4 font-sans">
      {/* Background Ambient Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] -right-[5%] w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] -left-[5%] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px]">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-10">
          {/* Logo / Icon Brand */}
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-500/30 animate-pulse">
            <ShieldCheck size={26} />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-[800] text-slate-900 tracking-tight leading-tight">
              Selamat <br />Datang <span className="text-emerald-600">Kembali.</span>
            </h1>
            <p className="text-slate-500 mt-3 font-medium">
              Silakan masuk ke akun customer Anda untuk mengelola pesanan.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field: Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">Email Anda</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={19} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="user@mail.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Password</label>
                <span className="text-xs font-bold text-slate-400">
                  Bantuan admin
                </span>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={19} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Password akun"
                  className="w-full pl-12 pr-4 py-4 bg-slate-100/50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 outline-none rounded-[1.25rem] text-sm font-semibold text-slate-800 transition-all"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-bold text-base shadow-xl shadow-slate-900/10 hover:bg-emerald-600 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Belum memiliki akun?{" "}
              <Link to="/customer/register" className="text-emerald-600 font-bold hover:underline underline-offset-4">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} /> Server Aman
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full" />
          <div>Terenkripsi</div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
