import React from 'react';
import { Check, Crown, AlertCircle, Sparkles, Calendar, RefreshCw,Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // React Query hooklari
import api from '../api/api';
import { toast } from 'react-toastify';

const OwnerSubscription = () => {
  const queryClient = useQueryClient();

  // 1. Ma'lumotlarni yuklash (React Query orqali)
  const { data: mySub, isLoading: subLoading } = useQuery({
    queryKey: ['my-sub'],
    queryFn: () => api.get('/my-sub/').then(res => res.data),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans/').then(res => res.data.results || res.data),
  });

  // 2. Planni tanlash (Mutation)
const selectPlanMutation = useMutation({
    mutationFn: (planId) => api.post(`/my-sub/select-plan/`, { 
      plan_id: planId,
      is_paid: false // Admin tasdiqlashi uchun false yuboramiz
    }),
    onSuccess: () => {
      toast.warning("Planni yangilash so'rovi yuborildi. Admin tasdiqlashini kuting!");
      queryClient.invalidateQueries(['my-sub']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Xato yuz berdi");
    }
  });
  // 3. Obunani uzaytirish (Mutation)
  const extendMutation = useMutation({
    mutationFn: () => api.post(`/my-sub/extend/`, { is_paid: false }),
    onSuccess: () => {
      toast.warning("Obunani uzaytirish so'rovi yuborildi!");
      queryClient.invalidateQueries(['my-sub']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Xato yuz berdi");
    }
  });

 const handlePlanSelect = (planId) => {
    if (!window.confirm("Ushbu planga o'tish uchun ariza bermoqchimisiz? (Admin tasdiqlashi shart)")) return;
    selectPlanMutation.mutate(planId);
  };

  const handleExtend = () => {
    if (!window.confirm("Obunani 30 kunga uzaytirish uchun ariza bermoqchimisiz?")) return;
    extendMutation.mutate();
  };

  if (subLoading || plansLoading) return <div className="p-10 text-center animate-pulse font-bold">Yuklanmoqda...</div>;

  // ARIZA HOLATINI TEKSHIRISH (Sening admin pagedagi mantiqing bilan bir xil)
  const isPending = !mySub?.is_paid && (mySub?.days_left <= 0 || mySub?.plan !== null);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* 1. Joriy Obuna Holati */}
      <div className="max-w-5xl mx-auto mb-12">
        <h2 className="text-3xl font-black text-slate-800 mb-6 flex items-center gap-3">
          <Sparkles className="text-amber-500" /> Mening Obunam
        </h2>
        
        <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-100 p-8 border border-blue-50 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-2xl ${mySub?.is_paid ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {isPending ? <Clock size={40} className="animate-spin" /> : <Crown size={40} />}
            </div>
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Joriy Plan</p>
              <h3 className="text-2xl font-black text-slate-800">
               {plans.find(p => p.id === mySub?.plan)?.name || "Sinov Muddati (Trial)"}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-10">
            <button 
              onClick={handleExtend}
              disabled={!mySub?.plan || extendMutation.isPending} 
              className="flex items-center gap-2 px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all group disabled:opacity-50"
            >
              <RefreshCw size={20} className={`${extendMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              OBUNANI UZAYTIRISH
            </button>
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Holati</p>
              <span className={`px-4 py-1 rounded-full text-xs font-black ${mySub?.is_paid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {mySub?.is_paid ? "FAOL" : "TO'LOV KUTILMOQDA"}
              </span>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Qolgan kun</p>
              <p className={`text-xl font-black ${mySub?.days_left < 5 ? 'text-red-500' : 'text-slate-800'}`}>
                {mySub?.days_left} kun
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Tugash sanasi</p>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <Calendar size={14} /> {mySub?.trial_end?.substring(0, 10) || "---"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Planlarni tanlash */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-black text-slate-800 mb-8 text-center">Planni yangilash</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative bg-white rounded-[40px] p-8 border-2 transition-all duration-300 hover:scale-105 ${mySub?.plan === plan.id ? 'border-blue-600 shadow-blue-100' : 'border-transparent shadow-xl shadow-slate-200'}`}
            >
              {mySub?.plan === plan.id && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black">
                  SIZNING PLANINGIZ
                </div>
              )}
              
              <div className="mb-6">
                <h4 className="text-xl font-black text-slate-800 mb-2">{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-blue-600">{plan.price}</span>
                  <span className="text-slate-400 font-bold">uzs/oy</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Check size={18} className="text-green-500" /> Barcha modullar
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Check size={18} className="text-green-500" /> 24/7 Qo'llab-quvvatlash
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Check size={18} className="text-green-500" /> Telegram xabarnomalar
                </li>
              </ul>

              <button 
                onClick={() => handlePlanSelect(plan.id)}
                disabled={mySub?.plan === plan.id || selectPlanMutation.isPending}
                className={`w-full py-4 rounded-2xl font-black transition-all ${
                  mySub?.plan === plan.id 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-300'
                }`}
              >
                {mySub?.plan === plan.id ? "FAOL" : "TANLASH"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-16 p-6 bg-blue-50 rounded-2xl flex items-start gap-4 border border-blue-100">
        <AlertCircle className="text-blue-600 shrink-0" />
        <p className="text-sm text-blue-800 font-medium leading-relaxed">
          <b>Eslatma:</b> Yangi plan tanlaganingizda, so'rov superadmin tomonidan ko'rib chiqiladi. 
          To'lovni amalga oshirish bo'yicha ma'lumot olish uchun biz bilan bog'laning.
        </p>
      </div>
    </div>
  );
};

export default OwnerSubscription;