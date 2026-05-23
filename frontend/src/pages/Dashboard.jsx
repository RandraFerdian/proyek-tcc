import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock3,
  MapPinned,
  PackagePlus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  X,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import api from "../services/api";
import { getPackageType } from "../constants/packageTypes";

const statusOptions = ["pending", "dikirim", "selesai", "dibatalkan"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getStatusMeta = (status = "") => {
  const normalized = status.toLowerCase();

  if (["dikirim", "in transit"].includes(normalized)) {
    return {
      label: "Dikirim",
      icon: <Truck size={14} />,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }

  if (["selesai", "delivered"].includes(normalized)) {
    return {
      label: "Selesai",
      icon: <CheckCircle2 size={14} />,
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }

  if (normalized === "dibatalkan") {
    return {
      label: "Dibatalkan",
      icon: <AlertCircle size={14} />,
      className: "bg-rose-50 text-rose-700 border-rose-100",
    };
  }

  return {
    label: "Pending",
    icon: <Clock3 size={14} />,
    className: "bg-amber-50 text-amber-700 border-amber-100",
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ordersRes, packagesRes, couriersRes] = await Promise.all([
        api.get("/orders/"),
        api.get("/packages/"),
        api.get("/couriers/"),
      ]);

      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : []);
      setCouriers(Array.isArray(couriersRes.data) ? couriersRes.data : []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err.response?.data?.detail ||
          "Dashboard belum bisa mengambil data. Pastikan backend sedang berjalan.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboardStats = useMemo(() => {
    const revenue = orders
      .filter((order) => ["selesai", "delivered"].includes((order.status || "").toLowerCase()))
      .reduce((total, order) => total + Number(order.total_price || 0), 0);

    const pending = orders.filter((order) => (order.status || "").toLowerCase() === "pending").length;
    const inDelivery = orders.filter((order) =>
      ["dikirim", "in transit"].includes((order.status || "").toLowerCase()),
    ).length;
    const finished = orders.filter((order) =>
      ["selesai", "delivered"].includes((order.status || "").toLowerCase()),
    ).length;

    return [
      {
        title: "Total Pesanan",
        value: orders.length,
        helper: `${pending} pesanan menunggu diproses`,
        icon: <ShoppingBag size={22} />,
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
      {
        title: "Omzet Selesai",
        value: formatCurrency(revenue),
        helper: `${finished} pesanan sudah selesai`,
        icon: <Wallet size={22} />,
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      },
      {
        title: "Sedang Dikirim",
        value: inDelivery,
        helper: "Pantau posisi lewat live tracking",
        icon: <Truck size={22} />,
        tone: "bg-amber-50 text-amber-700 border-amber-100",
      },
      {
        title: "Kurir Aktif",
        value: couriers.filter((courier) => courier.is_active).length,
        helper: `${couriers.length} kurir terdaftar`,
        icon: <Bike size={22} />,
        tone: "bg-cyan-50 text-cyan-700 border-cyan-100",
      },
    ];
  }, [couriers, orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      const fields = [
        order.order_code,
        order.customer?.name,
        order.customer?.company,
        order.package?.package_name,
        order.package?.name,
        order.courier?.name,
        order.status,
        String(order.id),
      ];

      return fields.some((field) => String(field || "").toLowerCase().includes(query));
    });
  }, [orders, searchTerm]);

  const recentOrders = useMemo(() => {
    const groups = {};
    filteredOrders.forEach((order) => {
      const code = order.order_code || `ORD-${order.id}`;
      if (!groups[code]) {
         groups[code] = {
           order_code: code,
           customer: order.customer,
           courier: order.courier,
           created_at: order.created_at,
           status: order.status,
           total_price: 0,
           items: [],
           id: order.id,
         };
      }
      groups[code].total_price += Number(order.total_price || 0);
      groups[code].items.push(order);
    });
    return Object.values(groups).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  }, [filteredOrders]);

  const quickActions = [
    {
      title: "Kelola Menu Paket",
      body: `${packages.length} paket katering tersedia`,
      icon: <PackagePlus size={22} />,
      path: "/admin/packages",
      className: "bg-white",
    },
    {
      title: "Kelola Kurir",
      body: `${couriers.length} kurir untuk operasional`,
      icon: <Users size={22} />,
      path: "/admin/couriers",
      className: "bg-white",
    },
    {
      title: "Live Tracking",
      body: "Pantau pesanan yang sedang dikirim",
      icon: <MapPinned size={22} />,
      path: "/admin/tracking",
      className: "bg-white",
    },
  ];

  const handleStatusChange = async (group, status) => {
    if (!window.confirm(`Ubah status seluruh pesanan ${group.order_code} menjadi ${status}?`)) return;
    try {
      setUpdatingId(group.order_code);
      await Promise.all(group.items.map(item => api.put(`/orders/${item.id}/status`, { status })));
      setOrders((current) =>
        current.map((order) => group.items.find(i => i.id === order.id) ? { ...order, status } : order)
      );
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(err.response?.data?.detail || "Gagal memperbarui status pesanan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Hapus seluruh pesanan ${group.order_code} dari dashboard admin?`)) return;
    try {
      setUpdatingId(group.order_code);
      await Promise.all(group.items.map(item => api.delete(`/orders/${item.id}`)));
      setOrders((current) => current.filter((order) => !group.items.find(i => i.id === order.id)));
    } catch (err) {
      console.error("Error deleting order:", err);
      setError(err.response?.data?.detail || "Gagal menghapus pesanan.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 pb-28 pt-6 md:px-8 md:pb-32 md:pt-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
              <TrendingUp size={14} />
              Admin Home
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Pusat Kontrol Catering Sehat
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Pantau pesanan, omzet, kurir, menu katering, dan pengiriman dari satu dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/admin/packages")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
            >
              <PackagePlus size={18} />
              Tambah Paket
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <div key={stat.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {stat.title}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`rounded-xl border p-3 ${stat.tone}`}>{stat.icon}</div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`group flex min-h-[116px] items-center justify-between rounded-2xl border border-slate-100 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md ${action.className}`}
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                  {action.icon}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">{action.title}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{action.body}</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600" />
            </button>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Pesanan Terbaru</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Ubah status, cek pelanggan, dan pantau nilai order dari sini.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari pesanan, pelanggan, paket..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Pelanggan</th>
                  <th className="px-5 py-4">Paket</th>
                  <th className="px-5 py-4">Kurir</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center font-semibold text-slate-500">
                      Memuat data dashboard...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-14 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-300">
                          <ShoppingBag size={32} />
                        </div>
                        <p className="font-black text-slate-700">Belum ada pesanan yang cocok</p>
                        <p className="mt-1 text-sm font-medium text-slate-400">
                          Pesanan pelanggan akan muncul otomatis setelah checkout.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((group) => {
                    const status = getStatusMeta(group.status);

                    return (
                      <tr key={group.order_code} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-800">
                            {group.order_code}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {formatDate(group.created_at)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {group.customer?.name || "Pelanggan"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {group.customer?.company || group.customer?.phone || "Customer"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {group.items.length} Menu
                          </p>
                          <button onClick={() => setSelectedGroup(group)} className="mt-1 text-[11px] font-bold text-emerald-600 hover:underline">
                            Lihat Detail
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-700">
                            {group.courier?.name || "Belum ditugaskan"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {group.courier?.vehicle_plate || "Kurir opsional"}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-black text-slate-800">
                          {formatCurrency(group.total_price)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-black ${status.className}`}>
                              {status.icon}
                              {status.label}
                            </span>
                            <select
                              value={group.status || "pending"}
                              onChange={(event) => handleStatusChange(group, event.target.value)}
                              disabled={updatingId === group.order_code}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50"
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedGroup(group)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                              title="Lihat Detail"
                            >
                              <ShoppingBag size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(group)}
                              disabled={updatingId === group.order_code}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              title="Hapus pesanan"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* --- DETAIL POPUP MODAL --- */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Detail Pesanan {selectedGroup.order_code}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Pemesan: {selectedGroup.customer?.name} | Total: {formatCurrency(selectedGroup.total_price)}
                </p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="space-y-3">
                {selectedGroup.items.map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-wide inline-block mb-2">
                          Item #{idx + 1} (ID: {item.id})
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">
                          {item.package?.package_name || item.package?.name || "Paket Katering"}
                        </h4>
                      </div>
                      <span className="font-black text-emerald-600 text-base whitespace-nowrap ml-3">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                    
                    <div className="flex gap-4 text-sm text-slate-600 mt-3 border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Kuantitas</span>
                        <span className="font-semibold">{item.quantity} Porsi</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tipe Paket</span>
                        <span className="font-semibold">{getPackageType(item.package)}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Catatan</span>
                        <span className="font-semibold italic">{item.notes || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

