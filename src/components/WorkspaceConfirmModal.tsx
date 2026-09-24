import React from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, HardDrive, X } from "lucide-react";

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemCount?: number;
  itemDetails?: string[];
  actionType?: "sheets_sync" | "drive_upload" | "delete" | "generic";
  confirmButtonText?: string;
  isProcessing?: boolean;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemCount,
  itemDetails,
  actionType = "sheets_sync",
  confirmButtonText = "Lanjutkan & Sinkronkan",
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (actionType) {
      case "sheets_sync":
        return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      case "drive_upload":
        return <HardDrive className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getIconBg = () => {
    switch (actionType) {
      case "sheets_sync":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "drive_upload":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-amber-50 border-amber-200 text-amber-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">Konfirmasi Izin Google Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>

          {itemCount !== undefined && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Jumlah Data Terdampak:</span>
              <span className="text-sm font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-xs">
                {itemCount} Catatan
              </span>
            </div>
          )}

          {itemDetails && itemDetails.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Detail Operasi:
              </p>
              <ul className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 max-h-32 overflow-y-auto">
                {itemDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-normal">
              Operasi ini akan memperbarui berkas di akun Google Drive / Google Sheets Anda dengan izin resmi yang telah Anda berikan.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
