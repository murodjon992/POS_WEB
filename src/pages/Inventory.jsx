import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit3, Package, X, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../api/api';

const Inventory = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [alerts, setAlerts] = useState({ out_of_stock: 0, low_stock: 0 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Miqdor uchun state
  const [quantityToAdd, setQuantityToAdd] = useState("");

  // 1. Ma'lumotlarni yuklash (Kategoriya filtri bilan)
  const fetchInventory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        search: searchTerm,
        category: categoryFilter, // Backendda bu "category" nomi bilan kutilayotgan bo'lishi kerak
      };
      
      const res = await api.get('/inventory/', { params });
      
      // DRF Pagination va sening backend formatingga moslash
      let productsData = [];
      if (res.data.results) {
        if (res.data.results.results) {
          productsData = res.data.results.results;
          if (res.data.results.alerts) setAlerts(res.data.results.alerts);
        } else {
          productsData = res.data.results;
        }
      } else {
        productsData = res.data;
      }

      setProducts(productsData);

      if (res.data.count) {
        setTotalPages(Math.ceil(res.data.count / 20));
      }
      setCurrentPage(page);
    } catch (err) {
      console.error("Yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  // Effektlar
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => fetchInventory(1), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, categoryFilter, fetchInventory]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories/");
        setAllCategories(res.data);
      } catch (err) {
        console.error("Kategoriyalar yuklanmadi");
      }
    };
    loadCategories();
  }, []);

  // 2. Tahrirlash modalini ochish
  const openEditModal = (item) => {
    setSelectedProduct(item);
    setQuantityToAdd(""); // Yangi qo'shiladigan miqdorni bo'shatamiz
    setShowModal(true);
  };

  // 3. SAQLASH (Mobil kabi stock/add/ orqali)
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!quantityToAdd || isNaN(quantityToAdd)) {
      alert("Iltimos, miqdorni to'g'ri kiriting!");
      return;
    }

    try {
      // MOBIL ILOVADAGI MANTIQ: stock/add/ ga POST so'rovi
      await api.post("stock/add/", {
        barcode: selectedProduct.barcode,
        quantity: parseInt(quantityToAdd)
      });
      
      fetchInventory(currentPage); 
      setShowModal(false);
      alert("Ombor muvaffaqiyatli yangilandi!");
    } catch (err) {
      console.error("Saqlashda xato:", err.response?.data);
      alert("Xatolik! Saqlashda muammo yuz berdi.");
    }
  };

  return (
    <div className="space-y-6 p-2">
      
      {/* STATISTIKA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl"><Package size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Tugagan</p>
            <p className="text-2xl font-black text-slate-800">{alerts.out_of_stock}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertCircle size={24} /></div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Kam qolgan</p>
            <p className="text-2xl font-black text-slate-800">{alerts.low_stock}</p>
          </div>
        </div>
      </div>

      {/* FILTER VA QIDIRUV */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Qidiruv..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="bg-transparent outline-none text-sm font-bold text-slate-700"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Barcha kategoriyalar</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 text-xs font-black uppercase tracking-widest">
                <th className="px-6 py-4">T/R</th>
                <th className="px-6 py-4">Mahsulot</th>
                <th className="px-6 py-4 text-center">Soni</th>
                <th className="px-6 py-4 text-center">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p, i) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-sm">{(currentPage-1)*20 + i + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {p.product_name}
                    <p className="text-[10px] font-mono text-slate-400">{p.barcode}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      p.quantity <= 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.quantity} dona
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => openEditModal(p)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
        <span className="text-sm text-slate-500 font-medium">Sahifa {currentPage} / {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => fetchInventory(currentPage-1)} className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronLeft size={20} /></button>
          <button disabled={currentPage === totalPages} onClick={() => fetchInventory(currentPage+1)} className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* MODAL (STOCK ADD) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl">
            <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-black">Zahirani to'ldirish</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateStock} className="p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-600 mb-2">{selectedProduct?.product_name}</p>
                <input 
                  type="number" 
                  placeholder="Qancha qo'shmoqchisiz?"
                  className="w-full p-4 text-2xl font-black text-center bg-indigo-50 border-2 border-indigo-100 rounded-2xl outline-none focus:border-indigo-500"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">Bekor qilish</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;