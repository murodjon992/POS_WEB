import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Package, Printer, Download } from "lucide-react";
import api from "../api/api";

const Products = ({ user }) => {
  const [allCategories, setAllCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false); // PDF uchun alohida loading
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]); // Bir nechta mahsulotni tanlash uchun

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    category: "",
    owner: "",
  });

  // PDF YUKLASH FUNKSIYASI
  const handleDownloadPDF = async (ids = []) => {
    if (ids.length === 0) {
        alert("Iltimos, mahsulot tanlang yoki barchasini yuklash tugmasini bosing");
        return;
    }
    setPdfLoading(true);
    try {
      const response = await api.post('print-barcodes/', 
        { product_ids: ids }, 
        { responseType: 'blob',
          headers: {
           'Content-Type': 'application/json', // Yuborilayotgan ma'lumot turi
            'Accept': 'application/pdf, */*'
          }
         } 
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
     const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shtrix_kodlar_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSelectedIds([]); // Yuklangandan keyin tanlovni tozalash
    } catch (error) {
      console.error("PDF yuklashda xato:", error);
      alert("Shtrix-kod generatsiya qilishda xatolik yuz berdi");
    } finally {
      setPdfLoading(false);
    }
  };

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
        owner: user?.is_superuser ? "" : user?.id,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      category: formData.category ? parseInt(formData.category) : null,
      owner: formData.owner ? parseInt(formData.owner) : (user?.is_superuser ? null : user?.id)
    }
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}/`, dataToSend);
      } else {
        await api.post("/products/", dataToSend);
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

  // Qidiruv filtri
  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(search);
    const ownerMatch = p.owner_name?.toLowerCase().includes(search);
    return nameMatch || ownerMatch;
  });

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={user?.is_superuser ? "Nomi yoki Do'kon nomi..." : "Mahsulot qidirish..."}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Ommaviy Print Tugmasi */}
          <button
            onClick={() => handleDownloadPDF(selectedIds.length > 0 ? selectedIds : filteredProducts.map(p => p.id))}
            disabled={pdfLoading || filteredProducts.length === 0}
            className="flex-1 md:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-indigo-200"
          >
            {pdfLoading ? "..." : <Download size={19} />} 
            {selectedIds.length > 0 ? `Tanlanganlar (${selectedIds.length})` : "Barchasini PDF"}
          </button>

          <button
            onClick={() => openModal()}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus size={20} /> Mahsulot Qo'shish
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 w-10">
                    <input 
                        type="checkbox" 
                        className="rounded accent-blue-600"
                        onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filteredProducts.map(p => p.id));
                            else setSelectedIds([]);
                        }}
                    />
                </th>
                <th className="px-6 py-4">Mahsulot</th>
                {user?.is_superuser && <th className="px-6 py-4">Do'kon</th>}
                <th className="px-6 py-4">Shtrix-kod</th>
                <th className="px-6 py-4">Kategoriya</th>
                <th className="px-6 py-4 text-right">Sotish narxi</th>
                <th className="px-6 py-4 text-right">Ombor</th>
                <th className="px-6 py-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        className="rounded accent-blue-600"
                        onChange={() => {
                            setSelectedIds(prev => prev.includes(product.id) 
                                ? prev.filter(id => id !== product.id) 
                                : [...prev, product.id]
                            );
                        }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Package size={18} />
                      </div>
                      <span className="font-bold text-slate-700">{product.name}</span>
                    </div>
                  </td>
                  {user?.is_superuser && (
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-mono">
                         @{product.owner_name}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 font-mono text-sm text-slate-500">{product.barcode}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {product.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">
                    {Number(product.sale_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${product.stock_count > 5 ? 'text-green-600' : 'text-red-500'}`}>
                        {Number(product.stock_count).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* INDIVIDUAL PRINT TUGMASI */}
                      <button 
                        onClick={() => handleDownloadPDF([product.id])} 
                        className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-colors"
                        title="PDF chiqarish"
                      >
                        <Printer size={16} />
                      </button>
                      <button onClick={() => openModal(product)} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL QISMI (O'zgarmadi, yuqoridagi onSubmit logic yangilandi) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden scale-in duration-300">
            <div className="px-8 py-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                {selectedProduct ? "Tahrirlash" : "Yangi Mahsulot"}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-red-500 hover:text-white rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-5">
              {/* Form elementlari o'zgarmagan holda qoladi... */}
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Kategoriya</label>
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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

              {user?.is_superuser && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Do'kon Egasi</label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    required
                  >
                    <option value="">Tanlang...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.username} {u.is_superuser ? "👑" : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Mahsulot Nomi</label>
                <input
                  required
                  placeholder="Masalan: Coca-Cola 1.5L"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="col-span-2 text-left">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Shtrix-kod</label>
                <input
                  required
                  placeholder="Barcode skanerlang yoki yozing"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Kelish Narxi</label>
                <input
                  type="number"
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Sotish Narxi</label>
                <input
                  type="number"
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex gap-3 mt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-4 bg-slate-100 font-black rounded-2xl text-slate-500 hover:bg-slate-200 transition-colors">BEKOR QILISH</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 font-black rounded-2xl text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">SAQLASH</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;