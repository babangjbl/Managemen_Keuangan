import { CategoryItem, Transaction } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
              expires_in?: number;
            }) => void;
            error_callback?: (err: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

/**
 * Extract clean spreadsheet ID from either a raw ID string or a full docs.google.com URL
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Match https://docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  // Otherwise if it's alphanumeric with hyphens/underscores >= 20 chars
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Request Access Token using Google Identity Services (GIS)
 */
export function requestGoogleAccessToken(
  clientId: string,
  promptUser = false
): Promise<{ accessToken: string; expiresIn: number }> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      return reject(
        new Error(
          'Google Identity Services belum termuat. Pastikan koneksi internet aktif dan muat ulang halaman.'
        )
      );
    }

    if (!clientId || clientId.trim() === '') {
      return reject(
        new Error(
          'Google Client ID belum diatur. Masukkan Client ID pada pengaturan Google Sheets.'
        )
      );
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: REQUIRED_SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            resolve({
              accessToken: response.access_token,
              expiresIn: response.expires_in || 3599,
            });
          } else {
            reject(new Error('Gagal memperoleh access token dari Google.'));
          }
        },
        error_callback: (err) => {
          reject(new Error(err?.message || 'Otorisasi Google dibatalkan atau gagal.'));
        },
      });

      client.requestAccessToken({ prompt: promptUser ? 'select_account' : '' });
    } catch (err: any) {
      reject(new Error(err?.message || 'Inisialisasi Google OAuth gagal'));
    }
  });
}

/**
 * Fetch Google User Profile (email, name, picture) using access token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<{
  email: string;
  name?: string;
  picture?: string;
}> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil profil akun Google (status ${res.status})`);
  }

  const data = await res.json();
  return {
    email: data.email || 'Akun Google',
    name: data.name,
    picture: data.picture,
  };
}

/**
 * Build batch payload of all rows for Google Sheets
 */
function buildSheetDataPayload(
  transactions: Transaction[],
  categories: CategoryItem[]
) {
  const incomeTx = transactions.filter((t) => t.type === 'income');
  const expenseTx = transactions.filter((t) => t.type === 'expense');

  // 1. Sheet Ringkasan (Summary)
  const summaryValues = [
    ['RINGKASAN KEUANGAN FINANZFLOW', '', '', ''],
    ['Dibuat Otomatis dari Aplikasi', new Date().toLocaleString('id-ID'), '', ''],
    ['', '', '', ''],
    ['Kategori / Metrik', 'Rumus Spreadsheet', 'Nominal (Rp)', 'Keterangan'],
    ['Total Pemasukan', '=SUM(Pemasukan!D3:D)', '=SUM(Pemasukan!D3:D)', 'Akumulasi seluruh pemasukan'],
    ['Total Pengeluaran', '=SUM(Pengeluaran!D3:D)', '=SUM(Pengeluaran!D3:D)', 'Akumulasi seluruh pengeluaran'],
    ['Saldo Bersih (Net Cashflow)', '=C5-C6', '=C5-C6', 'Surplus / Defisit Kas'],
    ['Jumlah Transaksi Pemasukan', '=COUNTA(Pemasukan!A3:A)', '=COUNTA(Pemasukan!A3:A)', 'Total entri masuk'],
    ['Jumlah Transaksi Pengeluaran', '=COUNTA(Pengeluaran!A3:A)', '=COUNTA(Pengeluaran!A3:A)', 'Total entri keluar'],
  ];

  // 2. Sheet Pemasukan
  const incomeValues: (string | number)[][] = [
    ['BUKU KAS PEMASUKAN', '', '', '', '', ''],
    ['No', 'Tanggal', 'Deskripsi', 'Nominal (Rp)', 'Kategori', 'Metode Pembayaran'],
  ];
  incomeTx.forEach((tx, idx) => {
    incomeValues.push([
      idx + 1,
      tx.date,
      tx.description,
      tx.amount,
      tx.category,
      tx.paymentMethod,
    ]);
  });
  if (incomeTx.length === 0) {
    incomeValues.push([1, new Date().toISOString().slice(0, 10), 'Contoh Pemasukan', 500000, 'Gaji', 'Transfer Bank']);
  }

  // 3. Sheet Pengeluaran
  const expenseValues: (string | number)[][] = [
    ['BUKU KAS PENGELUARAN', '', '', '', '', ''],
    ['No', 'Tanggal', 'Deskripsi', 'Nominal (Rp)', 'Kategori', 'Metode Pembayaran'],
  ];
  expenseTx.forEach((tx, idx) => {
    expenseValues.push([
      idx + 1,
      tx.date,
      tx.description,
      tx.amount,
      tx.category,
      tx.paymentMethod,
    ]);
  });
  if (expenseTx.length === 0) {
    expenseValues.push([1, new Date().toISOString().slice(0, 10), 'Contoh Pengeluaran', 50000, 'Makanan & Minuman', 'QRIS']);
  }

  // 4. Sheet Kategori
  const categoryValues: (string | number)[][] = [
    ['MASTER KATEGORI KEUANGAN', '', '', ''],
    ['Nama Kategori', 'Tipe', 'Alokasi Budget (Rp)', 'Warna'],
  ];
  categories.forEach((cat) => {
    categoryValues.push([
      cat.name,
      cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      cat.budgetMonthly || 0,
      cat.color,
    ]);
  });

  return [
    {
      range: 'Ringkasan!A1:D9',
      values: summaryValues,
    },
    {
      range: `Pemasukan!A1:F${incomeValues.length}`,
      values: incomeValues,
    },
    {
      range: `Pengeluaran!A1:F${expenseValues.length}`,
      values: expenseValues,
    },
    {
      range: `Kategori!A1:D${categoryValues.length}`,
      values: categoryValues,
    },
  ];
}

/**
 * Create a brand new Google Spreadsheet with all tabs and populate initial data
 */
export async function createFinanceGoogleSpreadsheet(
  accessToken: string,
  title: string,
  transactions: Transaction[],
  categories: CategoryItem[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Step 1: Create Spreadsheet with 4 Sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `FinanzFlow - Catatan Keuangan (${new Date().toLocaleDateString('id-ID')})`,
      },
      sheets: [
        { properties: { title: 'Ringkasan', gridProperties: { rowCount: 60, columnCount: 15 } } },
        { properties: { title: 'Pemasukan', gridProperties: { rowCount: Math.max(100, transactions.length + 50), columnCount: 10 } } },
        { properties: { title: 'Pengeluaran', gridProperties: { rowCount: Math.max(100, transactions.length + 50), columnCount: 10 } } },
        { properties: { title: 'Kategori', gridProperties: { rowCount: Math.max(50, categories.length + 20), columnCount: 10 } } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errJson = await createRes.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Gagal membuat Google Spreadsheet baru (status ${createRes.status})`
    );
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Step 2: Populate Data with batchUpdate values
  const payloadData = buildSheetDataPayload(transactions, categories);

  const populateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: payloadData,
      }),
    }
  );

  if (!populateRes.ok) {
    const errJson = await populateRes.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message || `Gagal mengisi data Google Spreadsheet (status ${populateRes.status})`
    );
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Push / Overwrite data to an existing Google Spreadsheet ID
 */
export async function pushDataToExistingSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  categories: CategoryItem[]
): Promise<boolean> {
  // First clear old ranges or update batch values directly
  const payloadData = buildSheetDataPayload(transactions, categories);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: payloadData,
      }),
    }
  );

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      errJson.error?.message ||
        `Gagal menyinkronkan data ke spreadsheet ${spreadsheetId} (status ${res.status})`
    );
  }

  return true;
}

/**
 * Import Transactions from an existing Google Sheet (from 'Pemasukan' & 'Pengeluaran' tabs or 'Sheet1')
 */
export async function importTransactionsFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ transactions: Transaction[]; count: number }> {
  const importedList: Transaction[] = [];

  // Try reading Pemasukan and Pengeluaran
  const rangesToFetch = ['Pemasukan!A3:F500', 'Pengeluaran!A3:F500'];

  for (const range of rangesToFetch) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          range
        )}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const rows: any[][] = data.values || [];
      const isIncome = range.startsWith('Pemasukan');

      rows.forEach((row, i) => {
        // [No, Tanggal, Deskripsi, Jumlah, Kategori, Metode]
        const date = row[1]?.toString().trim();
        const description = row[2]?.toString().trim();
        const rawAmount = row[3]?.toString().replace(/[^0-9.-]/g, '');
        const amount = parseFloat(rawAmount);
        const category = row[4]?.toString().trim() || (isIncome ? 'Lainnya' : 'Pengeluaran Lain');
        const paymentMethod = row[5]?.toString().trim() || 'Transfer Bank';

        if (date && description && !isNaN(amount) && amount > 0) {
          importedList.push({
            id: `gsheet-imp-${Date.now()}-${isIncome ? 'in' : 'ex'}-${i}`,
            date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
            description,
            amount,
            type: isIncome ? 'income' : 'expense',
            category,
            paymentMethod,
          });
        }
      });
    } catch {
      // Continue to next sheet
    }
  }

  // Fallback: If no transactions from specific named sheets, try reading generic 'Sheet1!A2:F300'
  if (importedList.length === 0) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:F300`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rows: any[][] = data.values || [];
        rows.forEach((row, i) => {
          const date = row[1]?.toString().trim() || row[0]?.toString().trim();
          const description = row[2]?.toString().trim() || row[1]?.toString().trim();
          const rawAmount = row[3]?.toString().replace(/[^0-9.-]/g, '');
          const amount = parseFloat(rawAmount);
          const type = (row[4] || '').toString().toLowerCase().includes('masuk') ? 'income' : 'expense';

          if (date && description && !isNaN(amount) && amount > 0) {
            importedList.push({
              id: `gsheet-imp-fallback-${Date.now()}-${i}`,
              date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
              description,
              amount,
              type,
              category: 'Google Sheets Import',
              paymentMethod: 'Transfer Bank',
            });
          }
        });
      }
    } catch {
      // Ignore
    }
  }

  return {
    transactions: importedList,
    count: importedList.length,
  };
}
