import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CreditCard, User, Calendar, Save } from 'lucide-react';
import api from '../api/api';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        api.get('/admin/subs/all/'),
        api.get('/plans/')
      
      ]);     
      setSubscriptions(subRes.data);
      setPlans(planRes.data);
    } catch (err) {
      console.error("Ma'lumot yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.patch(`/admin/subs/${id}/update/`, data);
      alert("Muvaffaqiyatli yangilandi!");
      fetchData(); // Ma'lumotlarni qayta yangilash
    } catch (err) {
      alert("Xatolik: " + JSON.stringify(err.response?.data));
    }
  };

  if (loading) return <div className="p-10 text-center">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
        <ShieldCheck className="text-blue-600" /> Obunalar Boshqaruvi (Admin)
      </h2>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4">Hozirgi Plan</th>
              <th className="px-6 py-4">To'lov</th>
              <th className="px-6 py-4">Boshlangan Sana</th>
              <th className="px-6 py-4">Tugash Sanasi</th>
              <th className="px-6 py-4">Qolgan Kun</th>
              <th className="px-6 py-4">Ruxsat</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className={sub.is_active ? "hover:bg-slate-50" : "bg-red-50/30"}>
                <td className="px-6 py-4 font-bold text-slate-700">@{sub.username}</td>
                
                <td className="px-6 py-4">
                  <select 
                    value={sub.plan || ""}
                    onChange={(e) => handleUpdate(sub.id, { plan: e.target.value })}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tanlang...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price})so'm</option>
                    ))}
                  </select>
                </td>

                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleUpdate(sub.id, { is_paid: !sub.is_paid })}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                      sub.is_paid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {sub.is_paid ? "TO'LANGAN" : "KUTILMOQDA"}
                  </button>
                </td>

                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {sub.start_date}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {sub.trial_end}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                  {sub.days_left} kun
                </td>
                      <td className="px-6 py-4 text-center">
  <div className="flex items-center justify-center">
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={sub.is_paid}
        onChange={() => handleUpdate(sub.id, { is_paid: !sub.is_paid })}
      />
      {/* Switch dizayni */}
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
      
      <span className="ml-3 text-sm font-bold text-slate-600">
        {sub.is_paid ? (
          <span className="text-green-600 uppercase">To'langan</span>
        ) : (
          <span className="text-amber-600 uppercase">Kutilmoqda</span>
        )}
      </span>
    </label>
  </div>
</td>
                <td className="px-6 py-4 text-center">
                  {sub.is_active ? (
                    <span className="text-green-500 font-bold text-xs">FAOL</span>
                  ) : (
                    <span className="text-red-500 font-bold text-xs">MUDDATI O'TGAN</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subscriptions;