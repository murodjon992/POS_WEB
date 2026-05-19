import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, ArrowDownCircle, ArrowUpCircle, X, ArrowDownLeft, ArrowUpRight, Truck, DollarSign, RotateCcw, Box } from 'lucide-react';
import api from '../api/api';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [loadingPay, setLoadingPay] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [foundProducts, setFoundProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [isCashReturn, setIsCashReturn] = useState(false);
  const [loadingReturn, setLoadingReturn] = useState(false);
  const [showAllPurchasesModal, setShowAllPurchasesModal] = useState(false);
  const [allPurchases, setAllPurchases] = useState([]);
  const [loadingAllPurchases, setLoadingAllPurchases] = useState(false);

  

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers/');
      setSuppliers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Xatolik:", err);
      setLoading(false);
    }
  };

  const fetchAllPurchases = async () => {
    setLoadingAllPurchases(true);
    try {
      const res = await api.get('/all-purchase-history/');
      setAllPurchases(res.data);
      setShowAllPurchasesModal(true);
    } catch (err) {
      alert("Kirimlar tarixini yuklab bo'lmadi!");
    } finally {
      setLoadingAllPurchases(false);
    }
  };

  const handleSupplierPayment = async () => {
    if (!payAmount || payAmount <= 0) return;
    setLoadingPay(true);
    try {
      const res = await api.post(`/pay-supplier-debt/${selectedSupplier.id}/`, { amount: payAmount });
      alert(res.data.status === 'deleted' ? "Qarz yopildi va yetkazib beruvchi o'chirildi" : "To'lov qabul qilindi");
      setShowPayModal(false);
      setPayAmount("");
      fetchSuppliers();
    } catch (err) { alert("Xatolik yuz berdi"); }
    finally { setLoadingPay(false); }
  };

  const openHistory = async (supplierId) => {
    setIsModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/supplier-history/${supplierId}/`);
      setSelectedHistory(res.data);
    } catch (err) {
      alert("Tarixni yuklashda xatolik!");
      setIsModalOpen(false);
    } finally { setLoadingHistory(false); }
  };

  const handleReturnSubmit = async () => {
    if (!selectedProduct || returnQty <= 0) return;
    setLoadingReturn(true);


    try {

      let url = '';
      if(selectedSupplier && selectedSupplier.id){
        url = `/suppliers/${selectedSupplier.id}/return/`
      } else {
        url = `/supplier-general-return/`
      }

      const response = await api.post(url, {
        barcode: selectedProduct.barcode,
        quantity: returnQty,
        is_cash: isCashReturn,
      });
      alert("Muvaffaqiyatli!");
      setShowReturnModal(false);
      fetchSuppliers();
    } catch (error) {
      const backendError = error.response?.data;
      console.log(backendError);
      
      if (error.response?.status === 500) {
        
        alert("Serverda jiddiy xato (500). PyCharm terminalini ko'r!");
      } else {
        const errorMsg = typeof backendError === 'object' ? JSON.stringify(backendError) : backendError;
        console.log(errorMsg);
        
        alert("Backenddan kelgan xato: " + errorMsg);
      }
    } finally {
      setLoadingReturn(false);
    }
  };

const handleSelectForReturn = (item) => {
    // --- KONSOLDA TEKSHIRISH ---
   
    
    // Mantiqiy cheklovni hisoblaymiz
    const stock = item.current_stock !== undefined ? item.current_stock : 0;
    const realLimit = Math.min(item.quantity, stock);
    
    
    if (stock < item.quantity) {
      console.warn("⚠️ Diqqat: Omborda fakturadagidan kam mahsulot qolgan!");
    }
    console.groupEnd();
    // ---------------------------

    setSelectedProduct({
      name: item.product_name,
      barcode: item.barcode,
      cost_price: item.purchase_price,
      maxQty: realLimit, 
      invoiceQty: item.quantity,
      stockQty: stock
    });
    setReturnQty(1);
    setShowReturnModal(true);
  };

  const resetReturnForm = () => {
    setSelectedProduct(null);
    setReturnQty(1);
    setReturnSearchTerm('');
    setFoundProducts([]);
  };

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalSupplierDebt = suppliers.reduce((acc, curr) => acc + Number(curr.total_debt_to_them), 0);

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Statistika kartalari */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white p-4 rounded-4xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><ArrowUpCircle size={28} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Umumiy Qarzimiz</p>
            <h3 className="text-3xl font-black text-slate-800">{totalSupplierDebt.toLocaleString()} so'm</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-4xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Truck size={28} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Yetkazib beruvchilar</p>
            <h3 className="text-3xl font-black text-slate-800">{suppliers.length} ta</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-4xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Box size={28} /></div>
          <div>
            <button onClick={fetchAllPurchases} className="flex items-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all font-bold">
              {loadingAllPurchases ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <RotateCcw size={20} />}
              Kirimlar Tarixi
            </button>
          </div>
        </div>
      </div>

      {/* Jadval qismi */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800">Yetkazib beruvchilar</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Qidirish..." className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-96 outline-none font-medium" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className='px-8 py-5'>T/R</th>
                <th className="px-8 py-5">Yetkazib beruvchi</th>
                <th className="px-8 py-5">Aloqa</th>
                <th className="px-8 py-5 text-right">Mavjud Qarz</th>
                <th className="px-8 py-5 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSuppliers.map((s, index) => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-5 text-slate-500">{index + 1}</td>
                  <td className="px-8 py-5 font-black text-slate-700 text-lg">{s.name}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{s.phone || '—'}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`font-black text-xl ${Number(s.total_debt_to_them) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {Number(s.total_debt_to_them).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center flex items-center justify-center gap-2">
                    <button onClick={() => { openHistory(s.id); setSelectedSupplier(s) }} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold">
                      <Eye size={18} /> Tarix
                    </button>
                    <button onClick={() => { setSelectedSupplier(s); setShowPayModal(true); }} className="bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white inline-flex p-2 rounded-xl shadow transition-all items-center gap-2 font-bold">
                      <DollarSign size={16} /> Pul berish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VOZVRAT MODAL OYNASI --- */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-120 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-3 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Mahsulotni qaytarish</h3>
                <p className="text-blue-100 text-xs">{selectedSupplier?.name}</p>
              </div>
              <button onClick={() => { setShowReturnModal(false); resetReturnForm(); }} className="p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
            </div>

            <div className="p-3 space-y-5">
              <div className="bg-blue-50 p-2 rounded-2xl border-2 border-blue-100">
                <p className="text-xs text-blue-500 font-black uppercase mb-1">Tanlangan mahsulot:</p>
                <h4 className="text-lg font-black text-blue-900">{selectedProduct?.name}</h4>
                <p className="text-sm font-bold text-blue-700">Narxi: {Number(selectedProduct?.cost_price).toLocaleString()} so'm</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* --- AQLLI MAXQTY ESLATMASI --- */}
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="flex justify-between text-[10px] font-black text-amber-700 uppercase">
                    <span>Fakturada: {selectedProduct?.invoiceQty} ta</span>
                    <span>Omborda: {selectedProduct?.stockQty} ta</span>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1 leading-tight">
                    * Maksimal qaytarish: <b>{selectedProduct?.maxQty} ta</b> (ombordagi qoldiqdan oshib bo'lmaydi)
                  </p>
                </div>

                <div>
                  <label className="text-[15px] font-bold text-slate-700 uppercase ml-2">Qaytarish miqdori:</label>
                  <input
                    type="number"
                    className={`w-full p-4 rounded-2xl font-bold outline-none border transition-all ${returnQty > selectedProduct?.maxQty ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-transparent focus:border-blue-500 text-slate-800'}`}
                    value={returnQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReturnQty(val === '' ? '' : Number(val))
                    }}
                  />
                  {returnQty > selectedProduct?.maxQty && (
                    <p className="text-[12px] text-rose-500 font-bold mt-1 ml-2 animate-bounce">
                      ⚠️ Mahsulot yetarli emas!
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[15px] font-black text-slate-700 uppercase ml-2">Qaytarish turi</label>
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" onChange={(e) => setIsCashReturn(e.target.value === 'true')}>
                    <option value="false">Qarzdan chegirish</option>
                    <option value="true">Naqd pul olish</option>
                  </select>
                </div>
                <div>
                  <label className="text-[20px] font-black text-slate-700 uppercase ml-2">Jami Summa:</label>
                  <p className='pl-3 text-[25px] font-bold text-blue-700'>{(selectedProduct?.cost_price * returnQty).toLocaleString()} so'm</p>
                </div>
              </div>

              <button
                onClick={handleReturnSubmit}
                disabled={loadingReturn || !returnQty || returnQty <= 0 || returnQty > selectedProduct?.maxQty}
                className={`w-full py-5 rounded-3xl font-black transition-all shadow-lg uppercase tracking-widest ${returnQty > selectedProduct?.maxQty ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-rose-200'}`}
              >
                {loadingReturn ? "Bajarilmoqda..." : "Vozvratni yakunlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TARIX MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-3 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-black">{loadingHistory ? "Yuklanmoqda..." : selectedHistory?.supplier_name}</h3>
                <p className="text-indigo-100 text-sm font-medium">Amallar tarixi</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/20 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {loadingHistory ? (
                <div className="flex flex-col items-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedHistory?.history.map((log) => (
                    <div key={log.id} className="mb-4 bg-white border border-slate-100 rounded-[1.8rem] shadow-sm overflow-hidden">
                      <div className="p-2 flex items-center justify-between bg-indigo-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${log.type === 'take' ? 'bg-amber-100 text-amber-600' : log.type === 'pay' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {log.type === 'take' ? <ArrowUpRight size={22} /> : log.type === 'pay' ? <ArrowDownLeft size={22} /> : <RotateCcw size={22} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{log.type === 'take' ? "Tovar kirimi" : log.type === 'pay' ? "To'lov qilindi" : "Vozvrat"}</p>
                            <p className="text-[10px] text-slate-600 font-bold tracking-widest">{log.created_at}</p>
                          </div>
                        </div>
                        <p className={`font-black text-xl ${log.type === 'take' ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {log.type === 'take' ? '+' : '-'} {Number(log.amount).toLocaleString()}
                        </p>
                      </div>
                      {log.items && log.items.length > 0 && (
                        <div className="px-4 pb-1">
                          <div className="pt-1 border-t border-dashed border-slate-200">
                            <table className="w-full text-[11px] font-bold text-slate-600">
                              <thead>
                                <tr className="uppercase tracking-tighter">
                                  <th className="py-2 text-left">Mahsulot</th>
                                  <th className="py-2 text-center">Soni</th>
                                  <th className="py-2 text-right">Amallar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {log.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2">{item.product_name}</td>
                                    <td className="py-2 text-center">{item.quantity} ta</td>
                                    <td className="py-2 text-right">
                                      {log.type === 'take' &&
                                        <button
                                          onClick={() => {
                                            const realLimit = Math.min(item.quantity, item.current_stock || item.quantity);
                                            setSelectedProduct({
                                              name: item.product_name,
                                              barcode: item.barcode,
                                              cost_price: item.purchase_price,
                                              maxQty: realLimit,
                                              invoiceQty: item.quantity,
                                              stockQty: item.current_stock || item.quantity
                                            });
                                            setReturnQty(1);
                                            setShowReturnModal(true);
                                            setIsModalOpen(false);
                                            handleSelectForReturn(item)
                                          }}
                                          className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-200 rounded-lg transition-colors">
                                          Qaytarish <RotateCcw size={14} />
                                        </button>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t flex justify-between items-center">
              <span className="text-slate-600 font-black text-xs uppercase">Joriy qarz:</span>
              <span className="text-3xl font-black text-red-700">{Number(selectedHistory?.total_debt_to_them).toLocaleString()} so'm</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TO'LOV MODALI --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-110 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-linear-to-br from-orange-500 to-amber-600 text-white relative">
              <button onClick={() => setShowPayModal(false)} className="absolute right-4 top-4 hover:bg-white/20 rounded-full p-1"><X size={20} /></button>
              <h3 className="text-xl font-bold">Yetkazib beruvchiga to'lov</h3>
              <p className="opacity-90">{selectedSupplier?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-900 font-black">
                <p className="text-xs text-amber-600 uppercase font-bold">Bizning qarzimiz</p>
                <p className="text-2xl">{Number(selectedSupplier?.total_debt_to_them).toLocaleString()} so'm</p>
              </div>
              <input type="number" className="w-full p-4 bg-slate-100 rounded-xl text-xl font-bold outline-none" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Beriladigan summa" />
              <button onClick={handleSupplierPayment} disabled={loadingPay || !payAmount} className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-orange-700">
                {loadingPay ? "YUBORILMOQDA..." : "TO'LOVNI TASDIQLASH"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BARCHA KIRIMLAR MODALI --- */}
      {showAllPurchasesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-130 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-widest">Barcha tovar kirimlari tarixi</h3>
              <button onClick={() => setShowAllPurchasesModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-4">Sana</th>
                    <th className="py-4 px-4">Mahsulot</th>
                    <th className="py-4 px-4">Yetkazib beruvchi</th>
                    <th className="py-4 px-4 text-center">Soni</th>
                    <th className="py-4 px-4">Turi</th>
                    <th className="py-4 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPurchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-slate-500">{item.date}</td>
                      <td className="py-4 px-4 font-black text-slate-700">{item.product_name}</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{item.supplier_name}</td>
                      <td className="py-4 px-4 text-center font-bold text-indigo-600">{item.quantity} ta</td>
                      <td className="py-4 px-4 text-[10px] font-black uppercase">
                        <span className={item.payment_method === 'cash' ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded' : 'text-red-600 bg-red-50 px-2 py-1 rounded'}>
                          {item.payment_method === 'cash' ? 'Naqd' : 'Qarz'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            const stock = item.current_stock !== undefined ? Number(item.current_stock) : 0;
                            const invoiceQty = Number(item.quantity);
                            const realLimit = Math.min(invoiceQty, stock);
                            
                            setSelectedSupplier({ id: item.supplier_id, name: item.supplier_name });
                            setSelectedProduct({
                              name: item.product_name,
                              barcode: item.barcode,
                              cost_price: item.purchase_price,
                              maxQty: realLimit,
                              invoiceQty: invoiceQty,
                              stockQty: item.current_stock || item.quantity
                            });
                            setShowReturnModal(true);
                            setShowAllPurchasesModal(false);
                          }}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                        >
                          <RotateCcw size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;