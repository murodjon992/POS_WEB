import React, { useState } from 'react';
import { Search, Eye, DollarSign, RotateCcw, X, ArrowDownLeft, ArrowUpRight, AlertCircle, UserCircle, ShoppingBag } from 'lucide-react';
import api from '../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const DebtorsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modallar holati
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Tanlangan ma'lumotlar
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [debtorDetails, setDebtorDetails] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  
  // Form ma'lumotlari
  const [payAmount, setPayAmount] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);

  // --- 1. React Query orqali Mijozlarni yuklash ---
  const { data: debtors = [], isLoading } = useQuery({
    queryKey: ['debtors'],
    queryFn: async () => {
      const res = await api.get('/customers/');
      return res.data;
    }
  });

  // --- 2. Qarz To'lash Funksiyasi ---
  const handlePayDebt = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      toast.warning("Summani to'g'ri kiriting");
      return;
    }

    setLoadingAction(true);
    try {
      await api.post(`/pay-customer-debt/${selectedDebtor.id}/`, { amount: payAmount });
      
      // Keshni yangilaymiz - Bu avtomatik ravishda ro'yxatni yangilaydi
      await queryClient.invalidateQueries(['debtors']);
      await queryClient.invalidateQueries(['owner-dashboard']);
      await queryClient.invalidateQueries(['daily-summary']);

      setShowPayModal(false);
      setPayAmount("");
      toast.success("To'lov qabul qilindi! 💰");
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoadingAction(false);
    }
  };

  // --- 3. Tarixni yuklash ---
  const openHistory = async (debtor) => {
    setSelectedDebtor(debtor);
    setShowHistoryModal(true);
    try {
      const res = await api.get(`/debtor-sales/${debtor.id}/`);
      setDebtorDetails(res.data);
    } catch (err) {
      toast.error("Tarixni yuklab bo'lmadi");
    }
  };

  // --- 4. Vozvratni Yakunlash ---
  const handleReturnSubmit = async () => {
    if (!selectedItem || returnQty <= 0) return;

    setLoadingAction(true);
    try {
      const payload = {
        customer_id: selectedDebtor.id,
        payment_method: 'debt',
        sale_id: selectedItem.stoc_log, 
        items: [{
          barcode: selectedItem.barcode,
          quantity: returnQty
        }]
      };

      await api.post('/return-product/', payload);
      
      // Hamma kerakli keshni tozalaymiz
      await queryClient.invalidateQueries(['debtors']);
      await queryClient.invalidateQueries(['products']);
      await queryClient.invalidateQueries(['owner-dashboard']);
      
      toast.success("Muvaffaqiyatli qaytarildi");
      setShowReturnModal(false);
      setShowHistoryModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Vozvratda xatolik");
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><ArrowUpRight size={32} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Umumiy Nasiyalar</p>
            <h3 className="text-3xl font-black text-slate-800">
              {debtors.reduce((a, b) => a + Number(b.total_debt), 0).toLocaleString()} so'm
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><UserCircle size={32} /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Qarzdorlar soni</p>
            <h3 className="text-3xl font-black text-slate-800">{debtors.length} ta mijoz</h3>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800">Qarzdorlar</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Qidirish..." 
              className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl w-full md:w-96 outline-none font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-20 text-center text-slate-400 font-bold animate-pulse text-xl">Yuklanmoqda...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Mijoz</th>
                  <th className="px-8 py-5">Telefon</th>
                  <th className="px-8 py-5 text-right">Mavjud Qarz</th>
                  <th className="px-8 py-5 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDebtors.map((d) => (
                  <tr key={d.id} className="hover:bg-indigo-50/30 transition-all">
                    <td className="px-8 py-5 font-black text-slate-700 text-lg">{d.name}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{d.phone || '—'}</td>
                    <td className="px-8 py-5 text-right font-black text-xl text-rose-600">
                      {Number(d.total_debt).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-center flex items-center justify-center gap-3">
                      <button onClick={() => openHistory(d)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold">
                        <Eye size={18} /> Tarix
                      </button>
                      <button onClick={() => { setSelectedDebtor(d); setShowPayModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-bold">
                        <DollarSign size={18} /> Pul olish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- MODAL: QARZ TO'LASH --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Qarz uzish</h3>
              <button onClick={() => setShowPayModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            
            <div className="bg-rose-50 p-5 rounded-3xl mb-6 border border-rose-100">
              <p className="text-xs font-black text-rose-400 uppercase mb-1">Maksimal qarz:</p>
              <p className="text-3xl font-black text-rose-600">{Number(selectedDebtor?.total_debt).toLocaleString()} so'm</p>
            </div>

            <input 
              type="number"
              className={`w-full p-5 rounded-2xl border-2 text-2xl font-black outline-none transition-all ${Number(payAmount) > Number(selectedDebtor?.total_debt) ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50 focus:border-indigo-500'}`}
              placeholder="Summani kiriting..."
              value={payAmount}
              autoFocus
              onChange={(e) => setPayAmount(e.target.value)}
            />

            {Number(payAmount) > Number(selectedDebtor?.total_debt) && (
              <div className="mt-3 flex items-center gap-2 text-rose-500 font-bold text-sm bg-rose-50 p-3 rounded-xl">
                <AlertCircle size={18}/> <span>Haqiqiy qarzdan ko'p kiritildi!</span>
              </div>
            )}

            <button 
              disabled={loadingAction || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > Number(selectedDebtor?.total_debt)}
              onClick={handlePayDebt}
              className="w-full mt-8 py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all disabled:bg-slate-200 uppercase tracking-widest"
            >
              {loadingAction ? "Bajarilmoqda..." : "Tasdiqlash"}
            </button>
          </div>
        </div>
      )}

    {/* --- MODAL: TARIX (To'lovlar va Savdolar) --- */}
{showHistoryModal && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      
      {/* Modal Header */}
      <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black tracking-tight">{selectedDebtor?.name}</h3>
          <p className="text-indigo-100 text-sm font-medium">Barcha amallar va nasiya savdolari</p>
        </div>
        <button onClick={() => setShowHistoryModal(false)} className="p-3 hover:bg-white/20 rounded-2xl transition-colors">
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHAP TOMON: AMALLAR LOGLARI (To'lovlar va Vozvratlar) */}
        <div className="space-y-4">
          <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <DollarSign className="text-emerald-500" /> Amallar Tarixi
          </h4>
          
          <div className="space-y-3">
            {debtorDetails?.logs?.length > 0 ? (
              debtorDetails.logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      log.type === 'pay' ? 'bg-emerald-50 text-emerald-600' : 
                      log.type === 'return' ? 'bg-orange-50 text-orange-600' : 
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {log.type === 'pay' ? <ArrowDownLeft size={20}/> : 
                       log.type === 'return' ? <RotateCcw size={20}/> : 
                       <ShoppingBag size={20} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">
                        {log.type === 'pay' ? "Qarz to'landi" : 
                         log.type === 'return' ? "Mahsulot qaytarildi" : 
                         "Nasiya savdo"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(log.created_at).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${log.type === 'pay' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.type === 'pay' ? '-' : '+'} {Number(log.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 font-bold bg-white rounded-2xl border-2 border-dashed border-slate-200">Amallar topilmadi</p>
            )}
          </div>
        </div>

        {/* O'NG TOMON: SAVDOLAR VA TOVARLAR */}
        <div className="space-y-4">
          <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <ShoppingBag className="text-indigo-500" /> Nasiya Savdolar
          </h4>

          <div className="space-y-4">
            {debtorDetails?.sales?.length > 0 ? (
              debtorDetails.sales.map((sale) => (
                <div key={sale.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="py-3 px-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Savdo #{sale.daily_id || sale.id}</span>
                    <span className="font-black text-indigo-600">{Number(sale.total_amount).toLocaleString()} so'm</span>
                  </div>
                  <div className="p-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 font-black uppercase text-[9px]">
                          <th className="pb-2 text-left">Mahsulot</th>
                          <th className="pb-2 text-center">Soni</th>
                          <th className="pb-2 text-right">Vozvrat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sale.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 font-bold text-slate-700">{item.product_name}</td>
                            <td className="py-2 text-center font-black text-slate-500">{item.remaining_qty} ta</td>
                            <td className="py-2 text-right">
                              {item.remaining_qty > 0 && (
                                <button 
                                  onClick={() => { setSelectedItem({ ...item, stoc_log: sale.id}); setReturnQty(1); setShowReturnModal(true); }}
                                  className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-slate-400 font-bold bg-white rounded-2xl border-2 border-dashed border-slate-200">Savdolar yo'q</p>
            )}
          </div>
        </div>

      </div>
    </div>
  </div>
)}
    

      {/* --- MODAL: VOZVRAT SONI --- */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center">Vozvrat miqdori</h3>
            <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl mb-8">
               <button onClick={() => setReturnQty(prev => Math.max(1, prev - 1))} className="w-12 h-12 bg-white rounded-xl font-black text-xl shadow-sm">-</button>
               <input 
                type="number"
                className="flex-1 bg-transparent text-center text-2xl font-black outline-none"
                value={returnQty}
                onChange={(e) => setReturnQty(Math.min(selectedItem.remaining_qty, Math.max(1, Number(e.target.value))))}
               />
               <button onClick={() => setReturnQty(prev => Math.min(selectedItem.remaining_qty, prev + 1))} className="w-12 h-12 bg-white rounded-xl font-black text-xl shadow-sm">+</button>
            </div>
            <button 
              onClick={handleReturnSubmit}
              disabled={loadingAction}
              className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest active:scale-95 transition-transform"
            >
              {loadingAction ? "..." : "Vozvratni Yakunlash"}
            </button>
            <button onClick={() => setShowReturnModal(false)} className="w-full mt-3 text-slate-400 font-bold text-sm">Bekor qilish</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorsPage;