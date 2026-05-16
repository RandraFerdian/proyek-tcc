import { NavLink, useNavigate } from "react-router-dom";
import {
  Bike,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
} from "lucide-react";

const navItems = [
  {
    name: "Home",
    path: "/admin",
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: "Tracking",
    path: "/admin/tracking",
    icon: <Map size={20} />,
  },
  {
    name: "Paket",
    path: "/admin/packages",
    icon: <Package size={20} />,
  },
  {
    name: "Kurir",
    path: "/admin/couriers",
    icon: <Bike size={20} />,
  },
];

const AdminBottomNav = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    navigate("/admin/login");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex justify-center px-3 pb-4 md:pb-6">
      <nav className="pointer-events-auto flex w-full max-w-2xl items-center gap-1 rounded-[1.25rem] border border-white/80 bg-white/90 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition-all sm:text-sm ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="hidden sm:inline">{item.name}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-rose-500 transition-all hover:bg-rose-50"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </nav>
    </div>
  );
};

export default AdminBottomNav;
