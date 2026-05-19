import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Clock, CreditCard, AlertCircle, RefreshCcw, User } from 'lucide-react';
import api from '../api/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const Subscriptions = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);

const { data: plans = [] } = useQuery({
  queryKey: ['plans'],
  queryFn: () => api.get('/plans/').then(res => res.data.results || res.data),
  staleTime: 1000 * 60 * 60, // Planlar har soatda bir yangilansa ham yetadi
});

  const { data: subscriptions = [], isLoading } = useQuery({
  queryKey: ['admin-subscriptions'], // Socket shu kalitni qidiradi
  queryFn: () => api.get('/admin/subs/all/').then(res => res.data),
});




 const updateMutation = useMutation({
    mutationFn: (args) => api.patch(`/admin/subs/${args.id}/update/`, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-subscriptions']);
      toast.success("Muvaffaqiyatli bajarildi!");
    },
    onError: () => toast.error("Xatolik yuz berdi!")
  });

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  // Yangilash tugmasi bosilganda refetch ishlatamiz
  const handleRefresh = () => {
    refetch();
    toast.info("Ma'lumotlar yangilandi");
  };

  if (isLoading) return <div className="p-10 text-center font-bold animate-bounce">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={28} /> Obunalar Boshqaruvi
          </h2>
          <p className="text-slate-500 text-xs font-bold">Mijozlar arizalarini ko'rib chiqish va tasdiqlash</p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border shadow-sm rounded-xl hover:bg-slate-100 transition-all font-bold text-sm">
          <RefreshCcw size={18} className="text-blue-600" /> Yangilash
        </button>
      </div>

      <div className="bg-white rounded-4xl shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-tighter">
            <tr>
              <th className="px-6 py-5">Foydalanuvchi</th>
              <th className="px-6 py-5">Tanlangan Plan</th>
              <th className="px-6 py-5 text-center">To'lov Holati</th>
              <th className="px-6 py-5 text-center">Tugash Sanasi</th>
              <th className="px-6 py-5 text-center">Telefon</th>
              <th className="px-6 py-5 text-center">Qolgan Kun</th>
              <th className="px-6 py-5 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subscriptions.map((sub) => {
              // ARIZA HOLATINI ANIQLASH: To'lanmagan bo'lsa demak bu yangi ariza
              const isNewRequest = !sub.is_paid && ( sub.days_left <= 0 || sub.plan !== null )
                
              return (
                <tr key={sub.id} className={`transition-all ${isNewRequest ? "bg-amber-50/40" : "hover:bg-slate-50/50"}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${isNewRequest ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-slate-100 text-slate-500"}`}>
                        <User size={18} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-800">@{sub.username}</p>
                        {isNewRequest && (
                          <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">
                            Yangi Ariza
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="relative">
                      <select 
                        value={sub.plan || ""} 
                        onChange={(e) => handleUpdate(sub.id, { plan: e.target.value })}
                        className={`p-2.5 border rounded-xl text-xs font-black outline-none w-full appearance-none pr-8 ${
                          isNewRequest ? "border-amber-300 bg-white" : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <option value="">Plansiz...</option>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price} so'm</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Clock size={14} />
                      </div>
                    </div>
                  </td>

                 <td className="px-6 py-4 text-center">
  {sub.is_paid ? (
    // 1. Agar to'langan bo'lsa - Yashil belgi
    <div className="flex items-center gap-2 justify-center px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black shadow-lg">
      <ShieldCheck size={14} />
      TASDIQLANGAN
    </div>
  ) : isNewRequest ? (
    // 2. To'lanmagan VA (Muddati tugagan yoki Plan tanlangan) bo'lsa - TASDIQLASH tugmasi
    <button 
      onClick={() => handleUpdate(sub.id, { is_paid: true })}
      className="group relative overflow-hidden px-4 py-2 rounded-xl text-[10px] font-black transition-all bg-white text-amber-600 border-2 border-amber-500 hover:bg-amber-500 hover:text-white shadow-xl shadow-amber-100 animate-pulse"
    >
      <span className="flex items-center gap-2 justify-center">
        <CreditCard size={14} />
        TASDIQLASH
      </span>
    </button>
  ) : (
    // 3. To'lanmagan lekin hali trial muddati bor bo'lsa - Shunchaki status
    <div className="flex items-center gap-2 justify-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black">
      <Clock size={14} />
      TRIAL MUDDATI
    </div>
  )}
</td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <input 
                        type="date" 
                        value={sub.trial_end ? sub.trial_end.substring(0, 10) : ""} 
                        onChange={(e) => handleUpdate(sub.id, { trial_end: e.target.value })}
                        className="p-2 bg-transparent text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 rounded-lg"
                      />
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Sana tahriri</span>
                    </div>
                  </td>
                      <td>+998{sub.phone}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-block px-3 py-1 rounded-lg font-black text-sm ${
                      sub.days_left < 3 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {sub.days_left} kun
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleUpdate(sub.id, { is_active_status: !sub.is_active_status })}
                      className={`p-3 rounded-xl transition-all ${
                        sub.is_active_status 
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100" 
                        : "text-red-600 bg-red-50 hover:bg-red-100 animate-pulse"
                      }`}
                      title={sub.is_active_status ? "Bloklash" : "Aktivlashtirish"}
                    >
                      {sub.is_active_status ? <ShieldCheck size={20}/> : <ShieldAlert size={20}/>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tushuntirish qismi */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-2 rounded-full border">
          <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm"></div> Yangi ariza (To'lov kutilmoqda)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-2 rounded-full border">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm"></div> Muddati tugayotganlar
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;