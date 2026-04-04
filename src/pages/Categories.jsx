import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, X, Search, User, Loader2 } from 'lucide-react';
import api from '../api/api';

const Categories = ({ user }) => {
  const [categories, setCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ name: "", owner_id: "" }); // owner -> owner_id ga o'zgardi

  useEffect(() => {
    fetchCategories();
    if (user?.is_superuser) fetchUsers();
  }, [user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories/');
      setCategories(res.data);
    } catch (err) {
      console.error("Kategoriyalarni yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all/");
      // Faqat oddiy do'kon egalarini ajratib olamiz
      setAllUsers(res.data.filter(u => !u.is_superuser));
    } catch (err) {
      console.error("Foydalanuvchilarni yuklashda xato:", err);
    }
  };

  const openModal = (cat = null) => {
    if (cat) {
      setSelectedId(cat.id);
      setFormData({ 
        name: cat.name, 
        owner_id: cat.owner || "" // Tahrirlashda eski ownerni saqlaymiz
      });
    } else {
      setSelectedId(null);
      // Yangi ochilganda: agar superadmin bo'lsa tanlashga qo'yamiz, bo'lmasa avtomatik o'zi
      setFormData({ name: "", owner_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validatsiya: Agar superadmin bo'lsa, owner tanlash shart
    if (user?.is_superuser && !formData.owner_id) {
      alert("Iltimos, do'konni tanlang!");
      return;
    }

    try {
      if (selectedId) {
        await api.put(`/categories/${selectedId}/`, formData);
      } else {
        await api.post('/categories/', formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Ma'lumotlarni to'ldirishda xato yuz berdi";
      alert("Xatolik: " + errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Kategoriyani o'chirishni tasdiqlaysizmi?")) {
      try {
        await api.delete(`/categories/${id}/`);
        fetchCategories();
      } catch (err) {
        alert("O'chirishda xatolik: Kategoriya ishlatilayotgan bo'lishi mumkin.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Kategoriyalardan qidirish..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl outline-none focus:border-blue-500 transition-all font-medium text-slate-700"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
        >
          <Plus size={20} /> Yangi Kategoriya
        </button>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      ) : (
        /* GRID LIST */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories
            .filter(c => 
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (c.owner_name && c.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .map((cat) => (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center hover:shadow-md transition-all group">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Tag size={18}/>
                  </div>
                  <span className="font-bold text-slate-700">{cat.name}</span>
                </div>
                {user?.is_superuser && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase ml-1">
                    <User size={10} className="text-blue-400"/> {cat.owner_name || "Admin"}
                  </div>
                )}
              </div>
              
              <div className="flex gap-1">
                <button onClick={() => openModal(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit size={18}/></button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">
                {selectedId ? "Tahrirlash" : "Yangi Kategoriya"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {/* OWNER SELECT (Faqat Superadmin uchun) */}
              {user?.is_superuser && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Do'konni Tanlang</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({...formData, owner_id: e.target.value})}
                    required
                  >
                    <option value="">Do'konni tanlang...</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} {u.first_name ? `(${u.first_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Kategoriya Nomi</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="Masalan: Ichimliklar"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 bg-slate-100 font-bold rounded-2xl text-slate-500 hover:bg-slate-200 transition-all text-sm"
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all text-sm"
                >
                  {selectedId ? "Yangilash" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;