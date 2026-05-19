import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit3, Package, X, AlertCircle, ChevronLeft, ChevronRight, Filter, Plus, UserPlus } from 'lucide-react';
import api from '../api/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const Inventory = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', currentPage, searchTerm, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/inventory/', { 
        params: { page: currentPage, search: searchTerm, category: categoryFilter } 
      });
      return res.data;
    },
    keepPreviousData: true, // Sahifa almashganda qotib qolmaslik uchun
  });
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get("/categories/").then(res => res.data)
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get("/suppliers/").then(res => res.data)
  });

  const stockInMutation = useMutation({
    mutationFn: async (data) => {
      let { supplierId } = data;
      if (data.paymentMethod === 'supplier_debt' && data.isNewSupplier) {
        const res = await api.post("/suppliers/", { name: data.newSupplierName, phone: data.newSupplierPhone});
        supplierId = res.data.id;
      }
      return api.post("/stock-in/", {
        barcode: data.barcode,
        quantity: parseInt(data.quantity),
        payment_method: data.paymentMethod,
        supplier_id: supplierId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory']); // Inventoryni yangilash
      queryClient.invalidateQueries(['suppliers']); // Supplierlar ro'yxatini yangilash
      setShowModal(false);
      resetForm();
      toast.success("Operatsiya muvaffaqiyatli yakunlandi!");
    },
    onError: () => toast.error("Xatolik yuz berdi!")
  });

  const products = inventoryData?.results?.results || inventoryData?.results || [];
  const alerts = inventoryData?.alerts || { out_of_stock: 0, low_stock: 0 };
  const totalPages = inventoryData?.count ? Math.ceil(inventoryData.count / 20) : 1;

const handleUpdateStock = (e) => {
    e.preventDefault();
    stockInMutation.mutate({
      barcode: selectedProduct.barcode,
      quantity: quantityToAdd,
      paymentMethod,
      isNewSupplier,
      newSupplierName,
      newSupplierPhone,
      supplierId: selectedSupplier
    });
  };

  const resetForm = () => {
    setQuantityToAdd("");
    setPaymentMethod("cash");
    setSelectedSupplier("");
    setIsNewSupplier(false);
    setNewSupplierName("");
    setNewSupplierPhone("");
  };

  if (isLoading) return <div className="p-10 text-center font-black animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className="space-y-3 p-4 max-w-10xl mx-auto">
      {/* STATISTIKA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-red-50 text-red-500 rounded-2xl"><Package size={28} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tugagan mahsulotlar</p>
            <p className="text-3xl font-black text-slate-800">{alerts.out_of_stock}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><AlertCircle size={28} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kam qolganlar</p>
            <p className="text-3xl font-black text-slate-800">{alerts.low_stock}</p>
          </div>
        </div>
      </div>

      {/* QIDIRUV VA FILTR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Mahsulot nomi yoki shtrix-kod..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl min-w-60">
          <Filter size={20} className="text-slate-400" />
          <select 
            className="w-full bg-transparent outline-none font-bold text-slate-700"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Barcha kategoriyalar</option>
            {allCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                <th className="px-8 py-5 text-left">T/R</th>
                <th className="px-8 py-5 text-left">Mahsulot</th>
                <th className="px-8 py-5 text-center">Narxi (Kirim/Sotish)</th>
                <th className="px-8 py-5 text-center">Zaxira</th>
                <th className="px-8 py-5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {products.map((p,index) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6">{ index + 1}</td>
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-800">{p.product_name}</p>
                    <p className="text-[14px] font-mono text-slate-400 mt-1">{p.barcode}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs">{Number(p.purchase_price).toLocaleString()}</span>
                      <span className="font-black text-indigo-600">{Number(p.sale_price).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full font-black text-xs ${
                      p.quantity <= 0 ? 'bg-red-50 text-red-500' : p.quantity <= 10 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {p.quantity} dona
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => { setSelectedProduct(p); setShowModal(true); }}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-sm font-bold text-slate-400">Sahifa {currentPage} / {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"><ChevronLeft /></button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all"><ChevronRight /></button>
        </div>
      </div>

      {/* KIRIM MODALI */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Kirim qilish</h3>
                <p className="text-indigo-500 font-bold text-sm italic">{selectedProduct?.product_name}</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleUpdateStock} className="p-8 space-y-5">
              {/* Miqdor */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miqdor (dona)</label>
                <input 
                  type="number" 
                  className="w-full mt-2 p-5 text-3xl font-black text-center bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(e.target.value)}
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>

              {/* To'lov turi */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-3xl">
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod("cash")}
                  className={`py-3 rounded-[1.2rem] font-black text-xs transition-all ${paymentMethod === 'cash' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  NAQD KASSA
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentMethod("supplier_debt")}
                  className={`py-3 rounded-[1.2rem] font-black text-xs transition-all ${paymentMethod === 'supplier_debt' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}
                >
                  NASIYA (QARZ)
                </button>
              </div>

              {/* Supplier qismi (faqat nasiya bo'lsa) */}
              {paymentMethod === 'supplier_debt' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  {isNewSupplier ?  (
                    <div className=" gap-2">
                      <div>
                      <input 
                        type="text"
                        placeholder="Yetkazib beruvchi nomi..."
                        className="flex-1 p-3 mb-3 w-full  border border-slate-500 rounded-2xl outline-none font-medium"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        autoFocus
                        />
                        </div>
                        <div>
                      <input type="text" placeholder="Telefon raqami..."
      className="w-full p-3 bg-white border border-slate-500 rounded-2xl outline-none font-bold text-slate-700 focus:border-amber-400 transition-all"
      value={newSupplierPhone}onChange={(e) => setNewSupplierPhone(e.target.value)}/>
      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <select 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-slate-700 appearance-none"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        required={!isNewSupplier}
                      >
                        <option value="">Yetkazib beruvchini tanlang</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button 
                        type="button"
                        onClick={() => setIsNewSupplier(true)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <UserPlus size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest">
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;