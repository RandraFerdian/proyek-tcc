import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
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
  ShoppingCart,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ChatWindow from "../components/ChatWindow";
import api from "../services/api";
import { KITCHEN_LOCATION } from "../constants/locations";
import { PACKAGE_TYPES, getPackageType } from "../constants/packageTypes";

const createStatusMarker = (status) => {
  let colorClass, glowClass, iconSvg;
  const currentStatus = status?.toLowerCase() || "pending";

  if (currentStatus === "selesai") {
    colorClass = "bg-teal-500";
    glowClass = "bg-teal-500/20";
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  } else if (currentStatus === "dikirim") {
    colorClass = "bg-emerald-500";
    glowClass = "bg-emerald-500/20";
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


const kitchenIcon = L.divIcon({
  className: "custom-icon",
  html: `<div class="bg-amber-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white text-white text-lg">🍳</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const destinationIcon = L.divIcon({
  className: "custom-icon",
  html: `<div class="bg-rose-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white text-white text-lg">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const courierIcon = L.divIcon({
  className: "custom-icon",
  html: `<div class="relative flex items-center justify-center">
        <div class="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-ping"></div>
        <div class="bg-emerald-500 w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-[2.5px] border-white relative z-10 text-white text-lg">🛵</div>
      </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -15],
});

const CustomerHome = () => {
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Semua");
  const [cart, setCart] = useState([]);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [routes, setRoutes] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [activeChatCode, setActiveChatCode] = useState(null);
  const navigate = useNavigate();

  const addToCart = (pkg, e) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(item => item.id === pkg.id);
      if (existing) {
        return prev.map(item => item.id === pkg.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...pkg, quantity: 1 }];
    });
  };

  const updateQuantity = (id, amount) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + amount) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const userName = localStorage.getItem("user_name") || "Pelanggan";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const packageRes = await api.get("/packages/");
        setPackages(packageRes.data || []);
      } catch (err) {
        console.error("Gagal mengambil data paket:", err);
      }
    };
    
    const fetchOrders = async () => {
      try {
        const orderRes = await api.get("/orders/me");
        setOrders(orderRes.data || []);
      } catch (err) {
        console.error("Gagal mengambil data pesanan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchOrders();

    const interval = setInterval(fetchOrders, 5000); // Poll every 5s for map & chat updates
    return () => clearInterval(interval);
  }, []);

  const activeTransactions = (orders || []).reduce((acc, order) => {
    const status = (order.status || "").toLowerCase();
    const isPending = ["pending"].includes(status);
    const isDelivering = ["dikirim", "in transit"].includes(status);
    if (isPending || isDelivering) {
      if (!acc.find((x) => x.order_code === order.order_code)) {
        acc.push(order);
      }
    }
    return acc;
  }, []);

  useEffect(() => {
    activeTransactions.forEach(async (tx) => {
      const code = tx.order_code;
      if (routes[code]) return;
      
      const destLat = parseFloat(tx.lat);
      const destLng = parseFloat(tx.lng);
      const kitchenLat = KITCHEN_LOCATION.lat;
      const kitchenLng = KITCHEN_LOCATION.lng;
      
      if (isNaN(destLat) || isNaN(destLng)) return;

      try {
        let coordsString = "";
        const isDelivering = ["dikirim", "in transit"].includes((tx.status || "").toLowerCase());
        const courierLat = tx.courier_location?.lat ? parseFloat(tx.courier_location.lat) : null;
        const courierLng = tx.courier_location?.lng ? parseFloat(tx.courier_location.lng) : null;

        if (isDelivering && courierLat && courierLng) {
            coordsString = `${courierLng},${courierLat};${destLng},${destLat}`;
        } else {
            coordsString = `${kitchenLng},${kitchenLat};${destLng},${destLat}`;
        }

        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRoutes(prev => ({ ...prev, [code]: coords }));
        }
      } catch (err) {
        console.error("OSRM fetch error:", err);
      }
    });
  }, [orders]); // re-fetch when orders updates

  const handleLogout = () => {
    localStorage.clear();
    navigate("/customer/login");
  };

  // PERBAIKAN: Pelindung tambahan pada packages array
  const filteredPackages = (packages || []).filter((pkg) => {
    const packageName = pkg.package_name || pkg.name || "";
    const typeMatches = selectedType === "Semua" || getPackageType(pkg) === selectedType;
    return typeMatches && packageName.toLowerCase().includes(searchQuery.toLowerCase());
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
          
          {/* Render markers for active orders grouped by order_code */}
          {activeTransactions.map((tx) => {
              const status = (tx.status || "").toLowerCase();
              const isDelivering = ["dikirim", "in transit"].includes(status);
              
              const destLat = parseFloat(tx.lat);
              const destLng = parseFloat(tx.lng);
              if (isNaN(destLat) || isNaN(destLng)) return null;

              const kitchenLat = KITCHEN_LOCATION.lat;
              const kitchenLng = KITCHEN_LOCATION.lng;

              const courierLat = tx.courier_location?.lat ? parseFloat(tx.courier_location.lat) : null;
              const courierLng = tx.courier_location?.lng ? parseFloat(tx.courier_location.lng) : null;

              const routeCoords = routes[tx.order_code];

              return (
                <React.Fragment key={tx.order_code}>
                  {/* Titik Dapur */}
                  <Marker position={[kitchenLat, kitchenLng]} icon={kitchenIcon}>
                    <Popup className="clean-popup">
                      <div className="p-1 text-center font-bold text-slate-700">Dapur Catering</div>
                    </Popup>
                  </Marker>

                  {/* Titik Diantar (Destinasi) */}
                  <Marker position={[destLat, destLng]} icon={destinationIcon}>
                    <Popup className="clean-popup">
                      <div className="p-1 text-center font-bold text-slate-700">Tujuan Pengiriman</div>
                    </Popup>
                  </Marker>

                  {/* Logika Tampilan Berdasarkan Status */}
                  {isDelivering && courierLat && courierLng ? (
                    <>
                      <Marker position={[courierLat, courierLng]} icon={courierIcon}>
                        <Popup className="clean-popup">
                          <div className="p-1 text-center font-bold text-emerald-700">Kurir Sedang Mengantar</div>
                        </Popup>
                      </Marker>
                      <Polyline 
                        positions={routeCoords || [ [courierLat, courierLng], [destLat, destLng] ]} 
                        color="#10b981" 
                        weight={4} 
                      />
                    </>
                  ) : (
                    <>
                      <Polyline 
                        positions={routeCoords || [ [kitchenLat, kitchenLng], [destLat, destLng] ]} 
                        color="#94a3b8" 
                        weight={4} 
                        dashArray="5, 10"
                      />
                    </>
                  )}
                </React.Fragment>
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
              className="px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full text-[13px] font-bold transition-colors flex items-center gap-2"
            >
              Pesanan
              {/* PERBAIKAN: Pelindung untuk cek length */}
              {orders?.length > 0 && (
                <span className="bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
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
            <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-2 pt-2">
              {["Semua", ...PACKAGE_TYPES].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-all ${
                    selectedType === type
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
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
                      className="group bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-emerald-100 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold tracking-wide">
                            {getPackageType(pkg)}
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
                        <h4 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                          {pkg.package_name || pkg.name}
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
                        <button onClick={(e) => addToCart(pkg, e)} className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95">
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

            {/* --- FLOATING CHAT BUTTON --- */}
      {(() => {
        const deliveringTx = activeTransactions.find(tx => ["dikirim", "in transit"].includes((tx.status || "").toLowerCase()));
        if (deliveringTx && !showChat) {
          return (
            <div className="fixed bottom-[180px] right-6 z-[1010] animate-bounce">
              <button
                onClick={() => {
                  setActiveChatCode(deliveringTx.order_code);
                  setShowChat(true);
                }}
                className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all"
              >
                <MessageCircle size={24} />
              </button>
            </div>
          );
        }
        return null;
      })()}

      {showChat && activeChatCode && (
        <ChatWindow 
          orderCode={activeChatCode} 
          role="customer" 
          userName={"Pelanggan"} 
          onClose={() => setShowChat(false)} 
        />
      )}

      {/* --- FLOATING CART BAR --- */}
      {cart.length > 0 && (
        <div className="fixed bottom-[110px] inset-x-0 z-[1010] px-6 pointer-events-none transition-all duration-300 animate-in slide-in-from-bottom-10">
          <div className="max-w-2xl mx-auto flex justify-center">
            <button 
              onClick={() => setShowCartPopup(true)} 
              className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(5,150,105,0.4)] flex items-center gap-4 transition-all active:scale-95"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} />
                <span className="font-bold text-sm">{totalItems} Item</span>
              </div>
              <span className="w-px h-5 bg-emerald-500/50"></span>
              <span className="font-bold text-sm">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- CART POPUP MODAL --- */}
      {showCartPopup && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 sm:items-center animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">Keranjang Anda</h3>
                  <p className="text-xs font-semibold text-slate-500">{totalItems} menu terpilih</p>
                </div>
              </div>
              <button
                onClick={() => setShowCartPopup(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex justify-between items-center">
                      <div className="flex-1 pr-4">
                        <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-wide inline-block mb-1">
                          {getPackageType(item)}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.package_name || item.name}</h4>
                        <span className="font-bold text-emerald-600 text-xs mt-0.5 block">
                          Rp {item.price?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      
                      <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full text-slate-600 shadow-sm transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 rounded-full text-emerald-600 shadow-sm transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm font-bold text-slate-500">Total Pembayaran</span>
                <span className="font-black text-emerald-600 text-xl">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setShowCartPopup(false);
                  navigate("/order-food", {
                    state: { initialCart: cart },
                  });
                }}
                className="w-full py-4 px-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
              >
                Checkout Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

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
