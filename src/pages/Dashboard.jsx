import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Users, Package, CheckCircle, DollarSign, Tag, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  console.log(data);
  

  useEffect(() => {
    api.get('/store-stats/').then(res => setData(res.data));
  }, []);

  if (!data) return <div className="p-10 text-center text-slate-400">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-black text-slate-900">
        {data.role === 'superadmin' ? 'Tizim Nazorati' : 'Mening Do\'konim'}
      </h1>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
               {/* Iconlarni dinamik render qilish yoki shartli qo'yish */}
               <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h2 className="text-2xl font-black text-slate-800">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* AGAR SUPERADMIN BO'LSA RECENT STORES JADVALI */}
      {data.role === 'superadmin' && (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6">Yangi qo'shilgan do'konlar</h3>
          <div className="space-y-4">
            {data.recent_stores.map(store => (
              <div key={store.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                <span className="font-bold text-slate-700">{store.username}</span>
                <span className="text-sm text-slate-400">{new Date(store.date_joined).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;