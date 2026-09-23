import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Info,
  Check,
  Palette,
} from 'lucide-react';
import { CategoryItem, PaymentMethodItem, Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';

interface Props {
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
  transactions: Transaction[];
  onAddCategory: (cat: Omit<CategoryItem, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onAddPaymentMethod: (method: Omit<PaymentMethodItem, 'id'>) => void;
  onDeletePaymentMethod: (id: string) => void;
  onSelectCell?: (cellRef: string, formula: string, value: string) => void;
}

export const CategoriesView: React.FC<Props> = ({
  categories,
  paymentMethods,
  transactions,
  onAddCategory,
  onDeleteCategory,
  onAddPaymentMethod,
  onDeletePaymentMethod,
  onSelectCell,
}) => {
  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  // New payment method form
  const [newPayName, setNewPayName] = useState('');
  const [newPayType, setNewPayType] = useState<'bank' | 'cash' | 'ewallet' | 'credit'>('bank');

  const incomeCats = categories.filter((c) => c.type === 'income');
  const expenseCats = categories.filter((c) => c.type === 'expense');

  // Helper to count usage of category
  const getCategoryStats = (catName: string, type: 'income' | 'expense') => {
    const matched = transactions.filter((t) => t.type === type && t.category === catName);
    const total = matched.reduce((acc, curr) => acc + curr.amount, 0);
    return { count: matched.length, total };
  };

  // Helper to count usage of payment method
  const getPaymentStats = (methodName: string) => {
    const matched = transactions.filter((t) => t.paymentMethod === methodName);
    const total = matched.reduce((acc, curr) => acc + curr.amount, 0);
    return { count: matched.length, total };
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
    });
    setNewCatName('');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPayName.trim()) return;
    onAddPaymentMethod({
      name: newPayName.trim(),
      type: newPayType,
    });
    setNewPayName('');
  };

  return (
    <div id="categories-sheet-container" className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header Info - Bento Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sheet 4: Master Kategori & Metode Pembayaran
              </h2>
              <p className="text-xs text-slate-500">
                Pusat data validasi dropdown untuk Sheet Pemasukan & Pengeluaran
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Di Excel/Google Sheets: Dipakai sebagai <strong>Data Validation &rarr; List from range</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Bento Grid: Kategori Pemasukan, Kategori Pengeluaran, Metode Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom 1: Kategori Pemasukan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-emerald-900">Kategori Pemasukan</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/60">
              {incomeCats.length} Kategori
            </span>
          </div>

          {/* List Kategori Pemasukan */}
          <div className="p-3.5 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {incomeCats.map((cat, idx) => {
              const stats = getCategoryStats(cat.name, 'income');
              return (
                <div
                  key={cat.id}
                  onClick={() =>
                    onSelectCell?.(
                      `CAT!A${idx + 2}`,
                      `=Kategori!A${idx + 2}`,
                      cat.name
                    )
                  }
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition text-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">{cat.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {stats.count} Transaksi &middot; {formatRupiah(stats.total)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus kategori "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Add Form Pemasukan */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                onAddCategory({
                  name: newCatName.trim(),
                  type: 'income',
                  color: newCatColor,
                });
                setNewCatName('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 shrink-0"
                title="Pilih warna"
              />
              <input
                type="text"
                placeholder="+ Tambah kategori..."
                value={newCatType === 'income' ? newCatName : ''}
                onFocus={() => setNewCatType('income')}
                onChange={(e) => {
                  setNewCatType('income');
                  setNewCatName(e.target.value);
                }}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95"
              >
                + Tambah
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 2: Kategori Pengeluaran */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-bold text-rose-900">Kategori Pengeluaran</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200/60">
              {expenseCats.length} Kategori
            </span>
          </div>

          {/* List Kategori Pengeluaran */}
          <div className="p-3.5 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {expenseCats.map((cat, idx) => {
              const stats = getCategoryStats(cat.name, 'expense');
              return (
                <div
                  key={cat.id}
                  onClick={() =>
                    onSelectCell?.(
                      `CAT!B${idx + 2}`,
                      `=Kategori!B${idx + 2}`,
                      cat.name
                    )
                  }
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition text-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">{cat.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {stats.count} Transaksi &middot; {formatRupiah(stats.total)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus kategori "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Add Form Pengeluaran */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                onAddCategory({
                  name: newCatName.trim(),
                  type: 'expense',
                  color: newCatColor,
                });
                setNewCatName('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 shrink-0"
                title="Pilih warna"
              />
              <input
                type="text"
                placeholder="+ Tambah kategori..."
                value={newCatType === 'expense' ? newCatName : ''}
                onFocus={() => setNewCatType('expense')}
                onChange={(e) => {
                  setNewCatType('expense');
                  setNewCatName(e.target.value);
                }}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95"
              >
                + Tambah
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 3: Metode Pembayaran */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-700" />
              <h3 className="text-sm font-bold text-sky-900">Metode Pembayaran</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200/60">
              {paymentMethods.length} Kanal
            </span>
          </div>

          {/* List Metode Pembayaran */}
          <div className="p-3.5 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {paymentMethods.map((method, idx) => {
              const stats = getPaymentStats(method.name);
              return (
                <div
                  key={method.id}
                  onClick={() =>
                    onSelectCell?.(
                      `CAT!C${idx + 2}`,
                      `=Kategori!C${idx + 2}`,
                      method.name
                    )
                  }
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition text-xs group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{method.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase font-mono font-bold">
                        {method.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {stats.count} Transaksi &middot; Total {formatRupiah(stats.total)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus metode "${method.name}"?`)) {
                        onDeletePaymentMethod(method.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Hapus metode"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Add Form Metode Pembayaran */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200">
            <form onSubmit={handleAddPaymentSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+ Tambah metode..."
                  value={newPayName}
                  onChange={(e) => setNewPayName(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
                <select
                  value={newPayType}
                  onChange={(e) => setNewPayType(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-medium"
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">e-Wallet</option>
                  <option value="cash">Tunai</option>
                  <option value="credit">Kredit</option>
                </select>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95"
                >
                  + Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
