import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Mail,
  Calendar,
  Shield,
  Search,
  UserPlus,
  Edit3,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import api from "../api/api";

const Users = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/all/"); // Backend yo'li
        setUsers(res.data);
      } catch (err) {
        console.error("Userlarni yuklashda xato:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAdd = async (e) => {
    try {
      
    } catch (error) {
      
    }
  }

  const handleUpdate = async (e) => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  
  // 1. XAVFSIZLIK: Agar selectedUser null bo'lsa, funksiyani to'xtatish
  if (!selectedUser) return;

  setIsUpdating(true);
  try {
    const updatedData = {
      username: selectedUser?.username,
      email: selectedUser?.email,
      is_active: selectedUser?.is_active,
    };

    const res = await api.put(`/users/update/${selectedUser.id}/`, updatedData);

    if (res.status === 200) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...updatedData } : u));
      setSelectedUser(null);
      alert("Muvaffaqiyatli yangilandi!");
    }
  } catch (err) {
    console.error("Xatolik tafsiloti:", err);
    
    // 2. XATOLIKNI ANIQLASHTIRISH
    if (err.response?.status === 400) {
      alert("Bu username band bo'lishi mumkin yoki ma'lumotlar noto'g'ri.");
    } else {
      alert("Server bilan bog'lanishda xato yuz berdi.");
    }
  } finally {
    setIsUpdating(false);
  }
};

  const handleDelete = async (userId) => {
    if (
      window.confirm(
        "Ushbu foydalanuvchini tizimdan butunlay o'chirib tashlamoqchimisiz?",
      )
    ) {
      try {
        await api.delete(`/users/delete/${userId}/`); // Backend URL
        // O'chgandan keyin ro'yxatni yangilaymiz
        setUsers(users.filter((u) => u.id !== userId));
        alert("Foydalanuvchi muvaffaqiyatli o'chirildi.");
      } catch (err) {
        alert("Xatolik: Foydalanuvchini o'chirib bo'lmadi.");
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* TEPADAGI QIDIRUV VA QO'SHISH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="User yoki email bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-100">
          <UserPlus size={18} /> Yangi User
        </button>
      </div>

      {/* FOYDALANUVCHILAR JADVALI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              <th className="px-6 py-4 w-12 text-center">#</th>
              <th className="px-6 py-4">Foydalanuvchi</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Qo'shilgan sana</th>
              <th className="px-6 py-4 text-center">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-400">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-center text-slate-400 text-sm">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {user.username}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          ID: {user.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-300" />{" "}
                      {user.email || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_superuser ? (
                      <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        Superadmin
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        Do'kon Egasi
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-300" />{" "}
                      {new Date(user.date_joined).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      {/* TAHRIRLASH TUGMASI */}
                      <button type="submit"
                       onClick={() => {setSelectedUser(user); }}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Tahrirlash"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* O'CHIRISH TUGMASI */}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && filteredUsers.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            Foydalanuvchilar topilmadi.
          </div>
        )}
      </div>
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* MODAL HEADER */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">Tahrirlash</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleUpdate} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={selectedUser.username}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Email Manzili
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                  value={selectedUser.email || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedUser.is_active}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      is_active: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-bold text-blue-700 cursor-pointer"
                >
                  Foydalanuvchi holati (Active)
                </label>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
