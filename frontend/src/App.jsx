import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- IMPORT SEMUA HALAMAN ---
// Public & Auth
import LandingPage from "./pages/LandingPage";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import CourierLogin from "./pages/CourierLogin";

// Customer (User)
import CustomerHome from "./pages/CustomerHome";
import OrderFood from "./pages/OrderFood";
import MyOrders from "./pages/MyOrders";
import CustomerTracking from "./pages/CustomerTracking";
import CustomerRegister from "./pages/CustomerRegister";

// Admin
import Dashboard from "./pages/Dashboard";
import Couriers from "./pages/Couriers";
import Packages from "./pages/Packages";
import TrackingMap from "./pages/TrackingMap";

// ==========================================
// SISTEM KEAMANAN (PENJAGA GERBANG)
// ==========================================
const ProtectedRoute = ({ children, allowedRoles, loginPath }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role");

  // 1. Jika tidak ada token (belum login), tendang ke halaman login yang sesuai
  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  // 2. Jika sudah login tapi role-nya tidak diizinkan mengakses halaman ini (Mencegah Bocor)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Arahkan kembali ke "rumah" masing-masing berdasarkan role asli mereka
    if (userRole === "admin") return <Navigate to="/admin" replace />;
    if (userRole === "courier") return <Navigate to="/courier" replace />;
    return <Navigate to="/home" replace />; // Default kembalikan ke customer
  }

  // 3. Jika aman, persilakan masuk
  return children;
};

// ==========================================
// KONFIGURASI ROUTING UTAMA
// ==========================================
const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES (Bisa diakses siapa saja) --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/courier/login" element={<CourierLogin />} />

        {/* --- CUSTOMER ROUTES (Hanya untuk role 'user') --- */}
        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/login">
              <CustomerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-food"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/login">
              <OrderFood />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/login">
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking/:orderId"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/login">
              <CustomerTracking />
            </ProtectedRoute>
          }
        />

        {/* --- ADMIN ROUTES (Hanya untuk role 'admin') --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/couriers"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <Couriers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <Packages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tracking"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <TrackingMap />
            </ProtectedRoute>
          }
        />

        {/* --- COURIER ROUTES (Hanya untuk role 'courier') --- */}
        {/* Saat ini fitur kurir belum full, kita siapkan jalurnya */}
        <Route
          path="/courier"
          element={
            <ProtectedRoute
              allowedRoles={["courier"]}
              loginPath="/courier/login"
            >
              {/* Ganti dengan komponen Dashboard Kurir nantinya */}
              <div className="p-10 text-center font-bold text-2xl">
                Selamat Datang, Kurir!
              </div>
            </ProtectedRoute>
          }
        />

        {/* --- CATCH ALL (Jika ketik URL sembarangan/404) --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
      </Routes>
    </Router>
  );
};

export default App;
