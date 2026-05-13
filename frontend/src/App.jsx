import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TrackingMap from "./pages/TrackingMap";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import Couriers from "./pages/Couriers";
import LandingPage from "./pages/LandingPage";
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";
import CourierLogin from "./pages/CourierLogin";
import OrderFood from "./pages/OrderFood";

// Komponen pembungkus untuk menangani visibilitas sidebar dan layout
const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const role = localStorage.getItem("user_role");
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sidebar HANYA muncul untuk Admin dan BUKAN di halaman login/landing
  const showSidebar = role === "admin" && 
                     !["/", "/login", "/admin/login", "/courier/login"].includes(location.pathname);

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden">
      {showSidebar && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}
      
      <main className={`flex-1 relative overflow-hidden transition-all duration-300 ${showSidebar && isSidebarOpen ? '' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const role = localStorage.getItem("user_role");

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<CustomerLogin />} />
          
          {/* Hidden Auth Routes (Manual Type) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/courier/login" element={<CourierLogin />} />
 {/* Placeholder/Similar for now */}
          
          {/* Customer Routes (No Sidebar) */}
          <Route path="/tracking" element={<TrackingMap />} />
          <Route path="/order-food" element={<OrderFood />} />

          {/* Admin Routes (With Sidebar) */}
          <Route 
            path="/dashboard" 
            element={role === "admin" ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/packages" 
            element={role === "admin" ? <Packages /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/couriers" 
            element={role === "admin" ? <Couriers /> : <Navigate to="/login" />} 
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
