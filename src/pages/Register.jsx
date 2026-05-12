import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Phone, ArrowRight, Sparkles, ShieldCheck, BarChart3, Zap } from 'lucide-react';
import api from '../api/api';
import Swal from 'sweetalert2';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return Swal.fire('Xato', 'Parollar mos kelmadi', 'error');
    }

    setLoading(true);
    try {
      const res = await api.post('/register/', {
        username: formData.username,
        phone: formData.phone,
        password: formData.password
      });

      // Muvaffaqiyatli ro'yxatdan o'tganda Botga yo'naltirish Modali
      Swal.fire({
        title: 'Xush kelibsiz! 🎉',
        html: `
          <div class="text-left space-y-4">
            <p class="text-slate-600">Siz muvaffaqiyatli ro'yxatdan o'tdingiz. <b>14 kunlik bepul</b> sinov muddati faollashtirildi!</p>
            <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p class="text-blue-700 font-bold text-sm mb-1">🚀 Muhim tavsiya:</p>
              <p class="text-xs text-blue-600 leading-relaxed">
                Kunlik savdo hisobotlarini Telegram orqali olish va parolni xavfsiz tiklash uchun botimizga a'zo bo'ling.
              </p>
            </div>
            <a href="${res.data.bot_url}" target="_blank" class="block w-full py-4 bg-indigo-600 text-white text-center rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
              Telegram Botni Faollashtirish
            </a>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      // Tokenlarni saqlash va dashboardga o'tish (ixtiyoriy)
      localStorage.setItem('auth_token', res.data.token);
      setTimeout(() => navigate('/dashboard'), 3000);

    } catch (err) {
        console.log(err.response?.data)?.error;
      Swal.fire('Xatolik', err.response?.data?.error || 'Ro\'yxatdan o\'tishda xato yuz berdi', 'error');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* CHAP TOMON: Kirish/Ma'lumot qismi */}
        <div className="md:w-5/12 bg-indigo-600 p-12 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Zap className="fill-white" size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight">Baraka POS</span>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">Savdo tizimingizni yangi bosqichga olib chiqing.</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"><BarChart3 size={24}/></div>
                <div><p className="font-bold">Kunlik Hisobotlar</p><p className="text-sm text-indigo-100">Savdolaringiz Telegramda</p></div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck size={24}/></div>
                <div><p className="font-bold">Xavfsiz Tizim</p><p className="text-sm text-indigo-100">Ma'lumotlar bulutda saqlanadi</p></div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-white/10 rounded-3xl border border-white/20">
            <p className="text-sm italic">"Bu tizim bilan do'konimni boshqarish ancha osonlashdi!"</p>
            <p className="text-xs mt-2 font-bold opacity-70">- Birinchi foydalanuvchimiz</p>
          </div>
        </div>

        {/* O'NG TOMON: Ro'yxatdan o'tish formasi */}
        <div className="md:w-7/12 p-12 md:p-20">
          <div className="max-w-md mx-auto">
            <div className="mb-10">
              <h3 className="text-3xl font-black text-slate-800 mb-2">Ro'yxatdan o'tish</h3>
              <p className="text-slate-400 font-medium">14 kunlik bepul sinov muddatini boshlang</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" name="username" placeholder="Foydalanuvchi nomi" required
                  className="w-full p-4 pl-12 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.username} onChange={handleChange}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" name="phone" placeholder="998901234567" required
                  className="w-full p-4 pl-12 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.phone} onChange={handleChange}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" name="password" placeholder="Parol" required
                  className="w-full p-4 pl-12 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.password} onChange={handleChange}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="password" name="confirmPassword" placeholder="Parolni tasdiqlang" required
                  className="w-full p-4 pl-12 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.confirmPassword} onChange={handleChange}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? "Yuklanmoqda..." : (
                  <>
                    HISOB YARATISH <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-8 text-slate-500 font-medium">
              Hisobingiz bormi? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Kirish</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;