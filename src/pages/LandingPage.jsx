import React, { useEffect, useState } from 'react';
import { CheckCircle2, Store, Users, Zap, Award, Crown, AlarmClock, Smartphone, Download, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import mainLogo from '../assets/icon.png';

const LandingPage = () => {
  const [plans, setPlans] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobil menyu uchun

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('plans/');
      setPlans(res.data.results);
    } catch (err) {
      console.error("Planlarni yuklashda xato:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          <div className="text-xl md:text-2xl font-black flex items-center text-amber-600 tracking-tighter">
            <img width={40} className="md:w-[50px]" src={mainLogo} alt="Logo" />
            Baraka<span className="text-gray-900">POS</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 font-medium text-gray-600">
            <a href="#features" className="hover:text-amber-600 transition">Xizmatlar</a>
            <a href="#about" className="hover:text-amber-600 transition">Biz haqimizda</a>
            <a href="#plans" className="hover:text-amber-600 transition">Tariflar</a>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-semibold text-gray-700 hover:text-amber-600">
              Kirish
            </Link>
            <Link to="/register" className="px-5 py-2.5 bg-amber-600 text-white text-xs md:text-sm font-bold rounded-full hover:bg-amber-700 shadow-lg shadow-amber-200 transition">
              Boshlash
            </Link>
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-6 flex flex-col space-y-4 font-medium animate-in slide-in-from-top">
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Xizmatlar</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)}>Biz haqimizda</a>
            <a href="#plans" onClick={() => setIsMenuOpen(false)}>Tariflar</a>
            <Link to="/login" className="text-amber-600">Kirish</Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 md:pt-48 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Biznesingizni <br />
            <span className="bg-gradient-to-r from-amber-600 to-indigo-800 bg-clip-text text-transparent">
              Aqlli Boshqaring
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-10 px-4">
            Sotuvlar, inventar va xodimlarni bitta platformada nazorat qiling. 
            Android ilovani yuklab oling va bepul sinab ko'ring.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-6">
            <button className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 shadow-xl">
              Bepul sinab ko'rish
            </button>
            <a href="./downloads/bpos.apk" download={'bpos.apk'} className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-xl flex items-center justify-center gap-2">
              <Smartphone size={20} /> Android (APK) <Download size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {[
              { title: "Tezkor POS", desc: "Sotuv jarayoni endi bir necha soniya vaqt oladi.", icon: "⚡" },
              { title: "Hisobotlar", desc: "Kunlik, haftalik va oylik daromadlarni tahlil qiling.", icon: "📊" },
              { title: "Xavfsizlik", desc: "Ma'lumotlaringiz bulutli tizimda 100% himoyalangan.", icon: "🔒" }
            ].map((f, idx) => (
              <div key={idx} className="p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-xl transition duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm md:text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className='text-center text-3xl md:text-4xl font-bold text-gray-900 mb-12'>Siz uchun qulay tariflar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
            {plans.map((f, i) => {
              const isPopular = i === 1; // Standart yoki o'rtadagi tarif

              return (
                <div 
                  key={i} 
                  className={`relative p-6 md:p-8 rounded-[2rem] border transition-all duration-500 ${
                    isPopular 
                      ? 'bg-white border-amber-500 shadow-2xl scale-100 md:scale-105 z-10' 
                      : 'bg-white border-gray-100'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Tavsiya etiladi
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900">{f.name}</h3>
                      <p className="text-gray-500 text-xs mt-1">Biznesingiz o'sishi uchun</p>
                    </div>
                    <div className={`p-3 rounded-xl ${isPopular ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                      {i === 0 ? <Zap size={22} /> : i === 1 ? <Award size={22} /> : <Crown size={22} />}
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl md:text-4xl font-black text-gray-900">
                      {parseInt(f.price).toLocaleString()}
                    </span>
                    <span className="text-gray-500 font-medium text-sm"> so'm/oy</span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <FeatureItem icon={<CheckCircle2 className="text-green-500" size={18} />} text="Cheksiz mahsulotlar" />
                    <FeatureItem icon={<Store className="text-amber-500" size={18} />} text={`Do'konlar: ${f.max_baranchs} ta`} />
                    <FeatureItem icon={<Users className="text-blue-500" size={18} />} text={`Xodimlar: ${f.max_users} ta`} />
                    <FeatureItem icon={<AlarmClock className="text-purple-500" size={18} />} text="24/7 Qo'llab-quvvatlash" />
                  </div>

                  <button className={`w-full py-4 rounded-xl font-bold transition-all ${
                    isPopular 
                      ? 'bg-amber-600 text-white hover:bg-amber-700' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}>
                    Hozir boshlash
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-gray-100 text-center text-sm text-gray-500">
        <p>&copy; 2026 Baraka-POS. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
};

// Yordamchi komponent (kodni toza saqlash uchun)
const FeatureItem = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <div className="shrink-0">{icon}</div>
    <span className="text-gray-600 text-sm md:text-base font-medium">{text}</span>
  </div>
);

export default LandingPage;