import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Store } from 'lucide-react';
import api from '../api/api';

const ImportExcel = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [owners, setOwners] = useState([]);

  // Do'konlar ro'yxatini yuklash
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await api.get('/users/all/');
        setOwners(res.data.filter(u => !u.is_superuser));
      } catch (err) {
        console.error("Ownerlarni yuklashda xato:", err);
      }
    };
    fetchOwners();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('idle');
  };

  const uploadFile = async () => {
    if (!file || !ownerId) {
      alert("Iltimos, do'konni tanlang va Excel faylni yuklang!");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner_id', ownerId);

    setStatus('uploading');
    setErrorMessage("");

    try {
      const response = await api.post('admin-excel-upload/', formData);
      if (response.status === 201 || response.status === 200) {
        setStatus('success');
        setFile(null);
        setOwnerId(""); // Muvaffaqiyatli bo'lsa formani tozalaymiz
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.error || "Yuklashda xatolik yuz berdi!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <FileSpreadsheet className="mr-2 text-blue-600" /> Excel Import (Superadmin)
          </h2>
          <p className="text-slate-500 mt-1">Excel orqali mahsulotlarni va ombor qoldig'ini bir qadamda yuklang.</p>
        </div>

        {/* 1-Qadam: Do'konni tanlash */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
            <Store size={16} className="mr-1" /> Qaysi do'kon uchun yuklanmoqda?
          </label>
          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            disabled={status === 'uploading'}
          >
            <option value="">Do'konni (Owner) tanlang...</option>
            {owners.map(u => (
              <option key={u.id} value={u.id}>
                {u.username} {u.first_name ? `(${u.first_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 2-Qadam: Faylni tanlash */}
        <div className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
          file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
        }`}>
          <input 
            type="file" 
            id="excel-upload" 
            hidden 
            accept=".xlsx, .xls" 
            onChange={handleFileChange} 
            disabled={status === 'uploading'} 
          />
          <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 ${file ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
              <Upload size={32} />
            </div>
            <span className="text-lg font-bold text-slate-700">
              {file ? file.name : "Excel faylni yuklang"}
            </span>
            <span className="text-sm text-slate-400 mt-1">
              Faqat .xlsx yoki .xls formatlari
            </span>
          </label>
        </div>

        {/* Statuslar va Tugma */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            {status === 'uploading' && (
              <span className="text-blue-600 flex items-center font-bold animate-pulse">
                <Loader2 size={20} className="mr-2 animate-spin" /> Ma'lumotlar qayta ishlanmoqda...
              </span>
            )}
            {status === 'success' && (
              <span className="text-green-600 flex items-center font-bold bg-green-50 px-4 py-2 rounded-full">
                <CheckCircle2 size={20} className="mr-2" /> Muvaffaqiyatli yuklandi!
              </span>
            )}
            {status === 'error' && (
              <div className="text-red-600 flex items-start font-bold bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
                <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" /> 
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={uploadFile}
            disabled={!file || !ownerId || status === 'uploading'}
            className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg shadow-blue-100 flex items-center justify-center"
          >
            {status === 'uploading' ? "Yuklanmoqda..." : "Bazaga yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcel;