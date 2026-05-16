import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, ZoomControl } from "react-leaflet";
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
  order.package?.package_name || order.package?.name || `Paket #${order.package_id || "-"}`;

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
    return [Number(order.courier_location.lat), Number(order.courier_location.lng)];
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
  if (isInDelivery(status)) {
    return {
      label: "Dikirim",
      icon: <Navigation size={12} className="fill-current" />,
      markerIcon: <Navigation size={18} className="fill-current text-white" strokeWidth={2.5} />,
      badge: "bg-blue-50 text-blue-700 border-blue-100",
      marker: "bg-blue-600",
    };
  }

  if (isFinished(status)) {
    return {
      label: "Selesai",
      icon: <CheckCircle2 size={12} />,
      markerIcon: <CheckCircle2 size={19} className="text-white" strokeWidth={2.8} />,
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      marker: "bg-emerald-600",
    };
  }

  if (isCancelled(status)) {
    return {
      label: "Dibatalkan",
      icon: <AlertCircle size={12} />,
      markerIcon: <AlertCircle size={19} className="text-white" strokeWidth={2.8} />,
      badge: "bg-rose-50 text-rose-700 border-rose-100",
      marker: "bg-rose-600",
    };
  }

  return {
    label: "Pending",
    icon: <Clock size={12} />,
    markerIcon: <Clock size={19} className="text-white" strokeWidth={2.8} />,
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    marker: "bg-amber-500",
  };
};

const createCustomIcon = (status) => {
  const meta = getStatusMeta(status);
  const pingEffect = isInDelivery(status) ? (
    <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping" />
  ) : null;

  const iconMarkup = renderToStaticMarkup(
    <div className="relative cursor-pointer">
      {pingEffect}
      <div className={`${meta.marker} relative z-10 flex items-center justify-center rounded-full border-[3px] border-white p-2.5 shadow-lg`}>
        {meta.markerIcon}
      </div>
    </div>,
  );

  return divIcon({
    html: iconMarkup,
    className: "custom-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createKitchenIcon = () =>
  divIcon({
    html: renderToStaticMarkup(
      <div className="relative cursor-pointer">
        <div className="relative z-10 flex items-center justify-center rounded-full border-[3px] border-white bg-slate-900 p-2.5 shadow-lg">
          <MapPin size={19} className="text-white" strokeWidth={2.8} />
        </div>
      </div>,
    ),
    className: "custom-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

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
      const url = role === "user" && customerId ? `/orders/?customer_id=${customerId}` : "/orders/";
      const response = await api.get(url);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.detail || "Gagal mengambil data tracking dari database.");
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

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((order) => {
      const fields = [
        getOrderCode(order),
        String(order.id),
        getPackageName(order),
        getCustomerName(order),
        order.courier?.name,
        order.status,
        getAddressText(order),
      ];

      return fields.some((field) => String(field || "").toLowerCase().includes(query));
    });
  }, [orders, searchTerm]);

  const mappedOrders = filteredOrders.filter((order) => getOrderMarkerPosition(order));
  const withoutCoordinateCount = filteredOrders.filter((order) => !hasDatabaseCoordinate(order)).length;
  const inTransitCount = orders.filter((order) => isInDelivery(order.status)).length;

  const mapCenter = mappedOrders.length
    ? getOrderMarkerPosition(mappedOrders[0])
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
        zoom={mappedOrders.length ? 14 : 13}
        zoomControl={false}
        className="z-0 h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ZoomControl position="bottomright" />

        <Marker position={[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng]} icon={createKitchenIcon()}>
          <Popup>{KITCHEN_LOCATION.name}</Popup>
        </Marker>

        {mappedOrders.map((order) => {
          const markerPos = getOrderMarkerPosition(order);
          const status = getStatusMeta(order.status);
          const destination = hasDatabaseCoordinate(order) ? [Number(order.lat), Number(order.lng)] : null;
          const routePoints = isInDelivery(order.status) && destination
            ? [
                [KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng],
                markerPos,
                destination,
              ]
            : [];

          return (
            <Fragment key={`delivery-${order.id}`}>
              {routePoints.length >= 2 && (
                <Polyline
                  positions={routePoints}
                  pathOptions={{
                    color: "#2563eb",
                    weight: 4,
                    opacity: 0.45,
                    dashArray: hasCourierCoordinate(order) ? undefined : "10 12",
                  }}
                />
              )}
              <Marker position={markerPos} icon={createCustomIcon(order.status)}>
                <Popup className="rounded-xl border-0 font-sans shadow-lg">
                  <div className="min-w-[210px] p-1">
                    <div className={`mb-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}>
                      {status.icon}
                      {status.label}
                    </div>
                    <h3 className="text-sm font-black text-slate-800">{getOrderCode(order)}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{getPackageName(order)}</p>
                    <p className="mt-2 text-xs text-slate-500">{getCustomerName(order)}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {isInDelivery(order.status) && hasCourierCoordinate(order)
                        ? "Marker menunjukkan posisi kurir terbaru"
                        : getAddressText(order)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      <div className="pointer-events-auto absolute left-4 right-4 top-4 z-10 flex max-h-[calc(100%-8.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-white bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:left-6 sm:right-auto sm:top-6 sm:w-[380px]">
        <div className="border-b border-slate-100/70 p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Live Tracking</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {loading ? "Memuat data database..." : `${mappedOrders.length} lokasi tampil di peta`}
              </p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-700">
              <Truck size={22} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-lg font-black text-slate-900">{orders.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-lg font-black text-blue-700">{inTransitCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Dikirim</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-lg font-black text-amber-700">{withoutCoordinateCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Tanpa GPS</p>
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
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${status.marker}`}>
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
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {filteredOrders.length === 0 && !loading && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center text-sm font-semibold text-slate-500">
              Tidak ada pesanan ditemukan.
            </div>
          )}

          {filteredOrders.map((order) => {
            const status = getStatusMeta(order.status);
            const hasCoordinate = hasDatabaseCoordinate(order);

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 transition-all ${
                  hasCoordinate
                    ? "border-slate-100 bg-white shadow-sm hover:border-blue-100 hover:shadow-md"
                    : "border-amber-100 bg-amber-50/60"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}>
                    {status.icon}
                    {status.label}
                  </span>
                  <span className="text-xs font-black text-slate-400">{getOrderCode(order)}</span>
                </div>

                <h3 className="text-base font-black leading-tight text-slate-900">{getPackageName(order)}</h3>

                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <UserRound size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="font-semibold">{getCustomerName(order)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="leading-relaxed">{getAddressText(order)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>{order.courier?.name || "Kurir belum ditugaskan"}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                  {hasCoordinate
                    ? isInDelivery(order.status) && hasCourierCoordinate(order)
                      ? `Kurir: ${Number(order.courier_location.lat).toFixed(5)}, ${Number(order.courier_location.lng).toFixed(5)}`
                      : `Tujuan: ${Number(order.lat).toFixed(5)}, ${Number(order.lng).toFixed(5)}`
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
