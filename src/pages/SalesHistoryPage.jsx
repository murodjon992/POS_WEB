import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, RotateCcw, X, Users } from 'lucide-react';
import api from '../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const SalesHistoryPage = () => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);

  // Vozvrat States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [returnQty, setReturnQty] = useState(1);

  // 1. Avval asosiy savdo ma'lumotlarini olamiz
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-history', date, selectedSeller],
    queryFn: async () => {
      const res = await api.get(`/sales-history/?date=${date}&seller_id=${selectedSeller}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const sales = salesData?.sales || [];
  const isOwner = salesData?.is_owner || false;

  // 2. Sotuvchilar ro'yxatini olish (Faqat Owner uchun)
  const { data: sellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const res = await api.get('/my-sellers/');
      return res.data;
    },
    enabled: isOwner, 
  });

  const executeReturn = async () => {
    if (returnQty <= 0 || returnQty > returnItem.remaining_qty) {
      toast.error("Miqdor xato kiritildi");
      return;
    }
    try {
      await api.post('/return-product/', {
        sale_id:returnSale.id,
        payment_method: returnSale.payment_method,
        customer_id: returnSale.customer,
        items: [{ barcode: returnItem.barcode, quantity: returnQty }]
      });
      queryClient.invalidateQueries(['sales-history']);
      setShowReturnModal(false);
      toast.success("Muvaffaqiyatli qaytarildi");
    } catch (err) {
      console.log(err.response?.data);
      
      toast.error(err.response?.data?.message || "Vozvratda xatolik");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-4xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Savdolar Tarixi</h1>
          <p className="text-slate-500 text-sm">Barcha amalga oshirilgan sotuvlar jurnali</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Seller Filter (Faqat Owner uchun) */}
          {isOwner && (
            <div className="relative flex-1 md:flex-none">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="pl-11 pr-10 py-3 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700 w-full md:min-w-50"
              >
                <option value="">Barcha sotuvchilar</option>
                {sellers?.map(s => (
                  <option key={s.id} value={s.id}>{s.username}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          )}

          {/* Date Filter */}
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-12 pr-6 py-3 bg-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Yuklanmoqda...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-4xl text-slate-300 font-bold text-xl border-2 border-dashed border-slate-100">
            Savdolar topilmadi
          </div>
        ) : (
          sales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-4xl shadow-sm overflow-hidden border border-slate-100 mb-4 transition-all hover:shadow-md">
              <div 
                onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${
                  expandedSale === sale.id ? 'bg-slate-50' : 'hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                    sale.payment_method === 'cash' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    #{sale.daily_id}
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-800">
                        {sale.payment_method === 'debt' ? (sale.customer_name || "Noma'lum Mijoz") : "Umumiy mijoz"}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          sale.payment_method === 'cash' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {sale.payment_method === 'cash' ? 'Naqd' : 'Nasiya'}
                        </span>

                        {sale.is_returned ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-slate-900 text-white">To'liq Qaytarildi</span>
                        ) : (
                          <>
                            {sale.payment_method === 'debt' && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${sale.is_paid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {sale.is_paid ? "To'landi" : "Qarz"}
                              </span>
                            )}
                            {isOwner && sale.seller_name && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-blue-50 text-blue-500 border border-blue-100">
                                Kassir: {sale.seller_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1 italic">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 leading-none">{Number(sale.total_amount).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">so'm</p>
                  </div>
                  {expandedSale === sale.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </div>

              {expandedSale === sale.id && (
                <div className="px-5 pb-5 pt-2 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                   {/* Table qismi o'zgarishsiz qoladi */}
                   <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-3">Mahsulot</th>
                          <th className="py-3 text-center">Soni</th>
                          <th className="py-3 text-right">Narx</th>
                          <th className="py-3 text-right w-10">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sale.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-4">
                              <p className={`font-bold ${item.remaining_qty === 0 ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.product_name}</p>
                              {item.returned_qty > 0 && (
                                <span className="text-[10px] font-black text-rose-500">- {item.returned_qty} qaytarilgan</span>
                              )}
                            </td>
                            <td className="py-4 text-center font-black">{item.remaining_qty} dona</td>
                            <td className="py-4 text-right font-black">{Number(item.price_at_time).toLocaleString()}</td>
                            <td className="py-4 text-right">
                              {item.remaining_qty > 0 && (
                                <button onClick={() => { setReturnSale(sale); setReturnItem(item); setReturnQty(1); setShowReturnModal(true); }} className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all">
                                  <RotateCcw size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Vozvrat Modal qismini o'zingizning kodingizdan qo'shib qo'ying (o'zgarmagan) */}
      {showReturnModal && returnItem && (
          /* Modal kodi o'zgarishsiz qoladi... */
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 flex items-center justify-center p-4">
             {/* ... Modalingizni shu yerga qo'ying ... */}
             <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                <div className="px-8 py-6 bg-rose-600 text-white relative">
                   <button onClick={() => setShowReturnModal(false)} className="absolute right-6 top-6 hover:bg-white/20 rounded-full p-2"><X size={20} /></button>
                   <h3 className="text-2xl font-black">Vozvrat qilish</h3>
                </div>
                <div className="p-8 space-y-6">
                   {/* Modal content... */}
                   <button onClick={executeReturn} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-wider hover:bg-rose-600 transition-all">Vozvratni tasdiqlash</button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;