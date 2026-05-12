import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { ShoppingCart, Search, Trash2, CreditCard,User, X, UserPlus, Plus, Minus, Package ,Clock,DollarSign,UserIcon,LogOut} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';


const POSPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate()

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
    // Agar qidiruv va kategoriya bo'sh bo'lsa, so'rov yubormaslik mumkin
    if (!searchTerm && !selectedCat) return [];

    let url = `/products/?search=${searchTerm}`;
    if (selectedCat) url += `&category=${selectedCat}`;
    
    const res = await api.get(url);
    const data = res.data.results || res.data;
    
  
    // --- BARCODE MANTIQINI SHU YERGA KO'CHIRAMIZ ---
    if (data.length === 1 && data[0].barcode === searchTerm) {
      addToCart(data[0]);
      setSearchTerm(''); // Skanerlangandan keyin inputni tozalash
    }

    return data;
  },
  // Bu qidiruvni silliq qiladi: yangi ma'lumot kelguncha eskisi ko'rinib turadi
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
  
  const user = JSON.parse(localStorage.getItem('user_data'))
  const isSeller = user?.role === 'seller'
  const salesHistory = salesHistoryData?.sales || [];
  const nextDailyId = salesHistoryData?.next_daily_id || 1;

  console.log(salesHistoryData);
  
  
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    window.location.href = '/login'
  }

  

 

  const fetchSalesHistory = async () => {
  try {
    const res = await api.get('/sales-history/'); // Backenddagi url
    setSalesHistory(res.data.sales || []);
  } catch (err) {
    console.error("Tarixni yuklashda xato");
  }
};



  // --- Modal: Mijozni vaqtinchalik saqlash ---
  const handleSaveCustomerLocal = () => {
    if (!newCustomer.name || !newCustomer.phone) {
        return alert("Ism va telefonni kiriting!");
    }
    // Bazaga yubormaymiz, faqat tanlangan qilib belgilaymiz
    setSelectedCustomer({
      id: null, // Yangi mijoz ekanini bildiradi
      name: newCustomer.name,
      phone: newCustomer.phone,
      isNew: true 
    });
    setIsCustomerModalOpen(false);
  };



  // --- Cart Actions ---
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

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Savat bo'sh!");
    
    if (paymentMethod === 'debt' && !selectedCustomer) {
        return alert("Nasiya savdo uchun mijoz tanlang!");
    }

    const payload = {
        items: cart.map(item => ({
            barcode: item.barcode,
            quantity: item.qty
        })),
        payment_method: paymentMethod, 
        // Agar selectedCustomer mavjud bo'lsa ID sini, bo'lmasa null yuboramiz
        customer_id: selectedCustomer?.id || null, 
        // Yangi mijoz bo'lsa ism va telefonni yuboramiz
        customer_name: selectedCustomer?.name || null,
        customer_phone: selectedCustomer?.phone || null,
        note: "POS savdosi"
    };

   try {
            const response = await api.post('/sale/', payload); 
            if (response.data.status === "success") {
                toast.success("Savdo yakunlandi!");
                setCart([]);
                setSelectedCustomer(null);
                
                // MUHIM: Socket ishlamay qolsa ham, keshni qo'lda yangilab qo'yamiz
                queryClient.invalidateQueries(['products']);
                queryClient.invalidateQueries(['debtors']);
                queryClient.invalidateQueries(['sales-history']);
            }
        } catch (err) {
          console.log(err.response?.data?.error);
            toast.error(err.response?.data?.error || "Xatolik!");
        }
};
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* 1. Chap tomondagi asosiy qism */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        
        {/* Kategoriyalar Paneli */}
        <div className="flex gap-2 flex-wrap mb-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setSelectedCat(null)}
            className={`px-2 py-1 rounded-full font-bold transition-all shadow-sm ${!selectedCat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-indigo-100'}`}
          >
            Hammasi
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-2 py-1 rounded-full text-[15px] font-bold whitespace-nowrap transition-all shadow-sm ${selectedCat === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-indigo-100'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Qidiruv inputi */}
        <div className="relative flex items-center mb-6 gap-4">
  {/* SEARCH INPUT QISMI - flex-1 qilib unga ko'p joy beramiz */}
  <div className="relative flex-1">
    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
    <input 
      ref={searchInputRef}
      type="text" 
      placeholder="Mahsulot nomi yoki barcode skanerlang..."
      className="w-full p-5 pl-14 rounded-2xl border-none shadow-lg focus:ring-4 focus:ring-indigo-100 outline-none text-xl transition-all"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      autoFocus
    />
  </div>

  {/* SELLER PROFIL PANELI */}
  {isSeller && (
    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-lg border border-indigo-50 h-[68px] animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Rasm yoki Icon */}
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
        <UserIcon size={20} />
      </div>
      
      {/* Ism va Rol - Kichik ekranlarda yashirish mumkin */}
      <div className="flex flex-col min-w-[100px]">
        <span className="text-sm font-bold text-slate-800 leading-none truncate">
          {user?.username || 'Sotuvchi'}
        </span>
        <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider mt-1">
          Kassa
        </span>
      </div>

      {/* Ajratuvchi chiziq */}
      <div className="w-[1px] h-8 bg-slate-100 mx-1"></div>

      {/* Logout Tugmasi */}
      <button 
        onClick={handleLogout}
        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
        title="Tizimdan chiqish"
      >
        <LogOut size={22} />
      </button>
    </div>
  )}
</div>

        {/* Mahsulotlar ro'yxati */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
           {products.map(p => {
              const cartItem = cart.find(item => item.id === p.id);
              const inCartQty = cartItem ? cartItem.qty : 0;
              // 2. Haqiqiy sotuvda qolgan miqdor (Ombor - Savat)
              const availableStock = p.stock_count - inCartQty;
              // 3. Agar mahsulot butunlay tugagan bo'lsa yoki savatga hammasi solingan bo'lsa
              const isLimitReached = availableStock <= 0;
              

  return (
    <div 
      key={p.id} 
      // 1. Agar tugagan bo'lsa, bosilganda hech narsa qilmaydi
      onClick={() => !isLimitReached && addToCart(p)} 
      // 2. Dinamik classlar: agar tugagan bo'lsa xiralashadi va kursatkich o'zgaradi
      className={`bg-white px-3 py-2 rounded-2xl border border-transparent transition-all group relative overflow-hidden 
        ${isLimitReached 
          ? 'opacity-50 grayscale cursor-not-allowed' 
          : 'hover:border-indigo-500 hover:shadow-xl cursor-pointer'
        }`}
    >
      {/* Kategoriya qismi */}
      <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-2xl font-medium text-xs uppercase 
        ${isLimitReached ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-slate-700'}`}>
         {p.category_name || 'Tovar'}
      </div>

      <h3 className={`font-black text-lg mb-1 leading-tight ${isLimitReached ? 'text-gray-400' : 'text-slate-700 group-hover:text-indigo-600'}`}>
        {p.name}
      </h3>
      
      <p className="text-slate-400 text-sm mb-0">Kod: {p.barcode}</p>
      <span className={`text-sm font-medium ${isLimitReached ? 'text-gray-400' : 'text-slate-800'}`}>
        Narxi: {Number(p.sale_price).toLocaleString()}
      </span>

      <div className="flex justify-between items-end">
        {/* Miqdor ko'rinishi */}
        <span className={`text-sm font-bold p-1 rounded ${isLimitReached ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-900'}`}>
          {isLimitReached ? 'TUGAGAN' : availableStock + ' ta'}
        </span>

        {/* Plyus tugmasi - agar tugagan bo'lsa yashirib qo'ysa ham bo'ladi yoki rangini o'zgartiramiz */}
        <div className={`${isLimitReached ? 'bg-gray-300' : 'bg-indigo-600 group-hover:scale-110'} text-white p-2 rounded-xl transition-transform`}>
          <Plus size={20}/>
        </div>
      </div>
    </div>
  );
})}
          </div>
          {products.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <Package size={100} strokeWidth={1} />
               <p className="text-xl font-bold mt-4">Mahsulot topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. O'ng tomondagi Savat qismi */}
      <div className="w-[450px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10 flex flex-col border-l border-slate-100">
        <div className="flex justify-between p-2">
            <h2 className="text-xl font-bold text-indigo-500 uppercase">Keyingi Savdo: #{nextDailyId}</h2>
            <button onClick={() => setIsHistoryModalOpen(true)} className="p-2 hover:bg-slate-300 bg-slate-100 rounded-xl text-slate-900 transition-colors"><Clock size={20} />
  </button>
    </div>
        <div className="p-3 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <ShoppingCart size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Savat</h2>
          </div>
          <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full font-black text-sm uppercase tracking-widest">{cart.length} ta</span>
        </div>

        {/* Savatdagi itemlar */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100 group">
              <div className="flex-1">
                <h4 className="font-bold text-slate-700 truncate w-44">{item.name}</h4>
                <p className="text-xs font-bold text-indigo-500 mt-1">{Number(item.sale_price).toLocaleString()} so'm</p>
              </div>
              <div className="flex items-center bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
                <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:bg-slate-50 cursor-pointer rounded-xl text-indigo-600"><Minus size={16}/></button>
                <span className="w-8 text-center font-black text-slate-700">{item.qty}</span>
                <button onClick={() => {
                  if(item.qty < item.stock_count){
                    updateQty(item.id, 1)
                  } else {
                    toast.warning('Omborda boshqa qolmadi')
                  }
                  }} 
                  className="p-2 hover:bg-slate-50 cursor-pointer rounded-xl text-indigo-600"><Plus size={16}/></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* To'lov bo'limi */}
        <div className="p-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 space-y-6">
          
          <div className="space-y-3">
             <div className="flex justify-between items-center">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                 {selectedCustomer?.isNew ? "Yangi Mijoz (Sessiyada)" : "Mijoz (Tanlangan)"}
               </label>
               {selectedCustomer && (
                 <button onClick={() => {setSelectedCustomer(null); setNewCustomer({name:'', phone:''})}} className="text-[10px] text-red-500 font-bold">O'CHIRISH</button>
               )}
             </div>
             
             <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <select 
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm outline-none text-sm font-bold appearance-none cursor-pointer ${selectedCustomer?.isNew ? 'text-indigo-600 ring-2 ring-indigo-500' : ''}`}
                    value={selectedCustomer?.id || ""}
                    disabled={selectedCustomer?.isNew}
                    onChange={(e) => {
                        const cust = customers.find(c => c.id == e.target.value);
                        setSelectedCustomer(cust);
                    }}
                  >
                    <option value="">{selectedCustomer?.isNew ? selectedCustomer.name : "Mijozni tanlang..."}</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} Jami: {c.total_debt}</option>)}
                  </select>
                </div>
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  <UserPlus size={20} />
                </button>
             </div>
          </div>

          <div className="flex justify-between items-end border-b border-slate-200 pb-6">
            <span className="text-slate-400 font-bold mb-1">Jami summa:</span>
            <div className="text-right">
              <p className="text-4xl font-black text-slate-800 leading-none">{totalPrice.toLocaleString()}</p>
              <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">O'zbek so'mi</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['cash', 'debt'].map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${paymentMethod == m ? 'bg-slate-800 text-white shadow-xl scale-105' : 'bg-blue-100 text-blue-700'}`}>{m === 'cash' ? 'Naqd To\'lov' : 'Nasiya Savdo'}</button>
            ))}
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-200 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-green-100 transition-all transform active:scale-95 flex items-center justify-center gap-3"
          >
            <CreditCard size={24} /> SAVDONI YAKUNLASH
          </button>
        </div>
      </div>

      {/* --- Yangi Mijoz Modali --- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black text-slate-800 mb-2">Yangi Mijoz</h2>
            <p className="text-slate-400 mb-8 font-medium">Bu mijoz bazada saqlanadi va savdo unga biriktiriladi.</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase ml-2">Mijoz ismi</label>
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Masalan: Alisher Navoiy"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase ml-2">Telefon raqami</label>
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="90 123 45 67"
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsCustomerModalOpen(false)} className="flex-1 py-4 font-black text-slate-400">BEKOR QILISH</button>
              <button 
                onClick={handleSaveCustomerLocal} 
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700"
              >
                TANLASH
              </button>
            </div>
          </div>
        </div>
      )}
{isHistoryModalOpen && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
      
      {/* Modal Sarlavhasi */}
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Mening bugungi savdolarim</h2>
          <p className="text-slate-400 text-sm font-medium">Bugun jami {salesHistory.length} ta savdo qildingiz</p>
        </div>
        <button 
          onClick={() => setIsHistoryModalOpen(false)}
          className="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all shadow-sm"
        >
          <X size={24} />
        </button>
      </div>

      {/* Savdolar Ro'yxati */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {salesHistory.length > 0 ? (
          <div className="space-y-3">
            {salesHistory.map((sale) => (
              
              <div key={sale.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${sale.payment_method === 'cash' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {sale.payment_method === 'cash' ? <DollarSign size={20}/> : <Clock size={20}/>}
                  </div>
                  <div>
                    <p className="font-black text-slate-700">ID: #{sale.daily_id}</p>
                    <p className={`text-xs  font-bold uppercase ${sale.payment_method === 'cash' ? 'text-green-600' : 'text-red-400'} `}>
                      {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {sale.payment_method === 'cash' ? 'Naqd' : 'Nasiya'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-black text-slate-800 text-lg">
                    {Number(sale.total_amount).toLocaleString()} <span className="text-[10px] text-slate-400">so'm</span>
                  </p>
                  <p className="text-[10px] font-black text-red-500 truncate max-w-[150px]">
                    {sale.customer_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
            <ShoppingCart size={60} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-lg font-bold">Bugun hali savdo qilmadingiz</p>
          </div>
        )}
      </div>

      {/* Modal Pastki Qismi */}
      <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="text-sm font-bold text-slate-500">
          Bugungi jami tushum: 
          <span className="ml-2 text-xl font-black text-slate-800">
            {salesHistory.reduce((sum, s) => sum + Number(s.total_amount), 0).toLocaleString()} so'm
          </span>
        </div>
        <button 
          onClick={() => setIsHistoryModalOpen(false)}
          className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all"
        >
          YOPISH
        </button>
      </div>
    </div>
  </div>
)}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default POSPage;