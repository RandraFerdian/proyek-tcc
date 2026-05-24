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
  MessageCircle,
} from "lucide-react";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import ChatWindow from "../components/ChatWindow";

const kitchenIcon = divIcon({
  className: "custom-icon",
  html: `<div class="bg-amber-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white text-white text-lg">🍳</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const destinationIcon = divIcon({
  className: "custom-icon",
  html: `<div class="bg-rose-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white text-white text-lg">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const courierIcon = divIcon({
  className: "custom-icon",
  html: `<div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-ping"></div>
        <div class="bg-emerald-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white relative z-10 text-white text-lg">🛵</div>
      </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const RoutePolyline = ({
  waypoints,
  color = "#2563eb",
  weight = 4,
  dashArray,
  className,
}) => {
  const [path, setPath] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const coordsString = waypoints.map((p) => `${p[1]},${p[0]}`).join(";");
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
        );
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);
          setPath(coords);
        } else {
          setPath(waypoints);
        }
      } catch {
        setPath(waypoints);
      }
    };
    if (waypoints && waypoints.length >= 2) {
      fetchRoute();
    }
  }, [JSON.stringify(waypoints)]);

  if (path.length < 2) return null;
  return (
    <Polyline
      positions={path}
      pathOptions={{ color, weight, opacity: 0.8, dashArray }}
      className={className}
    />
  );
};

const getPackageName = (order) =>
  order.package?.package_name ||
  order.package?.name ||
  `Paket #${order.package_id || "-"}`;

const getCustomerName = (order) =>
  order.customer?.name || `Pelanggan #${order.customer_id || "-"}`;

const getOrderCode = (order) =>
  order.order_code || `ORD-${String(order.id).padStart(4, "0")}`;

const getAddressText = (order) =>
  order.address?.street || order.street || "Alamat belum tersedia";

const statusLabel = (status = "") => {
  const current = status.toLowerCase();
  if (current === "dikirim" || current === "in transit")
    return "Sedang Diantar";
  if (current === "selesai" || current === "delivered") return "Selesai";
  if (current === "dibatalkan") return "Dibatalkan";
  return "Menunggu";
};

const groupOrdersByCode = (orderList) => {
  const grouped = {};
  orderList.forEach((order) => {
    const code = getOrderCode(order);
    if (!grouped[code]) {
      grouped[code] = {
        ...order,
        groupedIds: [order.id], // Menyimpan semua ID yang tergabung
        allPackages: [`${getPackageName(order)} (x${order.quantity || 1})`],
      };
    } else {
      // Jika kode sama, gabungkan ID dan nama makanannya
      grouped[code].groupedIds.push(order.id);
      grouped[code].allPackages.push(
        `${getPackageName(order)} (x${order.quantity || 1})`,
      );
    }
  });
  return Object.values(grouped); // Kembalikan sebagai Array
};

const CourierDashboard = () => {
  const navigate = useNavigate();
  const courierId =
    localStorage.getItem("courier_id") || localStorage.getItem("user_id");
  const courierName = localStorage.getItem("courier_name") || "Kurir";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [locationSending, setLocationSending] = useState(false);
  const [error, setError] = useState("");
  const [lastLocation, setLastLocation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [activeChatCode, setActiveChatCode] = useState(null);

  // Haversine formula to calculate distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  const handleInvalidCourierSession = useCallback(() => {
    localStorage.clear();
    navigate("/courier/login");
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    if (!courierId) return;
    try {
      setError("");
      const response = await api.get(`/orders/courier/${courierId}`);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching courier orders:", err);
      if (err.response?.status === 404) {
        handleInvalidCourierSession();
        return;
      }
      setError(err.response?.data?.detail || "Gagal mengambil tugas kurir.");
    } finally {
      setLoading(false);
    }
  }, [courierId, handleInvalidCourierSession]);

  useEffect(() => {
    if (!courierId) {
      navigate("/courier/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [courierId, fetchOrders, navigate]);

  const assignedOrders = useMemo(
    () =>
      groupOrdersByCode(
        orders.filter(
          (order) => Number(order.courier_id) === Number(courierId),
        ),
      ),
    [courierId, orders],
  );

  const availableOrders = useMemo(
    () =>
      groupOrdersByCode(
        orders.filter(
          (order) =>
            !order.courier_id &&
            !["selesai", "delivered", "dibatalkan"].includes(
              (order.status || "").toLowerCase(),
            ),
        ),
      ),
    [orders],
  );

  const activeOrder = assignedOrders.find((order) =>
    ["dikirim", "in transit"].includes((order.status || "").toLowerCase()),
  );

  useEffect(() => {
    let watchId;

    if (activeOrder && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;

          setLastLocation((prev) => {
            let shouldUpdate = false;
            if (!prev) {
              shouldUpdate = true;
            } else {
              const dist = getDistance(prev.lat, prev.lng, newLat, newLng);
              if (dist >= 20) {
                shouldUpdate = true;
              }
            }

            if (shouldUpdate) {
              api
                .post(`/couriers/${courierId}/location`, {
                  lat: newLat,
                  lng: newLng,
                  order_id: activeOrder.id,
                })
                .catch((err) =>
                  console.error("Auto update location failed", err),
                );
              return { lat: newLat, lng: newLng };
            }
            return prev;
          });
        },
        (err) => console.error("Watch position error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
      );
    }

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeOrder?.id, courierId]);

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
      return false;
    }

    setLocationSending(true);
    setError("");

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post(`/couriers/${courierId}/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              order_id: orderId || null,
            });
            await fetchOrders();
            resolve(true);
          } catch (err) {
            console.error("Error updating courier location:", err);
            setError(
              err.response?.data?.detail || "Gagal mengirim lokasi kurir.",
            );
            resolve(false);
          } finally {
            setLocationSending(false);
          }
        },
        () => {
          setError(
            "Tugas berhasil, namun GPS HP belum terbaca. Pastikan GPS menyala.",
          );
          setLocationSending(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  };

  const claimOrder = async (orderId, groupedIds) => {
    try {
      setUpdatingId(orderId);
      // Kirim perintah update untuk SEMUA item di pesanan ini sekaligus
      await Promise.all(
        groupedIds.map((id) =>
          api.put(`/orders/${id}/assign-courier`, {
            courier_id: Number(courierId),
          }),
        ),
      );
      await fetchOrders();
      await updateLocation(orderId);
    } catch (err) {
      console.error("Error claiming order:", err);
      if (err.response?.status === 404) {
        handleInvalidCourierSession();
        return;
      }
      setError(err.response?.data?.detail || "Gagal mengambil tugas.");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateStatus = async (orderId, groupedIds, status) => {
    try {
      setUpdatingId(orderId);
      // Kirim perintah update status untuk SEMUA item sekaligus
      await Promise.all(
        groupedIds.map((id) => api.put(`/orders/${id}/status`, { status })),
      );
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
      <div
        key={order.id}
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              {getOrderCode(order)}
            </p>
            {/* PERBAIKAN: Menampilkan gabungan menu dengan tanda (+) jika pesanan di-group */}
            <h3 className="mt-1 text-lg font-black text-slate-900 leading-tight">
              {order.allPackages
                ? order.allPackages.join(" + ")
                : getPackageName(order)}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-black ${
              isDone
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : isDelivering
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-amber-100 bg-amber-50 text-amber-700"
            }`}
          >
            {statusLabel(order.status)}
          </span>
        </div>

        <div className="space-y-3 text-sm font-semibold text-slate-600">
          <div className="flex gap-2">
            <UserRound size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <span>{getCustomerName(order)}</span>
          </div>
          <div className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <span className="leading-relaxed">{getAddressText(order)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {mode === "available" ? (
            <button
              // PERBAIKAN: Mengirimkan order.groupedIds agar semua item terambil sekaligus
              onClick={() => claimOrder(order.id, order.groupedIds)}
              disabled={updatingId === order.id}
              className="sm:col-span-3 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <PackageCheck size={18} />
              Ambil Tugas
            </button>
          ) : (
            <>
              <button
                // PERBAIKAN: Mengirimkan order.groupedIds dan status "dikirim"
                onClick={() =>
                  updateStatus(order.id, order.groupedIds, "dikirim")
                }
                disabled={updatingId === order.id || isDelivering || isDone}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
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
              {["dikirim", "in transit"].includes(
                (order.status || "").toLowerCase(),
              ) && (
                <button
                  onClick={() => {
                    setActiveChatCode(
                      order.order_code ||
                        `ORD-${String(order.id).padStart(4, "0")}`,
                    );
                    setShowChat(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  <MessageCircle size={17} />
                  Chat
                </button>
              )}
              <button
                // PERBAIKAN: Mengirimkan order.groupedIds dan status "selesai"
                onClick={() =>
                  updateStatus(order.id, order.groupedIds, "selesai")
                }
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Truck size={28} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                Ruang Kerja Kurir
              </p>
              <h1 className="text-2xl font-black tracking-tight">
                Halo, {courierName}
              </h1>
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

        {activeOrder && (
          <section className="mb-6 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
            <div className="bg-emerald-600 px-5 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Navigation size={18} />
                <h2 className="font-black text-sm uppercase tracking-wider">
                  Live Route: {getOrderCode(activeOrder)}
                </h2>
              </div>
            </div>
            <div className="h-[400px] w-full relative z-0">
              <MapContainer
                center={[
                  parseFloat(activeOrder.lat) || KITCHEN_LOCATION.lat,
                  parseFloat(activeOrder.lng) || KITCHEN_LOCATION.lng,
                ]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <ZoomControl position="bottomright" />

                <Marker
                  position={[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng]}
                  icon={kitchenIcon}
                >
                  <Popup className="clean-popup">Dapur Catering</Popup>
                </Marker>

                {parseFloat(activeOrder.lat) && parseFloat(activeOrder.lng) && (
                  <Marker
                    position={[
                      parseFloat(activeOrder.lat),
                      parseFloat(activeOrder.lng),
                    ]}
                    icon={destinationIcon}
                  >
                    <Popup className="clean-popup">
                      Tujuan: {getCustomerName(activeOrder)}
                    </Popup>
                  </Marker>
                )}

                {lastLocation && (
                  <Marker
                    position={[lastLocation.lat, lastLocation.lng]}
                    icon={courierIcon}
                  >
                    <Popup className="clean-popup">Posisi Anda (Kurir)</Popup>
                  </Marker>
                )}

                {lastLocation &&
                parseFloat(activeOrder.lat) &&
                parseFloat(activeOrder.lng) ? (
                  <RoutePolyline
                    waypoints={[
                      [lastLocation.lat, lastLocation.lng],
                      [
                        parseFloat(activeOrder.lat),
                        parseFloat(activeOrder.lng),
                      ],
                    ]}
                    color="#10b981"
                    className="animate-pulse"
                  />
                ) : (
                  parseFloat(activeOrder.lat) &&
                  parseFloat(activeOrder.lng) && (
                    <RoutePolyline
                      waypoints={[
                        [KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng],
                        [
                          parseFloat(activeOrder.lat),
                          parseFloat(activeOrder.lng),
                        ],
                      ]}
                      color="#94a3b8"
                      dashArray="5, 10"
                    />
                  )
                )}
              </MapContainer>
            </div>
          </section>
        )}

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Tugas Saya
            </p>
            <p className="mt-2 text-3xl font-black">{assignedOrders.length}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500">
              Sedang Diantar
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {
                assignedOrders.filter((order) =>
                  ["dikirim", "in transit"].includes(
                    (order.status || "").toLowerCase(),
                  ),
                ).length
              }
            </p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">
              Tersedia
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {availableOrders.length}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Titik Ambil Makanan
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {KITCHEN_LOCATION.shortName}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {KITCHEN_LOCATION.name}
                </p>
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
              availableOrders.map((order) =>
                renderOrderCard(order, "available"),
              )
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center font-bold text-slate-500">
                Tidak ada pesanan tersedia saat ini.
              </div>
            )}
          </div>
        </section>
      </div>

      {showChat && activeChatCode && (
        <ChatWindow
          orderCode={activeChatCode}
          role="courier"
          userName={courierName}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default CourierDashboard;
