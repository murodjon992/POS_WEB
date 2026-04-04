import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Package } from "lucide-react";
import api from "../api/api";

const Products = ({ user }) => { // Foydalanuvchi ma'lumotlarini prop sifatida olamiz
  const [allCategories, setAllCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Faqat superadmin uchun
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    category: "",
    owner: "", // Backend kutayotgan owner ID si
  });

  useEffect(() => {
    fetchProducts();
    loadCategories();
    if (user?.is_superuser) {
      fetchUsers();
    }
  }, [user]);

  const loadCategories = async () => {
    const res = await api.get("/categories/");
    setAllCategories(res.data);
    
  };
  
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/all/");
      setAllUsers(res.data);
    } catch (err) {
      console.error("Userlarni yuklashda xato");
    }
  };
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products/");
      setProducts(res.data);
      console.log(res.data);
    } catch (err) {
      console.error("Xato:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        ...product,
        category: product.category || "", 
        owner: product.owner || ""
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        barcode: "",
        purchase_price: "",
        sale_price: "",
        category: allCategories.length > 0 ? allCategories[0].id : "",
        // Agar owner bo'lsa, o'z ID sini yozib qo'yamiz, admin bo'lsa bo'sh qoladi
        owner: user?.is_superuser ? "" : user?.id,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ma'lumotlarni nusxalaymiz va ID larni raqamga aylantiramiz
  const dataToSend = {
    ...formData,
    category: formData.category ? parseInt(formData.category) : null,
    owner: formData.owner ? parseInt(formData.owner) : (user?.is_superuser ? null : user?.id)
  }
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}/`, formData);
      } else {
        await api.post("/products/", formData);
      }
      fetchProducts();
      closeModal();
    } catch (err) {
      alert("Xatolik yuz berdi! Ma'lumotlarni tekshiring.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("O'chirishni tasdiqlaysizmi?")) {
      await api.delete(`/products/${id}/`);
      fetchProducts();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={user?.is_superuser ? "Nomi yoki Do'kon nomi..." : "Mahsulot qidirish..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-blue-500 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => openModal()}
          className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus size={20} /> Mahsulot Qo'shish
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[11px] uppercase font-bold tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">T/R</th>
              {user?.is_superuser && <th className="px-6 py-4">Do'kon egasi</th>}
              <th className="px-6 py-4">Mahsulot</th>
              <th className="px-6 py-4">Shtrix-kod</th>
              <th className="px-6 py-4">Kategoriya</th>
              <th className="px-6 py-4 text-right">Kelish narxi</th>
              <th className="px-6 py-4 text-right">Sotish narxi</th>
              <th className="px-6 py-4 text-right">Omborda</th>
              <th className="px-6 py-4 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products
              .filter((p) => {
                const search = searchTerm.toLowerCase();
                const nameMatch = p.name?.toLowerCase().includes(search);
                const ownerMatch = p.owner_name?.toLowerCase().includes(search);
                return nameMatch || ownerMatch;
              })
              .map((product, index) => (
                <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">{index + 1}</td>
                  {user?.is_superuser && (
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      @{product.owner_name}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <Package size={18} />
                      </div>
                      <span className="font-bold text-slate-700">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{product.barcode}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                        {product.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {Number(product.purchase_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-orange-600">
                    {Number(product.sale_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">
                    {Number(product.stock_count).toLocaleString()}dona
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openModal(product)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">
                {selectedProduct ? "Tahrirlash" : "Yangi Mahsulot"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-4">
              
              {/* KATEGORIYA */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Kategoriya</label>
                <select
                  className="w-full p-3 bg-slate-50 border border-slate-400 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Tanlang...</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* OWNER (Faqat Superadmin ko'radi) */}
              {user?.is_superuser && (
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Do'kon Egasi</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    required
                  >
                    <option value="">Tanlang...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.username} {u.is_superuser ? "(Admin)" : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* MAHSULOT NOMI VA SHTRIX KOD */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nomi</label>
                <input
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Shtrix-kod</label>
                <input
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              {/* NARXLAR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Kelish Narxi</label>
                <input
                  type="number"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sotish Narxi</label>
                <input
                  type="number"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>

              {/* BUTTONS */}
              <div className="col-span-2 flex gap-3 mt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-700">Bekor qilish</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 font-bold rounded-xl text-white shadow-lg">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;