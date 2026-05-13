import { useNavigate } from "react-router-dom";
import {
  Package,
  ArrowRight,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  ChefHat,
  Star,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <ChefHat size={24} className="text-amber-600" />,
      bg: "bg-amber-50",
      ring: "ring-amber-100",
      title: "Menu Berkualitas",
      desc: "Paket katering dengan bahan segar dan cita rasa terbaik untuk setiap kebutuhan Anda.",
    },
    {
      icon: <MapPin size={24} className="text-blue-600" />,
      bg: "bg-blue-50",
      ring: "ring-blue-100",
      title: "Live Tracking",
      desc: "Pantau pesanan Anda secara real-time dari dapur hingga sampai di lokasi tujuan.",
    },
    {
      icon: <Clock size={24} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      title: "Tepat Waktu",
      desc: "Sistem monitoring memastikan setiap pengiriman katering sampai sesuai jadwal.",
    },
    {
      icon: <Truck size={24} className="text-violet-600" />,
      bg: "bg-violet-50",
      ring: "ring-violet-100",
      title: "Kurir Terpercaya",
      desc: "Tim kurir profesional yang berpengalaman dalam pengiriman makanan katering.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans overflow-y-auto">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Katering <span className="text-blue-600">Stich</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={() => navigate("/login?register=true")}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative z-10">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
              <Star size={14} className="text-blue-500 fill-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Monitoring System v1.0
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
              Pesan Katering,{" "}
              <span className="text-blue-600">Lacak Pengiriman</span> Secara
              Real-time
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8 max-w-xl">
              Sistem monitoring pengiriman katering yang memudahkan Anda memesan
              makanan, memantau status pengiriman, dan mendapatkan katering
              tepat waktu.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/login?register=true")}
                className="flex items-center justify-center gap-2 px-7 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all group active:scale-[0.98]"
              >
                Mulai Pesan Sekarang
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 px-7 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
              >
                Sudah Punya Akun? Masuk
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-3">
              Kenapa Katering Stich?
            </p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              Solusi Lengkap Katering Modern
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:-translate-y-1 transition-transform duration-300"
              >
                <div
                  className={`w-12 h-12 ${f.bg} ring-1 ${f.ring} rounded-2xl flex items-center justify-center mb-4`}
                >
                  {f.icon}
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-2">
                  {f.title}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-20 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-3">
              Cara Kerja
            </p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              3 Langkah Mudah
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Pilih Paket",
                desc: "Pilih paket katering sesuai kebutuhan dari berbagai menu yang tersedia.",
              },
              {
                step: "02",
                title: "Konfirmasi Pesanan",
                desc: "Tentukan jumlah, metode pembayaran, dan tambahkan catatan khusus.",
              },
              {
                step: "03",
                title: "Lacak Pengiriman",
                desc: "Pantau status pengiriman secara real-time hingga sampai di tujuan.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-blue-50 ring-1 ring-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-black text-blue-600">
                    {item.step}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-10 md:p-14 text-center relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                Siap Memesan Katering?
              </h3>
              <p className="text-blue-100 font-medium mb-8 max-w-md mx-auto">
                Daftar sekarang dan nikmati kemudahan memesan katering dengan
                monitoring real-time.
              </p>
              <button
                onClick={() => navigate("/login?register=true")}
                className="px-8 py-4 bg-white text-blue-700 font-black rounded-2xl shadow-lg hover:bg-blue-50 transition-all group active:scale-[0.98]"
              >
                Daftar Gratis Sekarang
                <ArrowRight
                  size={18}
                  className="inline-block ml-2 group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-600" />
            <span className="text-sm font-bold text-slate-700">
              Katering Stich
            </span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 Katering Stich • Monitoring System v1.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
