import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  UploadCloud,
  Layers,
  ShieldCheck,
  Calendar,
  LogOut,
  Sparkles,
  Database,
  ArrowRight,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  googleSignIn,
  logoutGoogle,
  getCurrentGoogleUser,
  getAccessToken,
  initAuth,
} from "../services/googleAuth";
import {
  getStoredSpreadsheetId,
  getStoredSpreadsheetUrl,
  getGoogleAutoSyncEnabled,
  setGoogleAutoSyncEnabled,
  syncAllAttendanceRecords,
  listDriveAttendanceFiles,
  DriveFileInfo,
  getOrCreateAttendanceSpreadsheet,
} from "../services/googleWorkspace";
import { AttendanceRecord, CompanyBranding } from "../types";
import { WorkspaceConfirmModal } from "./WorkspaceConfirmModal";

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  branding: CompanyBranding;
  onShowToast?: (msg: string) => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  attendanceRecords,
  branding,
  onShowToast,
}) => {
  const [user, setUser] = useState<User | null>(getCurrentGoogleUser());
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [autoSync, setAutoSync] = useState<boolean>(getGoogleAutoSyncEnabled());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(getStoredSpreadsheetUrl());
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem("presensigo_last_sync_time")
  );
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Check auth status
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        fetchDriveFiles();
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    // Initial check
    getAccessToken().then((tok) => {
      setToken(tok);
      if (tok) {
        fetchDriveFiles();
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  const fetchDriveFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listDriveAttendanceFiles();
      setDriveFiles(files);
    } catch (e) {
      console.warn("Could not list drive files:", e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        if (onShowToast) {
          onShowToast("Berhasil terhubung ke akun Google Workspace!");
        }
        // Ensure sheet exists or get info
        try {
          const sheet = await getOrCreateAttendanceSpreadsheet();
          setSpreadsheetUrl(sheet.spreadsheetUrl);
          setSpreadsheetId(sheet.spreadsheetId);
        } catch (sheetErr) {
          console.warn("Sheet init error:", sheetErr);
        }
        fetchDriveFiles();
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Gagal masuk dengan akun Google. Silakan coba lagi."
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setUser(null);
      setToken(null);
      setDriveFiles([]);
      if (onShowToast) {
        onShowToast("Akun Google berhasil diputuskan.");
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleToggleAutoSync = (val: boolean) => {
    setAutoSync(val);
    setGoogleAutoSyncEnabled(val);
    if (onShowToast) {
      onShowToast(
        val
          ? "Otomatis sinkron ke Google Sheet saat absen diaktifkan."
          : "Otomatis sinkron ke Google Sheet dinonaktifkan."
      );
    }
  };

  const handleTriggerManualSync = () => {
    if (!token) {
      setErrorMessage("Silakan login dengan Google terlebih dahulu.");
      return;
    }
    setConfirmModalOpen(true);
  };

  const executeManualSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const result = await syncAllAttendanceRecords(attendanceRecords);
      setSpreadsheetUrl(result.spreadsheetUrl);
      const timeStr = new Date().toLocaleString("id-ID");
      setLastSyncTime(timeStr);
      localStorage.setItem("presensigo_last_sync_time", timeStr);
      setConfirmModalOpen(false);
      if (onShowToast) {
        onShowToast(
          `Sukses! ${result.count} data absensi berhasil disinkronkan ke Google Sheets.`
        );
      }
      fetchDriveFiles();
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal menyinkronkan data ke Google Sheets.");
      setConfirmModalOpen(false);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Integrasi Google Sheets & Drive</h2>
              <p className="text-xs text-white/80">
                Penyimpanan & Rekapitulasi Data Absensi Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Perhatian</p>
                <p>{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* User Auth Status Banner */}
          {!user ? (
            <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Belum Terhubung
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  Hubungkan dengan Akun Google
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Aktifkan pencatatan absensi langsung ke Google Spreadsheet dan penyimpanan arsip berkas ke Google Drive.
                </p>
              </div>

              {/* Official Google Sign-in Styled Button */}
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center justify-center space-x-3 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs hover:shadow-md transition-all font-medium text-slate-700 text-sm cursor-pointer disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.1C3.29 21.43 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.1z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.57 1.26 6.58l4.02 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>{isSigningIn ? "Menghubungkan..." : "Masuk dengan Google"}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Google User"}
                    className="w-11 h-11 rounded-full border-2 border-emerald-300 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.email?.[0].toUpperCase() || "G"}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-800">
                      {user.displayName || "Akun Google Terhubung"}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            </div>
          )}

          {/* Section: Google Sheets Feature Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Google Sheets: Rekap Kehadiran Real-time
                  </h3>
                  <p className="text-xs text-slate-500">
                    Setiap data absensi masuk dan pulang otomatis tersimpan dalam spreadsheet
                  </p>
                </div>
              </div>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Auto sync switch */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Sinkronisasi Otomatis Saat Absen
                </p>
                <p className="text-[11px] text-slate-500">
                  Data langsung dikirim ke spreadsheet tanpa perlu tombol manual
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => handleToggleAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Manual Sync action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500">
                <span>Terakhir Disinkronkan: </span>
                <span className="font-semibold text-slate-700">
                  {lastSyncTime || "Belum pernah"}
                </span>
                <span className="text-slate-400"> ({attendanceRecords.length} catatan lokal)</span>
              </div>

              <button
                onClick={handleTriggerManualSync}
                disabled={isSyncing || !user}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan Semua Data Sekarang"}</span>
              </button>
            </div>
          </div>

          {/* Section: Google Drive Feature Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Google Drive: Arsip Dokumen & Berkas Laporan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unduh atau simpan laporan absensi bulanan (.xlsx & .pdf) langsung ke Drive
                  </p>
                </div>
              </div>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
              >
                <span>Buka Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Recent files from Google Drive */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Berkas PresensiGo di Google Drive:</span>
                {user && (
                  <button
                    onClick={fetchDriveFiles}
                    disabled={isLoadingFiles}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? "animate-spin" : ""}`} />
                    <span>Muat Ulang</span>
                  </button>
                )}
              </div>

              {driveFiles.length > 0 ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/70 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        {file.mimeType.includes("spreadsheet") ? (
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 truncate">
                          {file.name}
                        </span>
                      </div>
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium shrink-0 flex items-center space-x-1 ml-2"
                      >
                        <span>Lihat</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-xs text-slate-500">
                  {isLoadingFiles
                    ? "Memuat berkas dari Google Drive..."
                    : user
                    ? "Belum ada berkas laporan yang diunggah ke Google Drive. Anda dapat mengekspor dari tab Laporan Bulanan."
                    : "Masuk dengan Google untuk melihat berkas arsip Anda."}
                </div>
              )}
            </div>
          </div>

          {/* Benefits Info Box */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-slate-50 rounded-2xl border border-blue-100 text-xs space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Keunggulan Integrasi Google Workspace</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Akses Fleksibel:</strong> HR & Manajer dapat membuka spreadsheet dari mana saja tanpa membuka app.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Keamanan Resmi:</strong> Menggunakan token OAuth resmi Google Workspace terproteksi.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Format Standar:</strong> Kolom rapi dengan tanggal, jam masuk, jam pulang, verifikasi AI, dan radius GPS.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>
                  <strong>Backup Permanen:</strong> Data presensi tetap aman selamanya di penyimpanan cloud Google Anda.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Sync */}
      <WorkspaceConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={executeManualSync}
        title="Sinkronkan Semua Data Presensi ke Google Sheets"
        description="Aplikasi akan memperbarui spreadsheet 'PresensiGo - Rekap Absensi Pegawai' di akun Google Anda dengan semua catatan absensi saat ini. Data yang ada akan disinkronkan rapi ke baris-baris spreadsheet."
        itemCount={attendanceRecords.length}
        actionType="sheets_sync"
        confirmButtonText="Ya, Sinkronkan Sekarang"
        isProcessing={isSyncing}
        itemDetails={[
          `Target Spreadsheet: PresensiGo - Rekap Absensi Pegawai`,
          `Total Catatan: ${attendanceRecords.length} baris`,
          `Kolom: ID, Tanggal, Jam Masuk, Jam Pulang, Pegawai, Status, GPS, Verifikasi Wajah, Catatan`,
        ]}
      />
    </div>
  );
};
