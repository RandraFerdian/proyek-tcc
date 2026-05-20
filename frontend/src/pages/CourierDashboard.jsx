import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LocateFixed,
  LogOut,
  MapPin,
  Navigation,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";

const getPackageName = (order) =>
  order.package?.package_name || order.package?.name || `Paket #${order.package_id || "-"}`;

const getCustomerName = (order) =>
  order.customer?.name || `Pelanggan #${order.customer_id || "-"}`;

const getOrderCode = (order) =>
  order.order_code || `ORD-${String(order.id).padStart(4, "0")}`;

const getAddressText = (order) =>
  order.address?.street || order.street || "Alamat belum tersedia";

const statusLabel = (status = "") => {
  const current = status.toLowerCase();
  if (current === "dikirim" || current === "in transit") return "Sedang Diantar";
  if (current === "selesai" || current === "delivered") return "Selesai";
  if (current === "dibatalkan") return "Dibatalkan";
  return "Menunggu";
};

const CourierDashboard = () => {
  const navigate = useNavigate();
  const courierId = localStorage.getItem("courier_id") || localStorage.getItem("user_id");
  const courierName = localStorage.getItem("courier_name") || "Kurir";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [locationSending, setLocationSending] = useState(false);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!courierId) return;
    try {
      setError("");
      const response = await api.get(`/orders/courier/${courierId}`);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching courier orders:", err);
      setError(err.response?.data?.detail || "Gagal mengambil tugas kurir.");
    } finally {
      setLoading(false);
    }
  }, [courierId]);

  useEffect(() => {
    if (!courierId) {
      navigate("/courier/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [courierId, fetchOrders, navigate]);

  const assignedOrders = useMemo(
    () => orders.filter((order) => Number(order.courier_id) === Number(courierId)),
    [courierId, orders],
  );

  const availableOrders = useMemo(
    () => orders.filter((order) => !order.courier_id && !["selesai", "delivered", "dibatalkan"].includes((order.status || "").toLowerCase())),
    [orders],
  );

  const activeOrder = assignedOrders.find((order) =>
    ["dikirim", "in transit"].includes((order.status || "").toLowerCase()),
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("courier_id");
    localStorage.removeItem("courier_name");
    navigate("/courier/login");
  };

  const updateLocation = async (orderId = activeOrder?.id) => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung GPS.");
      return;
    }

    setLocationSending(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post(`/couriers/${courierId}/location`, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            order_id: orderId || null,
          });
          await fetchOrders();
        } catch (err) {
          console.error("Error updating courier location:", err);
          setError(err.response?.data?.detail || "Gagal mengirim lokasi kurir.");
        } finally {
          setLocationSending(false);
        }
      },
      () => {
        setError("Gagal mengambil lokasi. Pastikan izin GPS aktif.");
        setLocationSending(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const claimOrder = async (orderId) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/assign-courier`, {
        courier_id: Number(courierId),
      });
      await fetchOrders();
      await updateLocation(orderId);
    } catch (err) {
      console.error("Error claiming order:", err);
      setError(err.response?.data?.detail || "Gagal mengambil tugas.");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { status });
      await fetchOrders();
      if (status === "dikirim") {
        await updateLocation(orderId);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(err.response?.data?.detail || "Gagal update status pesanan.");
    } finally {
      setUpdatingId(null);
    }
  };

  const renderOrderCard = (order, mode = "assigned") => {
    const current = (order.status || "pending").toLowerCase();
    const isDone = ["selesai", "delivered"].includes(current);
    const isDelivering = ["dikirim", "in transit"].includes(current);

    return (
      <div key={order.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{getOrderCode(order)}</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{getPackageName(order)}</h3>
          </div>
          <span className={`rounded-xl border px-3 py-1.5 text-xs font-black ${
            isDone
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : isDelivering
                ? "border-blue-100 bg-blue-50 text-blue-700"
                : "border-amber-100 bg-amber-50 text-amber-700"
          }`}>
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="space-y-3 text-sm font-semibold text-slate-600">
          <div className="flex gap-2">
            <UserRound size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <span>{getCustomerName(order)}</span>
          </div>
          <div className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-blue-500" />
            <span className="leading-relaxed">{getAddressText(order)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {mode === "available" ? (
            <button
              onClick={() => claimOrder(order.id)}
              disabled={updatingId === order.id}
              className="sm:col-span-3 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              <PackageCheck size={18} />
              Ambil Tugas
            </button>
          ) : (
            <>
              <button
                onClick={() => updateStatus(order.id, "dikirim")}
                disabled={updatingId === order.id || isDelivering || isDone}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Navigation size={17} />
                Mulai
              </button>
              <button
                onClick={() => updateLocation(order.id)}
                disabled={locationSending || isDone}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <LocateFixed size={17} />
                Lokasi
              </button>
              <button
                onClick={() => updateStatus(order.id, "selesai")}
                disabled={updatingId === order.id || isDone}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <CheckCircle2 size={17} />
                Diterima
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Ruang Kerja Kurir</p>
              <h1 className="text-2xl font-black tracking-tight">Halo, {courierName}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOrders}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tugas Saya</p>
            <p className="mt-2 text-3xl font-black">{assignedOrders.length}</p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-blue-500">Sedang Diantar</p>
            <p className="mt-2 text-3xl font-black text-blue-700">
              {assignedOrders.filter((order) => ["dikirim", "in transit"].includes((order.status || "").toLowerCase())).length}
            </p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">Tersedia</p>
            <p className="mt-2 text-3xl font-black text-amber-700">{availableOrders.length}</p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Titik Ambil Makanan</p>
                <h2 className="mt-1 text-lg font-black text-slate-900">{KITCHEN_LOCATION.shortName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{KITCHEN_LOCATION.name}</p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps?q=${KITCHEN_LOCATION.lat},${KITCHEN_LOCATION.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <Navigation size={17} />
              Buka Maps
            </a>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 size={18} className="text-slate-400" />
            <h2 className="text-lg font-black">Tugas Pengantaran Saya</h2>
          </div>
          <div className="grid gap-4">
            {loading ? (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center font-bold text-slate-500">
                Memuat tugas...
              </div>
            ) : assignedOrders.length ? (
              assignedOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center font-bold text-slate-500">
                Belum ada tugas yang kamu ambil.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <PackageCheck size={18} className="text-slate-400" />
            <h2 className="text-lg font-black">Pesanan Belum Ada Kurir</h2>
          </div>
          <div className="grid gap-4">
            {availableOrders.length ? (
              availableOrders.map((order) => renderOrderCard(order, "available"))
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center font-bold text-slate-500">
                Tidak ada pesanan tersedia saat ini.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourierDashboard;
