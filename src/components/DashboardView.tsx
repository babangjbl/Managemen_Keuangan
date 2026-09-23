import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Sparkles,
  PlusCircle,
  Percent,
  KeyRound,
  ShieldCheck,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CategoryExpenseSummary, MonthlySummary, Transaction, AdminUser, GoogleSheetsSyncConfig } from '../types';
import {
  formatCompactRupiah,
  formatDateIndo,
  formatRupiah,
  getMonthYearKey,
  getMonthYearLabel,
} from '../utils/formatters';

interface Props {
  transactions: Transaction[];
  selectedMonth: string;
  adminUser: AdminUser;
  googleSyncConfig?: GoogleSheetsSyncConfig;
  onOpenGoogleSheetsModal?: () => void;
  onOpenProfileModal: () => void;
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onNavigateSheet: (sheet: 'income' | 'expense' | 'categories') => void;
  onSelectCell?: (cellRef: string, formula: string, value: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  transactions,
  selectedMonth,
  adminUser,
  googleSyncConfig,
  onOpenGoogleSheetsModal,
  onOpenProfileModal,
  onOpenAddModal,
  onNavigateSheet,
  onSelectCell,
}) => {
  // Filtered transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => getMonthYearKey(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Income and Expense breakdown
  const incomeTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'income'),
    [filteredTransactions]
  );
  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'expense'),
    [filteredTransactions]
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0),
    [incomeTransactions]
  );
  const totalExpense = useMemo(
    () => expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0),
    [expenseTransactions]
  );
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpense / totalIncome) * 100) : 0;

  // Monthly data for comparison chart (across all available months)
  const monthlyData: MonthlySummary[] = useMemo(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      const mKey = getMonthYearKey(tx.date);
      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, { income: 0, expense: 0 });
      }
      const data = monthMap.get(mKey)!;
      if (tx.type === 'income') {
        data.income += tx.amount;
      } else {
        data.expense += tx.amount;
      }
    });

    // Sort chronologically
    const sortedKeys = Array.from(monthMap.keys()).sort();
    return sortedKeys.map((key) => {
      const d = monthMap.get(key)!;
      return {
        monthKey: key,
        label: getMonthYearLabel(key),
        income: d.income,
        expense: d.expense,
        net: d.income - d.expense,
      };
    });
  }, [transactions]);

  // Expense categorized summary for Donut/Pie Chart
  const categoryExpenseData: CategoryExpenseSummary[] = useMemo(() => {
    const catMap = new Map<string, { amount: number; count: number }>();
    expenseTransactions.forEach((tx) => {
      const current = catMap.get(tx.category) || { amount: 0, count: 0 };
      catMap.set(tx.category, {
        amount: current.amount + tx.amount,
        count: current.count + 1,
      });
    });

    // Color palette for categories
    const palette = [
      '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
      '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#64748b'
    ];

    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1].amount - a[1].amount);
    return sortedCats.map(([cat, data], idx) => ({
      category: cat,
      amount: data.amount,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
      color: palette[idx % palette.length],
      transactionCount: data.count,
    }));
  }, [expenseTransactions, totalExpense]);

  // Payment methods breakdown
  const paymentMethodData = useMemo(() => {
    const methodMap = new Map<string, { count: number; total: number }>();
    filteredTransactions.forEach((tx) => {
      const current = methodMap.get(tx.paymentMethod) || { count: 0, total: 0 };
      methodMap.set(tx.paymentMethod, {
        count: current.count + 1,
        total: current.total + tx.amount,
      });
    });

    return Array.from(methodMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTransactions]);

  // Ringkasan Otomatis (Automatic Insights)
  const automaticInsights = useMemo(() => {
    // 1. Largest expense
    const largestExpense = expenseTransactions.length > 0
      ? [...expenseTransactions].sort((a, b) => b.amount - a.amount)[0]
      : null;

    // 2. Largest income
    const largestIncome = incomeTransactions.length > 0
      ? [...incomeTransactions].sort((a, b) => b.amount - a.amount)[0]
      : null;

    // 3. Top expense category
    const topCategory = categoryExpenseData.length > 0 ? categoryExpenseData[0] : null;

    // 4. Most used payment method
    const topPayment = paymentMethodData.length > 0 ? paymentMethodData[0] : null;

    // 5. Average expense per transaction
    const avgExpensePerTx = expenseTransactions.length > 0
      ? totalExpense / expenseTransactions.length
      : 0;

    // 6. Cashflow condition diagnosis
    let healthStatus: 'optimal' | 'good' | 'warning' | 'danger' = 'good';
    let healthBadge = 'Sehat (Surplus)';
    let healthMessage = 'Cashflow positif dan stabil. Tabungan terakumulasi dengan baik.';

    if (netBalance < 0) {
      healthStatus = 'danger';
      healthBadge = 'Defisit (Perhatian)';
      healthMessage = 'Pengeluaran melebihi pemasukan. Evaluasi pos pengeluaran sekunder & tersier.';
    } else if (expenseRatio > 85) {
      healthStatus = 'warning';
      healthBadge = 'Waspada (Ketahanan Rendah)';
      healthMessage = 'Pengeluaran menyerap lebih dari 85% pemasukan. Ruang gerak tabungan minim.';
    } else if (savingsRate >= 30) {
      healthStatus = 'optimal';
      healthBadge = 'Sangat Sehat (Optimal)';
      healthMessage = `Alokasi tabungan ${savingsRate.toFixed(0)}% telah melampaui standar ideal keuangan (20%).`;
    }

    return {
      largestExpense,
      largestIncome,
      topCategory,
      topPayment,
      avgExpensePerTx,
      healthStatus,
      healthBadge,
      healthMessage,
    };
  }, [
    expenseTransactions,
    incomeTransactions,
    categoryExpenseData,
    paymentMethodData,
    totalExpense,
    netBalance,
    expenseRatio,
    savingsRate,
  ]);

  return (
    <div id="dashboard-view-container" className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Bento Admin Profile & Access Card */}
      <div
        id="bento-admin-profile"
        className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-base flex items-center justify-center shadow-inner shrink-0">
            {adminUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white tracking-tight">{adminUser.name}</span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {adminUser.role}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Sesi Aktif
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Username: <strong className="text-slate-200 font-mono">@{adminUser.username}</strong></span>
              <span className="text-slate-600 hidden sm:inline">&bull;</span>
              <span className="text-slate-400 hidden sm:inline">Hak Akses: Pengelolaan Spreadsheet Finansial Penuh</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          {onOpenGoogleSheetsModal && (
            <button
              type="button"
              id="btn-dashboard-google-sheets"
              onClick={onOpenGoogleSheetsModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 shadow-xs transition cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {googleSyncConfig?.accessToken
                  ? 'Google Sheets Terkoneksi'
                  : 'Hubungkan Google Sheets'}
              </span>
              {googleSyncConfig?.accessToken && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-dashboard-edit-profile"
            onClick={onOpenProfileModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer active:scale-95 border border-emerald-500/30"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ganti Username / Password</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Formula Banner Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            $
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Bento Dashboard &middot; Formula Terkoneksi Otomatis</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
                =SUMIF / =QUERY / =ARRAYFORMULA
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Setiap perubahan baris di Sheet Pemasukan & Pengeluaran langsung terakumulasi pada kisi Bento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAddModal('income')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer active:scale-95"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            + Pemasukan
          </button>
          <button
            type="button"
            onClick={() => onOpenAddModal('expense')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer active:scale-95"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            + Pengeluaran
          </button>
        </div>
      </div>

      {/* 1. Bento Grid Top Row: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Bento Tile 1: Total Pemasukan (col-span-3) */}
        <div
          id="kpi-total-income"
          onClick={() =>
            onSelectCell?.('DASH!B2', '=SUM(Pemasukan!E:E)', formatRupiah(totalIncome))
          }
          className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black text-emerald-600 font-mono tracking-tight">
              {formatRupiah(totalIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold border-t border-slate-100 pt-2">
            <span className="font-mono text-slate-500 font-normal">=SUM(Pemasukan!E:E)</span>
            <span>{incomeTransactions.length} Transaksi</span>
          </div>
        </div>

        {/* Bento Tile 2: Total Pengeluaran (col-span-3) */}
        <div
          id="kpi-total-expense"
          onClick={() =>
            onSelectCell?.('DASH!C2', '=SUM(Pengeluaran!E:E)', formatRupiah(totalExpense))
          }
          className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-xs hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black text-rose-600 font-mono tracking-tight">
              {formatRupiah(totalExpense)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-rose-600 font-semibold border-t border-slate-100 pt-2">
            <span className="font-mono text-slate-500 font-normal">=SUM(Pengeluaran!E:E)</span>
            <span>{expenseTransactions.length} Transaksi</span>
          </div>
        </div>

        {/* Bento Tile 3: Saldo Bersih (Signature Dark Bento Card - col-span-3) */}
        <div
          id="kpi-net-balance"
          onClick={() =>
            onSelectCell?.(
              'DASH!D2',
              '=B2-C2 // Pemasukan minus Pengeluaran',
              formatRupiah(netBalance)
            )
          }
          className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-lg text-white cursor-pointer hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saldo Bersih
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
              {formatRupiah(netBalance)}
            </span>
          </div>
          <div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all ${netBalance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${Math.min(Math.max(savingsRate, 5), 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
              <span>Simpanan: {savingsRate.toFixed(1)}%</span>
              <span className={netBalance >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {automaticInsights.healthBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Bento Tile 4: Kategori Utama (col-span-3) */}
        <div
          id="kpi-top-categories"
          className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kategori Utama
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 my-2">
            {categoryExpenseData.slice(0, 5).map((cat) => (
              <span
                key={cat.category}
                className="px-2 py-0.5 bg-slate-100 text-[10px] rounded-md border border-slate-200 font-semibold text-slate-700 truncate max-w-[130px]"
                title={cat.category}
              >
                {cat.category}
              </span>
            ))}
            {categoryExpenseData.length === 0 && (
              <span className="text-xs text-slate-400">Belum ada kategori</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
            <span>Alokasi Belanja:</span>
            <span className="font-bold text-slate-800">{expenseRatio.toFixed(0)}% dari In</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Bento Row: Cashflow Analysis (8 Cols) & Expense Allocation (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento Card: Analisis Arus Kas (8 Cols) */}
        <div
          id="chart-monthly-comparison"
          className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col justify-between"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Analisis Arus Kas (Pemasukan vs Pengeluaran per Bulan)
              </h3>
              <p className="text-[11px] text-slate-500">
                Perbandingan tren arus kas masuk dan keluar per periode pencatatan
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-slate-600">Pengeluaran</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => formatCompactRupiah(val)}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatRupiah(Number(value) || 0),
                    name === 'income' ? 'Pemasukan' : 'Pengeluaran',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento Card: Alokasi Pengeluaran (4 Cols) */}
        <div
          id="chart-category-breakdown"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 tracking-tight">
                Alokasi Pengeluaran
              </h3>
              <p className="text-[11px] text-slate-500">
                Proporsi pengeluaran berdasarkan kategori
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSheet('categories')}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              Kelola &rarr;
            </button>
          </div>

          {categoryExpenseData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-xs text-slate-400">
              Belum ada data pengeluaran untuk periode ini
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 my-auto">
              {categoryExpenseData.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={cat.category}>
                        {cat.category}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {formatCompactRupiah(cat.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 font-mono w-9 text-right shrink-0">
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Total: {categoryExpenseData.length} Pos Kategori</span>
            <span className="font-bold text-slate-700">{formatRupiah(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bento Row: Ringkasan Otomatis (3 Bento Tiles) */}
      <div id="section-automatic-summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bento Subcard 1: Transaksional */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transaksional
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              =DATA()
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Rata-rata Pengeluaran:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatRupiah(automaticInsights.avgExpensePerTx)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Baris Tercatat:</span>
              <span className="font-mono font-bold text-slate-900">
                {filteredTransactions.length} transaksi
              </span>
            </div>
            {automaticInsights.largestExpense && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">
                  Pengeluaran Terbesar:
                </span>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-medium text-slate-800 truncate max-w-[140px]">
                    {automaticInsights.largestExpense.description}
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatRupiah(automaticInsights.largestExpense.amount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bento Subcard 2: Pola Pengeluaran */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pola Pengeluaran
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              =PATTERN()
            </span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">Kategori Terbesar:</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-slate-900">
                  {automaticInsights.topCategory?.category || '-'}
                </span>
                <span className="font-mono text-slate-600 font-semibold">
                  {automaticInsights.topCategory
                    ? `${automaticInsights.topCategory.percentage.toFixed(1)}%`
                    : '-'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 text-[10px] block uppercase font-bold tracking-wider">Kanal Pembayaran Utama:</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-slate-900">
                  {automaticInsights.topPayment?.name || '-'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {automaticInsights.topPayment ? `${automaticInsights.topPayment.count}x pakai` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Subcard 3: Evaluasi Cashflow & Kaidah 50/30/20 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rekomendasi Finansial
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              50 / 30 / 20
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <p className="font-semibold text-slate-800 leading-snug">
              {automaticInsights.healthMessage}
            </p>
            <p className="text-[11px] text-slate-500">
              Idealnya: Kebutuhan &le; 50%, Keinginan &le; 30%, Simpanan/Investasi &ge; 20%.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Rasio Tabungan:</span>
            <span className="font-mono font-bold text-emerald-600 text-sm">
              {savingsRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation to Sheet Detail - Bento Dual Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigateSheet('income')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition shadow-xs group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              +
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Sheet 2: Pemasukan
              </div>
              <div className="text-xs text-slate-500">
                Kelola baris Tanggal, Kategori, Keterangan, Metode & Nominal
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateSheet('expense')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-500 transition shadow-xs group cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
              -
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Sheet 3: Pengeluaran
              </div>
              <div className="text-xs text-slate-500">
                Kelola baris Tanggal, Kategori, Keterangan, Metode & Nominal
              </div>
            </div>
          </div>
          <ArrowDownRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
        </button>
      </div>
    </div>
  );
};
