import React from "react";
import {
  User,
  Shield,
  Check,
  Camera,
  MapPin,
  Clock,
  FileSpreadsheet,
  Settings,
  BellRing,
  Sparkles,
  X,
} from "lucide-react";
import { EmployeeProfile, UserRole } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  employees: EmployeeProfile[];
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  employees,
}) => {
  if (!isOpen) return null;

  const employeeUser = employees.find((e) => e.role === "employee") || employees[0];
  const managerUser = employees.find((e) => e.role === "manager") || employees[3] || employees[0];

  const handleSelect = (role: UserRole) => {
    onSelectRole(role);
    audioNotificationService.playChime(role === "manager" ? "warning" : "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Pilih Tampilan Role Pengguna</h3>
              <p className="text-[11px] text-blue-100">Beralih mode antara Pegawai dan Admin Kepegawaian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            Aplikasi ini menyediakan dua tampilan antarmuka terpisah yang disesuaikan dengan kebutuhan peran kerja:
          </p>

          {/* Option 1: Pegawai */}
          <div
            onClick={() => handleSelect("employee")}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              currentRole === "employee"
                ? "bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/10"
                : "bg-white border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/50"
            }`}
          >
            {currentRole === "employee" && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <User className="w-6 h-6" />
              </div>

              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900">Tampilan Pegawai (Karyawan)</h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                    User
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Login simulasi: <strong>{employeeUser.name}</strong> ({employeeUser.position})
                </p>

                {/* Features Pill */}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <Camera className="w-2.5 h-2.5 text-blue-500" /> Presensi Wajah AI
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <MapPin className="w-2.5 h-2.5 text-emerald-500" /> GPS Geofence
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <Clock className="w-2.5 h-2.5 text-amber-500" /> Pengajuan Izin
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    Chat Admin
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Admin Kepegawaian */}
          <div
            onClick={() => handleSelect("manager")}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              currentRole === "manager"
                ? "bg-amber-50/80 border-amber-500 shadow-md shadow-amber-500/10"
                : "bg-white border-slate-200/80 hover:border-amber-300 hover:bg-slate-50/50"
            }`}
          >
            {currentRole === "manager" && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Shield className="w-6 h-6" />
              </div>

              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900">Tampilan Admin Kepegawaian</h4>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.2 rounded">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Login simulasi: <strong>{managerUser.name}</strong> ({managerUser.position})
                </p>

                {/* Features Pill */}
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <Check className="w-2.5 h-2.5 text-emerald-500" /> Persetujuan Cuti 1-Klik
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <BellRing className="w-2.5 h-2.5 text-rose-500" /> Siaran Suara AI
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <Settings className="w-2.5 h-2.5 text-slate-500" /> Jam & Geofence
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    <FileSpreadsheet className="w-2.5 h-2.5 text-blue-500" /> Laporan Semua
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Peran aktif saat ini: <strong className="text-slate-700 capitalize">{currentRole === "manager" ? "Admin Kepegawaian" : "Pegawai"}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
