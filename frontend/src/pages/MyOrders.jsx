import { useState, useEffect, useMemo } from "react";
import {
  Package,
  ChevronLeft,
  Clock,
  ArrowRight,
  ShoppingBag,
  MapPin,
  X,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MyOrders = () => {
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/orders/me");

        if (Array.isArray(response.data)) {
          setRawOrders(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setRawOrders(response.data.data);
        } else {
          setRawOrders([]);
        }
      } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
        setRawOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  const groupedOrders = useMemo(() => {
    const safeOrders = Array.isArray(rawOrders) ? rawOrders : [];

    const groups = safeOrders.reduce((acc, order) => {
      if (!order) return acc;

      const code = order.order_code || `ORD-${order.id || "UNKNOWN"}`;

      if (!acc[code]) {
        acc[code] = {
          order_code: code,
          status: order.status || "pending",
          created_at: order.created_at,
          street: order.street || "Alamat tidak tertera",
          payment_method: order.payment_method || "cash",
          notes: order.notes || "",
          scheduled_time: order.scheduled_time || "",
          total_transaction_price: 0,
          total_items_count: 0,
          items: [],
        };
      }

      acc[code].items.push(order);
      acc[code].total_transaction_price += order.total_price || 0;
      acc[code].total_items_count += order.quantity || 1;

      return acc;
    }, {});

    return Object.values(groups).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });
  }, [rawOrders]);

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
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans overflow-hidden relative">
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
            Katering Stich
          </p>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm"
              />
            ))
          ) : groupedOrders.length === 0 ? (
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
            groupedOrders.map((group) => {
              const status = getStatusConfig(group.status);

              const firstItemName =
                group.items[0]?.package?.package_name ||
                group.items[0]?.package?.name ||
                "Paket Custom Katering";
              const extraItemsCount = group.items.length - 1;
              const displayTitle =
                extraItemsCount > 0
                  ? `${firstItemName} + ${extraItemsCount} menu lainnya`
                  : firstItemName;

              return (
                <div
                  key={group.order_code}
                  onClick={() => setSelectedGroup(group)}
                  className="group hover:bg-slate-50 bg-white rounded-[2.5rem] p-6 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                          {group.order_code}
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
                      <h3 className="text-lg font-black text-slate-950 mb-1 group-hover:text-blue-600 transition-colors">
                        {displayTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag size={14} className="text-slate-300" />{" "}
                          {group.total_items_count} Porsi Total
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-300" />{" "}
                          {group.created_at
                            ? new Date(group.created_at).toLocaleDateString(
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
                        Rp{" "}
                        {group.total_transaction_price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* --- MODAL DETAIL --- */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Detail Transaksi
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {selectedGroup.order_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={12} /> Menu Yang Dipesan
                </h4>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
                  {selectedGroup.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {item.package?.package_name ||
                            item.package?.name ||
                            "Paket Custom Katering"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          {item.quantity} Porsi x Rp{" "}
                          {(
                            item.total_price / (item.quantity || 1)
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className="font-black text-slate-800 text-sm">
                        Rp {item.total_price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                  <div className="p-4 bg-slate-100/50 flex justify-between items-center rounded-b-2xl">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Total Keseluruhan
                    </p>
                    <p className="text-base font-black text-blue-600">
                      Rp{" "}
                      {selectedGroup.total_transaction_price.toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Jadwal Antar
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-700 flex items-center gap-3">
                  <Clock size={16} className="text-blue-600" />
                  {selectedGroup.scheduled_time
                    ? new Date(selectedGroup.scheduled_time).toLocaleString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Segera dikirim"}{" "}
                  WIB
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> Alamat Pengiriman
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    [Titik Koordinat Peta]
                  </p>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {selectedGroup.street || "Alamat lengkap tidak tertera."}
                  </p>
                </div>
              </div>
            </div>

            {selectedGroup.status?.toLowerCase() === "dikirim" && (
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() =>
                    navigate(`/tracking/${selectedGroup.items[0].id}`)
                  }
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  Lacak Pengiriman Kurir <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
