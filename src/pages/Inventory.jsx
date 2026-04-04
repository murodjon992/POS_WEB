import React, { useState, useEffect } from 'react';
import { Search, Edit3, Trash2, Plus, Package, X, Lock, AlertCircle } from 'lucide-react';
import api from '../api/api';

const Inventory = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form ma'lumotlari
  const [formData, setFormData] = useState({
    product_name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    quantity: "",
    category: "",
    owner: "",
  });

  useEffect(() => {
    fetchInventory();
    loadCategories();
    if (user?.is_superuser) {
      fetchUsers();
    }
  }, [user]);

  // 1. Ombor ma'lumotlarini yuklash
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/');
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setProducts(data);
    } catch (err) {
      console.error("Yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Kategoriyalarni yuklash va foydalanuvchiga qarab filtrlash
  const loadCategories = async () => {
    try {
      const res = await api.get("/categories/");
      // Agar superadmin bo'lsa hamma kategoriya, aks holda faqat o'ziniki
      const filteredCats = user?.is_superuser 
        ? res.data 
        : res.data.filter(cat => cat.owner === user?.id);
      setAllCategories(filteredCats);
    } catch (err) {
      console.error("Kategoriyalarni yuklashda xato");
    }
  };

  // 3. Foydalanuvchilarni yuklash (Faqat Admin uchun)
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all/");
      setAllUsers(res.data);
    } catch (err) {
      console.error("Userlarni yuklashda xato");
    }
  };

  // 4. Modalni ochish (Yangi yoki Tahrirlash uchun)
  const openModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        product_name: product.product_name || "",
        barcode: product.barcode || "",
        purchase_price: product.purchase_price || "",
        sale_price: product.sale_price || "",
        quantity: product.quantity || "",
        category: product.category || "",
        owner: product.owner || ""
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        product_name: "",
        barcode: "",
        purchase_price: "",
        sale_price: "",
        quantity: "",
        category: allCategories.length > 0 ? allCategories[0].id : "",
        owner: user?.is_superuser ? "" : user?.id,
      });
    }
    setShowModal(true);
  };

  // 5. Ma'lumotni saqlash (POST yoki PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      category: parseInt(formData.category),
      owner: user?.is_superuser ? parseInt(formData.owner) : user?.id,
      quantity: parseInt(formData.quantity)
    };

    try {
      if (selectedProduct) {
        await api.put(`/inventory/${selectedProduct.id}/`, dataToSend);
      } else {
        await api.post("/inventory/", dataToSend);
      }
      fetchInventory();
      closeModal();
    } catch (err) {
      alert("Xatolik! Ma'lumotlarni tekshirib qaytadan urining.");
    }
  };

  // 6. O'chirish
  const handleDelete = async (id) => {
    if (window.confirm("Haqiqatan ham ushbu mahsulotni o'chirmoqchimisiz?")) {
      try {
        await api.delete(`/inventory/${id}/`);
        fetchInventory();
      } catch (err) {
        alert("O'chirishda xatolik yuz berdi.");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  // Qidiruv filtri
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      p.product_name?.toLowerCase().includes(search) || 
      p.barcode?.toString().includes(search) || 
      p.owner_name?.toLowerCase().includes(search)
    );
  });

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6 p-2">
      
      {/* SEARCH VA ADD BUTTON */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Nomi, egasi yoki shtrix-kod..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Mahsulot Qo'shish
        </button>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                <th className="px-6 py-4">T/R</th>
                {user?.is_superuser && <th className="px-6 py-4">Do'kondor</th>}
                <th className="px-6 py-4">Mahsulot</th>
                <th className="px-6 py-4">Shtrix-kod</th>
                <th className="px-6 py-4 text-right">Sotish narxi</th>
                <th className="px-6 py-4 text-center">Omborda</th>
                <th className="px-6 py-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 text-slate-400 text-sm">{index + 1}</td>
                  {user?.is_superuser && (
                    <td className="px-6 py-4 font-medium text-indigo-600">@{product.owner_name}</td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <Package size={16} />
                      </div>
                      <span className="font-bold text-slate-800">{product.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.barcode}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">
                    {Number(product.sale_price).toLocaleString()} so'm
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-purple-100 text-purple-700 text-xs font-black px-2.5 py-1 rounded-full">
                      {Number(product.quantity).toLocaleString()} dona
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-16 text-center text-slate-400 font-medium">Ma'lumot topilmadi...</div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-5 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">
                {selectedProduct ? "Zaxirani Yangilash" : "Yangi Mahsulot"}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              
              {/* ASOSIY INPUT: SONI (Har doim ochiq va fokusda) */}
              <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100">
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 tracking-widest">Ombordagi Soni (Dona)</label>
                <input 
                  type="number"
                  className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-black text-2xl text-center"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  autoFocus
                />
              </div>

              {/* MAHSULOT MA'LUMOTLARI (Editda muzlatiladi) */}
              <div className={`space-y-4 ${selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mahsulot Nomi</label>
                    <div className="relative">
                      <input 
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        value={formData.product_name}
                        onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                        required={!selectedProduct}
                      />
                      {selectedProduct && <Lock size={12} className="absolute right-3 top-3.5 text-slate-400" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Shtrix-kod</label>
                    <input 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      required={!selectedProduct}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategoriya</label>
                    <select 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required={!selectedProduct}
                    >
                      <option value="">Tanlang...</option>
                      {allCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                {user?.is_superuser && !selectedProduct && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Do'kon Egasi</label>
                    <select 
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.owner}
                      onChange={(e) => setFormData({...formData, owner: e.target.value})}
                      required={user?.is_superuser && !selectedProduct}
                    >
                      <option value="">Egasi kim?</option>
                      {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Tahrirlash rejimida faqat mahsulot <b>sonini</b> o'zgartirishingiz mumkin. Boshqa ma'lumotlarni o'zgartirish uchun "Mahsulotlar" bo'limidan foydalaning.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-600 transition-all">Bekor qilish</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;