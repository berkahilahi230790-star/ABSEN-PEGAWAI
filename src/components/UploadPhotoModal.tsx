import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { EmployeeProfile } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile;
  onSavePhoto: (newAvatarUrl: string) => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSavePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setSelectedPhoto(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          setSelectedPhoto(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (!selectedPhoto) return;

    setIsSuccess(true);
    audioNotificationService.playChime("normal");
    onSavePhoto(selectedPhoto);

    setTimeout(() => {
      setIsSuccess(false);
      setSelectedPhoto(null);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="upload-photo-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="upload-photo-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Upload Foto Profil</h3>
                <p className="text-[11px] text-emerald-100">Perbarui Foto Identitas & Presensi</p>
              </div>
            </div>

            <button
              id="close-upload-photo-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Foto profil Anda berhasil disimpan dan diperbarui!</span>
            </div>
          )}

          {/* Side by Side or Center Preview */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs bg-slate-100 mx-auto">
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-1.5">Foto Saat Ini</span>
            </div>

            <div className="text-slate-300 font-bold text-sm">➔</div>

            <div className="text-center">
              <div
                className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-sm mx-auto flex items-center justify-center ${
                  selectedPhoto ? "border-emerald-500 bg-white ring-4 ring-emerald-100" : "border-dashed border-slate-300 bg-slate-50"
                }`}
              >
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto}
                    alt="Pratinjau Baru"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                {selectedPhoto ? "Pratinjau Baru" : "Belum Ada"}
              </span>
            </div>
          </div>

          {/* Drag & Drop or Click Area (Strictly supports both per guidelines) */}
          <div
            id="drag-and-drop-photo-zone"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
                : "border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Tarik & Lepas foto ke sini, atau <span className="text-emerald-600 underline">Pilih File</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Format didukung: JPG, PNG, atau WebP (Maks. 5 MB)
            </p>
          </div>

          {/* Tombol Utama Upload Foto Pegawai */}
          <div className="pt-1 flex flex-col items-center gap-2">
            <button
              id="btn-upload-foto-pegawai"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Foto Pegawai</span>
            </button>

            {selectedPhoto && (
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-[11px] text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Batalkan pilihan foto baru</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              id="confirm-save-photo-btn"
              type="button"
              disabled={!selectedPhoto || isSuccess}
              onClick={handleSave}
              className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                selectedPhoto && !isSuccess
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSuccess ? "Tersimpan!" : "Terapkan Foto Profil"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
