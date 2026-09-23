import React from 'react';
import {
  Download,
  FileSpreadsheet,
  HelpCircle,
  Plus,
  RefreshCw,
  Sparkles,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { AdminUser, SheetTab, SpreadsheetCellSelection } from '../types';

interface Props {
  activeSheet: SheetTab;
  cellSelection: SpreadsheetCellSelection | null;
  selectedMonth: string;
  availableMonths: Array<{ key: string; label: string }>;
  onSelectMonth: (month: string) => void;
  onOpenAddModal: (defaultType?: 'income' | 'expense') => void;
  onOpenFormulaGuide: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  adminUser: AdminUser;
  onOpenProfileModal: () => void;
  onLogout: () => void;
  onOpenGoogleSheetsModal: () => void;
  isGoogleConnected: boolean;
}

export const SpreadsheetHeader: React.FC<Props> = ({
  activeSheet,
  cellSelection,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  onOpenAddModal,
  onOpenFormulaGuide,
  onExportCsv,
  onResetData,
  adminUser,
  onOpenProfileModal,
  onLogout,
  onOpenGoogleSheetsModal,
  isGoogleConnected,
}) => {
  // Determine current active formula string for formula bar
  const defaultFormula =
    activeSheet === 'dashboard'
      ? '=SALDO_BERSIH(Pemasukan!E:E, Pengeluaran!E:E)'
      : activeSheet === 'income'
      ? '=SUM(Pemasukan!E2:E) // Total Pemasukan Terkalkulasi'
      : activeSheet === 'expense'
      ? '=SUM(Pengeluaran!E2:E) // Total Pengeluaran Terkalkulasi'
      : activeSheet === 'categories'
      ? '=UNIQUE(Kategori!A2:B) // Master Data Validasi Dropdown'
      : '=EXCEL_FORMULAS_OVERVIEW()';

  const formulaText = cellSelection?.formula || defaultFormula;
  const cellRefText = cellSelection?.cellRef || (
    activeSheet === 'dashboard' ? 'DASH!A1' :
    activeSheet === 'income' ? 'INCOME!E' :
    activeSheet === 'expense' ? 'EXPENSE!E' :
    'CAT!A1'
  );

  return (
    <header id="spreadsheet-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Primary Top Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            $
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                FinanzFlow <span className="text-slate-400 font-normal text-xs md:text-sm">Spreadsheet v2.4</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Bento Grid
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Sistem Input Transaksi & Dashboard Bento Interaktif
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Month Filter */}
          <div className="flex items-center text-xs bg-slate-100 rounded-full p-1 border border-slate-200">
            <span className="pl-2.5 pr-1 text-slate-600 font-bold hidden sm:inline text-[11px] uppercase tracking-wider">Periode:</span>
            <select
              id="period-select"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-white text-emerald-800 text-xs font-bold py-1 px-3 rounded-full border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="all">Semua Periode</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Add Transaction */}
          <button
            id="btn-quick-add"
            type="button"
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Tambah Data</span>
          </button>

          {/* Action: Formula Guide */}
          <button
            id="btn-formula-guide"
            type="button"
            onClick={onOpenFormulaGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition border border-slate-200 shadow-2xs cursor-pointer"
            title="Pelajari rumus Google Sheets / Excel yang digunakan"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Rumus Sheets</span>
          </button>

          {/* Action: Google Sheets Integration */}
          <button
            id="btn-open-google-sheets"
            type="button"
            onClick={onOpenGoogleSheetsModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200/80 shadow-2xs cursor-pointer active:scale-95"
            title="Integrasi & Sinkronisasi Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Google Sheets</span>
            {isGoogleConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            )}
          </button>

          {/* Action: Export CSV */}
          <button
            id="btn-export-csv"
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition border border-slate-200 shadow-2xs cursor-pointer"
            title="Unduh data dalam format CSV untuk Excel / Google Sheets"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Action: Reset Data */}
          <button
            id="btn-reset-demo"
            type="button"
            onClick={onResetData}
            className="p-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-transparent hover:border-slate-200 cursor-pointer"
            title="Reset ke data contoh standar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Admin Profile Pill & Trigger */}
          <div className="flex items-center pl-1 border-l border-slate-200 ml-0.5 gap-1.5">
            <button
              id="btn-admin-profile-header"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition cursor-pointer text-xs"
              title="Kelola profil admin & ganti password"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                {adminUser.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="font-bold text-slate-800 hidden sm:inline truncate max-w-[90px]">
                {adminUser.username}
              </span>
              <span className="hidden md:inline text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                Admin
              </span>
            </button>

            <button
              id="btn-logout-header"
              type="button"
              onClick={() => {
                if (confirm('Keluar dari sesi Administrator?')) {
                  onLogout();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Formula Bar - Authentic Excel / Google Sheets Style */}
      <div className="bg-slate-50 px-4 py-1.5 flex items-center gap-2 text-xs border-b border-slate-200">
        <div className="flex items-center gap-1 min-w-[76px] font-mono text-slate-600 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-center shadow-2xs">
          <span>{cellRefText}</span>
        </div>
        <div className="flex items-center text-slate-400 font-serif italic text-xs font-semibold px-1">
          <span>fx</span>
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-0.5 font-mono text-xs text-slate-700 overflow-hidden text-ellipsis whitespace-nowrap shadow-2xs flex items-center justify-between">
          <span className="truncate">{formulaText}</span>
          <span className="text-[10px] text-emerald-600 font-sans font-medium flex items-center gap-1 shrink-0 ml-2">
            <Sparkles className="w-3 h-3" /> Auto-sync
          </span>
        </div>
      </div>
    </header>
  );
};
