import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const FormulaGuideView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formulaCards = [
    {
      title: 'Total Pemasukan (Dashboard)',
      targetCell: 'Dashboard!B2',
      formula: '=SUM(Pemasukan!E2:E)',
      excelAlt: '=SUM(Pemasukan!E:E)',
      description: 'Menjumlahkan seluruh nominal di kolom E sheet Pemasukan secara dinamis.',
      category: 'Dashboard KPI',
    },
    {
      title: 'Total Pengeluaran (Dashboard)',
      targetCell: 'Dashboard!C2',
      formula: '=SUM(Pengeluaran!E2:E)',
      excelAlt: '=SUM(Pengeluaran!E:E)',
      description: 'Menjumlahkan seluruh nominal di kolom E sheet Pengeluaran secara otomatis.',
      category: 'Dashboard KPI',
    },
    {
      title: 'Saldo Bersih (Net Balance)',
      targetCell: 'Dashboard!D2',
      formula: '=B2 - C2',
      excelAlt: '=B2 - C2',
      description: 'Mengurangkan Total Pemasukan (B2) dengan Total Pengeluaran (C2). Jika negatif, format teks merah.',
      category: 'Dashboard KPI',
    },
    {
      title: 'Rasio Tabungan / Simpanan (%)',
      targetCell: 'Dashboard!E2',
      formula: '=IF(B2>0, (D2 / B2), 0)',
      excelAlt: '=IF(B2>0, (D2/B2), 0)',
      description: 'Menghitung persentase tabungan terhadap total pemasukan (format sebagai Persentase %).',
      category: 'Dashboard KPI',
    },
    {
      title: 'Pengeluaran per Kategori (Tabel Ringkasan)',
      targetCell: 'Dashboard!H3',
      formula: '=SUMIF(Pengeluaran!$B$2:$B, G3, Pengeluaran!$E$2:$E)',
      excelAlt: '=SUMIF(Pengeluaran!$B:$B, G3, Pengeluaran!$E:$E)',
      description: 'Menjumlahkan nominal pengeluaran khusus untuk kategori tertentu di cell G3 (misal: "Makanan & Minuman").',
      category: 'Breakdown & Grafik',
    },
    {
      title: 'Pengeluaran per Periode Bulan Tertentu',
      targetCell: 'Dashboard!B10',
      formula: '=SUMIFS(Pengeluaran!$E:$E, Pengeluaran!$A:$A, ">=2026-09-01", Pengeluaran!$A:$A, "<=2026-09-30")',
      excelAlt: '=SUMIFS(Pengeluaran!E:E, Pengeluaran!A:A, ">=2026-09-01", Pengeluaran!A:A, "<=2026-09-30")',
      description: 'Kalkulasi pengeluaran bulanan bersyarat antara tanggal awal dan tanggal akhir bulan.',
      category: 'Breakdown & Grafik',
    },
    {
      title: 'Validasi Dropdown Kategori (Data Validation)',
      targetCell: 'Pemasukan!B2:B & Pengeluaran!B2:B',
      formula: '=Kategori!$A$2:$A$20 (Untuk Pemasukan) / =Kategori!$B$2:$B$20 (Untuk Pengeluaran)',
      excelAlt: '=Kategori!$A$2:$A$20',
      description: 'Pengaturan menu Data -> Data Validation -> List from range agar user memilih dari daftar kategori tanpa salah ketik.',
      category: 'Struktur Input',
    },
    {
      title: 'Validasi Dropdown Metode Pembayaran',
      targetCell: 'Pemasukan!D2:D & Pengeluaran!D2:D',
      formula: '=Kategori!$C$2:$C$20',
      excelAlt: '=Kategori!$C$2:$C$20',
      description: 'Dropdown sumber pembayaran (Transfer BCA, Mandiri, GoPay, OVO, Cash, dll).',
      category: 'Struktur Input',
    },
    {
      title: 'Pengeluaran Terbesar (Ringkasan Otomatis)',
      targetCell: 'Dashboard!F6',
      formula: '=MAX(Pengeluaran!E2:E)',
      excelAlt: '=MAX(Pengeluaran!E:E)',
      description: 'Mengambil nilai nominal pengeluaran tertinggi yang pernah dikeluarkan.',
      category: 'Ringkasan Otomatis',
    },
    {
      title: 'Rata-rata Pengeluaran per Transaksi',
      targetCell: 'Dashboard!F7',
      formula: '=AVERAGE(Pengeluaran!E2:E)',
      excelAlt: '=AVERAGE(Pengeluaran!E:E)',
      description: 'Menghitung rata-rata nilai per baris transaksi pengeluaran.',
      category: 'Ringkasan Otomatis',
    },
  ];

  return (
    <div id="formula-guide-container" className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Arsitektur & Rumus Spreadsheet Manajemen Keuangan
              </h2>
              <p className="text-xs text-slate-500">
                Referensi formula baku untuk diimplementasikan langsung pada Google Sheets atau Microsoft Excel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Google Sheets & Excel Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Blueprint Architecture Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3.5 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          Alur Hubungan Antar Sheet (Data Flow)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
            <span className="font-bold text-amber-900 block">4. Sheet Kategori</span>
            <p className="text-slate-600 text-[11px]">
              Menyimpan list master kategori & metode pembayaran. Menjadi referensi Data Validation.
            </p>
            <div className="pt-2 text-amber-700 font-mono text-[10px] font-bold">
              &darr; Referensi dropdown
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
            <span className="font-bold text-emerald-900 block">2. Sheet Pemasukan</span>
            <p className="text-slate-600 text-[11px]">
              Struktur tabel input: Tanggal, Kategori, Keterangan, Metode, Nominal.
            </p>
            <div className="pt-2 text-emerald-700 font-mono text-[10px] font-bold">
              &rarr; Diserap SUM / SUMIF
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
            <span className="font-bold text-rose-900 block">3. Sheet Pengeluaran</span>
            <p className="text-slate-600 text-[11px]">
              Struktur tabel input: Tanggal, Kategori, Keterangan, Metode, Nominal.
            </p>
            <div className="pt-2 text-rose-700 font-mono text-[10px] font-bold">
              &rarr; Diserap SUM / SUMIF
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
            <span className="font-bold text-indigo-900 block">1. Sheet Dashboard</span>
            <p className="text-slate-600 text-[11px]">
              Otomatis menghitung Total In, Total Out, Saldo, Grafik bulanan, dan Ringkasan Otomatis.
            </p>
            <div className="pt-2 text-indigo-700 font-mono text-[10px] font-bold">
              &star; Tampilan Eksekutif Bento
            </div>
          </div>
        </div>
      </div>

      {/* List of Formulas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          Katalog Rumus Siap Salin (Copy-Paste)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formulaCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-xs hover:border-slate-300 transition space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.category}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Cell: {card.targetCell}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">{card.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.description}</p>
              </div>

              {/* Code block */}
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs flex items-center justify-between gap-2 overflow-x-auto">
                <span className="truncate">{card.formula}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(card.formula, idx)}
                  className="p-1 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
                  title="Salin rumus"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Formatting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-xs text-slate-700 space-y-2 shadow-xs">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Tips Format Angka & Conditional Formatting di Spreadsheet:
        </h4>
        <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-[11px]">
          <li>
            <strong>Format Mata Uang Rupiah:</strong> Blok kolom Nominal, pilih <em>Format &rarr; Number &rarr; Custom currency &rarr; Indonesian Rupiah (Rp)</em> atau format <code>_("Rp"* #,##0_);_("Rp"* (#,##0);_("-"_)</code>.
          </li>
          <li>
            <strong>Conditional Formatting Saldo Bersih:</strong> Buat rule format bersyarat jika nilai <code>&lt; 0</code> berikan latar belakang merah muda terang, jika <code>&gt;= 0</code> berikan latar belakang hijau muda.
          </li>
          <li>
            <strong>Membuat Grafik Otomatis:</strong> Di Google Sheets, blok tabel Pemasukan vs Pengeluaran bulanan lalu klik <em>Insert &rarr; Chart &rarr; Column Chart</em>.
          </li>
        </ul>
      </div>
    </div>
  );
};
