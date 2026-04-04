import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';

// Layoutlar
import AdminLayout from './layouts/AdminLAyout'; 
import MainLayout from './layouts/MainLayout';

// Sahifalar
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Products from './pages/Products';
import Subscriptions from './pages/Subscription';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import ImportExcel from './pages/ImportExcel';
import Plans from './pages/Plans';
import Users from './pages/Users';
import LandingPage from './pages/LandingPage';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user_data');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user_data', JSON.stringify(userData));
    // Login bo'lgandan keyin dashboardga yo'naltirish shart emas, 
    // chunki state o'zgarganda Router o'zi qayta render qiladi.
  };

  if (loading) return null;

  // Himoyalangan Layout komponenti
  const ProtectedLayout = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    const SelectedLayout = user?.is_superuser ? AdminLayout : MainLayout;

    return (
      <SidebarProvider>
        <SelectedLayout user={user} />
      </SidebarProvider>
    );
  };

  return (
    <Router>
      <Routes>
        {/* LANDING PAGE: Faqat mehmonlar uchun yoki doim ochiq */}
        <Route 
          path="/" 
          element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
        />

        {/* LOGIN: Faqat tizimga kirmaganlar uchun */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} 
        />

        {/* BARCHA HIMOYALANGAN SAHIFALAR /dashboard OSTIDA */}
        <Route path="/dashboard" element={<ProtectedLayout />}>
          {/* Index sahifa ( /dashboard ) */}
          <Route index element={user?.is_superuser ? <SuperAdminDashboard /> : <Dashboard />} />
          
          {/* Umumiy sahifalar */}
          <Route path="categories" element={<Categories user={user} />} /> 
          <Route path="products" element={<Products user={user} />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="import" element={<ImportExcel />} />
          
          {/* Admin sahifalari */}
          {user?.is_superuser && (
            <>
              <Route path="users" element={<Users />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="plans" element={<Plans />} />
            </>
          )}

          {/* Owner sahifalari */}
          {!user?.is_superuser && (
            <Route path="my-shop" element={<div>Do'kon sozlamalari</div>} />
          )}
        </Route>

        {/* Noma'lum yo'llar */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;