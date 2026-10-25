import React, { useState } from "react";
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare, ArrowUpRight } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "button" | "banner" | "compact";
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "button",
  className = "",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already running inside standalone PWA mode or dismissed, hide
  if (isInstalled || dismissed) {
    return null;
  }

  // Handle install action
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General Android / Chrome instruction fallback if beforeinstallprompt not fired yet
      alert("Untuk memasang aplikasi Presensi Go di HP, buka menu browser (titik 3 di kanan atas) lalu pilih 'Instal Aplikasi' atau 'Tambahkan ke Layar Utama'.");
    }
  };

  // Compact variant for header / topbar
  if (variant === "compact") {
    return (
      <>
        <button
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Pasang / Install Aplikasi Presensi Go di Perangkat"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Install PWA</span>
        </button>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // Banner variant for Login Page or Dashboard top
  if (variant === "banner") {
    return (
      <>
        <div
          id="pwa-install-banner"
          className={`p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg border border-blue-500/30 flex items-center justify-between gap-3 relative overflow-hidden animate-in fade-in ${className}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-black p-0.5 border border-white/30 shrink-0 shadow-md">
              <img
                src="/assets/aistudio/photo_6262753760518017337_x_4519ad83.jpg"
                alt="Presensi Go Icon"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white leading-tight">Presensi Go</span>
                <span className="text-[9px] bg-emerald-500/90 text-white px-1.5 py-0.2 rounded-full font-bold">PWA</span>
              </div>
              <p className="text-[11px] text-blue-200 line-clamp-1 mt-0.5">
                Pasang aplikasi di layar utama HP untuk akses cepat tanpa buka browser
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pasang</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup banner"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // Standard Button variant
  return (
    <>
      <button
        id="pwa-install-btn"
        onClick={handleInstallClick}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install Aplikasi (PWA)</span>
      </button>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

// Modal Guide for iOS Safari Users
const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative p-5 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black p-0.5 border border-slate-200 shrink-0">
              <img
                src="/assets/aistudio/photo_6262753760518017337_x_4519ad83.jpg"
                alt="Presensi Go Icon"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Pasang Presensi Go</h3>
              <p className="text-[11px] text-slate-500">Panduan untuk Pengguna iPhone / iPad (iOS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900">Buka di Browser Safari</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pastikan Anda membuka halaman ini menggunakan browser <strong>Safari</strong> bawaan iOS.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <span>Ketuk Tombol Bagikan</span>
                <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Ketuk tombol <strong>Share / Bagikan</strong> berbentuk kotak dengan panah ke atas di bagian bawah layar Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <span>Pilih "Tambahkan ke Layar Utama"</span>
                <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Gulir menu dan pilih <strong>"Add to Home Screen"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>, lalu ketuk <strong>Tambah</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
};
