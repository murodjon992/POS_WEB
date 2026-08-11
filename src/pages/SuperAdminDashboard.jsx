import React, { useState } from "react";
import { 
  Users,CreditCard,TrendingUp,Package, Store,Search, ExternalLink,ShieldCheck, Calendar, AlertCircle,ArrowUpRight} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/api";

const SuperAdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // MUHIM O'ZGARISH: endi useState+useEffect bilan bir martalik fetch emas,
  // useQuery bilan 'owner-dashboard' kalitiga ulanamiz. SocketContext.jsx
  // SUBSCRIPTION_UPDATE/NEW_SALE kelganda aynan shu kalitni invalidatsiya
  // qiladi - shuning uchun endi bu sahifa ham socket orqali jonli yangilanadi.
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: async () => {
      const res = await api.get("/admin-store-stats/");
      return res.data;
    },
  });

  const stats = data?.main_stats;
  const stores = data?.stores || [];

  // Obuna holatini aniqlash uchun yordamchi funksiya
  const getStatusInfo = (days) => {
    if (days <= 0) return { label: "To'lov tugagan", color: "bg-red-50 text-red-600", border: "border-red-100" };
    if (days <= 5) return { label: "Tugash arafasida", color: "bg-amber-50 text-amber-600", border: "border-amber-100" };
    return { label: "Faol", color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-bold">Global tizim yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-red-500 font-bold">Ma'lumotlarni yuklashda xato yuz berdi.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="text-indigo-600" size={38} />
            Baraka<span className="text-indigo-600">POS</span> Control
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">SaaS platformasining umumiy holati va moliyaviy tahlili</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:shadow-md transition-all">
            Audit
          </button>
          <button className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2">
            <CreditCard size={18} /> To'lovlar
          </button>
        </div>
      </div>

      {/* 2. MAIN STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<TrendingUp size={26} />} 
          label="Tizim Foydasi" 
          value={`${stats?.total_profit?.toLocaleString()} so'm`} 
          subValue="Oxirgi 30 kunlik"
          color="emerald"
        />
        <StatCard 
          icon={<Store size={26} />} 
          label="Aktiv Do'konlar" 
          value={stats?.active_stores} 
          subValue={`${stats?.total_stores} tadan`}
          color="indigo"
        />
        <StatCard 
          icon={<Package size={26} />} 
          label="Tizim GMV" 
          value={`${stats?.total_gmv?.toLocaleString()} so'm`} 
          subValue="Umumiy savdolar"
          color="amber"
        />
        <StatCard 
          icon={<AlertCircle size={26} />} 
          label="Qarzdorliklar" 
          value={stats?.expiring_soon} 
          subValue="To'lov kutilmoqda"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. STORES MANAGEMENT TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Do'konlar Monitoringi</h3>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Qidiruv (User, telefon)..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase font-black tracking-widest border-b border-slate-50">
                  <th className="pb-4 text-left">Do'kon Ma'lumotlari</th>
                  <th className="pb-4 text-center">Status</th>
                  <th className="pb-4 text-center">Aylanma / Foyda</th>
                  <th className="pb-4 text-center">Muddati</th>
                  <th className="pb-4 text-right">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stores.filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((store) => {
                    const status = getStatusInfo(store.days_left);
                    return (
                      <tr key={store.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black shadow-inner">
                              {store.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{store.username}</p>
                              <p className="text-xs text-slate-400">{store.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-5 text-center">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{store.total_sales?.toLocaleString()}</span>
                            <span className="text-[10px] text-emerald-500 font-bold">+{store.system_profit?.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-5 text-center">
                          <div className={`inline-flex flex-col p-2 rounded-xl border ${status.border}`}>
                            <span className="text-xs font-black">{store.days_left} kun</span>
                            <span className="text-[9px] text-slate-400">{new Date(store.expiry_date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-5 text-right">
                          <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <ExternalLink size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. SYSTEM HEALTH & SIDEBAR INFO */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold italic opacity-80">SaaS Health</h3>
                <ArrowUpRight className="text-indigo-400" />
              </div>
              <div className="space-y-6">
                <ProgressItem label="API Response Time" value="120ms" percent={85} color="bg-indigo-400" />
                <ProgressItem label="Server Storage" value="42%" percent={42} color="bg-emerald-400" />
                <ProgressItem label="Daily Active Users" value="1.2k" percent={65} color="bg-amber-400" />
              </div>
            </div>
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <AlertCircle size={20} />
              </div>
              <h4 className="font-black text-indigo-900 text-sm uppercase">Tezkor Eslatma</h4>
            </div>
            <p className="text-indigo-700/80 text-sm leading-relaxed font-medium">
              Obunasi tugagan do'konlarga avtomatik SMS yuborish tizimi faol. Bugun 12 ta yangi to'lov amalga oshirildi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
    <div className={`p-4 w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-${color}-50 text-${color}-600 group-hover:rotate-6 transition-transform`}>
      {icon}
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{value}</h2>
    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-400 uppercase">{subValue}</span>
      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}></div>
    </div>
  </div>
);

const ProgressItem = ({ label, value, percent, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-2 font-bold">
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-white/10 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full`} style={{width: `${percent}%`}}></div>
    </div>
  </div>
);

export default SuperAdminDashboard;
