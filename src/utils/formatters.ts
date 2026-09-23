export const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDO_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(absVal);
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

export function formatCompactRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000_000_000).toFixed(1)} M`;
  }
  if (abs >= 1_000_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000_000).toFixed(1)} jt`;
  }
  if (abs >= 1_000) {
    return `${isNegative ? '-' : ''}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return `${isNegative ? '-' : ''}Rp ${abs}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return `${day.toString().padStart(2, '0')} ${INDO_MONTHS_SHORT[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

export function getMonthYearKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

export function getMonthYearLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!month || !year) return monthKey;
  return `${INDO_MONTHS_SHORT[month - 1]} ${year}`;
}

export function exportTransactionsToCsv(
  transactions: Array<{
    date: string;
    type: string;
    category: string;
    description: string;
    paymentMethod: string;
    amount: number;
  }>,
  fileName: string = 'Spreadsheet_Manajemen_Keuangan.csv'
) {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Metode Pembayaran', 'Nominal (IDR)'];
  const rows = transactions.map(t => [
    `"${t.date}"`,
    `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.paymentMethod.replace(/"/g, '""')}"`,
    t.amount
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
