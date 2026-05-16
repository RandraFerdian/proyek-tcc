import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Clock,
  CreditCard,
  ChevronLeft,
  ShoppingBag,
  Plus,
  Minus,
  StickyNote,
  Navigation,
  Building,
  Locate,
  Utensils,
} from "lucide-react";
import api from "../services/api";

const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
};

const LocationPicker = ({ lat, lng, onPick }) => {
  useMapEvents({
    click: (e) => {
      const { lat: nextLat, lng: nextLng } = e.latlng;
      onPick(nextLat, nextLng);
    },
  });
  return <Marker position={[lat, lng]} icon={pinIcon} />;
};

const OrderFood = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPackageId = location.state?.packageId;

  // --- STATE DATA ---
  const [allPackages, setAllPackages] = useState([]); // Menyimpan semua pilihan menu katering
  const [cart, setCart] = useState([]); // Menyimpan daftar menu katering yang dibeli
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State Form Alamat, Pengiriman & Pembayaran
  const [formData, setFormData] = useState({
    address_label: "Rumah",
    street: "",
    city: "",
    lat: -7.7971,
    lng: 110.3705,
    scheduled_time: "",
    payment_method: "cash",
    notes: "",
  });

  // --- AMBIL DATA SEMUA MENU DARI API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/packages/");
        setAllPackages(res.data);

        // Jika user masuk membawa satu menu utama dari halaman home
        if (initialPackageId) {
          const primaryItem = res.data.find(
            (item) => item.id === initialPackageId,
          );
          if (primaryItem) {
            setCart([{ ...primaryItem, quantity: 1 }]);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil daftar paket katering:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialPackageId]);

  // --- MANAJEMEN KERANJANG (CART OPERATIONS) ---
  const handleAddMenuToCart = (menu) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === menu.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prevCart, { ...menu, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + amount;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  // Hitung akumulasi total harga belanjaan
  const calculateTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // --- GEOLOCATION & GEOPICKER LOGIC ---
  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        lat,
        lng,
        street: data.display_name || "",
        city:
          data.address.city || data.address.town || data.address.county || "",
      }));
    } catch (err) {
      console.error("Geocoding gagal:", err);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Fitur geolokasi tidak didukung oleh browser Anda.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchAddressFromCoords(latitude, longitude);
      },
      () => {
        alert("Gagal mendapatkan lokasi saat ini. Pastikan izin GPS aktif.");
      },
    );
  };

  const generateOrderCode = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `STCH-${date}-${random}`;
  };

  // --- PROSES KIRIM PESANAN GABUNGAN KE BACKEND ---
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert(
        "Keranjang belanja Anda masih kosong. Silakan pilih menu terlebih dahulu.",
      );
      return;
    }
    setSubmitting(true);

    try {
      const customerId = localStorage.getItem("user_id");
      const orderCode = generateOrderCode();
      const finalTotalPrice = calculateTotalPrice();

      // 1. Simpan data alamat pengiriman baru
      const addrRes = await api.post("/addresses/", {
        customer_id: customerId,
        label: formData.address_label,
        street: formData.street,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
      });

      // 2. Kirim data induk order, list menu item, dan informasi pemenuhan data payment
      await api.post("/orders/", {
        order_code: orderCode,
        customer_id: customerId,
        address_id: addrRes.data.id,
        total_price: finalTotalPrice,
        scheduled_time: formData.scheduled_time,
        status: "pending",
        notes: formData.notes,
        // List menu makanan yang dibeli dikirim sebagai array objek untuk kebutuhan order detail looping di backend
        order_items: cart.map((item) => ({
          package_id: item.id,
          quantity: item.quantity,
          price_at_order: item.price,
        })),
        // Payload pemenuhan parameter pembuatan record pada tabel `payments`
        payment_data: {
          amount: finalTotalPrice,
          method: formData.payment_method,
          status: formData.payment_method === "cash" ? "pending" : "unpaid",
        },
      });

      alert("Seluruh Pesanan dan Alur Pembayaran Berhasil Diproses!");
      navigate("/orders");
    } catch (err) {
      console.error("Gagal mengirim pesanan:", err);
      alert("Terjadi kesalahan. Pastikan semua field terisi dengan benar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-['Plus_Jakarta_Sans']">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-['Plus_Jakarta_Sans'] pb-36">
      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md z-[1000] border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h1 className="font-bold text-lg text-slate-900">
            Konfirmasi & Tambah Menu
          </h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto pt-24 px-6 space-y-6">
        {/* --- DAFTAR MENU YANG AKAN DIBELI (KERANJANG) --- */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
            <ShoppingBag size={18} className="text-blue-600" /> Menu Yang
            Dipilih
          </h3>

          {cart.length === 0 ? (
            <p className="text-slate-400 text-xs font-medium py-2 text-center">
              Belum ada menu yang dipilih. Tambahkan menu di bawah.
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-slate-50">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between pt-3 first:pt-0"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {item.package_name}
                    </h4>
                    <p className="text-blue-600 font-bold text-xs mt-0.5">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* Pengatur Kuantitas Menu */}
                  <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-600"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- FITUR BARU: PILIHAN TAMBAHAN MENU KATERING LAINNYA --- */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
            <Utensils size={18} className="text-blue-600" /> Tambah Pilihan Menu
            Lainnya
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
            {allPackages.map((menu) => (
              <div
                key={menu.id}
                className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-slate-50 transition-colors"
              >
                <div className="truncate pr-2">
                  <h4 className="font-bold text-slate-800 text-xs truncate">
                    {menu.package_name}
                  </h4>
                  <p className="text-slate-500 font-semibold text-[11px] mt-0.5">
                    Rp {menu.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddMenuToCart(menu)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm active:scale-95"
                >
                  Tambah
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* --- MAPS PICKER --- */}
        <section className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 relative">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation size={20} className="text-blue-600" />
              <h3 className="font-bold text-slate-800">
                Tentukan Titik Pengiriman
              </h3>
            </div>
            <button
              type="button"
              onClick={handleLocateMe}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Locate size={14} /> Lokasi Saya
            </button>
          </div>
          <div className="h-[220px] relative z-0">
            <MapContainer
              center={[formData.lat, formData.lng]}
              zoom={14}
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <LocationPicker
                lat={formData.lat}
                lng={formData.lng}
                onPick={fetchAddressFromCoords}
              />
              <RecenterMap lat={formData.lat} lng={formData.lng} />
            </MapContainer>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Label Alamat
                </label>
                <input
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="Contoh: Rumah, Kantor"
                  value={formData.address_label}
                  onChange={(e) =>
                    setFormData({ ...formData, address_label: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Kota
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    readOnly
                    className="w-full mt-1.5 pl-10 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-semibold text-slate-500 outline-none"
                    value={formData.city}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Alamat Lengkap (Otomatis dari Peta)
              </label>
              <textarea
                readOnly
                className="w-full mt-1.5 px-4 py-3 bg-slate-100 border-none rounded-2xl text-sm font-medium text-slate-500 outline-none resize-none"
                rows="2"
                value={formData.street}
              />
            </div>
          </div>
        </section>

        {/* Waktu & Detail Metode Pembayaran */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Clock size={14} /> Waktu Pengiriman
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_time: e.target.value })
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <CreditCard size={14} /> Metode Pembayaran
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none cursor-pointer"
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
              >
                <option value="cash">Cash on Delivery (COD)</option>
                <option value="transfer">Bank Transfer</option>
                <option value="ewallet">E-Wallet (OVO/Dana)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <StickyNote size={14} /> Catatan Pesanan
            </label>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
              rows="3"
              placeholder="Contoh: Tolong pisahkan kuah, tambah sendok..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </section>
      </div>

      {/* Bottom Floating Billing Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-[1000] px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Pembayaran
            </p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              Rp {calculateTotalPrice().toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={handleOrderSubmit}
            disabled={
              submitting ||
              cart.length === 0 ||
              !formData.scheduled_time ||
              !formData.street
            }
            className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-900/10 hover:bg-blue-600 hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? "Memproses..." : "Pesan Sekarang"}
          </button>
        </div>
      </div>

      <style>{`
        .leaflet-container { border-bottom: 1px solid #f1f5f9; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.4); }
      `}</style>
    </div>
  );
};

export default OrderFood;
