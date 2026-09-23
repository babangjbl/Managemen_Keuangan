import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Tags,
  Code2,
  PlusCircle,
} from 'lucide-react';
import { SheetTab } from '../types';

interface Props {
  activeSheet: SheetTab;
  onChangeSheet: (sheet: SheetTab) => void;
  incomeCount: number;
  expenseCount: number;
  categoryCount: number;
}

export const SheetTabs: React.FC<Props> = ({
  activeSheet,
  onChangeSheet,
  incomeCount,
  expenseCount,
  categoryCount,
}) => {
  const tabs: Array<{
    id: SheetTab;
    label: string;
    sheetNumber: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    color: string;
    borderColor: string;
  }> = [
    {
      id: 'dashboard',
      label: '1. Dashboard',
      sheetNumber: 'Sheet 1',
      icon: LayoutDashboard,
      color: 'text-indigo-600',
      borderColor: 'border-b-indigo-600',
    },
    {
      id: 'income',
      label: '2. Pemasukan',
      sheetNumber: 'Sheet 2',
      icon: TrendingUp,
      badge: incomeCount,
      color: 'text-emerald-600',
      borderColor: 'border-b-emerald-600',
    },
    {
      id: 'expense',
      label: '3. Pengeluaran',
      sheetNumber: 'Sheet 3',
      icon: TrendingDown,
      badge: expenseCount,
      color: 'text-rose-600',
      borderColor: 'border-b-rose-600',
    },
    {
      id: 'categories',
      label: '4. Kategori & Metode',
      sheetNumber: 'Sheet 4',
      icon: Tags,
      badge: categoryCount,
      color: 'text-amber-600',
      borderColor: 'border-b-amber-600',
    },
    {
      id: 'formulas',
      label: 'Rumus & Formula',
      sheetNumber: 'Docs',
      icon: Code2,
      color: 'text-sky-600',
      borderColor: 'border-b-sky-600',
    },
  ];

  return (
    <div id="spreadsheet-tabs-bar" className="bg-slate-100 border-b border-slate-200 px-4 pt-2.5 flex items-center justify-between overflow-x-auto select-none">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeSheet === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`tab-sheet-${tab.id}`}
              type="button"
              onClick={() => onChangeSheet(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                isActive
                  ? `bg-white text-slate-900 border-slate-200 border-b-2 ${tab.borderColor} shadow-xs -mb-px z-10`
                  : 'bg-slate-200/70 hover:bg-slate-200 text-slate-600 border-transparent hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-300/80 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 py-1 px-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Bento Sync Aktif
        </span>
      </div>
    </div>
  );
};
