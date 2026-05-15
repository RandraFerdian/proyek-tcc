import { Link } from "react-router-dom";
import {
  Package,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  Star,
} from "lucide-react";

const LandingPage = () => {
  return (
    /* h-full dan overflow-y-auto wajib agar bisa di-scroll di dalam Layout */
    <div className="h-full w-full overflow-y-auto bg-white scroll-smooth selection:bg-blue-100 selection:text-blue-900 font-sans antialiased text-slate-700">
      {/* Pola Latar Belakang Tipis (Dot Pattern) */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* --- NAVBAR (Ultra-Glassmorphism) --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:rotate-[-10deg] transition-transform duration-300">
              <Package className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-slate-950 tracking-tighter">
              Stich<span className="text-blue-600">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Lacak Pesanan
            </Link>
            <Link
              to="/admin/login"
              className="px-5 py-2.5 bg-slate-950 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-950/10 active:scale-95 hover:shadow-lg hover:shadow-slate-950/20"
            >
              Portal Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (Centered with Visual Mockup) --- */}
      <section className="relative pt-24 pb-40 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-10 shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            Logistik Katering Real-Time
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter mb-8 leading-[0.95] max-w-4xl mx-auto">
            Kirim Katering <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-blue-600">Lebih Pintar</span>
              <span className="absolute bottom-3 left-0 w-full h-4 bg-blue-100 z-0 rounded-full"></span>
            </span>
            & Tepat Waktu
          </h1>

          {/* Sub-headline */}
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Platform manajemen pengiriman terpadu untuk bisnis katering. Pantau
            kurir, optimalkan rute, dan berikan pengalaman pelacakan live
            terbaik bagi pelanggan Anda.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 w-full sm:w-auto">
            <Link
              to="/login"
              className="w-full sm:w-auto px-10 py-4.5 bg-blue-600 text-white text-lg font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 group active:scale-95 hover:-translate-y-0.5"
            >
              Lacak Pesanan Saya
              <ArrowRight
                className="group-hover:translate-x-1 transition-transform"
                size={20}
                strokeWidth={2.5}
              />
            </Link>
            <Link
              to="/courier/login"
              className="w-full sm:w-auto px-10 py-4.5 bg-white text-slate-800 text-lg font-bold rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-sm hover:shadow-md"
            >
              Portal Kurir
            </Link>
          </div>

          {/* --- VISUAL MOCKUP (Simulasi App di HP) --- */}
          <div className="relative w-full max-w-5xl mx-auto mt-10 animate-fade-in-up">
            {/* Dekorasi Glow di belakang HP */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Bingkai HP Mac (Stylized) */}
            <div className="relative bg-slate-950 p-3 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-4 border-slate-800/50 aspect-[16/10] overflow-hidden group">
              {/* Layar Dalam */}
              <div className="w-full h-full bg-slate-100 rounded-[2.2rem] overflow-hidden relative border-2 border-slate-900">
                {/* Bagian Peta (Leaflet Preview) */}
                <div className="absolute inset-0 bg-[#f8f9fa]">
                  <img
                    src="https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s-l+285AEC(110.3695,-7.7971)/110.3695,-7.7971,14,0/1000x600?access_token=pk.ey..."
                    alt="Map Preview"
                    className="w-full h-full object-cover opacity-80"
                  />

                  {/* Fake Courier Marker */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 relative z-10">
                    <div className="absolute -inset-4 bg-blue-500/30 rounded-full animate-ping"></div>
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-2xl border-2 border-white relative z-10">
                      <Package
                        className="text-white fill-white rotate-45"
                        size={20}
                      />
                    </div>
                  </div>
                </div>

                {/* Info Panel Melayang (Stylized Bottom Sheet) */}
                <div className="absolute bottom-5 left-5 right-5 bg-white/90 backdrop-blur-lg p-5 rounded-3xl shadow-xl border border-white flex items-center gap-4 transition-transform duration-500 group-hover:translate-y-[-10px]">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center font-black text-blue-600 text-lg border-2 border-whiteshadow-inner">
                    R
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                      Menuju Lokasimu
                    </p>
                    <h4 className="text-lg font-bold text-slate-950">
                      Kurir randra
                    </h4>
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                    Est: 8 Menit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Premium Grids) --- */}
      <section className="bg-slate-50/50 py-32 border-t border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 max-w-xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-slate-950 mb-5 tracking-tighter leading-tight">
              Satu Platform, <br /> Kendali Penuh
            </h2>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
              Fitur canggih yang didesain khusus untuk efisiensi operasional
              katering Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 - Live Tracking */}
            <div className="bg-white p-9 rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] group">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors duration-300 border border-blue-100 shadow-inner group-hover:shadow-blue-600/30">
                <MapPin
                  className="text-blue-600 group-hover:text-white transition-colors duration-300"
                  size={30}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-3.5 tracking-tight">
                Pelacakan Real-Time
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium text-base">
                Berikan transparansi total. Pelanggan dapat melihat posisi kurir
                secara *live* di peta tanpa perlu mengunduh aplikasi tambahan.
              </p>
            </div>

            {/* Card 2 - Optimized Routes */}
            <div className="bg-white p-9 rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] group">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-500 transition-colors duration-300 border border-emerald-100 shadow-inner group-hover:shadow-emerald-500/30">
                <Clock
                  className="text-emerald-600 group-hover:text-white transition-colors duration-300"
                  size={30}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-3.5 tracking-tight">
                Estimasi Waktu Akurat
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium text-base">
                Algoritma kami menghitung waktu tempuh berdasarkan lalu lintas,
                memastikan pesanan tiba di tangan pelanggan selagi hangat dan
                segar.
              </p>
            </div>

            {/* Card 3 - Admin Dashboard */}
            <div className="bg-white p-9 rounded-[2.5rem] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.03)] border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] group">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors duration-300 border border-indigo-100 shadow-inner group-hover:shadow-indigo-600/30">
                <ShieldCheck
                  className="text-indigo-600 group-hover:text-white transition-colors duration-300"
                  size={30}
                  strokeWidth={2.5}
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-3.5 tracking-tight">
                Manajemen Terpusat
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium text-base">
                Kelola ribuan pesanan, pantau performa seluruh armada kurir, dan
                akses laporan pengiriman lengkap dari satu *dashboard* admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIAL/TRUST SECTION --- */}
      <section className="bg-white py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
          <Star className="text-amber-400 fill-amber-400 mb-6" size={32} />
          <p className="text-3xl md:text-4xl font-medium text-slate-950 max-w-3xl leading-snug tracking-tight mb-10">
            "Stich Logistics benar-benar mengubah cara kami mengelola
            pengiriman. Kepuasan pelanggan meningkat drastis karena mereka bisa
            melacak pesanan selagi menunggu."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center font-bold text-white text-lg">
              B
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-950 text-lg">
                Bunda Katering Yogyakarta
              </p>
              <p className="text-sm font-medium text-slate-500">
                Mitra sejak 2023
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Minimal & Dark) --- */}
      <footer className="bg-slate-950 py-16 border-t border-slate-800 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-centershadow-blue-600/30">
              <Package className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter">
              Stich<span className="text-blue-500">.</span>
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} Stich Logistics. Mengirim kehangatan,
            tepat waktu.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            Solusi oleh randra
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
