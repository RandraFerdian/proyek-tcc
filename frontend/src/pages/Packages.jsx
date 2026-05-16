import { useState, useEffect } from "react";
import { Package, Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../services/api";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    package_name: "",
    description: "",
    price: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchPackages = async () => {
    try {
      const response = await api.get("/packages/");
      setPackages(response.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPackages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "price" ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/packages/${editingId}`, formData);
      } else {
        await api.post("/packages/", formData);
      }
      setIsModalOpen(false);
      setFormData({ package_name: "", description: "", price: "" });
      setEditingId(null);
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
    }
  };

  const handleEdit = (pkg) => {
    setFormData({
      package_name: pkg.package_name,
      description: pkg.description,
      price: pkg.price,
    });
    setEditingId(pkg.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus paket ini?")) {
      try {
        await api.delete(`/packages/${id}`);
        fetchPackages();
      } catch (error) {
        console.error("Error deleting package:", error);
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8 pb-32">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Paket Katering
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Kelola data paket katering Anda di sini.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ package_name: "", description: "", price: "" });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Paket
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="py-4 px-6 font-semibold tracking-wide">ID</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Nama Paket</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Deskripsi</th>
                <th className="py-4 px-6 font-semibold tracking-wide">Harga</th>
                <th className="py-4 px-6 font-semibold text-right tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6 font-bold text-slate-700">#{pkg.id}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                        <Package size={16} />
                      </div>
                      {pkg.package_name}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 max-w-xs truncate">{pkg.description}</td>
                  <td className="py-4 px-6 font-semibold text-emerald-600">
                    Rp {pkg.price.toLocaleString("id-ID")}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(pkg)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    Belum ada data paket.
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
                {editingId ? "Edit Paket" : "Tambah Paket"}
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
                  Nama Paket
                </label>
                <input
                  type="text"
                  name="package_name"
                  value={formData.package_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Contoh: Paket Premium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Deskripsi singkat..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="0"
                />
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

export default Packages;
