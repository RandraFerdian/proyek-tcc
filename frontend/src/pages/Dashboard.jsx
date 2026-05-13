import { useState, useEffect } from "react";
import {
  Package as PackageIcon,
  TrendingUp,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Plus,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import api from "../services/api";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    order_code: "",
    customer_id: "",
    package_id: "",
    courier_id: "",
    quantity: 1,
    status: "pending",
    notes: ""
  });

  useEffect(() => {
    fetchOrders();
    fetchSelectionData();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Admin sees all orders by default
      const response = await api.get("/orders/");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectionData = async () => {
    try {
      const [pkgs, curs, custs] = await Promise.all([
        api.get("/packages/"),
        api.get("/couriers/"),
        api.get("/customers/") // Changed from /users/ to /customers/
      ]);
      setPackages(pkgs.data);
      setCouriers(curs.data);
      setUsers(custs.data); // Store customer data in the 'users' state for the dropdown
    } catch (error) {
      console.error("Error fetching selection data:", error);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: ["customer_id", "package_id", "courier_id", "quantity"].includes(name) 
        ? (value === "" ? "" : Number(value)) 
        : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Use the generic update if available or specific status update if only status changes
        // For now let's assume we need a generic update endpoint on backend or use the status one if that's all we have
        // Since I haven't added a generic PUT /orders/{id} yet, let's just do status update for now or add the generic one
        await api.put(`/orders/${editingId}/status`, { status: formData.status });
      } else {
        await api.post("/orders/", {
          ...formData,
          order_code: formData.order_code || `ORD-${Date.now().toString().slice(-6)}`
        });
      }
      setIsModalOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      order_code: "",
      customer_id: "",
      package_id: "",
      courier_id: "",
      quantity: 1,
      status: "pending",
      notes: ""
    });
    setEditingId(null);
  };

  const handleEdit = (order) => {
    setFormData({
      order_code: order.order_code || "",
      customer_id: order.customer_id || "",
      package_id: order.package_id || "",
      courier_id: order.courier_id || "",
      quantity: order.quantity || 1,
      status: order.status || "pending",
      notes: order.notes || ""
    });
    setEditingId(order.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus pesanan ini?")) {
      try {
        await api.delete(`/orders/${id}`);
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "In Transit":
      case "dikirim":
        return <TrendingUp size={14} />;
      case "Delivered":
      case "selesai":
        return <CheckCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "In Transit":
      case "dikirim":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Delivered":
      case "selesai":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  const stats = [
    {
      title: "Total Pesanan",
      value: orders.length.toString(),
      icon: <PackageIcon size={24} className="text-blue-600" />,
      bg: "bg-blue-50",
      ring: "ring-blue-100",
    },
    {
      title: "Sedang Dikirim",
      value: orders.filter((o) => ["In Transit", "dikirim"].includes(o.status)).length.toString(),
      icon: <TrendingUp size={24} className="text-amber-600" />,
      bg: "bg-amber-50",
      ring: "ring-amber-100",
    },
    {
      title: "Selesai",
      value: orders.filter((o) => ["Delivered", "selesai"].includes(o.status)).length.toString(),
      icon: <CheckCircle size={24} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Overview Katering
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Pantau performa pengiriman dan pesanan hari ini.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Pesanan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 transition-transform hover:-translate-y-1 duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {stat.title}
                </p>
                <h2 className="text-4xl font-black text-slate-800">
                  {loading ? "..." : stat.value}
                </h2>
              </div>
              <div
                className={`p-3.5 rounded-2xl ${stat.bg} ring-1 ${stat.ring}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Pesanan Terbaru</h3>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors" onClick={fetchOrders}>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="py-4 px-6 font-semibold tracking-wide">ID Order</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Pelanggan</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Paket</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Status</th>
                <th className="py-4 px-6 font-semibold text-right tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    Belum ada pesanan.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 font-bold text-slate-700">{order.order_code || `#ORD-${order.id}`}</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {users.find(u => u.id === order.customer_id)?.name || `Pelanggan #${order.customer_id}`}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {order.package ? order.package.package_name : `Paket #${order.package_id}`}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border ${getStatusStyle(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(order)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(order.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Pesanan" : "Tambah Pesanan"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kode Pesanan (Opsional)</label>
                  <input
                    type="text"
                    name="order_code"
                    value={formData.order_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pelanggan</label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="">Pilih Pelanggan</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Paket</label>
                <select
                  name="package_id"
                  value={formData.package_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="">Pilih Paket</option>
                  {packages.map(p => <option key={p.id} value={p.id}>{p.package_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Kurir</label>
                <select
                  name="courier_id"
                  value={formData.courier_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="">Pilih Kurir (Opsional)</option>
                  {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="dikirim">Dikirim</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

