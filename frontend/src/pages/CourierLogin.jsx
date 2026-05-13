import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
} from "lucide-react";

const CourierLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Backend belum mendukung auth untuk kurir secara spesifik di tabel kurir
    // Untuk demonstrasi UI, kita beri notifikasi atau gunakan admin login logic jika diperlukan
    setError("Fitur login kurir akan segera hadir. Gunakan portal admin sementara.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
      {/* Subtle background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-violet-100/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[300px] h-[300px] bg-indigo-100/30 rounded-full blur-[100px]" />
      </div>

      {/* Back Button */}
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

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="pt-12 pb-6 px-8 text-center bg-gradient-to-b from-violet-50/60 to-transparent">
            <div className="w-16 h-16 bg-violet-50 ring-1 ring-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck size={32} className="text-violet-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Kurir Portal
            </h1>
            <p className="text-slate-500 mt-1.5 font-medium">
              Masuk untuk melihat rute pengiriman
            </p>

            {/* Courier Badge */}
            <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 bg-violet-50 border border-violet-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
                Courier Portal
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-4">
            {error && (
              <div className="p-3 border text-xs font-bold rounded-xl bg-rose-50 border-rose-100 text-rose-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                ID Kurir / Email
              </label>
              <div className="relative group">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kurir@katering-stich.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder:text-slate-400 text-slate-700"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none transition-all placeholder:text-slate-400 text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 text-white font-black rounded-2xl shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Menghubungkan..." : "Masuk ke Sistem"}
              {!loading && (
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
            <ShieldCheck size={14} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Gunakan perangkat yang terdaftar
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2026 Katering Stich • Monitoring System v1.0
        </p>
      </div>
    </div>
  );
};

export default CourierLogin;
