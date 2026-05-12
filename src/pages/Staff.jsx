import React, { useState, useEffect } from 'react';
import { UserPlus, ShieldAlert, Trash2, Key,Pen } from 'lucide-react';
import api from '../api/api';

const StaffManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '', phone: '' });

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async () => {
    const res = await api.get('/sellers/');
    setSellers(res.data.results || res.data);
  };
 
  const openEditModal = (seller) => {
    setEditingSeller(seller);
    setFormData({
      username: seller.user.username,
      password: '', 
      full_name: seller.full_name,
      phone: seller.phone
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSeller(null);
    setFormData({ username: '', password: '', full_name: '', phone: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSeller) {
        await api.put(`/sellers/${editingSeller.id}/`, formData);
      } else {
        await api.post('/sellers/', formData);
      }
      closeModal();
      fetchSellers();
    } catch (err) {
      console.log(err.response?.data);
      
      alert("Xatolik yuz berdi. Ma'lumotlarni tekshiring.",err);
    }
  };

  const deleteSeller = async (sellerId) => {
    if(window.confirm('Sotuvchini o`chirmoqchimisiz?')){
      try {
        await api.delete(`/sellers/${sellerId}`)
        fetchSellers()
      } catch (err) {
        console.log(err, 'Xatolik')
      }
    }
    
  }


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">Xodimlar (Sotuvchilar)</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
        >
          <UserPlus size={18}/> Xodim qo'shish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sellers.map(seller => (
          <div key={seller.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <Key size={24}/>
              </div>
              <div>
                <h3 className="font-black text-slate-700">{seller.full_name}</h3>
                <p className="text-xs text-slate-400">@{seller.user.username}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
               <span className="text-sm font-bold text-slate-500">{seller.phone}</span>
               <div>
               <button onClick={() => openEditModal(seller)} className="text-green-500 cursor-pointer mr-2 hover:text-green-700">
                  <Pen size={18}/>
               </button>
               <button onClick={() => deleteSeller(seller.id)} className="text-red-400 cursor-pointer hover:text-red-600">
                  <Trash2 size={18}/>
               </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Yangi xodim qo'shish formasi */}
     {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black mb-6">
              {editingSeller ? "Xodimni tahrirlash" : "Yangi sotuvchi"}
            </h2>
            
            <div className="space-y-4">
              <input 
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                placeholder="F.I.SH" className="w-full p-3 bg-slate-100 rounded-xl outline-none" required
              />
              <input 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Username" className="w-full p-3 bg-slate-100 rounded-xl outline-none" required
              />
              <input 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                type="password" 
                placeholder={editingSeller ? "Yangi parol (ixtiyoriy)" : "Parol"} 
                className="w-full p-3 bg-slate-100 rounded-xl outline-none" 
                required={!editingSeller} // Faqat yangi qo'shishda majburiy
              />
              <input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="Telefon" className="w-full p-3 bg-slate-100 rounded-xl outline-none" 
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={closeModal} className="flex-1 py-3 font-bold text-slate-400">Bekor qilish</button>
              <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black">
                {editingSeller ? "Saqlash" : "Yaratish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement