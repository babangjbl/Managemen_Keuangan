import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Tag, CreditCard, DollarSign } from 'lucide-react';
import { CategoryItem, PaymentMethodItem, Transaction, TransactionType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id'>) => void;
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
  defaultType?: TransactionType;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  paymentMethods,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');

  // Update default selections when type changes
  useEffect(() => {
    setType(defaultType);
  }, [defaultType, isOpen]);

  useEffect(() => {
    const activeCats = categories.filter((c) => c.type === type);
    if (activeCats.length > 0) {
      setCategory(activeCats[0].name);
    }
    if (paymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(paymentMethods[0].name);
    }
  }, [type, categories, paymentMethods]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/[^0-9]/g, ''));
    if (!description.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      alert('Mohon lengkapi keterangan dan nominal valid');
      return;
    }

    onSubmit({
      type,
      date: date || new Date().toISOString().slice(0, 10),
      category: category || 'Lain-lain',
      description: description.trim(),
      paymentMethod: paymentMethod || 'Tunai',
      amount: cleanAmount,
    });

    // Reset
    setDescription('');
    setAmountStr('');
    onClose();
  };

  const activeCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Tambah Data Transaksi Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Transaction Type Segmented Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Pemasukan</span>
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Pengeluaran</span>
              </button>
            </div>
          </div>

          {/* Kolom 1: Tanggal */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tanggal (Kolom A)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Kolom 2: Kategori */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Kategori (Kolom B - Dropdown)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kolom 3: Keterangan */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Keterangan (Kolom C)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Gaji Pokok, Belanja Bulanan, dsb."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Kolom 4: Metode Pembayaran */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Metode Pembayaran (Kolom D - Dropdown)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kolom 5: Nominal */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nominal (Kolom E)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-500 font-mono">
                Rp
              </span>
              <input
                type="number"
                required
                min="1"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition shadow-xs cursor-pointer active:scale-95 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Simpan ke Spreadsheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
