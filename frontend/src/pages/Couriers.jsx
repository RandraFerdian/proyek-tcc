import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../services/api";

const Couriers = () => {
  const [couriers, setCouriers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vehicle_plate: "",
    phone: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchCouriers = async () => {
    try {
      const response = await api.get("/couriers/");
      setCouriers(response.data);
    } catch (error) {
      console.error("Error fetching couriers:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCouriers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/couriers/${editingId}`, formData);
      } else {
        await api.post("/couriers/", formData);
      }
      setIsModalOpen(false);
      setFormData({ name: "", vehicle_plate: "", phone: "", is_active: true });
      setEditingId(null);
      fetchCouriers();
    } catch (error) {
      console.error("Error saving courier:", error);
    }
  };

  const handleEdit = (courier) => {
    setFormData({
      name: courier.name,
      vehicle_plate: courier.vehicle_plate || "",
      phone: courier.phone || "",
      is_active: courier.is_active ?? true,
    });
    setEditingId(courier.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kurir ini?")) {
      try {
        await api.delete(`/couriers/${id}`);
        fetchCouriers();
      } catch (error) {
        console.error("Error deleting courier:", error);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 pb-32">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Data Kurir
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Kelola data kurir pengantaran Anda di sini.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", vehicle_plate: "", phone: "", is_active: true });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Kurir
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="py-4 px-6 font-semibold tracking-wide">ID</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Nama Kurir</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Plat Kendaraan</th>
                <th className="py-4 px-6 font-semibold tracking-wide">No. Telepon</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Status</th>
                <th className="py-4 px-6 font-semibold text-right tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {couriers.map((courier) => (
                <tr key={courier.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6 font-bold text-slate-700">#{courier.id}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs border border-blue-100">
                        {courier.name.charAt(0)}
                      </div>
                      {courier.name}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500">{courier.vehicle_plate || "-"}</td>
                  <td className="py-4 px-6 text-slate-500">{courier.phone || "-"}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                      courier.is_active 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {courier.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(courier)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(courier.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {couriers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Belum ada data kurir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Kurir" : "Tambah Kurir"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama Kurir
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Nama Lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Plat Kendaraan
                </label>
                <input
                  type="text"
                  name="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase"
                  placeholder="AB 1234 CD"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  No. Telepon
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="08123456789"
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                  Status Aktif
                </label>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Couriers;
