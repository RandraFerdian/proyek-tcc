import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import api from "../services/api";

const CourierLogin = () => {
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/couriers/login", {
        phone,
        vehicle_plate: vehiclePlate,
      });
      localStorage.clear();
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_role", "courier");
      localStorage.setItem("user_id", response.data.courier_id);
      localStorage.setItem("courier_id", response.data.courier_id);
      localStorage.setItem("courier_name", response.data.name);
      navigate("/courier");
    } catch (err) {
      setError(err.response?.data?.detail || "Login kurir gagal. Cek nomor HP dan plat kendaraan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-blue-100/30 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-[300px] w-[300px] rounded-full bg-blue-100/30 blur-[100px]" />
      </div>

      <Link
        to="/"
        className="group absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-700"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        <span>Beranda</span>
      </Link>

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="bg-gradient-to-b from-blue-50/70 to-transparent px-8 pb-6 pt-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100">
              <Truck size={32} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Kurir Portal</h1>
            <p className="mt-1.5 font-medium text-slate-500">Masuk untuk mengambil dan mengantar pesanan</p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                Kurir Live Tracking
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-8 pb-10">
            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Nomor HP
              </label>
              <div className="group relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                Plat Kendaraan
              </label>
              <div className="group relative">
                <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="AB 1234 CD"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 uppercase text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Menghubungkan..." : "Masuk ke Tugas Kurir"}
              {!loading && <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 shadow-sm">
            <ShieldCheck size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Gunakan data kurir dari admin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierLogin;
