import React, { useState, useEffect } from 'react';
import { Calendar, Wallet, TrendingUp, Users,ArrowUpRight, ArrowDownRight, ChevronLeft,ChevronRight, Package, Plus, X, Loader2} from 'lucide-react';
import api from '../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

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

// ─── Stat kartochkasi ────────────────────────────────────────────────────────
const StatCard = ({ title, main, subs = [], color, icon, isLoading }) => (
    <div className={`${color} rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-white/60`}>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
            <span className="opacity-60">{icon}</span>
        </div>
        {isLoading
            ? <div className="h-7 w-24 bg-current opacity-10 rounded animate-pulse" />
            : <p className="text-2xl font-black tabular-nums leading-none">{fmt(main)} <span className="text-xs font-bold opacity-60">so'm</span></p>
        }
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

                {/* Preset tugmalar */}
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

// ─── Asosiy Dashboard ────────────────────────────────────────────────────────
const Dashboard = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [page, setPage] = useState(1);
    const [showExpenseModal, setShowExpenseModal] = useState(false);


    const [data, setData] = useState({
        stats: {},
        transactions: [],
        pagination: { total_pages: 1, current_page: 1, next: null, previous: null }
    });

    const { data: dashboardData, isLoading, isError } = useQuery({
        queryKey: ['dashboard', date, page], // Sana yoki sahifa o'zgarsa o'zi load qiladi
        queryFn: async () => {
            const res = await api.get(`/owner-dashboard/?date=${date}&page=${page}`);
            return res.data;
        },
        keepPreviousData: true, // Sahifa almashganda ekran "oqarib" qolmaydi
    });

    const s = dashboardData?.stats || {};
    const transactions = dashboardData?.transactions || [];
    const daily_debt_sales = (s.daily_total_sales || 0) - (s.daily_cash_sales || 0);


    if (isLoading) return <div className="p-10 text-center font-bold">Yuklanmoqda...</div>;
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

    const totalPages = data.pagination?.total_pages || 1;
    const hasNext = !!data.pagination?.next;
    const hasPrev = !!data.pagination?.previous;

    // Sahifa raqamlarini hisoblash
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen">
            {showExpenseModal && (
                <ExpenseModal
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={loadData}
                />
            )}

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Moliyaviy Dashboard</h1>
                <div className="flex items-center gap-2">
                    {/* Chiqim qo'shish */}
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm transition-colors"
                    >
                        <Plus size={16} />
                        Chiqim
                    </button>
                    {/* Sana */}
                    <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-2xl shadow-sm border border-slate-200">
                        <Calendar size={16} className="text-blue-500" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
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
                                <span className="text-rose-400 text-[10px]">{e.created_at}</span>
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
                        Jami: {data.pagination?.count || 0} ta
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-3 w-12 text-center">#</th>
                                <th className="px-6 py-3">Turi</th>
                                <th className="px-6 py-3">To'lov</th>
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
                            ) : data.transactions?.length > 0 ? (
                                data.transactions.map((t, idx) => {
                                    const income = isIncome(t.type);
                                    const colorCfg = TYPE_COLORS[t.type] || { bg: 'bg-slate-100 text-slate-600', sign: '' };
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-3.5 text-center text-slate-300 font-bold text-xs">
                                                {(page - 1) * 10 + idx + 1}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${colorCfg.bg}`}>
                                                    {t.type_display}
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
                                                {income ? '+' : '−'}{fmt(t.amount)}
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
                                        Bu kunda pul harakati yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-400">
                            Sahifa: <span className="text-slate-700">{page} / {totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!hasPrev || isLoading}
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
                                        className={`min-w-[34px] h-8 rounded-xl font-black text-xs transition-all border ${
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
                                disabled={!hasNext || isLoading}
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