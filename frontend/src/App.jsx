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
import CustomerRegister from "./pages/CustomerRegister";
import AdminLogin from "./pages/AdminLogin";
import CourierLogin from "./pages/CourierLogin";
import CourierDashboard from "./pages/CourierDashboard";

// Customer (User)
import CustomerHome from "./pages/CustomerHome";
import OrderFood from "./pages/OrderFood";
import MyOrders from "./pages/MyOrders";
import CustomerTracking from "./pages/CustomerTracking";

// Admin
import Dashboard from "./pages/Dashboard";
import Couriers from "./pages/Couriers";
import Packages from "./pages/Packages";
import TrackingMap from "./pages/TrackingMap";
import AdminBottomNav from "./components/AdminBottomNav";

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
    
    // PERBAIKAN: Default kembalikan ke customer home yang benar
    return <Navigate to="/customer/home" replace />; 
  }

  // 3. Jika aman, persilakan masuk
  return children;
};

const AdminLayout = ({ children }) => {
  return (
    <div className="relative h-screen min-h-screen overflow-hidden bg-slate-50">
      <main className="h-full min-w-0 overflow-hidden">{children}</main>
      <AdminBottomNav />
    </div>
  );
};

// ==========================================
// KONFIGURASI ROUTING UTAMA
// ==========================================
const App = () => {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />
        
        {/* PERBAIKAN: Menggunakan rute dengan awalan /customer/ */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/courier/login" element={<CourierLogin />} />

        {/* --- CUSTOMER ROUTES (Hanya untuk role 'user') --- */}
        <Route
          path="/customer/home" /* PERBAIKAN: Disesuaikan dengan tujuan login */
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/customer/login">
              <CustomerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-food"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/customer/login">
              <OrderFood />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/customer/login">
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking/:orderId"
          element={
            <ProtectedRoute allowedRoles={["user"]} loginPath="/customer/login">
              <CustomerTracking />
            </ProtectedRoute>
          }
        />

        {/* --- ADMIN ROUTES (Hanya untuk role 'admin') --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/couriers"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <AdminLayout>
                <Couriers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/packages"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <AdminLayout>
                <Packages />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tracking"
          element={
            <ProtectedRoute allowedRoles={["admin"]} loginPath="/admin/login">
              <AdminLayout>
                <TrackingMap />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* --- COURIER ROUTES (Hanya untuk role 'courier') --- */}
        <Route
          path="/courier"
          element={
            <ProtectedRoute allowedRoles={["courier"]} loginPath="/courier/login">
              <CourierDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />

        {/* --- CATCH ALL (WAJIB DITARUH PALING BAWAH) --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
