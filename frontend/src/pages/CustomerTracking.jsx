import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ref, onValue } from "firebase/database";
import { database } from "../services/firebaseConfig";
import { ArrowLeft, Clock, Phone } from "lucide-react";

// Membuat ikon marker custom menggunakan Tailwind CSS
const createCustomIcon = () => {
  return L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <div class="relative w-12 h-12 flex items-center justify-center -ml-2 -mt-2">
        <div class="absolute inset-1 bg-blue-500/40 rounded-full animate-ping"></div>
        <div class="bg-blue-600 w-9 h-9 rounded-2xl shadow-xl border-2 border-white relative z-10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rotate-45">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const CustomerTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [courierLoc, setCourierLoc] = useState(null);

  // Posisi default: Yogyakarta
  const defaultPosition = [-7.7971, 110.3695];

  useEffect(() => {
    const deliveryRef = ref(database, `deliveries/${orderId}`);
    const unsubscribe = onValue(deliveryRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.location) {
        setCourierLoc({
          lat: data.location.lat,
          lng: data.location.lng,
          courierName: data.courier_name || "Kurir Stich",
        });
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  return (
    <div className="relative h-screen w-full bg-slate-100">
      {/* Tombol Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-[1000] p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 hover:bg-white hover:scale-105 transition-all text-slate-800"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Leaflet Map */}
      <div className="w-full h-full z-0">
        <MapContainer
          center={
            courierLoc ? [courierLoc.lat, courierLoc.lng] : defaultPosition
          }
          zoom={15}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false} // Sembunyikan tombol +/- bawaan agar lebih clean
        >
          {/* TileLayer ini adalah peta gratis dari OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            // Menggunakan basemap Voyager (Carto) agar warnanya bersih/terang ala Mapbox
          />

          {courierLoc && (
            <Marker
              position={[courierLoc.lat, courierLoc.lng]}
              icon={createCustomIcon()}
            />
          )}
        </MapContainer>
      </div>

      {/* Bottom Sheet Driver Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[1000]">
        <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center font-black text-blue-600 border-2 border-white shadow-sm">
              {courierLoc?.courierName?.charAt(0) || "K"}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                Sedang Menuju Lokasimu
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {courierLoc?.courierName || "Kurir Pengantar"}
              </h2>
            </div>
            <button className="p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-100 hover:text-blue-600 active:scale-90 transition-all">
              <Phone size={20} />
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex gap-4">
            <div className="flex-1 flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 py-3 px-4 rounded-xl border border-slate-100">
              <Clock size={16} className="text-blue-500" />
              <span>
                Estimasi Tiba:{" "}
                <span className="font-bold text-slate-900">10 Menit</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
