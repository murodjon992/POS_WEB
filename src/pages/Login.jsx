import React, { useState } from 'react';
import { Lock, User, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/api';


const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(''); // TokenAuth odatda username kutadi
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Login so'rovi
      const response = await api.post('/login/', {
        username: username,
        password: password
      });

      // 2. Ma'lumotlarni qabul qilish
      // Taxmin: Backend { "token": "...", "user": { "username": "admin", "is_superuser": true } } qaytaradi
      const { token, user } = response.data; 
      
      if (token) {
        // Tokenni va foydalanuvchi ma'lumotlarini saqlash
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user)); 

        // App.jsx dagi holatni yangilash (user ma'lumotini uzatamiz)
        onLoginSuccess(user); 
      } else {
        setError("Serverdan ma'lumot to'liq kelmadi.");
      }
    } catch (err) {
      console.error("Login xatosi:", err.response);
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Username yoki parol noto'g'ri!");
      } else {
        setError("Server bilan bog'lanishda xato yuz berdi.");
      }
    } finally {
      setLoading(false);
    }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1C2434] px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl overflow-hidden relative">
        
        {/* Dekorativ element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-orange-600"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Baraka<span className="text-orange-600">POS</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Boshqaruv paneliga kirish</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* USERNAME INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800"
                placeholder="admin_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Parol
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              "Kirish"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            © 2026 Baraka-POS System. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;