import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  Link2,
  KeyRound,
  ShieldCheck,
  Info,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { CategoryItem, GoogleSheetsSyncConfig, Transaction } from '../types';
import {
  createFinanceGoogleSpreadsheet,
  extractSpreadsheetId,
  fetchGoogleUserProfile,
  importTransactionsFromGoogleSheet,
  pushDataToExistingSpreadsheet,
  requestGoogleAccessToken,
} from '../services/googleSheets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: CategoryItem[];
  syncConfig: GoogleSheetsSyncConfig;
  onUpdateSyncConfig: (updated: Partial<GoogleSheetsSyncConfig>) => void;
  onImportTransactions: (imported: Transaction[]) => void;
}

export const GoogleSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  syncConfig,
  onUpdateSyncConfig,
  onImportTransactions,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'import' | 'settings'>('sync');

  // Input states
  const [clientIdInput, setClientIdInput] = useState(
    syncConfig.clientId || ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string) || ''
  );
  const [targetSpreadsheetInput, setTargetSpreadsheetInput] = useState(
    syncConfig.spreadsheetUrl || syncConfig.spreadsheetId || ''
  );
  const [spreadsheetTitleInput, setSpreadsheetTitleInput] = useState(
    syncConfig.spreadsheetTitle || `FinanzFlow Keuangan - ${new Date().toLocaleDateString('id-ID')}`
  );

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isConnected = !!syncConfig.accessToken;

  // 1. Connect Google Account via GIS
  const handleConnectGoogle = async (promptUser = true) => {
    setErrorMsg('');
    setSuccessMsg('');
    const effectiveClientId = clientIdInput.trim();

    if (!effectiveClientId) {
      setActiveTab('settings');
      setErrorMsg(
        'Masukkan Google Client ID terlebih dahulu di tab Pengaturan untuk memulai koneksi OAuth.'
      );
      return;
    }

    setIsLoading(true);
    setLoadingText('Membuka dialog otorisasi Google Identity...');

    try {
      const authResult = await requestGoogleAccessToken(effectiveClientId, promptUser);
      setLoadingText('Mengambil info profil akun Google...');
      const profile = await fetchGoogleUserProfile(authResult.accessToken);

      onUpdateSyncConfig({
        clientId: effectiveClientId,
        accessToken: authResult.accessToken,
        tokenExpiry: Date.now() + authResult.expiresIn * 1000,
        userEmail: profile.email,
        userName: profile.name,
        userPicture: profile.picture,
      });

      setSuccessMsg(`Berhasil terhubung dengan Google Account: ${profile.email}`);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(
        err?.message ||
          'Gagal menghubungkan ke Google. Pastikan Client ID valid dan domain aplikasi telah ditambahkan di Authorized Javascript Origins.'
      );
    }
  };

  // 2. Disconnect Google Account
  const handleDisconnect = () => {
    onUpdateSyncConfig({
      accessToken: null,
      tokenExpiry: null,
      userEmail: null,
      userName: null,
      userPicture: null,
    });
    setSuccessMsg('Koneksi Google Account berhasil diputus.');
  };

  // 3. Create Brand New Spreadsheet
  const handleCreateNewSpreadsheet = async () => {
    if (!syncConfig.accessToken) {
      await handleConnectGoogle();
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingText('Membuat Google Spreadsheet baru & menyiapkan 4 sheet finansial...');

    try {
      const result = await createFinanceGoogleSpreadsheet(
        syncConfig.accessToken,
        spreadsheetTitleInput.trim(),
        transactions,
        categories
      );

      const syncTime = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      onUpdateSyncConfig({
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetTitle: spreadsheetTitleInput.trim(),
        lastSyncTime: syncTime,
      });

      setTargetSpreadsheetInput(result.spreadsheetUrl);
      setSuccessMsg('Google Spreadsheet berhasil dibuat dan seluruh data telah disinkronkan!');
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      // If token expired, prompt re-connect
      if (err?.message?.includes('401') || err?.message?.toLowerCase().includes('auth')) {
        setErrorMsg('Sesi token Google telah berakhir. Silakan hubungkan ulang akun Google.');
        handleConnectGoogle(true);
      } else {
        setErrorMsg(err?.message || 'Gagal membuat Google Spreadsheet.');
      }
    }
  };

  // 4. Push Updates to Existing Sheet
  const handlePushUpdates = async () => {
    if (!syncConfig.accessToken) {
      await handleConnectGoogle();
      return;
    }

    const cleanId = extractSpreadsheetId(targetSpreadsheetInput);
    if (!cleanId) {
      setErrorMsg('Masukkan URL atau ID Google Spreadsheet yang valid.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingText(`Mengirim ${transactions.length} baris data ke Google Sheets...`);

    try {
      await pushDataToExistingSpreadsheet(
        syncConfig.accessToken,
        cleanId,
        transactions,
        categories
      );

      const syncTime = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      onUpdateSyncConfig({
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        lastSyncTime: syncTime,
      });

      setSuccessMsg('Data transaksi dan ringkasan berhasil diperbarui di Google Sheets!');
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Gagal memperbarui data di Google Sheets.');
    }
  };

  // 5. Import from Google Sheet
  const handleImportSheet = async () => {
    if (!syncConfig.accessToken) {
      await handleConnectGoogle();
      return;
    }

    const cleanId = extractSpreadsheetId(targetSpreadsheetInput);
    if (!cleanId) {
      setErrorMsg('Masukkan URL atau ID Google Spreadsheet yang ingin diimpor.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingText('Membaca lembar Pemasukan & Pengeluaran dari Google Sheets...');

    try {
      const result = await importTransactionsFromGoogleSheet(
        syncConfig.accessToken,
        cleanId
      );

      if (result.count === 0) {
        setErrorMsg(
          'Tidak ada data transaksi valid yang ditemukan di Google Sheet tersebut. Pastikan sheet memiliki tab "Pemasukan" atau "Pengeluaran" dengan kolom Tanggal, Deskripsi, dan Nominal.'
        );
      } else {
        onImportTransactions(result.transactions);
        setSuccessMsg(
          `Berhasil mengimpor ${result.count} data transaksi dari Google Sheets!`
        );
      }
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Gagal membaca data dari Google Sheets.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Integrasi Google Sheets & Drive
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ekspor, impor, dan sinkronkan pembukuan keuangan langsung ke akun Google Spreadsheet Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Account Connection Status Bar */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {syncConfig.userPicture ? (
              <img
                src={syncConfig.userPicture}
                alt={syncConfig.userName || 'Google User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-emerald-400"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-slate-950 font-bold flex items-center justify-center text-xs">
                G
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {isConnected ? syncConfig.userName || 'Akun Google' : 'Belum Terhubung ke Google'}
                </span>
                {isConnected ? (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Terhubung
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Offline
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {isConnected ? syncConfig.userEmail : 'Otorisasi diperlukan untuk akses Google Sheets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-rose-600/90 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 flex items-center gap-1 active:scale-95"
              >
                <LogOut className="w-3 h-3" />
                <span>Putus Akun</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-connect-google"
                onClick={() => handleConnectGoogle(true)}
                disabled={isLoading}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Hubungkan Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('sync');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ekspor / Sinkronisasi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Impor dari Spreadsheet</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('settings');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Konfigurasi & Client ID</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Notifications */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{errorMsg}</span>
                {errorMsg.toLowerCase().includes('terms of service') && (
                  <p className="mt-1 text-[11px] text-rose-700">
                    Proyek Google Cloud Anda membutuhkan persetujuan Google Cloud Terms of Service. Buka Google Cloud Console untuk proyek <strong>polar-surfer-406809</strong> untuk menyetujui persyaratan layanan.
                  </p>
                )}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-700 font-medium">{loadingText}</p>
            </div>
          )}

          {/* TAB 1: SYNC & EXPORT */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Option A: Create New Spreadsheet */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800">
                      Opsi 1: Buat Google Spreadsheet Baru Otomatis
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Rekomendasi
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Aplikasi akan membuat spreadsheet baru di Google Drive dengan format 4 sheet lengkap (Ringkasan, Pemasukan, Pengeluaran, Kategori) dan formula otomatis (=SUM, dll).
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Judul Spreadsheet di Google Drive
                  </label>
                  <input
                    type="text"
                    value={spreadsheetTitleInput}
                    onChange={(e) => setSpreadsheetTitleInput(e.target.value)}
                    placeholder="Nama file spreadsheet"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  id="btn-create-google-sheet"
                  disabled={isLoading}
                  onClick={handleCreateNewSpreadsheet}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Buat & Ekspor ke Google Spreadsheet Baru</span>
                </button>
              </div>

              {/* Active / Connected Spreadsheet Information */}
              {syncConfig.spreadsheetId && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-900">
                        Spreadsheet Google Aktif
                      </h4>
                    </div>
                    {syncConfig.lastSyncTime && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Sinkron terakhir: {syncConfig.lastSyncTime}
                      </span>
                    )}
                  </div>

                  <div className="bg-white border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 truncate">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {syncConfig.spreadsheetTitle || 'Spreadsheet Keuangan'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">
                        ID: {syncConfig.spreadsheetId}
                      </span>
                    </div>

                    <a
                      href={syncConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${syncConfig.spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 transition shrink-0"
                    >
                      <span>Buka Sheet</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Push update button */}
                  <button
                    type="button"
                    id="btn-push-google-sheet"
                    disabled={isLoading}
                    onClick={handlePushUpdates}
                    className="w-full py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Perbarui Data ke Spreadsheet Ini ({transactions.length} Transaksi)</span>
                  </button>
                </div>
              )}

              {/* Option B: Update Existing Spreadsheet by ID / URL */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    Opsi 2: Hubungkan ke Google Sheet yang Sudah Ada
                  </h4>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    URL atau ID Google Spreadsheet
                  </label>
                  <input
                    type="text"
                    value={targetSpreadsheetInput}
                    onChange={(e) => setTargetSpreadsheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0.../edit"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handlePushUpdates}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Kirim Data ke Spreadsheet Tersebut</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT FROM GOOGLE SHEETS */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    Impor Transaksi dari Google Sheets
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Masukkan link atau ID Google Spreadsheet. Sistem akan membaca baris transaksi dari tab <strong>Pemasukan</strong> dan <strong>Pengeluaran</strong>, lalu menambahkannya ke lembar aplikasi ini.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    URL atau ID Spreadsheet Sumber
                  </label>
                  <input
                    type="text"
                    value={targetSpreadsheetInput}
                    onChange={(e) => setTargetSpreadsheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0.../edit"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Format kolom yang didukung: No (A), Tanggal (B), Deskripsi (C), Jumlah (D), Kategori (E), Metode (F).
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-import-google-sheet"
                  disabled={isLoading}
                  onClick={handleImportSheet}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Mulai Impor Data dari Google Sheets</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT ID & CLOUD SETUP GUIDE */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Google Cloud OAuth 2.0 Client ID
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="xxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Diperoleh dari Google Cloud Console &gt; APIs &amp; Services &gt; Credentials (Web application).
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSyncConfig({ clientId: clientIdInput.trim() });
                    setSuccessMsg('Google Client ID berhasil disimpan.');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Simpan Client ID
                </button>
              </div>

              {/* Instructions on Google Cloud Project */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Panduan Pengaturan Google Cloud Console</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-600">
                  <li>
                    Buka proyek Google Cloud Anda (misal: <strong>polar-surfer-406809</strong>).
                  </li>
                  <li>
                    Pastikan Anda telah menyetujui <strong>Google Cloud Terms of Service</strong> di konsol jika diminta.
                  </li>
                  <li>
                    Aktifkan API: <strong>Google Sheets API</strong> dan <strong>Google Drive API</strong> di menu <em>Enabled APIs &amp; Services</em>.
                  </li>
                  <li>
                    Pada menu <strong>Credentials &gt; Create Credentials &gt; OAuth client ID</strong>, pilih tipe <em>Web application</em>.
                  </li>
                  <li>
                    Tambahkan URL preview aplikasi ini ke <strong>Authorized JavaScript origins</strong>.
                  </li>
                  <li>
                    Salin Client ID ke input di atas lalu klik <strong>Hubungkan Google</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
