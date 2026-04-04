import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { LayoutDashboard, Package, Tags, Warehouse, FileUp, Menu, LogOut, CreditCard } from 'lucide-react';

const MainLayout = ({ user }) => {
  const { isExpanded, toggleSidebar } = useSidebar();
  

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  };


  const ownerMenus = [
    { title: "Dashboard", icon: <LayoutDashboard size={20}/>, path: '/' },
    { title: "Mahsulotlar", icon: <Package size={20}/>, path: '/dashboard/products' },
    { title: "Kategoriyalar", icon: <Tags size={20}/>, path: '/dashboard/categories' },
    { title: "Ombor", icon: <Warehouse size={20}/>, path: '/dashboard/inventory' },
    { title: "Excel Import", icon: <FileUp size={20}/>, path: '/dashboard/import' },
    { title: "Obuna", icon: <CreditCard size={20}/>, path: '/dashboard/my-subscription' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 transition-all duration-300 z-50 flex flex-col ${isExpanded ? 'w-72' : 'w-20'}`}>
        <div className="p-6 h-20 flex items-center justify-between border-b border-slate-100">
          {isExpanded && <h1 className="text-xl font-black text-orange-600 italic">Baraka POS</h1>}
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Menu size={20} /></button>
        </div>
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {ownerMenus.map((menu) => (
            <NavLink key={menu.title} to={menu.path} className={({ isActive }) => `flex items-center p-3.5 rounded-2xl transition-all ${isActive ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
              {menu.icon}
              {isExpanded && <span className="ml-3">{menu.title}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">
            <LogOut size={18} /> {isExpanded && "Chiqish"}
          </button>
        </div>
      </aside>
      <main className={`flex-1 transition-all duration-300 ${isExpanded ? 'ml-72' : 'ml-20'}`}>
        <header className="h-16 bg-white/80 backdrop-blur-md border-b px-8 flex items-center justify-between sticky top-0 z-40">
          <span className="text-sm font-bold text-slate-600 italic">Do'kon Boshqaruvi</span>
          <span className='font-bold text-slate-800'>Tarif: </span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">@{user?.username}</span>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 uppercase">{user?.username[0]}</div>
          </div>
        </header>
        <div className="p-8"><Outlet /></div>
      </main>
    </div>
  );
};

export default MainLayout;