import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Warehouse, Receipt, CalendarCheck, 
  Menu, LogOut, Store, ScanBarcode, User, Settings, ChevronDown, X, Import
} from 'lucide-react';

const AdminLayout = ({ user }) => {
  // Sidebar holati (agar context ishlamasa, shu yerda boshqaramiz)
  const [isExpanded, setIsExpanded] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Tashqariga bosilganda dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuGroups = [
    {
      title: "Tizim Nazorati",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/dashboard' },
        { id: 'users', label: 'Do\'konlar', icon: <Users size={22} />, path: '/dashboard/users' },
      ]
    },
    {
      title: "Ombor va Tovar",
      items: [
        { id: 'categories', label: 'Kategoriyalar', icon: <Store size={22} />, path: '/dashboard/categories' },
        { id: 'products', label: 'Mahsulotlar', icon: <ScanBarcode size={22} />, path: '/dashboard/products' },
        { id: 'inventory', label: 'Ombor zaxirasi', icon: <Warehouse size={22} />, path: '/dashboard/inventory' },
        { id: 'import', label: 'Excel Import', icon: <Import size={22} />, path: '/dashboard/import' },
      ]
    },
    {
      title: "Sozlamalar",
      items: [
        { id: 'plans', label: 'Tariflar', icon: <Receipt size={22} />, path: '/dashboard/plans' },
        { id: 'subscriptions', label: 'Obunalar', icon: <CalendarCheck size={22} />, path: '/dashboard/subscriptions' },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FC]">
      
      {/* --- ASIDE (SIDEBAR) --- */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#1C2434] text-slate-300 transition-all duration-300 z-50 flex flex-col shadow-2xl ${
          isExpanded ? 'w-72' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-700/50">
          {isExpanded && (
            <span className="font-black text-xl text-white tracking-wider flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-sm italic text-white">B</div>
              BARAKA <p className="text-orange-600">POS</p>
            </span>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-white"
          >
            {isExpanded ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {menuGroups.map((group) => (
            <div key={group.title}>
              {isExpanded && (
                <h3 className="px-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-[2px]">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink 
                    key={item.id} 
                    to={item.path} 
                    className={({ isActive }) => `
                      flex items-center p-3.5 rounded-xl transition-all duration-200 group
                      ${isActive 
                        ? 'bg-orange-700 text-white shadow-lg shadow-blue-600/20' 
                        : 'hover:bg-slate-800/50 hover:text-white'}
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {isExpanded && <span className="ml-4 text-sm font-semibold tracking-wide">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Bottom */}
       
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex-1 transition-all duration-300 ${isExpanded ? 'ml-72' : 'ml-20'}`}>
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div>
             <h1 className="text-xl font-bold text-slate-800 hidden md:block">
               Boshqaruv Paneli
             </h1>
          </div>

          {/* RIGHT SIDE: PROFILE DROPDOWN */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 transition-all border border-slate-100"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left pr-2">
                <p className="text-sm font-bold text-slate-900 leading-none">@{user?.username}</p>
                <p className="text-[10px] font-bold text-green-600 uppercase mt-1 tracking-widest">Online</p>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-3 animate-in fade-in slide-in-from-top-2">
                <div className="px-6 py-4 border-b border-slate-50 mb-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Tizim administratori</p>
                  <p className="font-bold text-slate-800 truncate">{user?.username}</p>
                </div>
                
                <button className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <User size={18} /> Profil
                </button>
                <button className="flex items-center gap-3 w-full px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Settings size={18} /> Sozlamalar
                </button>
                <div className="px-4 mt-3">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold"
                  >
                    <LogOut size={18} /> Chiqish
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* MAIN PAGE CONTENT */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;