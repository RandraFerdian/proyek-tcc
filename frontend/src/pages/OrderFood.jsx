import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  MapPin, 
  Package,
  ArrowRight,
  History
} from "lucide-react";
import api from "../services/api";

const OrderFood = () => {
  const [packages, setPackages] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu"); // 'menu' or 'history'
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Selection state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const customerId = localStorage.getItem("user_id");

  useEffect(() => {
    fetchPackages();
    fetchMyOrders();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get("/packages/");
      setPackages(response.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await api.get(`/orders/?customer_id=${customerId}`);
      setMyOrders(response.data);
    } catch (error) {
      console.error("Error fetching my orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;

    setIsOrdering(true);
    try {
      await api.post("/orders/", {
        customer_id: Number(customerId),
        package_id: selectedPackage.id,
        quantity: quantity,
        total_price: selectedPackage.price * quantity,
        status: "pending",
        payment_method: paymentMethod,
        payment_status: "unpaid",
        notes: notes
      });
      
      // Success
      setSelectedPackage(null);
      setQuantity(1);
      setNotes("");
      setPaymentMethod("cash");
      setActiveTab("history");
      fetchMyOrders();
      alert("Pesanan berhasil dikirim! Silakan selesaikan pembayaran.");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Gagal mengirim pesanan. Silakan coba lagi.");
    } finally {
      setIsOrdering(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'dikirim': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'selesai': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-6 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katering Mandiri</h1>
            <p className="text-slate-500 text-sm font-medium">Pesan paket katering favorit Anda</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("menu")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "menu" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
            >
              <ShoppingBag size={16} /> Menu
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
            >
              <History size={16} /> Pesanan Saya
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {activeTab === "menu" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                   <Package size={48} className="text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black">
                     Rp {pkg.price.toLocaleString()}
                   </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{pkg.package_name}</h3>
                  <p className="text-slate-500 text-sm mb-6 flex-1">{pkg.description || "Paket katering lezat siap santap."}</p>
                  <button 
                    onClick={() => { setSelectedPackage(pkg); setQuantity(1); setPaymentMethod("cash"); }}
                    className="w-full py-3 bg-slate-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Pesan Sekarang <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400">Memuat pesanan...</div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <Clock size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">Belum ada riwayat pesanan</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${order.status === 'pending' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                      <Package className={order.status === 'pending' ? 'text-amber-500' : 'text-blue-500'} size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{order.package?.package_name || "Paket Katering"}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                        <span>#ORD-{order.id}</span>
                        <span>•</span>
                        <span>{order.payment_method}</span>
                        <span>•</span>
                        <span className={order.payment_status === 'paid' ? 'text-emerald-500' : 'text-rose-500'}>{order.payment_status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Jumlah</p>
                      <p className="font-bold text-slate-700">{order.quantity} Box</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Pesanan */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-4 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Konfirmasi Pesanan</h3>
              <button onClick={() => setSelectedPackage(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Minus size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 pt-4 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Package className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Item Terpilih</p>
                  <p className="font-bold text-blue-900">{selectedPackage.package_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Jumlah Pesanan</span>
                  <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-black text-slate-800 w-4 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'transfer', 'qris'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Tanpa pedas, kirim jam 12 siang..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-20 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-400 font-medium">Total Pembayaran</span>
                  <span className="text-xl font-black text-slate-900">Rp {(selectedPackage.price * quantity).toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isOrdering}
                  className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                >
                  {isOrdering ? "Memproses..." : "Konfirmasi Pembelian"}
                  <Check size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderFood;
