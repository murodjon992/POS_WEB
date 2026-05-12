import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './context/SidebarContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './context/SocketContext'; // Yangi import
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Sahifalar (Sizning importlaringiz)
import AdminLayout from './layouts/AdminLAyout'; 
import MainLayout from './layouts/MainLayout';
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
import StaffManagement from './pages/Staff';
import POSPage from './pages/POSPage';
import DebtorsPage from './pages/DebtorsPage';
import SuppliersPage from './pages/SuppliersPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import OwnerSubscription from './pages/OwnerSubscription';
import Register from './pages/Register';

const queryClient = new QueryClient();

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
  };

  if (loading) return null;

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
    <QueryClientProvider client={queryClient}>
      {/* SocketProvider hamma narsani eshitib turadi */}
      <SocketProvider user={user} isAuthenticated={isAuthenticated}>
        <Router>
          <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
          <Routes>
            <Route path="/register" element={<Register replace />} /> 
            <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
            
            <Route path="/login" element={!isAuthenticated ? <Login onLoginSuccess={handleLoginSuccess} /> : (
              user?.role === 'seller' ? <Navigate to="/dashboard/pos" replace /> : <Navigate to="/dashboard" replace />)} />

            <Route path="/dashboard" element={<ProtectedLayout />}>
              <Route index element={user?.role === 'seller' ? <Navigate to="/dashboard/pos" replace /> : (user?.is_superuser ? <SuperAdminDashboard /> : <Dashboard/>)} />
              
              <Route path="categories" element={<Categories user={user} />} /> 
              <Route path="products" element={<Products user={user} />} />
              <Route path="pos" element={<POSPage />} />

              {(user?.role === "owner" || user?.role === "seller") && (
                <>
                  <Route path="debtors" element={<DebtorsPage />} />
                  <Route path="sales" element={<SalesHistoryPage />} />
                  <Route path="inventory" element={<Inventory />} />
                </>
              )}

              {user?.is_superuser && (
                <>
                  <Route path="users" element={<Users />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="plans" element={<Plans />} />
                </>
              )}
              <Route path="import" element={<ImportExcel />} />

              {!user?.is_superuser && user?.role === "owner" && (
                <>
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="my-shop" element={<div>Do'kon sozlamalari</div>} />
                  <Route path="my-subscription" element={<OwnerSubscription />} />
                </>
              )}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;