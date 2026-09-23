import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminUser,
  CategoryItem,
  GoogleSheetsSyncConfig,
  PaymentMethodItem,
  SheetTab,
  SpreadsheetCellSelection,
  Transaction,
  TransactionType,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import { SpreadsheetHeader } from './components/SpreadsheetHeader';
import { SheetTabs } from './components/SheetTabs';
import { DashboardView } from './components/DashboardView';
import { SpreadsheetTableView } from './components/SpreadsheetTableView';
import { CategoriesView } from './components/CategoriesView';
import { FormulaGuideView } from './components/FormulaGuideView';
import { TransactionModal } from './components/TransactionModal';
import { LoginForm } from './components/LoginForm';
import { AdminProfileModal } from './components/AdminProfileModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { exportTransactionsToCsv, getMonthYearKey, getMonthYearLabel } from './utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'spreadsheet_finance_transactions_v1',
  CATEGORIES: 'spreadsheet_finance_categories_v1',
  PAYMENT_METHODS: 'spreadsheet_finance_payments_v1',
  ADMIN_AUTH: 'spreadsheet_admin_auth_v1',
  ADMIN_SESSION: 'spreadsheet_admin_session_v1',
  GOOGLE_SYNC: 'spreadsheet_google_sync_v1',
};

const DEFAULT_ADMIN: AdminUser = {
  username: 'admin',
  name: 'Administrator Keuangan',
  passwordHash: 'admin123',
  role: 'Super Admin',
  lastLogin: 'Hari ini',
};

const DEFAULT_GOOGLE_SYNC: GoogleSheetsSyncConfig = {
  clientId: ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || '',
  accessToken: null,
  tokenExpiry: null,
  userEmail: null,
  userName: null,
  userPicture: null,
  spreadsheetId: null,
  spreadsheetTitle: null,
  spreadsheetUrl: null,
  lastSyncTime: null,
  autoSync: false,
};

export default function App() {
  // Admin Authentication & Profile State
  const [adminUser, setAdminUser] = useState<AdminUser>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    } catch {
      return false;
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Google Sheets Integration State
  const [googleSyncConfig, setGoogleSyncConfig] = useState<GoogleSheetsSyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_SYNC);
      return saved ? JSON.parse(saved) : DEFAULT_GOOGLE_SYNC;
    } catch {
      return DEFAULT_GOOGLE_SYNC;
    }
  });

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SYNC, JSON.stringify(googleSyncConfig));
  }, [googleSyncConfig]);

  const handleUpdateGoogleSyncConfig = (updated: Partial<GoogleSheetsSyncConfig>) => {
    setGoogleSyncConfig((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleImportTransactions = (imported: Transaction[]) => {
    setTransactions((prev) => [...imported, ...prev]);
  };

  // Sync Admin User Credentials to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(adminUser));
  }, [adminUser]);

  // 1. Core State with LocalStorage Persistence
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_METHODS;
    } catch {
      return INITIAL_PAYMENT_METHODS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  // 2. Navigation & UI State
  const [activeSheet, setActiveSheet] = useState<SheetTab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [cellSelection, setCellSelection] = useState<SpreadsheetCellSelection | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<TransactionType>('expense');

  // Available Months for filter
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      monthsSet.add(getMonthYearKey(tx.date));
    });
    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        key,
        label: getMonthYearLabel(key),
      }));
  }, [transactions]);

  // Calculation summaries
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const netBalance = totalIncome - totalExpense;

  const incomeTransactionsCount = useMemo(
    () => transactions.filter((t) => t.type === 'income').length,
    [transactions]
  );

  const expenseTransactionsCount = useMemo(
    () => transactions.filter((t) => t.type === 'expense').length,
    [transactions]
  );

  // Handlers for Transactions
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus baris transaksi ini?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Handlers for Categories
  const handleAddCategory = (catData: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...catData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Handlers for Payment Methods
  const handleAddPaymentMethod = (methodData: Omit<PaymentMethodItem, 'id'>) => {
    const newMethod: PaymentMethodItem = {
      ...methodData,
      id: `pay-${Date.now()}`,
    };
    setPaymentMethods((prev) => [...prev, newMethod]);
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('Kembalikan spreadsheet ke data contoh standar? Semua data input kustom akan diganti dengan data demo.')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setCategories(INITIAL_CATEGORIES);
      setPaymentMethods(INITIAL_PAYMENT_METHODS);
      setSelectedMonth('all');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    exportTransactionsToCsv(transactions);
  };

  // Cell Selection update for formula bar
  const handleSelectCell = (cellRef: string, formula: string, value: string) => {
    setCellSelection({
      sheet: activeSheet,
      cellRef,
      formula,
      value,
    });
  };

  const openAddModalWithType = (type: TransactionType = 'expense') => {
    setAddModalDefaultType(type);
    setIsAddModalOpen(true);
  };

  // Admin Auth Handlers
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
    setAdminUser((prev) => ({
      ...prev,
      lastLogin: new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    setIsProfileModalOpen(false);
  };

  const handleUpdateAdminProfile = (updated: Partial<AdminUser>) => {
    setAdminUser((prev) => ({
      ...prev,
      ...updated,
    }));
    return true;
  };

  // If not logged in as Admin, show Login Form Gatekeeper
  if (!isAuthenticated) {
    return <LoginForm adminUser={adminUser} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* 1. Top Spreadsheet Header & Formula Bar */}
      <SpreadsheetHeader
        activeSheet={activeSheet}
        cellSelection={cellSelection}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onSelectMonth={setSelectedMonth}
        onOpenAddModal={(type) => openAddModalWithType(type || 'expense')}
        onOpenFormulaGuide={() => setActiveSheet('formulas')}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        adminUser={adminUser}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        onOpenGoogleSheetsModal={() => setIsGoogleModalOpen(true)}
        isGoogleConnected={!!googleSyncConfig.accessToken}
      />

      {/* 2. Sheet Navigation Tabs (Dashboard, Pemasukan, Pengeluaran, Kategori, Rumus) */}
      <SheetTabs
        activeSheet={activeSheet}
        onChangeSheet={(sheet) => {
          setActiveSheet(sheet);
          setCellSelection(null);
        }}
        incomeCount={incomeTransactionsCount}
        expenseCount={expenseTransactionsCount}
        categoryCount={categories.length}
      />

      {/* 3. Main Sheet Body Content */}
      <main className="flex-1 pb-16">
        {activeSheet === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            selectedMonth={selectedMonth}
            adminUser={adminUser}
            googleSyncConfig={googleSyncConfig}
            onOpenGoogleSheetsModal={() => setIsGoogleModalOpen(true)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenAddModal={(type) => openAddModalWithType(type)}
            onNavigateSheet={(sheet) => setActiveSheet(sheet)}
            onSelectCell={handleSelectCell}
          />
        )}

        {activeSheet === 'income' && (
          <SpreadsheetTableView
            type="income"
            transactions={transactions}
            categories={categories}
            paymentMethods={paymentMethods}
            selectedMonth={selectedMonth}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSelectCell={handleSelectCell}
          />
        )}

        {activeSheet === 'expense' && (
          <SpreadsheetTableView
            type="expense"
            transactions={transactions}
            categories={categories}
            paymentMethods={paymentMethods}
            selectedMonth={selectedMonth}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSelectCell={handleSelectCell}
          />
        )}

        {activeSheet === 'categories' && (
          <CategoriesView
            categories={categories}
            paymentMethods={paymentMethods}
            transactions={transactions}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddPaymentMethod={handleAddPaymentMethod}
            onDeletePaymentMethod={handleDeletePaymentMethod}
            onSelectCell={handleSelectCell}
          />
        )}

        {activeSheet === 'formulas' && <FormulaGuideView />}
      </main>

      {/* Modal for Quick Input */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTransaction}
        categories={categories}
        paymentMethods={paymentMethods}
        defaultType={addModalDefaultType}
      />

      {/* Admin Profile & Credential Management Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        adminUser={adminUser}
        onUpdateProfile={handleUpdateAdminProfile}
        onLogout={handleLogout}
      />

      {/* Google Sheets & Drive Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        transactions={transactions}
        categories={categories}
        syncConfig={googleSyncConfig}
        onUpdateSyncConfig={handleUpdateGoogleSyncConfig}
        onImportTransactions={handleImportTransactions}
      />

      {/* Spreadsheet Bottom Status Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-1.5 text-xs text-slate-600 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            READY
          </span>
          <span className="hidden sm:inline text-slate-500">
            {transactions.length} baris transaksi tersimpan di browser
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>
            Pemasukan: <strong className="text-emerald-700">{incomeTransactionsCount}</strong>
          </span>
          <span>
            Pengeluaran: <strong className="text-rose-700">{expenseTransactionsCount}</strong>
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-600">
            Struktur Spreadsheet Manajemen Keuangan v2.4
          </span>
        </div>
      </footer>
    </div>
  );
}
