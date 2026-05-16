import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  ChevronRight,
  Star,
  LogOut,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";

const createStatusMarker = (status) => {
  let colorClass, glowClass, iconSvg;
  const currentStatus = status?.toLowerCase() || "pending";

  if (currentStatus === "selesai") {
    colorClass = "bg-teal-500";
    glowClass = "bg-teal-500/20";
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  } else if (currentStatus === "dikirim") {
    colorClass = "bg-blue-500";
    glowClass = "bg-blue-500/20";
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="rotate-45 -ml-0.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
  } else {
    colorClass = "bg-slate-800";
    glowClass = "bg-slate-800/20";
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }

  return L.divIcon({
    className: "custom-icon",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 ${glowClass} rounded-full animate-ping"></div>
        <div class="${colorClass} p-2 rounded-full shadow-sm border-[2.5px] border-white relative z-10 transition-transform">
          ${iconSvg}
        </div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -15],
  });
};

const CustomerHome = () => {
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const userName = localStorage.getItem("user_name") || "Pelanggan";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const packageRes = await api.get("/packages/");
        // PERBAIKAN: Memastikan data selalu berbentuk array, meski API return null
        setPackages(packageRes.data || []);

        const orderRes = await api.get("/orders/me");
        // PERBAIKAN: Memastikan data selalu berbentuk array
        setOrders(orderRes.data || []);
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        // Fallback aman jika terjadi error (seperti koneksi terputus)
        setPackages([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/customer/login");
  };

  // PERBAIKAN: Pelindung tambahan pada packages array
  const filteredPackages = (packages || []).filter((pkg) => {
    const packageName = pkg.name || "";
    return packageName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-screen w-full relative bg-[#f4f5f7] overflow-hidden antialiased">
      {/* --- BACKGROUND MAP --- */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[-7.7971, 110.3705]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

          {/* PERBAIKAN: Gunakan tanda tanya (?) sebelum map agar tidak error jika orders null */}
          {orders?.map((order) => {
            const isDelivering = ["dikirim", "in transit"].includes((order.status || "").toLowerCase());
            const markerLat = isDelivering && order.courier_location?.lat
              ? order.courier_location.lat
              : isDelivering
                ? KITCHEN_LOCATION.lat
                : order.lat;
            const markerLng = isDelivering && order.courier_location?.lng
              ? order.courier_location.lng
              : isDelivering
                ? KITCHEN_LOCATION.lng
                : order.lng;
            if (!markerLat || !markerLng) return null;
            return (
              <Marker
                key={order.id}
                position={[parseFloat(markerLat), parseFloat(markerLng)]}
                icon={createStatusMarker(order.status)}
              >
                <Popup className="clean-popup">
                  <div className="p-1.5 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      ID: {order.order_code || order.id}
                    </p>
                    <p className="font-bold text-slate-800 text-sm leading-tight mb-2 px-2">
                      {order.package?.package_name || order.package?.name || "Paket Katering"}
                    </p>
                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 capitalize">
                      {order.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* --- MODERN FLOATING NAVBAR --- */}
      <nav className="fixed top-6 left-0 right-0 z-[1010] px-4 md:px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto bg-white/90 backdrop-blur-md px-3 py-3 md:px-4 md:py-3 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 ml-1">
            <LayoutGrid size={18} />
          </div>

          <div className="flex-1 px-4 relative group">
            <Search
              size={18}
              className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Cari menu katering..."
              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-slate-100 border-none outline-none rounded-full py-2.5 pl-10 pr-4 text-[13px] font-medium text-slate-800 transition-colors placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/orders")}
              className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2"
            >
              Pesanan
              {/* PERBAIKAN: Pelindung untuk cek length */}
              {orders?.length > 0 && (
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                  {orders.length}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 pl-2">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- COLLAPSIBLE BOTTOM DRAWER --- */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[1005] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform ${
          isMenuOpen ? "h-[85vh]" : "h-[90px]"
        }`}
      >
        <div className="h-full bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-full pt-5 pb-5 px-8 flex flex-col items-center cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mb-5"></div>
            <div className="w-full flex justify-between items-center max-w-5xl mx-auto">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                Katalog Menu
                {!isMenuOpen && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
                    Ketuk untuk Buka
                  </span>
                )}
              </h3>
              <div className="text-slate-400">
                {isMenuOpen ? (
                  <ChevronDown size={24} />
                ) : (
                  <ChevronUp size={24} />
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex-1 overflow-y-auto px-6 md:px-8 pb-12 transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          >
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-slate-100 rounded-[2rem] animate-pulse"
                    />
                  ))
                : filteredPackages?.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() =>
                        navigate("/order-food", {
                          state: { packageId: pkg.id },
                        })
                      }
                      className="group bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold tracking-wide">
                            Populer
                          </div>
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="text-amber-400 fill-amber-400"
                            />
                            <span className="text-[12px] font-bold text-slate-700">
                              4.8
                            </span>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                          {pkg.name}
                        </h4>
                        <p className="text-slate-500 text-[13px] font-medium line-clamp-2 leading-relaxed">
                          {pkg.description ||
                            "Hidangan organik pilihan dengan bahan berkualitas tinggi."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-50">
                        <span className="font-bold text-slate-800 text-lg">
                          Rp {pkg.price?.toLocaleString("id-ID")}
                        </span>
                        <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight size={18} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .clean-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 0.25rem;
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .clean-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  );
};

export default CustomerHome;
