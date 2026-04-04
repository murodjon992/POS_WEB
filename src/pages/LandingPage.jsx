import React, { useEffect, useState } from 'react';
import { CheckCircle2, Store, Users, Zap, Award, Crown, AlarmClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const LandingPage = () => {
  const [plans, setPlans] = useState([])

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
   const res = await api.get('plans/')
  setPlans(res.data)

  }
  
  
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="text-2xl font-black text-orange-600 tracking-tighter">
            Baraka<span className="text-gray-900">POS</span>
          </div>
          
          <div className="hidden md:flex space-x-8 font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition">Xizmatlar</a>
            <a href="#about" className="hover:text-blue-600 transition">Biz haqimizda</a>
            <a href="#plans" className="hover:text-blue-600 transition">Tariflar</a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
              Kirish
            </Link>
            <Link to="/register" className="px-6 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-full hover:bg-orange-700 shadow-lg shadow-blue-200 transition">
              Boshlash
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Biznesingizni <br />
            <span className="bg-gradient-to-r from-orange-600 to-indigo-800 bg-clip-text text-transparent">
              Aqlli Boshqaring
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Sotuvlar, inventar va xodimlarni bitta platformada nazorat qiling. 
            Samaradorlikni oshiring va vaqtingizni tejang.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl">
              Bepul sinab ko'rish
            </button>
            <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition">
              Videoni ko'rish
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES (REKLAMA BLOKI) */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "Tezkor POS", desc: "Sotuv jarayoni endi bir necha soniya vaqt oladi.", icon: "⚡" },
              { title: "Hisobotlar", desc: "Kunlik, haftalik va oylik daromadlarni tahlil qiling.", icon: "📊" },
              { title: "Xavfsizlik", desc: "Ma'lumotlaringiz bulutli tizimda 100% himoyalangan.", icon: "🔒" }
            ].map(f => (
              <div key={f} className="p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

 <section id="plans" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
    <h1 className='text-center text-4xl font-bold text-orange-700 my-15'>Tariflar</h1>
          <div className="grid md:grid-cols-3 gap-10">
           {plans.map((f, i) => {
            // Har bir tarif uchun har xil ikonka va uslublar
            const isPopular = f.name.toLowerCase() === 'standart' || i === 1;

            return (
              <div 
                key={i} 
                className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 group ${
                  isPopular 
                    ? 'bg-white border-orange-500 shadow-2xl shadow-orange-100 scale-105 z-10' 
                    : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-xl'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Eng ommabop
                  </span>
                )}

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{f.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">Kichik va o'rta biznes uchun</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${isPopular ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                    {i === 0 ? <Zap size={24} /> : i === 1 ? <Award size={24} /> : <Crown size={24} />}
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-black text-gray-900">{f.price.toLocaleString()}</span>
                  <span className="text-gray-500 font-medium"> so'm/oy</span>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                    <span className="text-gray-600 font-medium">Cheksiz mahsulot kiritish</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Store className="text-orange-500 shrink-0" size={20} />
                    <span className="text-gray-600 font-medium">Do'konlar: <b className="text-gray-900">{f.max_baranchs} ta</b></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="text-blue-500 shrink-0" size={20} />
                    <span className="text-gray-600 font-medium">Xodimlar: <b className="text-gray-900">{f.max_users} ta</b></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlarmClock className="text-purple-500 shrink-0" size={20} />
                    <span className="text-gray-600 font-medium">24/7 Texnik Yordam</span>
                  </div>
                </div>

                <button className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${
                  isPopular 
                    ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  Tanlash
                </button>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-100 text-center text-gray-500">
        <p>&copy; 2026 Baraka-POS. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
};

export default LandingPage;