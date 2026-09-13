import React, { useState } from "react";
import {
  X,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Copy,
  Check,
  Camera,
  KeyRound,
  IdCard,
} from "lucide-react";
import { EmployeeProfile, WorkScheduleConfig } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface EmployeeIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile;
  schedule: WorkScheduleConfig;
  onOpenUploadPhoto: () => void;
  onOpenChangePassword: () => void;
}

export const EmployeeIdentityModal: React.FC<EmployeeIdentityModalProps> = ({
  isOpen,
  onClose,
  employee,
  schedule,
  onOpenUploadPhoto,
  onOpenChangePassword,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCopyNip = () => {
    navigator.clipboard.writeText(employee.id.toUpperCase());
    setCopiedId(true);
    audioNotificationService.playChime("normal");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const remainingLeave = employee.annualLeaveQuota - employee.usedLeave;
  const leavePercentage = Math.round((employee.usedLeave / employee.annualLeaveQuota) * 100);

  return (
    <div
      id="identity-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="identity-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95"
      >
        {/* Header Ribbon - ID Card Style */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-24 h-24 rounded-full bg-blue-400/20 blur-lg pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                <IdCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Identitas Resmi Pegawai</h3>
                <p className="text-[11px] text-blue-200">Kartu Tanda Pengenal Digital (E-ID)</p>
              </div>
            </div>

            <button
              id="close-identity-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Overview Card */}
          <div className="mt-4 flex items-center gap-3.5 relative z-10">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/90 shadow-md bg-white">
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenUploadPhoto();
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md border border-white hover:bg-blue-700 active:scale-90 transition-all"
                title="Ganti Foto Profil"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white truncate">{employee.name}</h4>
                <span className="shrink-0 text-[10px] bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  Aktif
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium truncate mt-0.5">{employee.position}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-mono tracking-wider font-semibold">
                  NIP: {employee.id.toUpperCase()}
                </span>
                <button
                  onClick={handleCopyNip}
                  className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 active:scale-90 transition-all"
                  title="Salin NIP"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information List */}
        <div className="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Card: Departemen & Kantor */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Departemen / Divisi</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{employee.department}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Lokasi Penugasan</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{schedule.officeName}</span>
                <span className="text-[10px] text-slate-500 line-clamp-1">{schedule.officeAddress}</span>
              </div>
            </div>
          </div>

          {/* Card: Kontak Pegawai */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email Kantor</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{employee.email}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Nomor Telepon / WhatsApp</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{employee.phone}</span>
              </div>
            </div>
          </div>

          {/* Card: Hak Cuti Tahunan */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Sisa Kuota Cuti Tahunan</span>
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                {remainingLeave} dari {employee.annualLeaveQuota} Hari
              </span>
            </div>

            <div className="w-full h-2 bg-blue-200/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${leavePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Terpakai: {employee.usedLeave} hari</span>
              <span>Sisa: {remainingLeave} hari</span>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              id="id-modal-goto-upload-photo"
              onClick={() => {
                onClose();
                onOpenUploadPhoto();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Ganti Foto</span>
            </button>

            <button
              id="id-modal-goto-change-pwd"
              onClick={() => {
                onClose();
                onOpenChangePassword();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-700 font-bold text-xs shadow-xs hover:shadow-sm active:scale-95 transition-all"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Ubah Password</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
