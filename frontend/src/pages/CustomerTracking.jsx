import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Clock, MapPin, Navigation, Phone } from "lucide-react";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";

const defaultPosition = [KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng];

const createCourierIcon = () =>
  L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex h-12 w-12 items-center justify-center -ml-2 -mt-2">
        <div class="absolute inset-1 rounded-full bg-blue-500/40 animate-ping"></div>
        <div class="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-white bg-blue-600 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-45">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const createDestinationIcon = () =>
  L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex h-11 w-11 items-center justify-center -ml-2 -mt-2">
        <div class="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-white bg-emerald-600 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const createKitchenIcon = () =>
  L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative flex h-11 w-11 items-center justify-center -ml-2 -mt-2">
        <div class="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-white bg-slate-900 shadow-xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 22h18"></path>
            <path d="M6 22V8l6-4 6 4v14"></path>
            <path d="M10 22v-6h4v6"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const CustomerTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // STATE BARU: Untuk menyimpan titik rute jalan raya OSRM
  const [routePath, setRoutePath] = useState([]);

  const fetchOrder = useCallback(async () => {
    try {
      setError("");
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (err) {
      console.error("Gagal mengambil tracking order:", err);
      setError(err.response?.data?.detail || "Gagal mengambil data tracking.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
    const interval = setInterval(fetchOrder, 7000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const courierLoc = order?.courier_location;
  const destination =
    order?.lat && order?.lng
      ? { lat: Number(order.lat), lng: Number(order.lng) }
      : null;
  const isDelivering = ["dikirim", "in transit"].includes(
    (order?.status || "").toLowerCase(),
  );
  const courierPosition =
    courierLoc?.lat && courierLoc?.lng
      ? {
          lat: Number(courierLoc.lat),
          lng: Number(courierLoc.lng),
          fromGps: true,
        }
      : isDelivering
        ? {
            lat: KITCHEN_LOCATION.lat,
            lng: KITCHEN_LOCATION.lng,
            fromGps: false,
          }
      : null;
  const routeStart = courierPosition || {
    lat: KITCHEN_LOCATION.lat,
    lng: KITCHEN_LOCATION.lng,
  };
  const routeEnd = destination;
  const routeStartLat = routeStart.lat;
  const routeStartLng = routeStart.lng;
  const routeEndLat = routeEnd?.lat;
  const routeEndLng = routeEnd?.lng;

  // FITUR BARU: OSRM Route Fetcher
  useEffect(() => {
    if (routeEndLat && routeEndLng) {
      const fetchRealRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${routeStartLng},${routeStartLat};${routeEndLng},${routeEndLat}?overview=full&geometries=geojson`,
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            // OSRM return [Lng, Lat], Leaflet butuh [Lat, Lng]
            const coords = data.routes[0].geometry.coordinates.map((c) => [
              c[1],
              c[0],
            ]);
            setRoutePath(coords);
          } else {
            setRoutePath([
              [routeStartLat, routeStartLng],
              [routeEndLat, routeEndLng],
            ]); // Fallback garis lurus
          }
        } catch (err) {
          console.error("Gagal mengambil rute OSRM:", err);
          setRoutePath([
            [routeStartLat, routeStartLng],
            [routeEndLat, routeEndLng],
          ]); // Fallback garis lurus
        }
      };
      fetchRealRoute();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoutePath([]);
    }
  }, [routeStartLat, routeStartLng, routeEndLat, routeEndLng]);

  const mapCenter = courierPosition
    ? [courierPosition.lat, courierPosition.lng]
    : destination
      ? [destination.lat, destination.lng]
      : defaultPosition;

  return (
    <div className="relative h-screen w-full bg-slate-100">
      <button
        onClick={() => navigate(-1)}
        className="absolute left-6 top-6 z-[1000] rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-800 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white"
      >
        <ArrowLeft size={20} />
      </button>

      <MapContainer
        center={mapCenter}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />

        <Marker
          position={[KITCHEN_LOCATION.lat, KITCHEN_LOCATION.lng]}
          icon={createKitchenIcon()}
        >
          <Popup>{KITCHEN_LOCATION.name}</Popup>
        </Marker>

        {/* MENGGUNAKAN ROUTE PATH DARI OSRM */}
        {routePath.length >= 2 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.8,
              dashArray: courierPosition?.fromGps ? undefined : "10 12",
            }}
            className="animate-pulse" // Animasi denyut opsional
          />
        )}

        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={createDestinationIcon()}
          >
            <Popup>Lokasi tujuan pengiriman</Popup>
          </Marker>
        )}

        {courierPosition && (
          <Marker
            position={[courierPosition.lat, courierPosition.lng]}
            icon={createCourierIcon()}
          >
            <Popup>
              {courierPosition.fromGps
                ? order?.courier?.name || "Kurir Stich"
                : "Kurir mulai dari dapur"}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bagian Bawah Tetap Sama... */}
      <div className="absolute bottom-8 left-1/2 z-[1000] w-[90%] max-w-md -translate-x-1/2">
        <div className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-blue-50 font-black text-blue-600 shadow-sm">
              {order?.courier?.name?.charAt(0) || "K"}
            </div>
            <div className="flex-1">
              <p className="mb-0.5 text-[10px] font-black uppercase tracking-widest text-blue-600">
                {loading
                  ? "Memuat Tracking"
                  : order?.status === "selesai"
                    ? "Pesanan Selesai"
                    : "Kurir Pengantar"}
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {order?.courier?.name || "Menunggu kurir ditugaskan"}
              </h2>
              {error && (
                <p className="mt-1 text-xs font-semibold text-rose-600">
                  {error}
                </p>
              )}
            </div>
            <button className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600 active:scale-90">
              <Phone size={20} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <Navigation size={16} className="text-blue-500" />
              <span>
                Status:{" "}
                <span className="font-bold capitalize text-slate-900">
                  {order?.status || "pending"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <MapPin size={16} className="text-emerald-500" />
              <span className="line-clamp-2">
                {order?.address?.street ||
                  order?.street ||
                  "Alamat tujuan belum tersedia"}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <Clock size={16} className="text-blue-500" />
              <span>
                Lokasi update:{" "}
                <span className="font-bold text-slate-900">
                  {courierLoc?.updated_at
                    ? "baru saja"
                    : isDelivering
                      ? `mulai dari ${KITCHEN_LOCATION.shortName}`
                      : "belum tersedia"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <MapPin size={16} className="text-slate-700" />
              <span>
                Titik awal:{" "}
                <span className="font-bold text-slate-900">
                  {KITCHEN_LOCATION.shortName}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
