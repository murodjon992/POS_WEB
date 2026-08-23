import React, { useState, useEffect } from 'react';
import { Smartphone, Save, ExternalLink, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../api/api';

const AppVersionPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    minimum_version: '',
    latest_version: '',
    update_message: '',
    store_url: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['app-version-admin'],
    queryFn: async () => {
      const res = await api.get('/admin/app-version/');
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        minimum_version: data.minimum_version || '',
        latest_version: data.latest_version || '',
        update_message: data.update_message || '',
        store_url: data.store_url || '',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch('/admin/app-version/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['app-version-admin']);
      toast.success('Versiya ma\'lumotlari saqlandi!');
    },
    onError: () => toast.error('Saqlashda xatolik yuz berdi'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <Smartphone className="text-indigo-600" size={38} />
          Ilova Versiyasi
        </h1>
        <p className="text-slate-500 mt-1 font-medium italic">
          Mobil ilova yangilanishlarini boshqarish
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Minimal versiya (majburiy)
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={form.minimum_version}
                  onChange={(e) => setForm({ ...form, minimum_version: e.target.value })}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                  Shu versiyadan pastdagi ilovalar majburiy yangilashga yo'naltiriladi
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Eng oxirgi versiya
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                  value={form.latest_version}
                  onChange={(e) => setForm({ ...form, latest_version: e.target.value })}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                  Play Store'dagi hozirgi eng so'nggi versiya
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Xabar matni
              </label>
              <textarea
                rows={3}
                placeholder="Ilovaning yangi versiyasi chiqdi! Davom etish uchun yangilang."
                className="w-full mt-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 resize-none"
                value={form.update_message}
                onChange={(e) => setForm({ ...form, update_message: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
                Foydalanuvchiga ko'rsatiladigan xabar
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Play Store havolasi
              </label>
              <div className="relative mt-2">
                <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                  value={form.store_url}
                  onChange={(e) => setForm({ ...form, store_url: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <Save size={18} />
              {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </form>
        </div>

        {/* SIDEBAR - HOLAT KO'RSATKICHI */}
        <div className="space-y-6">
          <div
            className={`rounded-[2rem] p-8 border ${
              form.minimum_version !== form.latest_version
                ? 'bg-amber-50 border-amber-100'
                : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-lg text-white ${
                  form.minimum_version !== form.latest_version ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              >
                {form.minimum_version !== form.latest_version ? (
                  <AlertTriangle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}
              </div>
              <h4
                className={`font-black text-sm uppercase ${
                  form.minimum_version !== form.latest_version ? 'text-amber-900' : 'text-emerald-900'
                }`}
              >
                Joriy holat
              </h4>
            </div>
            {form.minimum_version !== form.latest_version ? (
              <p className="text-amber-700/80 text-sm leading-relaxed font-medium">
                Minimal ({form.minimum_version}) va eng oxirgi ({form.latest_version}) versiyalar
                farq qilyapti — eski ilovalar <b>majburiy yangilashga</b> yo'naltiriladi.
              </p>
            ) : (
              <p className="text-emerald-700/80 text-sm leading-relaxed font-medium">
                Hozircha majburiy yangilash yo'q — barcha foydalanuvchilar bemalol ishlataveradi.
              </p>
            )}
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <h4 className="font-bold italic opacity-80 mb-4 text-sm">Qanday ishlaydi</h4>
            <ul className="space-y-3 text-sm text-white/70 leading-relaxed">
              <li>• <b className="text-white">minimal versiya</b>dan past ilovalar — majburiy, bekor qilib bo'lmaydi</li>
              <li>• <b className="text-white">eng oxirgi versiya</b>dan past (lekin minimaldan yuqori) — ixtiyoriy taklif</li>
              <li>• O'zgarishlar darhol kuchga kiradi — ilova qayta build qilinishi shart emas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppVersionPage;