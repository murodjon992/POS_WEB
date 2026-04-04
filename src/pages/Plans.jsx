import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, ShieldCheck } from 'lucide-react';
import api from '../api/api';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, subRes] = await Promise.all([
        api.get('/plans/')
      ]);
      setPlans(planRes.data);
      setCurrentSub(subRes.data);
    } catch (err) {
      console.error("Ma'lumot yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold text-slate-500 text-xl">Rejalar yuklanmoqda...</div>;

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      {/* Sarlavha qismi */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
          Biznesingizni <span className="text-blue-600">kuchaytiring</span>
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Sizga mos keladigan tarifni tanlang. Har qanday vaqtda boshqa tarifga o'tishingiz mumkin.
        </p>
      </div>

      {/* Tariflar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = currentSub?.plan === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 border-2 ${
                isCurrent 
                ? 'border-blue-500 bg-blue-50/20 shadow-2xl shadow-blue-100 scale-105 z-10' 
                : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl'
              }`}
            >
              {/* "Joriy Reja" nishoni */}
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <ShieldCheck size={14} /> Sizning tarifingiz
                </div>
              )}

              {/* Plan Ikonkasi va Nomi */}
              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.name.toLowerCase().includes('pro') ? 'bg-orange-100 text-orange-600' : 
                  plan.name.toLowerCase().includes('business') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {plan.name.toLowerCase().includes('pro') ? <Crown size={30} /> : 
                   plan.name.toLowerCase().includes('business') ? <Rocket size={30} /> : <Zap size={30} />}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 font-medium">/{plan.duration_days} kun</span>
                </div>
              </div>

              {/* Imkoniyatlar Ro'yxati */}
              <div className="space-y-4 mb-10 flex-grow">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={14} strokeWidth={4} /></div>
                  <span className="font-semibold">Cheksiz mahsulot</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={14} strokeWidth={4} /></div>
                  <span className="font-semibold">{plan.max_users} ta foydalanuvchi</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={14} strokeWidth={4} /></div>
                  <span className="font-semibold">{plan.max_baranchs} ta do'kon</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className={`p-1 rounded-full ${plan.can_see_reports ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-300'}`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span className={plan.can_see_reports ? 'font-semibold' : 'text-slate-300 line-through'}>
                    Analitik hisobotlar
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="bg-green-100 p-1 rounded-full text-green-600"><Check size={14} strokeWidth={4} /></div>
                  <span className="font-semibold">24/7 Texnik yordam</span>
                </div>
              </div>

              {/* Tugma */}
              <button 
                disabled={isCurrent}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                  isCurrent 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95'
                }`}
              >
                {isCurrent ? 'Faol holatda' : 'Sotib olish'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pastki eslatma */}
      <p className="text-center mt-12 text-slate-400 text-sm italic">
        * To'lov amalga oshirilgandan so'ng 1-5 daqiqa ichida tarif faollashadi.
      </p>
    </div>
  );
};

export default Plans;