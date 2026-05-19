import React, { useState } from 'react';
import { Calendar, Wallet, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Package, Plus, X, Loader2, Award } from 'lucide-react';
import api from '../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
// ─── Recharts grafiklar kutubxonasi komponentlari ───
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// ─── Yordamchi funksiyalar ───────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');

const TYPE_COLORS = {
    sale: { bg: 'bg-emerald-100 text-emerald-700', sign: '+' },
    customer_pay: { bg: 'bg-teal-100 text-teal-700', sign: '+' },
    income: { bg: 'bg-cyan-100 text-cyan-700', sign: '+' },
    supplier_pay: { bg: 'bg-rose-100 text-rose-700', sign: '−' },
    expense: { bg: 'bg-orange-100 text-orange-700', sign: '−' },
};
const isIncome = (type) => ['sale', 'customer_pay', 'income'].includes(type);

// Grafiklar uchun ranglar palitrasi
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Stat kartochkasi ────────────────────────────────────────────────────────
const StatCard = ({ title, main, subs = [], color, icon, isLoading }) => (
    <div className={`${color} rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-white/60`}>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
            <span className="opacity-60">{icon}</span>
        </div>
        {isLoading ? (
            <div className="h-7 w-24 bg-current opacity-10 rounded animate-pulse" />
        ) : (
            <p className="text-2xl font-black tabular-nums leading-none">
                {fmt(main)} <span className="text-xs font-bold opacity-60">so'm</span>
            </p>
        )}
        {subs.map((s, i) => (
            <p key={i} className="text-[11px] font-semibold opacity-75 leading-snug">{s}</p>
        ))}
    </div>
);

// ─── Chiqim qo'shish modali ──────────────────────────────────────────────────
const ExpenseModal = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const PRESETS = ['Arenda', 'Maosh', 'Svet', "Yo'lkira", 'Suv', 'Boshqa'];

    const submit = async () => {
        if (!amount || Number(amount) <= 0) return setError("Summa kiriting");
        if (!note.trim()) return setError("Izoh majburiy");
        setSaving(true);
        setError('');
        try {
            await api.post('/expenses/add/', { amount: Number(amount), note: note.trim() });
            onSuccess();
            onClose();
        } catch (e) {
            setError(e.response?.data?.error || "Xato yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-lg">Chiqim qo'shish</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PRESETS.map(p => (
                        <button
                            key={p}
                            onClick={() => setNote(p)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                note === p
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <input
                    type="text"
                    placeholder="Izoh (masalan: Arenda)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 transition-colors"
                />
                <input
                    type="number"
                    placeholder="Summa (so'm)"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 transition-colors"
                />

                {error && <p className="text-rose-500 text-xs font-bold">{error}</p>}

                <button
                    onClick={submit}
                    disabled={saving}
                    className="w-full bg-slate-900 text-white rounded-2xl py-3 font-black text-sm hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                    Saqlash
                </button>
            </div>
        </div>
    );
};

// ─── Asosiy Dashboard Komponenti ─────────────────────────────────────────────
const Dashboard = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const { data: dashboardData, isLoading, isError } = useQuery({
        queryKey: ['dashboard', date, page],
        queryFn: async () => {
            const res = await api.get(`/owner-dashboard/?date=${date}&page=${page}`);
            return res.data;
        },
        keepPreviousData: true,
    });

    const s = dashboardData?.stats || {};
    const transactions = dashboardData?.transactions || [];
    const topProducts = s.top_products || []
    const pagination = dashboardData?.pagination || { total_pages: 1, current_page: 1, count: 0, next: null, previous: null };
    console.log(topProducts);
    
    const daily_debt_sales = (s.daily_total_sales || 0) - (s.daily_cash_sales || 0);

    const handleExpenseSuccess = () => {
        queryClient.invalidateQueries(['dashboard']);
        toast.success("Chiqim muvaffaqiyatli qo'shildi!");
    };

    // Grafiklarga mos ma'lumotlar tuzilmasini yaratamiz
    const salesChartData = [
        { name: 'Naqd Savdo', value: s.daily_cash_sales || 0 },
        { name: 'Nasiya Savdo', value: daily_debt_sales || 0 },
    ];

    const financeFlowData = [
        { name: 'Kirim (Kassa)', summa: s.daily_cash_in || 0 },
        { name: 'Chiqim (Xarajat)', summa: (s.daily_supplier_pay || 0) + (s.daily_expenses || 0) }
    ];

    const statsCards = [
        {
            title: "Seyfdagi Naqd (Jami)",
            main: s.safe_balance,
            subs: [
                `Bugun kirim: +${fmt(s.daily_cash_in)} so'm`,
                `Bugun chiqim: −${fmt((s.daily_supplier_pay || 0) + (s.daily_expenses || 0))} so'm`,
            ],
            color: "bg-emerald-50 text-emerald-800",
            icon: <Wallet size={16} />
        },
        {
            title: "Kunlik Savdo (Jami)",
            main: s.daily_total_sales,
            subs: [
                `Naqd: ${fmt(s.daily_cash_sales)} so'm`,
                `Nasiya: ${fmt(daily_debt_sales)} so'm`,
            ],
            color: "bg-blue-50 text-blue-800",
            icon: <TrendingUp size={16} />
        },
        {
            title: "Kunlik Naqd Kassa",
            main: s.daily_cash_in,
            subs: [
                `Naqd savdo: ${fmt(s.daily_cash_sales)} so'm`,
                `Nasiya to'lovi: +${fmt(s.daily_customer_payments)} so'm`,
            ],
            color: "bg-teal-50 text-teal-800",
            icon: <ArrowUpRight size={16} />
        },
        {
            title: "Ta'minotchi Qarzi",
            main: s.total_supplier_debt,
            subs: [
                `Bugun nasiya olindi: +${fmt(s.daily_supplier_new_debt)} so'm`,
                `Bugun qaytarildi: +${fmt(s.daily_supplier_return)} so'm`,
                `Bugun to'landi: −${fmt(s.daily_supplier_pay)} so'm`,
            ],
            color: "bg-purple-50 text-purple-800",
            icon: <Users size={16} />
        },
        {
            title: "Mijozlar Qarzi (Bizda)",
            main: s.total_customer_debt,
            subs: [
                `Bugun yangi: +${fmt(s.daily_new_debt)} so'm`,
                `Bugun to'landi: −${fmt(s.daily_debt_collected)} so'm`,
            ],
            color: "bg-amber-50 text-amber-800",
            icon: <ArrowUpRight size={16} />
        },
        {
            title: "Kunlik Chiqimlar",
            main: s.daily_expenses,
            subs: (s.expense_list || []).slice(0, 2).map(e => `${e.note}: ${fmt(e.amount)} so'm`),
            color: "bg-rose-50 text-rose-800",
            icon: <ArrowDownRight size={16} />
        },
        {
            title: "Ombor Qiymati",
            main: s.inventory_value,
            subs: ["(Tan narxi bo'yicha)"],
            color: "bg-slate-100 text-slate-700",
            icon: <Package size={16} />
        },
    ];

    const totalPages = pagination.total_pages || 1;
    const hasNext = !!pagination.next;
    const hasPrev = !!pagination.previous;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

    if (isError) return <div className="p-10 text-center font-bold text-rose-500">Ma'lumotlarni yuklashda xatolik yuz berdi!</div>;

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
            {showExpenseModal && (
                <ExpenseModal
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={handleExpenseSuccess}
                />
            )}

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Moliyaviy Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition-colors"
                    >
                        <Plus size={16} />
                        Chiqim
                    </button>
                    <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-2xl shadow-sm border border-slate-200">
                        <Calendar size={16} className="text-blue-500" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => {
                                setDate(e.target.value);
                                setPage(1);
                            }}
                            className="outline-none font-bold text-slate-600 bg-transparent cursor-pointer text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* ── STATS GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {statsCards.map((c, i) => (
                    <StatCard key={i} {...c} isLoading={isLoading} />
                ))}
            </div>

            {/* ── 🌟 YANGI SEKSIYA: GRAFIKLAR VA TOP MAHSULOTLAR ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. KUNLIK SAVDO STRUKTURASI (Pie Chart) */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-2">Savdo Turi (Bugun)</h3>
                    <div className="h-56 w-full flex items-center justify-center">
                        {isLoading ? (
                            <div className="w-36 h-36 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin" />
                        ) : (s.daily_total_sales || 0) === 0 ? (
                            <p className="text-xs text-slate-400 font-bold">Bugun savdo bo'lmadi</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={salesChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {salesChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${fmt(value)} so'm`} />
                                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 2. Kassa Kirim-Chiqim Balansi (Bar Chart) */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-2">Kassa Balansi (Bugun)</h3>
                    <div className="h-56 w-full">
                        {isLoading ? (
                            <div className="w-full h-full bg-slate-50 rounded-2xl animate-pulse" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financeFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                                    <Tooltip formatter={(value) => `${fmt(value)} so'm`} />
                                    <Bar dataKey="summa" radius={[10, 10, 0, 0]}>
                                        <Cell fill="#10b981" />
                                        <Cell fill="#ef4444" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* 3. TOP 5 MAHSULOT KARTASI */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">Top 5 Mahsulot (Bugun)</h3>
                            <Award size={16} className="text-amber-500" />
                        </div>
                        <div className="space-y-2.5">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                                ))
                            ) : topProducts.length > 0 ? (
                                topProducts.map((p, idx) => (
                                    <div key={p.product__id || idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-50">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{p.product__name}</p>
                                                {p.product__category__name && (
                                                    <p className="text-[10px] text-slate-400 font-bold">{p.product__category__name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl text-xs font-black tabular-nums">
                                            {p.total_quantity} ta
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 font-bold text-center py-12">Bugun mahsulot sotilmadi</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* ── KUNLIK CHIQIMLAR RO'YXATI ── */}
            {(s.expense_list || []).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                    <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">
                        Bugungi Xarajatlar
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {s.expense_list.map(e => (
                            <div key={e.id} className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100">
                                <span>{e.note}</span>
                                <span className="opacity-70">—</span>
                                <span>{fmt(e.amount)} so'm</span>
                                {e.created_at && <span className="text-rose-400 text-[10px]">({e.created_at})</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TRANSAKSIYALAR JADVALI ── */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">
                        Pul Harakatlari
                    </h3>
                    <span className="text-xs text-slate-400 font-bold">
                        Jami: {pagination.count || 0} ta
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-3 w-12 text-center">#</th>
                                <th className="px-6 py-3">Turi</th>
                                <th className="px-6 py-3">To'lov usuli</th>
                                <th className="px-6 py-3">Summa</th>
                                <th className="px-6 py-3 text-right">Vaqt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 rounded animate-pulse w-20" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length > 0 ? (
                                transactions.map((t, idx) => {
                                    const income = isIncome(t.type);
                                    const colorCfg = TYPE_COLORS[t.type] || { bg: 'bg-slate-100 text-slate-600', sign: '' };
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-3.5 text-center text-slate-300 font-bold text-xs">
                                                {(page - 1) * 10 + idx + 1}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${colorCfg.bg}`}>
                                                    {t.type_display || t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    t.payment_method === 'cash'
                                                        ? 'bg-green-50 text-green-600'
                                                        : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                    {t.payment_method === 'cash' ? 'Naqd' : 'Nasiya'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-3.5 font-black tabular-nums ${income ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {income ? '+' : '−'}{fmt(t.amount)} so'm
                                            </td>
                                            <td className="px-6 py-3.5 text-right text-slate-400 text-xs font-bold">
                                                {t.created_at
                                                    ? new Date(t.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                                    : '—'
                                                }
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 font-bold text-sm">
                                        Tanlangan kunda pul harakatlari mavjud emas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── PAGINATION BUTTONS ── */}
                {!isLoading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">
                            Sahifa: <span className="text-slate-700">{page} / {totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!hasPrev}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {pageNumbers.map((p, idx, arr) => (
                                <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="px-1 text-slate-300 text-xs">…</span>
                                    )}
                                    <button
                                        onClick={() => setPage(p)}
                                        className={`min-w-8.5 h-8 rounded-xl font-black text-xs transition-all border ${
                                            page === p
                                                ? 'bg-slate-900 border-slate-900 text-white shadow'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))}

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={!hasNext}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;