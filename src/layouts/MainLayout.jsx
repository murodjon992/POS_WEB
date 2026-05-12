import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useQuery } from '@tanstack/react-query'; // React Query qo'shildi
import { 
  LayoutDashboard, Package, Tags, Warehouse, FileUp, Menu, 
  LogOut, CreditCard, Users, User2, Barcode, UserCheck, 
  Clock1, Lock 
} from 'lucide-react';
import mainLogo from '../assets/icon.png';
import api from '../api/api';

const MainLayout = ({ user }) => {
  const { isExpanded, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const isSeller = user?.role === "seller";

  // 1. Obuna holatini React Query orqali yuklaymiz
  // Bu query 'SocketContext'dagi ['my-sub'] bilan bog'langan
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-sub'],
    queryFn: () => api.get('/my-sub/').then(res => res.data),
    // Foydalanuvchi sahifada turganda ham har 5 daqiqada tekshirib turish (ixtiyoriy)
    staleTime: 1000 * 60 * 5, 
  });

  const isSubActive = subscription?.is_active_status && subscription?.days_left > 0;

  

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  };

  // 3. Menular ro'yxati
  const ownerMenus = [
    { title: "Dashboard", icon: <LayoutDashboard size={20}/>, path: '/dashboard' },
    { title: "Sotuvchilar", icon: <Users size={20}/>, path: '/dashboard/staff', restricted: true },
    { title: "Tovar beruvchilar", icon: <UserCheck size={20}/>, path: '/dashboard/suppliers', restricted: true },
    { title: "Qarzdorlar", icon: <User2 size={20}/>, path: '/dashboard/debtors', restricted: true },
    { title: "Savdolar Tarixi", icon: <Clock1 size={20}/>, path: '/dashboard/sales' },
    { title: "Mahsulotlar", icon: <Package size={20}/>, path: '/dashboard/products', restricted: true },
    { title: "Kategoriyalar", icon: <Tags size={20}/>, path: '/dashboard/categories', restricted: true },
    { title: "Ombor", icon: <Warehouse size={20}/>, path: '/dashboard/inventory', restricted: true },
    { title: "SAVDO (POS)", icon: <Barcode size={20}/>, path: '/dashboard/pos', restricted: true },
    { title: "Excel Import", icon: <FileUp size={20}/>, path: '/dashboard/import', restricted: true },
    { title: "Obuna", icon: <CreditCard size={20}/>, path: '/dashboard/my-subscription' },
  ];

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      {!isSeller && (
        <aside className={`fixed inset-y-0 left-0 bg-indigo-900 border-r border-slate-200 transition-all duration-300 z-50 flex flex-col ${isExpanded ? 'w-72' : 'w-20'}`}>
          <div className="p-6 h-20 flex items-center bg-white justify-between border-b border-slate-100">
            {isExpanded && (
              <h1 className="text-xl flex items-center font-black text-amber-600 italic">
                <img width={60} src={mainLogo} alt="Logo" />
                <span className='text-slate-800'>Baraka</span>POS
              </h1>
            )}
            <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
          </div>
          
          <nav className="grow p-4 space-y-2 overflow-y-auto">
            {ownerMenus.map((menu) => {
              const isDisabled = menu.restricted && !isSubActive;
              return (
                <NavLink 
                  key={menu.title} 
                  to={isDisabled ? "/dashboard/my-subscription" : menu.path}
                  onClick={(e) => {
                    if (isDisabled) {
                      alert("Obuna muddati tugagan yoki hisob faollashtirilmagan! Iltimos, tarifni yangilang.");
                    }
                  }}
                  className={({ isActive }) => `
                    flex items-center p-3.5 rounded-2xl transition-all relative
                    ${isActive ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/10'}
                    ${isDisabled ? 'opacity-40 grayscale pointer-events-auto' : ''}
                  `}
                >
                  {menu.icon}
                  {isExpanded && <span className="ml-3">{menu.title}</span>}
                  {isDisabled && <Lock size={14} className="absolute right-4 text-amber-400" />}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 border-t border-indigo-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={18} /> {isExpanded && "Chiqish"}
            </button>
          </div>
        </aside>
      )}

      <main className={`flex-1 transition-all duration-300 ${isSeller ? 'ml-0' : (isExpanded ? 'ml-72' : 'ml-20')}`}>
        {!isSeller && (
          <header className="h-16 bg-white/80 backdrop-blur-md border-b px-8 flex items-center justify-between sticky top-0 z-40">
            <span className="text-sm font-bold text-slate-600 italic">Do'kon Boshqaruvi</span>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full text-[11px] font-black tracking-wider uppercase ${isSubActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>

                  {isSubActive ? (
    // Agar backend plan_details yuborsa shuni, bo'lmasa 'Faol Obuna'ni ko'rsatadi
    subscription?.plan_details?.name || subscription?.plan_name || "Faol Obuna"
  ) : (
    'Obuna toxtatilgan'
  )}
              </div>
              
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">@{user?.username}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-200 uppercase">
                  {user?.username?.[0]}
                </div>
              </div>
            </div>
          </header>
        )}
        <div className="p-8">
          {/* Sahifalarga obuna holatini context orqali uzatamiz */}
          <Outlet context={{ isSubActive, subscription }} />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;