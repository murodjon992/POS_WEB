import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, Package, Printer, Download, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/api";

const Products = ({ user }) => {
  // --- STATE-LAR ---
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]); // Doimo massiv bo'lib turishi uchun
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formData, setFormData] = useState({
    name: "", barcode: "", purchase_price: "", sale_price: "", category: "", owner: "",
  });

  // --- EFFEKTLAR ---
  useEffect(() => {
    fetchProducts(1);
    loadCategories();
  }, [user]);

  // Qidiruv effekti
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- MA'LUMOTLARNI YUKLASH ---
  const loadCategories = async () => {
    try {
      const res = await api.get("/categories/");
      setAllCategories(res.data || []);
    } catch (e) { console.error("Kategoriya xatosi",e); }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      
      const url = `/products/?page=${page}${searchTerm ? `&search=${searchTerm}` : ""}`;
      const res = await api.get(url);
      if (res.data && res.data.results) {
        setProducts(res.data.results); 
        setTotalItems(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 20));
      } else {
        setProducts([]); // Agar results bo'lmasa
      }
      setCurrentPage(page);
    } catch (err) {
      console.error("Xato:", err);
      setProducts([]); // Xato bo'lsa massivni bo'shatish (crash bo'lmasligi uchun)
    } finally {
      setLoading(false);
    }
  };

  // --- FUNKSIYALAR ---
  const handleDownloadPDF = async (ids = []) => {
    const targetIds = ids.length > 0 ? ids : products.map(p => p.id);
    if (targetIds.length === 0) { alert("Mahsulot tanlanmagan"); return; }
    
    setPdfLoading(true);
    try {
      const response = await api.post('print-barcodes/', { product_ids: targetIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shtrix_kodlar_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { alert("PDF generatsiya xatosi"); } finally { setPdfLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}/`, formData);
      } else {
        await api.post("/products/", { ...formData, owner: user?.id });
      }
      fetchProducts(currentPage);
      setShowModal(false);
    } catch (err) { alert("Saqlashda xato!"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("O'chirishni tasdiqlaysizmi?")) {
      await api.delete(`/products/${id}/`);
      fetchProducts(currentPage);
    }
  };

  const openModal = (product = null) => {
    setSelectedProduct(product);
    setFormData(product || { 
      name: "", barcode: "", purchase_price: "", sale_price: "", 
      category: allCategories[0]?.id || "", 
      owner: user?.id 
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-left">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Qidirish..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl outline-none focus:border-blue-500 border border-transparent focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => handleDownloadPDF(selectedIds)}
            disabled={pdfLoading || !products || products.length === 0}
            className="flex-1 md:flex-none bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-200"
          >
            {pdfLoading ? "Yuklanmoqda..." : <><Download size={19} /> PDF Export</>}
          </button>
          <button onClick={() => openModal()} className="flex-1 md:flex-none bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg">
            <Plus size={20} /> Qo'shish
          </button>
        </div>
      </div>

      {/* JADVAL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b border-slate-200">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setSelectedIds(e.target.checked ? products.map(p => p.id) : [])} 
                  />
                </th>
                <th className="px-6 py-4">Mahsulot nomi</th>
                <th className="px-6 py-4">Shtrix-kod</th>
                <th className="px-6 py-4 text-right">Narxi</th>
                <th className="px-6 py-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{product.name}</td>
                    <td className="px-6 py-4 font-mono text-sm">{product.barcode}</td>
                    <td className="px-6 py-4 text-right font-black">{Number(product.sale_price).toLocaleString()}</td>
                    <td className="px-6 py-4 flex justify-center gap-1">
                      <button onClick={() => handleDownloadPDF([product.id])} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Printer size={16} /></button>
                      <button onClick={() => openModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Mahsulot topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-between items-center">
          <div className="text-sm text-slate-500">Jami: <span className="font-bold">{totalItems}</span></div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => fetchProducts(currentPage - 1)} 
              className="p-2 bg-white border rounded-xl disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold px-4">Sahifa {currentPage} / {totalPages}</span>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => fetchProducts(currentPage + 1)} 
              className="p-2 bg-white border rounded-xl disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL (Agar modal kodingiz bo'lsa shu yerga qo'ying) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-2xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{selectedProduct ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
              {/* Modal formasi bu yerda bo'ladi */}
              <button onClick={() => setShowModal(false)} className="mt-4 text-red-500">Yopish</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Products;