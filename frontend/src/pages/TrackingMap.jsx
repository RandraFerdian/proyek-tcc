import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Package,
  MapPin,
  Navigation,
  CheckCircle2,
  Search,
  Clock,
  LogOut,
} from "lucide-react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";


// Create custom icon using Lucide icon
const createCustomIcon = (status) => {
  const isTransit = status === "In Transit";
  const bgColor = isTransit ? "bg-blue-600" : "bg-emerald-600";
  const pingEffect = isTransit ? (
    <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
  ) : null;

  const iconMarkup = renderToStaticMarkup(
    <div className="relative group cursor-pointer">
      {pingEffect}
      <div className={`${bgColor} p-2.5 rounded-full shadow-lg border-[3px] border-white relative z-10 transition-transform group-hover:scale-110 flex items-center justify-center`}>
        {isTransit ? (
          <Navigation size={18} className="text-white fill-current" strokeWidth={2.5} />
        ) : (
          <Package size={20} className="text-white" strokeWidth={2.5} />
        )}
      </div>
    </div>
  );

  return divIcon({
    html: iconMarkup,
    className: "custom-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const TrackingMap = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const basePosition = [-7.7971, 110.3695]; // Yogyakarta

  const role = localStorage.getItem("user_role");

  useEffect(() => {
    fetchOrders();
    // Simulate real-time polling every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const customerId = localStorage.getItem("user_id");
      
      let url = "/orders/";
      if (role === "user" && customerId) {
        url += `?customer_id=${customerId}`;
      }
      
      const response = await api.get(url);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  const filteredOrders = orders.filter((order) => 
    order.id.toString().includes(searchTerm) || 
    (order.package && order.package.package_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inTransitCount = orders.filter((o) => o.status === "In Transit").length;

  return (
    <div className="relative w-full h-full bg-slate-100">
      {/* Logout Button Floating - Only for Customer role who might not have sidebar visible */}
      {role === "user" && (
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 z-50 p-4 bg-white/80 backdrop-blur-xl border border-white rounded-2xl shadow-xl text-rose-500 hover:bg-rose-50 transition-all flex items-center gap-2 font-bold group"
        >
          <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      )}

      {/* LEAFLET MAP CONTAINER - TEMA LIGHT CLEAN */}
      <MapContainer
        center={basePosition}
        zoom={13}
        zoomControl={false}
        className="w-full h-full z-0"
      >

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <ZoomControl position="bottomright" />

        {/* Render markers for orders */}
        {orders.map((order, index) => {
          if (order.status === "Pending" || order.status === "Packed") return null;
          
          // Generate deterministic pseudo-random offset based on ID to spread markers out a bit
          const offsetLat = (order.id * 0.005) % 0.02 - 0.01;
          const offsetLng = (order.id * 0.008) % 0.02 - 0.01;
          const markerPos = [basePosition[0] + offsetLat, basePosition[1] + offsetLng];

          return (
            <Marker key={`marker-${order.id}`} position={markerPos} icon={createCustomIcon(order.status)}>
              <Popup className="rounded-xl font-sans border-0 shadow-lg">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-800 text-sm">Pesanan #{order.id}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.package ? order.package.package_name : "Paket Standar"}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 mt-2 uppercase">{order.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* FLOATING LIGHT GLASSMORPHISM PANEL */}
      <div className="absolute top-6 left-6 w-[360px] bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col max-h-[calc(100%-3rem)] z-10 overflow-hidden pointer-events-auto">
        {/* Header Panel */}
        <div className="p-6 pb-4 border-b border-slate-100/50">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Live Tracking
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {loading ? "Memuat..." : `${inTransitCount} pesanan sedang dalam perjalanan`}
          </p>

          <div className="mt-5 relative">
            <input
              type="text"
              placeholder="Cari ID atau Paket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700 shadow-sm"
            />
            <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          </div>
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredOrders.length === 0 && !loading && (
            <div className="text-center p-4 text-sm text-slate-500">
              Tidak ada pesanan ditemukan.
            </div>
          )}
          
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                ["In Transit", "dikirim"].includes(order.status) 
                  ? "bg-white border-slate-100 shadow-sm hover:shadow-md" 
                  : "bg-white/60 border-slate-100 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                {["In Transit", "dikirim"].includes(order.status) ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md flex items-center gap-1.5">
                    <Navigation size={12} className="fill-current" /> {order.status}
                  </span>
                ) : ["Delivered", "selesai"].includes(order.status) ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> {order.status}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md flex items-center gap-1.5">
                    <Clock size={12} /> {order.status}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-bold">#ORD-{order.id.toString().padStart(3, '0')}</span>
              </div>
              
              <h3 className={`font-bold text-lg leading-tight transition-colors ${
                ["In Transit", "dikirim"].includes(order.status) ? "text-slate-800 group-hover:text-blue-600" : "text-slate-700"
              }`}>
                {order.package ? order.package.package_name : `Paket #${order.package_id}`}
              </h3>

              {["In Transit", "dikirim"].includes(order.status) && (
                <div className="mt-4 space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="mt-0.5">
                      <MapPin size={16} className="text-blue-500" />
                    </div>
                    <span className="leading-relaxed font-medium">
                      Menuju Lokasi Pelanggan #{order.customer_id}
                    </span>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
