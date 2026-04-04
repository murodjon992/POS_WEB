import React, { useState, useEffect } from "react";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Package, 
  Store, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Calendar
} from "lucide-react";
import api from "../api/api";

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

   useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("admin/subs/all/"); // Backend yo'li
        setUsers(res.data);
        
      } catch (err) {
        console.error("Userlarni yuklashda xato:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSuperStats();
  }, []);

  const fetchSuperStats = async () => {
    try {
      setLoading(true);
      // Backend: @api_view(['GET']) va @permission_classes([IsAdminUser]) bo'lgan endpoint
      const res = await api.get("/superadmin-stats/"); 
      setData(res.data);
    } catch (err) {
      console.error("Superadmin ma'lumotlarini yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
          <p className="text-slate-500 font-bold animate-pulse">Tizim ma'lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={36} />
            Global Boshqaruv
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Tizimdagi barcha do'konlar va moliyaviy holat nazorati</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSuperStats} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
             Yangilash
          </button>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
             Hisobot yuklash
          </button>
        </div>
      </div>

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.main_stats?.map((stat, index) => (
          <div key={index} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 group">
            <div className={`p-4 w-14 h-14 rounded-2xl mb-6 flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
              {stat.icon === "users" && <Users size={28} />}
              {stat.icon === "credit-card" && <CreditCard size={28} />}
              {stat.icon === "trending-up" && <TrendingUp size={28} />}
              {stat.icon === "package" && <Package size={28} />}
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">{stat.value}</h2>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-tighter">{stat.subValue}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT STORES TABLE */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Store className="text-indigo-600" /> Yangi Do'konlar
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Do'kon qidirish..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-[11px] uppercase font-bold tracking-widest border-b border-slate-50">
                  <th className="pb-4 font-black">Do'kon/Ega</th>
                  <th className="pb-4 font-black text-center">Ro'yxatdan o'tgan</th>
                  <th className="pb-4 font-black text-center">Status</th>
                  <th className="pb-4 font-black text-center">Tugash sanasi</th>
                  <th className="pb-4 text-right font-black">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.filter(s => s.username.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((store) => (
                  <tr key={store.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm">
                          {store.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{store.username}</p>
                          <p className="text-xs text-slate-400">{store.email || "Email mavjud emas"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-600">{new Date(store.start_date).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(store.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </td>
                    <td className="py-5 text-center">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">Faol</span>
                    </td>
                    <td className="py-5 text-center">
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[16px] font-bold uppercase tracking-wider">{store.days_left}kun</span>
                    </td>
                    <td className="py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SYSTEM LOGS / ANALYTICS MINI CARD */}
        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-[3rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 italic text-indigo-200">SaaS Holati</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Server Yuklamasi</span>
                    <span className="font-bold">24%</span>
                  </div>
                  <div className="w-full bg-indigo-800 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full" style={{width: '24%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Obuna Convertatsiyasi</span>
                    <span className="font-bold">68%</span>
                  </div>
                  <div className="w-full bg-indigo-800 rounded-full h-1.5">
                    <div className="bg-emerald-400 h-1.5 rounded-full" style={{width: '68%'}}></div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-sm font-bold hover:bg-indigo-500/40 transition-all">
                Texnik monitoring
              </button>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">Eslatma</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              Bugun soat 23:55 da tizimda profilaktika ishlari rejalashtirilgan. Barcha do'kon egalariga xabarnoma yuborishni unutmang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;