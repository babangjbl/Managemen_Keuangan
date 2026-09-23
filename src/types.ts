export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  paymentMethod: string;
  amount: number;
  notes?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  iconName?: string;
  budgetMonthly?: number;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'ewallet' | 'credit';
  color?: string;
}

export type SheetTab = 'dashboard' | 'income' | 'expense' | 'categories' | 'formulas';

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryExpenseSummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
}

export interface SpreadsheetCellSelection {
  sheet: SheetTab;
  cellRef: string; // e.g. "E12", "C4"
  formula?: string;
  value?: string | number;
}

export interface AdminUser {
  username: string;
  name: string;
  passwordHash: string; // plain or simple stored password
  role: string;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface GoogleSheetsSyncConfig {
  clientId: string;
  accessToken: string | null;
  tokenExpiry: number | null;
  userEmail: string | null;
  userName?: string | null;
  userPicture?: string | null;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  lastSyncTime: string | null;
  autoSync: boolean;
}
