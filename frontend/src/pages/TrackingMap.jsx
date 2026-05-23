import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { renderToStaticMarkup } from "react-dom/server";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Navigation,
  Search,
  Truck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";

const basePosition = [KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng];

const normalizeStatus = (status = "") => status.toLowerCase();

const isInDelivery = (status) =>
  ["in transit", "dikirim"].includes(normalizeStatus(status));
const isFinished = (status) =>
  ["delivered", "selesai"].includes(normalizeStatus(status));
const isCancelled = (status) => normalizeStatus(status) === "dibatalkan";

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

const hasDatabaseCoordinate = (order) =>
  Number.isFinite(Number(order.lat)) && Number.isFinite(Number(order.lng));
const hasCourierCoordinate = (order) =>
  Number.isFinite(Number(order.courier_location?.lat)) &&
  Number.isFinite(Number(order.courier_location?.lng));

const getOrderMarkerPosition = (order) => {
  if (isInDelivery(order.status) && hasCourierCoordinate(order)) {
    return [
      Number(order.courier_location.lat),
      Number(order.courier_location.lng),
    ];
  }
  if (isInDelivery(order.status) && !hasCourierCoordinate(order)) {
    return [KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng];
  }
  if (hasDatabaseCoordinate(order)) {
    return [Number(order.lat), Number(order.lng)];
  }
  return null;
};

const getStatusMeta = (status) => {
  if (isInDelivery(status))
    return {
      label: "Dikirim",
      icon: <Navigation size={12} className="fill-current" />,
      markerIcon: (
        <Navigation
          size={18}
          className="fill-current text-white"
          strokeWidth={2.5}
        />
      ),
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      marker: "bg-emerald-600",
    };
  if (isFinished(status))
    return {
      label: "Selesai",
      icon: <CheckCircle2 size={12} />,
      markerIcon: (
        <CheckCircle2 size={19} className="text-white" strokeWidth={2.8} />
      ),
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      marker: "bg-emerald-600",
    };
  if (isCancelled(status))
    return {
      label: "Dibatalkan",
      icon: <AlertCircle size={12} />,
      markerIcon: (
        <AlertCircle size={19} className="text-white" strokeWidth={2.8} />
      ),
      badge: "bg-rose-50 text-rose-700 border-rose-100",
      marker: "bg-rose-600",
    };
  return {
    label: "Pending",
    icon: <Clock size={12} />,
    markerIcon: <Clock size={19} className="text-white" strokeWidth={2.8} />,
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    marker: "bg-amber-500",
  };
};


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
// --- KOMPONEN PEMBANTU BARU UNTUK RUTE JALAN RAYA OSRM ---
const RoutePolyline = ({ waypoints, color = "#2563eb", weight = 4, dashArray, className }) => {
  const [path, setPath] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const coordsString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
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

const statusLegend = ["pending", "dikirim", "selesai", "dibatalkan"];

const TrackingMap = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role");

  const fetchOrders = useCallback(async () => {
    try {
      setError("");
      const customerId = localStorage.getItem("user_id");
      const url =
        role === "user" && customerId
          ? `/orders/?customer_id=${customerId}`
          : "/orders/";
      const response = await api.get(url);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.detail ||
          "Gagal mengambil data tracking dari database.",
      );
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    navigate(role === "admin" ? "/admin/login" : "/customer/login");
  };

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const matches = query ? orders.filter((order) => {
      const fields = [
        getOrderCode(order),
        String(order.id),
        getPackageName(order),
        getCustomerName(order),
        order.courier?.name,
        order.status,
        getAddressText(order),
      ];
      return fields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(query),
      );
    }) : orders;

    const grouped = {};
    matches.forEach(order => {
      const code = getOrderCode(order);
      if (!grouped[code]) {
        grouped[code] = {
          ...order,
          allPackages: [`${getPackageName(order)} (x${order.quantity || 1})`]
        };
      } else {
        grouped[code].allPackages.push(`${getPackageName(order)} (x${order.quantity || 1})`);
      }
    });
    return Object.values(grouped);
  }, [orders, searchTerm]);

  const mappedGroups = filteredGroups.filter((group) =>
    getOrderMarkerPosition(group),
  );
  const withoutCoordinateCount = filteredGroups.filter(
    (group) => !hasDatabaseCoordinate(group),
  ).length;
  const inTransitCount = filteredGroups.filter((group) =>
    isInDelivery(group.status),
  ).length;

  const mapCenter = mappedGroups.length
    ? getOrderMarkerPosition(mappedGroups[0])
    : basePosition;

  return (
    <div className="relative h-full w-full bg-slate-100">
      {role === "user" && (
        <button
          onClick={handleLogout}
          className="absolute right-6 top-6 z-50 flex items-center gap-2 rounded-2xl border border-white bg-white/80 p-4 font-bold text-rose-500 shadow-xl backdrop-blur-xl transition-all hover:bg-rose-50"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mappedGroups.length ? 14 : 13}
        zoomControl={false}
        className="z-0 h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />

                <Marker
          position={[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng]}
          icon={kitchenIcon}
        >
          <Popup className="clean-popup">
            <div className="p-1 text-center font-bold text-slate-700">Dapur Catering</div>
          </Popup>
        </Marker>

        {mappedGroups.map((group) => {
          const status = getStatusMeta(group.status);
          const isDelivering = isInDelivery(group.status);
          
          const destLat = parseFloat(group.lat);
          const destLng = parseFloat(group.lng);
          if (isNaN(destLat) || isNaN(destLng)) return null;

          const kitchenLat = KITCHEN_LOCATION.lat;
          const kitchenLng = KITCHEN_LOCATION.lng;

          const courierLat = group.courier_location?.lat ? parseFloat(group.courier_location.lat) : null;
          const courierLng = group.courier_location?.lng ? parseFloat(group.courier_location.lng) : null;

          return (
            <Fragment key={`delivery-${group.id}`}>
              {/* Titik Diantar (Destinasi) */}
              <Marker position={[destLat, destLng]} icon={destinationIcon}>
                <Popup className="rounded-xl border-0 font-sans shadow-lg">
                  <div className="min-w-[210px] p-1">
                    <div
                      className={`mb-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}
                    >
                      {status.icon}
                      {status.label}
                    </div>
                    <h3 className="text-sm font-black text-slate-800">
                      {getOrderCode(group)}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-600 leading-tight">
                      {group.allPackages.join(" + ")}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {getCustomerName(group)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {getAddressText(group)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Logika Tampilan Berdasarkan Status */}
              {isDelivering && courierLat && courierLng ? (
                <>
                  <Marker position={[courierLat, courierLng]} icon={courierIcon}>
                    <Popup className="rounded-xl border-0 font-sans shadow-lg">
                      <div className="min-w-[210px] p-1 text-center">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-100">
                          🛵 Kurir
                        </div>
                        <h3 className="text-sm font-black text-slate-800">
                          {group.courier?.name || "Kurir"}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-emerald-600 leading-tight">
                          Sedang Mengantar Pesanan
                        </p>
                        <p className="mt-2 text-xs text-slate-500 font-bold">
                          {getOrderCode(group)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <RoutePolyline
                    waypoints={[ [kitchenLat, kitchenLng], [courierLat, courierLng], [destLat, destLng] ]}
                    color="#10b981"
                    className="animate-pulse"
                  />
                </>
              ) : (
                <>
                  <RoutePolyline
                    waypoints={[ [kitchenLat, kitchenLng], [destLat, destLng] ]}
                    color="#94a3b8"
                    dashArray="5, 10"
                  />
                </>
              )}
            </Fragment>
          );
        })}
      </MapContainer>

      {/* Bagian Overlay UI Tetap Sama... */}
      <div className="pointer-events-auto absolute left-4 right-4 top-4 z-10 flex max-h-[calc(100%-8.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-white bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:left-6 sm:right-auto sm:top-6 sm:w-[380px]">
        <div className="border-b border-slate-100/70 p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Live Tracking
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {loading
                  ? "Memuat data database..."
                  : `${mappedGroups.length} lokasi tampil di peta`}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700">
              <Truck size={22} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">
                {filteredGroups.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Order
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p className="text-lg font-black text-emerald-700">
                {inTransitCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Dikirim
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-lg font-black text-amber-700">
                {withoutCoordinateCount}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Tanpa GPS
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusLegend.map((statusName) => {
              const status = getStatusMeta(statusName);
              return (
                <div
                  key={statusName}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${status.badge}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${status.marker}`}
                  >
                    {status.markerIcon}
                  </span>
                  {status.label}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative mt-5">
            <input
              type="text"
              placeholder="Cari order, pelanggan, paket, alamat..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {filteredGroups.length === 0 && !loading && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center text-sm font-semibold text-slate-500">
              Tidak ada pesanan ditemukan.
            </div>
          )}
          {filteredGroups.map((group) => {
            const status = getStatusMeta(group.status);
            const hasCoordinate = hasDatabaseCoordinate(group);
            return (
              <div
                key={group.id}
                className={`rounded-2xl border p-4 transition-all ${hasCoordinate ? "border-slate-100 bg-white shadow-sm hover:border-emerald-100 hover:shadow-md" : "border-amber-100 bg-amber-50/60"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                  <span className="text-xs font-black text-slate-400">
                    {getOrderCode(group)}
                  </span>
                </div>
                <h3 className="text-base font-black leading-tight text-slate-900">
                  {group.allPackages.join(" + ")}
                </h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <UserRound
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <span className="font-semibold">
                      {getCustomerName(group)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    <span className="leading-relaxed">
                      {getAddressText(group)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <span>
                      {group.courier?.name || "Kurir belum ditugaskan"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                  {hasCoordinate
                    ? isInDelivery(group.status) && hasCourierCoordinate(group)
                      ? `Kurir: ${Number(group.courier_location.lat).toFixed(5)}, ${Number(group.courier_location.lng).toFixed(5)}`
                      : `Tujuan: ${Number(group.lat).toFixed(5)}, ${Number(group.lng).toFixed(5)}`
                    : "Koordinat belum ada di database alamat"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
