import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Truck /* <-- Ini yang sebelumnya terlewat */,
  Landmark,
  Wallet,
  Banknote,
  ShieldCheck,
  Star,
  LocateFixed,
  Plus,
  Minus,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

// Pointer (Pin) Peta Normal & Elegan
const pinIcon = L.divIcon({
  className: "custom-pin",
  html: `
    <div class="relative flex items-center justify-center -mt-6">
      <div class="w-10 h-10 bg-blue-600 rounded-full shadow-lg border-[3px] border-white flex items-center justify-center z-10 relative">
        <div class="w-3 h-3 bg-white rounded-full"></div>
      </div>
      <div class="absolute -bottom-1.5 w-4 h-4 bg-slate-900/30 rounded-full blur-[3px]"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const MapController = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { animate: true, duration: 1.5 });
  }, [pos, map]);
  return null;
};

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const OrderFood = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [mapPos, setMapPos] = useState([-7.7971, 110.3705]);
  const [isLocating, setIsLocating] = useState(false);
  const debounceTimeout = useRef(null);

  const [formData, setFormData] = useState({
    package_id: "",
    quantity: 1,
    address: "",
    payment_method: "transfer_bank",
    notes: "",
  });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get("/packages/");
        setPackages(res.data);
        if (location.state?.packageId) {
          setFormData((prev) => ({
            ...prev,
            package_id: location.state.packageId,
          }));
        } else if (res.data.length > 0) {
          setFormData((prev) => ({ ...prev, package_id: res.data[0].id }));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPackages();
  }, [location.state]);

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapPos([lat, lng]);
          fetchAddressFromCoords(lat, lng);
        },
        (error) => {
          alert("Gagal mendapatkan lokasi GPS.");
          setIsLocating(false);
        },
      );
    }
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    setIsLocating(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      if (data && data.display_name)
        setFormData((prev) => ({ ...prev, address: data.display_name }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapClick = (latlng) => {
    setMapPos([latlng.lat, latlng.lng]);
    fetchAddressFromCoords(latlng.lat, latlng.lng);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Fungsi khusus untuk menambah/mengurangi quantity
  const updateQuantity = (amount) => {
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + amount),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const customerId = localStorage.getItem("user_id");
    try {
      // Format payload diubah agar serasi dengan backend baru
      await api.post("/orders/", {
        customer_id: parseInt(customerId),
        package_id: parseInt(formData.package_id),
        quantity: formData.quantity,
        status: "pending",
        payment_method: formData.payment_method,
        notes: formData.notes,
        street: formData.address, // Mengirim teks alamat
        lat: mapPos[0], // Mengirim koordinat Latitude dari peta
        lng: mapPos[1], // Mengirim koordinat Longitude dari peta
      });
      navigate("/orders");
    } catch (error) {
      alert("Gagal memproses pesanan.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPackage = packages.find(
    (p) => p.id === parseInt(formData.package_id),
  );
  const subtotal = selectedPackage
    ? selectedPackage.price * formData.quantity
    : 0;

  // Ongkir dihapus (set ke 0)
  const deliveryFee = 0;
  const totalAmount = subtotal + deliveryFee;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#f8fafc] flex flex-col font-sans selection:bg-blue-100 text-slate-700 pb-10 scroll-smooth">
      {/* HEADER */}
      <nav className="sticky top-0 z-[1000] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="p-2.5 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
              Konfirmasi Checkout
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Stich Logistics
            </p>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section Alamat & Peta */}
          <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Lokasi Pengiriman
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    Tentukan titik presisi pengantaran.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={getUserLocation}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                <LocateFixed size={16} />{" "}
                <span className="hidden sm:block">Lokasi Saya</span>
              </button>
            </div>

            <div className="w-full h-72 rounded-[1.5rem] overflow-hidden border border-slate-200 mb-5 relative bg-slate-100">
              <MapContainer
                center={mapPos}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <Marker position={mapPos} icon={pinIcon} />
                <MapController pos={mapPos} />
                <LocationPicker onLocationSelect={handleMapClick} />
                <ZoomControl position="bottomright" />
              </MapContainer>
              {isLocating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[500] flex items-center justify-center font-bold text-blue-600 text-sm gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>{" "}
                  Memuat Lokasi...
                </div>
              )}
            </div>

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Alamat akan terisi otomatis dari peta..."
              required
              rows="3"
              className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 resize-none"
            />
          </section>

          {/* Section Pembayaran */}
          <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-50">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/50">
                <CreditCard size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Metode Pembayaran
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  Pilih cara bayar paling aman.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: "transfer_bank",
                  label: "Bank Transfer",
                  desc: "Verifikasi Manual",
                  icon: <Landmark size={22} />,
                },
                {
                  id: "e_wallet",
                  label: "E-Wallet",
                  desc: "Cepat & Instan",
                  icon: <Wallet size={22} />,
                },
                {
                  id: "cod",
                  label: "Tunai (COD)",
                  desc: "Bayar di Tempat",
                  icon: <Banknote size={22} />,
                },
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() =>
                    setFormData({ ...formData, payment_method: method.id })
                  }
                  className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 flex flex-col items-center gap-3 text-center border ${
                    formData.payment_method === method.id
                      ? "border-blue-500 bg-blue-50/50 shadow-[0_8px_20px_-6px_rgba(59,130,246,0.2)] ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl transition-colors ${formData.payment_method === method.id ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500"}`}
                  >
                    {method.icon}
                  </div>
                  <div>
                    <span className="font-bold text-sm block mb-1 text-slate-900">
                      {method.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {method.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* KOLOM KANAN: SUMMARY */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-6 flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                <ShoppingBag size={16} />
              </div>
              Ringkasan Belanja
            </h2>

            <div className="space-y-6">
              {/* Item Info + Quantity Selector */}
              <div className="bg-[#f8fafc] p-5 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-slate-900 leading-tight pr-4">
                    {selectedPackage?.package_name || "Memuat..."}
                  </h4>

                  {/* QUANTITY SELECTOR (Lebih Elegan) */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                      <Star
                        size={12}
                        className="text-amber-500 fill-amber-500"
                      />{" "}
                      Katering Pilihan
                    </div>

                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => updateQuantity(-1)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 text-sm">
                        {formData.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(1)}
                        className="p-1.5 hover:bg-slate-50 rounded-lg text-blue-600 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Harga */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-bold">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Section Ongkir (Dibuat Gratis) */}
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Truck size={14} className="text-blue-500" /> Pengiriman
                  </span>
                  <span className="text-emerald-600 font-bold">Gratis</span>
                </div>

                <div className="border-t border-dashed border-slate-200 my-4 pt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-500">
                      Total Tagihan
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      Rp {totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !formData.address || !formData.package_id}
                className="w-full mt-4 py-4.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-2xl transition-all shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? "Memproses..." : "Bayar Pesanan"}
                {!loading && (
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderFood;
