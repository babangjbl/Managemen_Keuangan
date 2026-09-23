import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Copy,
  ArrowUpDown,
  Calendar,
  CreditCard,
  Tag,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { CategoryItem, PaymentMethodItem, Transaction, TransactionType } from '../types';
import { formatDateIndo, formatRupiah, getMonthYearKey } from '../utils/formatters';

interface Props {
  type: TransactionType;
  transactions: Transaction[];
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
  selectedMonth: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, updated: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onSelectCell?: (cellRef: string, formula: string, value: string) => void;
}

export const SpreadsheetTableView: React.FC<Props> = ({
  type,
  transactions,
  categories,
  paymentMethods,
  selectedMonth,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onSelectCell,
}) => {
  const isIncome = type === 'income';
  const sheetName = isIncome ? 'Pemasukan' : 'Pengeluaran';
  const sheetPrefix = isIncome ? 'INC' : 'EXP';

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Quick inline add row state
  const [isInlineAdding, setIsInlineAdding] = useState(false);
  const [newRowDate, setNewRowDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newRowCategory, setNewRowCategory] = useState(
    () => categories.find((c) => c.type === type)?.name || ''
  );
  const [newRowDesc, setNewRowDesc] = useState('');
  const [newRowPayment, setNewRowPayment] = useState(() => paymentMethods[0]?.name || '');
  const [newRowAmount, setNewRowAmount] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  // Filter transactions
  const filteredList = useMemo(() => {
    return transactions
      .filter((t) => t.type === type)
      .filter((t) => (selectedMonth === 'all' ? true : getMonthYearKey(t.date) === selectedMonth))
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
        );
      })
      .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
      .filter((t) => (paymentFilter === 'all' ? true : t.paymentMethod === paymentFilter))
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc'
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date);
        }
        if (sortField === 'amount') {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
        return sortOrder === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      });
  }, [
    transactions,
    type,
    selectedMonth,
    searchQuery,
    categoryFilter,
    paymentFilter,
    sortField,
    sortOrder,
  ]);

  // Calculations for bottom summary row
  const totalAmount = useMemo(
    () => filteredList.reduce((sum, item) => sum + item.amount, 0),
    [filteredList]
  );
  const averageAmount = useMemo(
    () => (filteredList.length > 0 ? totalAmount / filteredList.length : 0),
    [filteredList, totalAmount]
  );

  // Available categories for this sheet type
  const activeCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newRowAmount.replace(/[^0-9]/g, ''));
    if (!newRowDesc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Mohon isi keterangan dan nominal valid');
      return;
    }

    onAddTransaction({
      type,
      date: newRowDate || new Date().toISOString().slice(0, 10),
      category: newRowCategory || (activeCategories[0]?.name || 'Lain-lain'),
      description: newRowDesc.trim(),
      paymentMethod: newRowPayment || (paymentMethods[0]?.name || 'Tunai'),
      amount: parsedAmount,
    });

    // Reset inline inputs
    setNewRowDesc('');
    setNewRowAmount('');
    setIsInlineAdding(false);
  };

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    if (editForm) {
      onUpdateTransaction(id, editForm);
    }
    setEditingId(null);
    setEditForm({});
  };

  const duplicateRow = (tx: Transaction) => {
    onAddTransaction({
      type: tx.type,
      date: tx.date,
      category: tx.category,
      description: `${tx.description} (Copy)`,
      paymentMethod: tx.paymentMethod,
      amount: tx.amount,
    });
  };

  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div id={`sheet-table-${type}`} className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Table Action Bar - Bento Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
              isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isIncome ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Sheet {isIncome ? '2: Pemasukan' : '3: Pengeluaran'}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
                {filteredList.length} Baris
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Struktur Input: Tanggal | Kategori | Keterangan | Metode Pembayaran | Nominal
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48 text-slate-800"
            />
          </div>

          {/* Filter Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">Semua Kategori</option>
            {activeCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filter Payment */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">Semua Metode</option>
            {paymentMethods.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Inline Add Toggle */}
          <button
            id={`btn-add-row-${type}`}
            type="button"
            onClick={() => setIsInlineAdding(!isInlineAdding)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl text-white shadow-xs cursor-pointer transition active:scale-95 ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Baris</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid Container - Bento Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Quick Inline Insert Bar (if open) */}
        {isInlineAdding && (
          <form
            onSubmit={handleSaveInline}
            className="bg-emerald-50/50 border-b border-emerald-200 p-3 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Baris Baru:
            </span>

            {/* Tanggal */}
            <input
              type="date"
              required
              value={newRowDate}
              onChange={(e) => setNewRowDate(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            />

            {/* Kategori */}
            <select
              value={newRowCategory}
              onChange={(e) => setNewRowCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            >
              {activeCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Keterangan */}
            <input
              type="text"
              required
              placeholder="Keterangan transaksi..."
              value={newRowDesc}
              onChange={(e) => setNewRowDesc(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 flex-1 min-w-[180px]"
            />

            {/* Metode Pembayaran */}
            <select
              value={newRowPayment}
              onChange={(e) => setNewRowPayment(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
            >
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Nominal */}
            <div className="relative">
              <span className="absolute left-2 top-1 text-slate-400 font-mono">Rp</span>
              <input
                type="number"
                required
                min="1"
                placeholder="Nominal..."
                value={newRowAmount}
                onChange={(e) => setNewRowAmount(e.target.value)}
                className="bg-white border border-slate-200 rounded pl-7 pr-2 py-1 text-xs text-slate-800 font-mono w-28 text-right"
              />
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer shadow-2xs"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsInlineAdding(false)}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            {/* Spreadsheet Column Header A, B, C, D, E, F */}
            <thead>
              <tr className="bg-slate-100 text-slate-500 border-b border-slate-200 select-none text-[11px] font-mono">
                <th className="w-12 px-3 py-1.5 text-center border-r border-slate-200 font-medium bg-slate-200/60">
                  #
                </th>
                <th className="w-32 px-3 py-1.5 border-r border-slate-200 font-medium">
                  A &middot; Tanggal
                </th>
                <th className="w-44 px-3 py-1.5 border-r border-slate-200 font-medium">
                  B &middot; Kategori
                </th>
                <th className="px-3 py-1.5 border-r border-slate-200 font-medium">
                  C &middot; Keterangan
                </th>
                <th className="w-44 px-3 py-1.5 border-r border-slate-200 font-medium">
                  D &middot; Metode Pembayaran
                </th>
                <th className="w-36 px-3 py-1.5 text-right border-r border-slate-200 font-medium">
                  E &middot; Nominal (IDR)
                </th>
                <th className="w-24 px-3 py-1.5 text-center font-medium">
                  Aksi
                </th>
              </tr>
            </thead>

            {/* Rows */}
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data transaksi yang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredList.map((tx, idx) => {
                  const rowNumber = idx + 2; // spreadsheet row starting at row 2 (row 1 is header)
                  const isEditing = editingId === tx.id;
                  const catMeta = categories.find((c) => c.name === tx.category);

                  if (isEditing) {
                    return (
                      <tr key={tx.id} className="bg-amber-50/70">
                        <td className="px-3 py-2 text-center font-mono text-slate-400 bg-slate-50 border-r border-slate-200">
                          {rowNumber}
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="date"
                            value={editForm.date || tx.date}
                            onChange={(e) =>
                              setEditForm({ ...editForm, date: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <select
                            value={editForm.category || tx.category}
                            onChange={(e) =>
                              setEditForm({ ...editForm, category: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          >
                            {activeCategories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={editForm.description || tx.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200">
                          <select
                            value={editForm.paymentMethod || tx.paymentMethod}
                            onChange={(e) =>
                              setEditForm({ ...editForm, paymentMethod: e.target.value })
                            }
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          >
                            {paymentMethods.map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            value={editForm.amount || tx.amount}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                amount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(tx.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-medium hover:bg-emerald-700 cursor-pointer"
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[11px] hover:bg-slate-300 cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Row number */}
                      <td className="px-3 py-2 text-center font-mono text-slate-400 bg-slate-50/60 border-r border-slate-200 text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Col A: Tanggal */}
                      <td
                        onClick={() =>
                          onSelectCell?.(
                            `${sheetPrefix}!A${rowNumber}`,
                            `=TEXT(A${rowNumber}, "DD/MM/YYYY")`,
                            tx.date
                          )
                        }
                        className="px-3 py-2 border-r border-slate-100 font-mono text-slate-700 cursor-pointer"
                      >
                        {formatDateIndo(tx.date)}
                      </td>

                      {/* Col B: Kategori */}
                      <td
                        onClick={() =>
                          onSelectCell?.(
                            `${sheetPrefix}!B${rowNumber}`,
                            `=VLOOKUP(B${rowNumber}, Kategori!A:C, 1, FALSE)`,
                            tx.category
                          )
                        }
                        className="px-3 py-2 border-r border-slate-100 cursor-pointer"
                      >
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{
                            backgroundColor: catMeta ? `${catMeta.color}15` : '#f1f5f9',
                            color: catMeta ? catMeta.color : '#475569',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: catMeta ? catMeta.color : '#94a3b8' }}
                          />
                          {tx.category}
                        </span>
                      </td>

                      {/* Col C: Keterangan */}
                      <td
                        onClick={() =>
                          onSelectCell?.(
                            `${sheetPrefix}!C${rowNumber}`,
                            `="${tx.description}"`,
                            tx.description
                          )
                        }
                        className="px-3 py-2 border-r border-slate-100 text-slate-800 font-medium cursor-pointer"
                      >
                        {tx.description}
                      </td>

                      {/* Col D: Metode Pembayaran */}
                      <td
                        onClick={() =>
                          onSelectCell?.(
                            `${sheetPrefix}!D${rowNumber}`,
                            `="${tx.paymentMethod}"`,
                            tx.paymentMethod
                          )
                        }
                        className="px-3 py-2 border-r border-slate-100 text-slate-600 cursor-pointer"
                      >
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.paymentMethod}
                        </span>
                      </td>

                      {/* Col E: Nominal */}
                      <td
                        onClick={() =>
                          onSelectCell?.(
                            `${sheetPrefix}!E${rowNumber}`,
                            `=${tx.amount}`,
                            formatRupiah(tx.amount)
                          )
                        }
                        className={`px-3 py-2 text-right font-mono font-semibold border-r border-slate-100 cursor-pointer ${
                          isIncome ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {formatRupiah(tx.amount)}
                      </td>

                      {/* Col F: Aksi */}
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => startEdit(tx)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="Ubah baris ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRow(tx)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                            title="Duplikasi baris ini"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary Formula Row: =SUM(E2:E...) */}
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="px-3 py-2.5 text-center font-mono text-slate-400 bg-slate-200/70 border-r border-slate-200">
                  &Sigma;
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-[11px] text-emerald-800">
                  =COUNT({filteredList.length})
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200 text-slate-600 text-xs">
                  Ringkasan Kolom
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200 text-slate-600 text-xs font-mono">
                  Rata-rata: {formatRupiah(averageAmount)}
                </td>
                <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-xs text-slate-500">
                  =SUM(E2:E{filteredList.length + 1})
                </td>
                <td
                  onClick={() =>
                    onSelectCell?.(
                      `${sheetPrefix}!E_TOTAL`,
                      `=SUM(${sheetPrefix}!E2:E${filteredList.length + 1})`,
                      formatRupiah(totalAmount)
                    )
                  }
                  className={`px-3 py-2.5 text-right font-mono text-sm border-r border-slate-200 cursor-pointer ${
                    isIncome ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {formatRupiah(totalAmount)}
                </td>
                <td className="px-3 py-2.5 text-center text-[10px] text-slate-500">
                  Terkalkulasi
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
