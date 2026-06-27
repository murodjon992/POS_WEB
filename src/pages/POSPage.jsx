import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { ShoppingCart, Search, Trash2, CreditCard, User, X, UserPlus, Plus, Minus, Package, Clock, DollarSign, UserIcon, LogOut, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const formatMoney = (amount) => {
  return Number(amount).toLocaleString().replace(/\s/g, ' ');
};

const POSPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCat, setSelectedCat] = useState(null);
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const searchInputRef = useRef(null);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get('/categories/').then(res => res.data.results || res.data)
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products', searchTerm, selectedCat],
        queryFn: async () => {
            let url = `/products/?search=${searchTerm}`;
            if (selectedCat) url += `&category=${selectedCat}`;
            
            const res = await api.get(url);
            const data = res.data.results || res.data;
            
            if (searchTerm && data.length === 1 && data[0].barcode === searchTerm) {
              addToCart(data[0]);
              setSearchTerm(''); 
            }

            return data;
        },
        keepPreviousData: true,
    });

    const { data: customers = [] } = useQuery({
        queryKey: ['debtors'],
        queryFn: () => api.get('/debtors/').then(res => res.data.results || res.data),
    });

    const { data: salesHistoryData } = useQuery({
        queryKey: ['sales-history'],
        queryFn: () => api.get('/sales-history/').then(res => res.data),
    });
    
    const user = JSON.parse(localStorage.getItem('user_data'));
    const isSeller = user?.role === 'seller';
    const salesHistory = salesHistoryData?.sales || [];
    const nextDailyId = salesHistoryData?.next_daily_id || 1;

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
    };

    const handleSaveCustomerLocal = () => {
        if (!newCustomer.name || !newCustomer.phone) {
            return alert("Ism va telefonni kiriting!");
        }
        setSelectedCustomer({ id: null, name: newCustomer.name, phone: newCustomer.phone, isNew: true });
        setIsCustomerModalOpen(false);
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
          setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
          setCart([...cart, { ...product, qty: 1 }]);
        }
        setSearchTerm('');
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
    
    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : item;
          }
          return item;
        }));
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.sale_price * item.qty), 0);

    const printReceiptWithQZ = async (cart, totalPrice, paymentMethod, customerName, nextDailyId) => {
      try {
        const qz = await window.loadQZTray();
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }

        const possibleIPs = ['192.168.100.25', '192.168.1.25'];
        let activeConfig = null;

        for (let ip of possibleIPs) {
          try {
            let testConfig = qz.configs.create({ host: ip, port: 9100 });
            activeConfig = testConfig;
            break;
          } catch (e) {}
        }

        if (!activeConfig) {
          activeConfig = qz.configs.create({ host: '192.168.100.25', port: 9100 });
        }

        const ESC = '\x1B';
        const GS = '\x1D';
        
        const cleanText = (text) => {
          if (!text) return '';
          return text
            .replace(/o‘/g, 'o').replace(/O‘/g, 'O')
            .replace(/o'/g, 'o').replace(/O'/g, 'O')
            .replace(/g‘/g, 'g').replace(/G‘/g, 'G')
            .replace(/g'/g, 'g').replace(/G'/g, 'G')
            .replace(/sh/g, 'sh').replace(/SH/g, 'SH')
            .replace(/ch/g, 'ch').replace(/CH/g, 'CH');
        };

        let printData = [
          `${ESC}@`, 
          `${ESC}a\x01`, 
          `${GS}!\x11`,  
          "BARAKA POS\n\n",
          `${GS}!\x00`,  
          "BUYURTMA (CHEK) RAQAMI:\n",
          `${ESC}E\x01`, 
          `${GS}!\x22`,  
          `#${nextDailyId}\n\n`,
          `${GS}!\x00`,  
          `${ESC}E\x00`, 
          `Sana: ${new Date().toLocaleString()}\n`,
          "================================\n", 
        ];

        if (customerName) {
          printData.push(`${ESC}a\x00`); 
          printData.push(`Mijoz: ${cleanText(customerName)}\n`);
          printData.push("================================\n");
        }

        cart.forEach((item, index) => {
          printData.push(`${ESC}a\x00`); 
          printData.push(`${GS}!\x11`); 
          printData.push(`${index + 1}. ${cleanText(item.name)}\n`);
          
          printData.push(`${ESC}a\x00`);
          printData.push(`${GS}!\x11`); 
          
          const pricePart = `${formatMoney(item.sale_price)} x `;
          const qtyPart = `${item.qty} ta`;
          const totalPart = `${formatMoney(item.qty * item.sale_price)} sm`;
          
          const currentLineLength = pricePart.length + qtyPart.length + totalPart.length;
          const spaceCount = 24 - currentLineLength;
          const spaces = spaceCount > 0 ? ' '.repeat(spaceCount) : ' ';
          
          printData.push(pricePart);
          printData.push(`${ESC}E\x01`);
          printData.push(qtyPart);
          printData.push(`${ESC}E\x00`); 
          printData.push(`${spaces}${totalPart}\n`);
          printData.push(`${GS}!\x00`); 
          printData.push("--------------------------------\n");
        });

        printData.push(`${ESC}a\x02`); 
        printData.push(`${GS}!\x11`);  
        printData.push(`${ESC}E\x01`);  
        printData.push(`JAMI: ${formatMoney(totalPrice)} so'm\n`);
        printData.push(`${ESC}E\x00`);  
        
        printData.push(`${ESC}a\x01`); 
        printData.push(`${GS}!\x00`);  
        printData.push(`Tolod turi: ${paymentMethod === 'cash' ? 'NAQD' : 'NASIYA'}\n\n`);
        printData.push("Xaridingiz uchun rahmat!\n\n\n\n"); 
        printData.push(`${GS}V\x41\x00`); 

        await qz.print(activeConfig, printData);
      } catch (err) {
        console.error("QZ Tray xatosi:", err);
        toast.error("Printer xatosi!");
      }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Savat bo'sh!");
        if (paymentMethod === 'debt' && !selectedCustomer) return alert("Mijoz tanlang!");

        const payload = {
            items: cart.map(item => ({ barcode: item.barcode, quantity: item.qty })),
            payment_method: paymentMethod, 
            customer_id: selectedCustomer?.id || null, 
            customer_name: selectedCustomer?.name || null,
            customer_phone: selectedCustomer?.phone || null,
            note: "POS savdosi"
        };

        try {
            const response = await api.post('/sale/', payload); 
            if (response.data.status === "success") {
                toast.success("Savdo yakunlandi!");
                const customerName = selectedCustomer?.name || null;
                printReceiptWithQZ(cart, totalPrice, paymentMethod, customerName, nextDailyId);
                setCart([]);
                setSelectedCustomer(null);
                queryClient.invalidateQueries(['products']);
                queryClient.invalidateQueries(['debtors']);
                queryClient.invalidateQueries(['sales-history']);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Xatolik!");
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden font-sans w-full">
          
          {/* Chap Tomon (Mahsulotlar Tizimi) */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            
            {/* Kategoriyalar */}
            <div className="flex gap-1.5 flex-wrap mb-2 overflow-x-auto pb-1 shrink-0 scrollbar-hide">
              <button 
                onClick={() => setSelectedCat(null)}
                className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm ${selectedCat ? 'bg-white text-slate-500 hover:bg-indigo-50' : 'bg-indigo-600 text-white' }`}
              >
                Hammasi
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCat === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-indigo-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Qidiruv Paneli */}
            <div className="relative flex items-center mb-3 gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Skanerlang yoki mahsulot nomini yozing..."
                  className="w-full p-2.5 pl-10 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {isSeller && (
                <div className="flex items-center gap-2 bg-white p-1.5 pr-3 rounded-xl shadow-sm border border-indigo-50 h-10 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <UserIcon size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[80px]">{user?.username || 'Kassa'}</span>
                  <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500 transition-all shrink-0">
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </div>

          {/* GRID TIZIMI: 1024 o'lchamda ham, undan kattalarda ham chiroyli chiqadi */}
<div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
  {products.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2.5">
      {products.map(p => {
        const cartItem = cart.find(item => item.id === p.id);
        const inCartQty = cartItem ? cartItem.qty : 0;
        const availableStock = p.stock_count - inCartQty;
        const isLimitReached = availableStock <= 0;

        return (
          <div 
            key={p.id} 
            onClick={() => !isLimitReached && addToCart(p)} 
            className={`bg-white p-3 rounded-xl border border-slate-50 transition-all group relative overflow-hidden shadow-sm flex flex-col justify-between h-28
              ${isLimitReached ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-indigo-500 hover:shadow-md cursor-pointer'}`}
          >
            {/* Ustki qism: Nomi va kodi */}
            <div>
              <h3 className={`font-bold text-xs leading-tight line-clamp-2 ${isLimitReached ? 'text-gray-400' : 'text-slate-700 group-hover:text-indigo-600'}`}>{p.name}</h3>
              <p className="text-slate-400 text-[10px] mt-0.5">Kod: {p.barcode}</p>
            </div>
            
            {/* Pastki qism: Narxi, Zaxira Badge-i va + belgisi */}
            <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">{formatMoney(p.sale_price)}</span>
                {/* Qaytarilgan Zaxira Badge (Siz aytgan Kategoriya/Ombor belgisi) */}
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 w-max ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-950'}`}>
                  {isLimitReached ? '0 ta' : availableStock + ' ta'}
                </span>
              </div>

              {/* O'ng burchakdagi Plus (+) belgisi (Savatda bor-yo'qligiga qarab o'zgaradi) */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm
                ${inCartQty > 0 ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {inCartQty > 0 ? <span className="text-xs font-black">+{inCartQty}</span> : <Plus size={14} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16">
       <Package size={50} strokeWidth={1.5} className="mb-2 text-slate-400" />
       <p className="text-xs font-bold">Mahsulotlar yuklanmoqda...</p>
    </div>
  )}
</div>
          </div>

          {/* O'ng Tomon (Savat) - 1024px ekranda siqilib ketmaslik uchun o'lchamlari mutanosib qilindi */}
          <div className="w-[280px] xl:w-[360px] bg-white shadow-xl z-10 flex flex-col border-l border-slate-200 shrink-0">
            <div className="flex justify-between p-2 items-center bg-slate-50 border-b border-slate-200">
                <h2 className="text-[10px] xl:text-xs font-black text-indigo-600 uppercase tracking-tight">Kassa Navbati: #{nextDailyId}</h2>
                <button onClick={() => setIsHistoryModalOpen(true)} className="p-1.5 hover:bg-slate-200 bg-white border rounded-lg text-slate-700 transition-colors shrink-0">
                  <Clock size={14} />
                </button>
            </div>
            
            <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <span className="font-bold text-slate-700 text-xs xl:text-sm flex items-center gap-1.5">
                <ShoppingCart size={16} className="text-indigo-600" /> Savat
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold text-[11px]">{cart.length} ta</span>
            </div>

            {/* Savat ichidagi ro'yxat */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[11px] xl:text-xs text-slate-700 truncate">{item.name}</h4>
                    <p className="text-[10px] xl:text-[11px] font-bold text-indigo-600 mt-0.5">{formatMoney(item.sale_price)} sm</p>
                  </div>
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 text-indigo-600 hover:bg-slate-50 rounded-l-lg"><Minus size={10}/></button>
                    <span className="w-5 text-center font-bold text-xs text-slate-700">{item.qty}</span>
                    <button onClick={() => {
                      if(item.qty < item.stock_count) updateQty(item.id, 1);
                      else toast.warning('Zaxira tugadi');
                    }} className="p-1 text-indigo-600 hover:bg-slate-50 rounded-r-lg"><Plus size={10}/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1 shrink-0 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* To'lov paneli */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
              <div className="space-y-1">
                 <div className="flex justify-between items-center">
                   <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mijoz ma'lumoti</label>
                   {selectedCustomer && <button onClick={() => {setSelectedCustomer(null); setNewCustomer({name:'', phone:''})}} className="text-[9px] text-red-500 font-bold">O'CHIRISH</button>}
                 </div>
                 <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                      <select 
                        className="w-full pl-7 pr-2 py-1.5 rounded-xl bg-white border border-slate-200 outline-none text-[11px] font-bold appearance-none cursor-pointer"
                        value={selectedCustomer?.id || ""}
                        disabled={selectedCustomer?.isNew}
                        onChange={(e) => setSelectedCustomer(customers.find(c => c.id == e.target.value))}
                      >
                        <option value="">{selectedCustomer?.isNew ? selectedCustomer.name : "Mijoz tanlash..."}</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <button onClick={() => setIsCustomerModalOpen(true)} className="bg-indigo-600 text-white p-1.5 rounded-xl hover:bg-indigo-700 shadow-md shrink-0">
                      <UserPlus size={14} />
                    </button>
                 </div>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold text-xs">Jami:</span>
                <p className="text-base xl:text-lg font-black text-slate-800 tracking-tight">{formatMoney(totalPrice)} so'm</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['cash', 'debt'].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all ${paymentMethod === m ? 'bg-slate-800 text-white shadow-md' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>{m === 'cash' ? 'Naqd' : 'Nasiya'}</button>
                ))}
              </div>
              
              <button 
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Printer size={16} /> SAVDONI YAKUNLASH
              </button>
            </div>
          </div>

          {/* Modallar */}
          {isCustomerModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white p-5 rounded-2xl w-full max-w-xs shadow-xl">
                <h2 className="text-sm font-black text-slate-800 mb-3">Yangi Mijoz</h2>
                <div className="space-y-2">
                  <input className="w-full p-2 bg-slate-50 rounded-lg outline-none font-bold text-xs border" placeholder="Ismi" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}/>
                  <input className="w-full p-2 bg-slate-50 rounded-lg outline-none font-bold text-xs border" placeholder="Telefon raqami" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}/>
                </div>
                <div className="flex gap-2 mt-4 text-xs font-bold">
                  <button onClick={() => setIsCustomerModalOpen(false)} className="flex-1 py-1.5 text-slate-400">BEKOR</button>
                  <button onClick={handleSaveCustomerLocal} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg shadow-md">SAQLASH</button>
                </div>
              </div>
            </div>
          )}

          {isHistoryModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md max-h-[70vh] flex flex-col shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xs font-black text-slate-800">Bugungi savdolar (Jami: {salesHistory.length} ta)</h2>
                  <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 rounded-lg text-slate-400"><X size={16} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {salesHistory.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg text-xs shadow-sm">
                      <div>
                        <p className="font-bold text-slate-700">ID: #{sale.daily_id} ({sale.payment_method === 'cash' ? 'Naqd' : 'Nasiya'})</p>
                        <p className="text-[10px] text-slate-400">{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <p className="font-black text-slate-800">{formatMoney(sale.total_amount)} so'm</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
        </div>
    );
};

export default POSPage;