import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Check, Minus, DollarSign, Calendar, Users, Layout,Zap } from 'lucide-react';
import api from '../api/api';

const Plans = ({ user }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '', price: '', duration_days: 30, max_baranchs: 1, max_users: 2, can_see_reports: false
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/plans/');
      // Pagination bor yoki yo'qligini tekshiramiz
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setPlans(data || []);
    } catch (err) {
      console.error("Xato:", err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData(plan);
    } else {
      setEditingPlan(null);
      setFormData({ name: '', price: '', duration_days: 30, max_baranchs: 1, max_users: 2, can_see_reports: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}/`, formData);
      } else {
        await api.post('/plans/', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Saqlashda xatolik yuz berdi!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Ushbu tarifni o'chirmoqchimisiz?")) {
      try {
        await api.delete(`/plans/${id}/`);
        fetchData();
      } catch (err) {
        alert("O'chirishda xatolik!");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Tarif Rejalari</h1>
            <p className="text-slate-500">Tizimdagi barcha obuna paketlarini boshqarish</p>
          </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} /> Yangi Tarif
            </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-slate-600 uppercase tracking-wider">T/R</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Tarif Nomi</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Narxi</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Muddat</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Limitlar</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Hisobot</th>
                  <th className="p-6 text-xs font-black text-slate-600 uppercase tracking-wider">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {plans.map((plan,index) => (
                  <tr key={plan.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-6 text-slate-600 font-medium">{ index + 1}</td>
                    <td className="p-6 font-bold text-slate-700">{plan.name}</td>
                    <td className="p-6">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">
                        {parseFloat(plan.price).toLocaleString()} so'm
                      </span>
                    </td>
                    <td className="p-6 text-slate-600 font-medium">{plan.duration_days} kun</td>
                    <td className="p-6">
                      <div className="flex gap-4 text-xs">
                        <span title="Do'konlar" className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                           <Layout size={12}/> {plan.max_baranchs}
                        </span>
                        <span title="Foydalanuvchilar" className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                           <Users size={12}/> {plan.max_users}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      {plan.can_see_reports ? 
                        <Check className="text-green-500" size={20} /> : 
                        <Minus className="text-slate-300" size={20} />
                      }
                    </td>
                    <td className="p-6">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(plan)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(plan.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">
                {editingPlan ? "Tarifni tahrirlash" : "Yangi tarif qo'shish"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Tarif nomi" icon={<Zap size={16}/>} value={formData.name} onChange={v => setFormData({...formData, name: v})} />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Narxi (so'm)" type="number" icon={<DollarSign size={16}/>} value={formData.price} onChange={v => setFormData({...formData, price: v})} />
                <Input label="Amal qilish muddati" type="number" icon={<Calendar size={16}/>} value={formData.duration_days} onChange={v => setFormData({...formData, duration_days: v})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Max do'konlar" type="number" icon={<Layout size={16}/>} value={formData.max_baranchs} onChange={v => setFormData({...formData, max_baranchs: v})} />
                <Input label="Max ishchilar" type="number" icon={<Users size={16}/>} value={formData.max_users} onChange={v => setFormData({...formData, max_users: v})} />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.can_see_reports} 
                  onChange={e => setFormData({...formData, can_see_reports: e.target.checked})} 
                  className="w-5 h-5 accent-blue-600 rounded-lg" 
                />
                <span className="font-bold text-slate-700 text-sm">Analitik hisobotlarni ko'rish imkoniyati</span>
              </label>

              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4"
              >
                {editingPlan ? "O'zgarishlarni saqlash" : "Tarifni yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Input Component
const Input = ({ label, type="text", value, onChange, icon }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-2 tracking-widest">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all"
        required
      />
    </div>
  </div>
);

export default Plans;