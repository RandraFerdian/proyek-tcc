import { useState, useEffect } from "react";
import {
  Package,
  ChevronLeft,
  Clock,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        // Otomatis menempelkan token dari localStorage berkat interceptor api.js
        const response = await api.get("/orders/me");
        setOrders(response.data);
      } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "dikirim":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-100",
          label: "Dalam Pengiriman",
          icon: <Clock size={12} />,
        };
      case "selesai":
        return {
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          label: "Berhasil Terkirim",
          icon: <Package size={12} />,
        };
      case "pending":
        return {
          color: "text-amber-600 bg-amber-50 border-amber-100",
          label: "Menunggu Dapur",
          icon: <Clock size={12} />,
        };
      default:
        return {
          color: "text-slate-500 bg-slate-50 border-slate-100",
          label: status || "Diproses",
          icon: <Package size={12} />,
        };
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-6 py-5 flex items-center gap-4">
        <button
          onClick={() => navigate("/customer/home")}
          className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-950 tracking-tight leading-none">
            Riwayat Pesanan
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Stich Logistics Dashboard
          </p>
        </div>
      </nav>

      {/* CONTENT SECTION */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            /* Skeleton Loading */
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm"
              />
            ))
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-200 mb-6 border border-blue-100">
                <ShoppingBag size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Belum ada pesanan
              </h2>
              <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">
                Sepertinya kamu belum memesan katering apapun.
              </p>
              <button
                onClick={() => navigate("/customer/home")}
                className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
              >
                Mulai Pesan Sekarang
              </button>
            </div>
          ) : (
            /* Daftar Card Pesanan */
            orders.map((order) => {
              const status = getStatusConfig(order.status);
              return (
                <div
                  key={order.id}
                  className="group bg-white rounded-[2.5rem] p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          ORDER ID
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {order.order_code || `#ORD-${order.id}`}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${status.color}`}
                    >
                      {status.icon} {status.label}
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="flex-1">
                      {/* PERBAIKAN: Menggunakan .name bukan .package_name */}
                      <h3 className="text-lg font-black text-slate-950 mb-1 group-hover:text-blue-600 transition-colors">
                        {order.package?.name || "Paket Custom Gabungan"}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-slate-300" />{" "}
                          {order.quantity || 1} Porsi
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-300" />{" "}
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "Hari ini"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Total Bayar
                      </p>
                      <p className="text-lg font-black text-slate-900">
                        Rp {order.total_price?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Tracking jika sedang dikirim */}
                  {order.status?.toLowerCase() === "dikirim" && (
                    <button
                      onClick={() => navigate(`/tracking/${order.id}`)}
                      className="w-full mt-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 group/btn"
                    >
                      Lacak Lokasi Kurir
                      <ArrowRight
                        size={18}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
      <div className="h-10"></div>
    </div>
  );
};

export default MyOrders;
