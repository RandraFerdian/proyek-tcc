import { NavLink, useNavigate } from "react-router-dom";
import {
  Map,
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
} from "lucide-react";


const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const role = localStorage.getItem("user_role") || "user";

  const menuItems = [
    { name: "Pesan Katering", icon: <ShoppingBag size={20} />, path: "/order-food", roles: ["user"] },
    { name: "Live Tracking", icon: <Map size={20} />, path: "/tracking", roles: ["admin", "user"] },

    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
      roles: ["admin"]
    },
    { name: "Paket Katering", icon: <Package size={20} />, path: "/packages", roles: ["admin"] },
    { name: "Data Kurir", icon: <Users size={20} />, path: "/couriers", roles: ["admin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  return (
    <aside
      className={`bg-white border-r border-slate-100 flex flex-col z-20 relative transition-all duration-300 ${
        isOpen ? "w-72" : "w-20"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-10 bg-white border border-slate-200 text-slate-500 rounded-full p-1 shadow-sm hover:text-blue-600 hover:border-blue-200 transition-colors z-50"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Logo Area */}
      <div className={`p-8 pb-4 ${isOpen ? "" : "px-4"}`}>
        <div className={`flex items-center gap-3 ${isOpen ? "" : "justify-center"}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
            <Package className="text-white" size={24} />
          </div>
          {isOpen && (
            <div className="overflow-hidden transition-all duration-300 w-32">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Stich<span className="text-blue-600">.</span>
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
                Logistics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 px-4 space-y-1.5 mt-8 overflow-y-auto ${isOpen ? "" : "px-2"}`}>
        {isOpen && (
          <div className="px-4 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>
        )}
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={!isOpen ? item.name : ""}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? "bg-blue-50/80 text-blue-700 shadow-sm ring-1 ring-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isOpen ? "" : "justify-center px-0"}`
            }
          >
            <div className="shrink-0">{item.icon}</div>
            {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile Area */}
      <div className={`m-4 bg-slate-50/50 rounded-2xl border border-slate-100 ${isOpen ? "p-4" : "p-2"}`}>
        <div className={`flex items-center gap-3 ${isOpen ? "mb-4 px-2" : "justify-center mb-2"}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold border border-slate-200 shadow-sm shrink-0 uppercase">
            {role.charAt(0)}
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate capitalize">
                {role} Mode
              </p>
              <p className="text-xs text-slate-500 truncate">Sistem Katering</p>
            </div>
          )}
        </div>
        <div className={`flex gap-2 ${isOpen ? "" : "flex-col"}`}>
          <button title="Settings" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-slate-600 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors text-sm font-medium">
            <Settings size={16} />
          </button>
          <button 
            onClick={handleLogout}
            title="Logout" 
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-200 hover:bg-rose-50 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

