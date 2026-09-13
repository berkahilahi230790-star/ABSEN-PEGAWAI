import React from "react";
import {
  Camera,
  LogOut,
  FileText,
  MessageSquareText,
  BarChart3,
  MapPin,
  CalendarCheck,
  SlidersHorizontal,
  Sparkles,
  ShieldAlert,
  UserCog,
  Palette,
} from "lucide-react";
import { AttendanceRecord, CompanyBranding, UserRole, WorkScheduleConfig } from "../types";
import { getThemeClasses } from "../utils/theme";

interface QuickActionsProps {
  todayAttendance: AttendanceRecord | null;
  unreadChatCount: number;
  currentRole: UserRole;
  branding: CompanyBranding;
  schedule: WorkScheduleConfig;
  officeDistanceMeters: number | null;
  onOpenAttendance: (type: "in" | "out") => void;
  onOpenLeaveRequest: () => void;
  onOpenChat: () => void;
  onOpenReports: () => void;
  onOpenSettings: () => void;
  onOpenBranding?: () => void;
  onOpenOfficeRadar: () => void;
  onOpenIdentity?: () => void;
  onOpenChangePassword?: () => void;
  onOpenUploadPhoto?: () => void;
  onOpenAccount?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  todayAttendance,
  unreadChatCount,
  currentRole,
  branding,
  schedule,
  officeDistanceMeters,
  onOpenAttendance,
  onOpenLeaveRequest,
  onOpenChat,
  onOpenReports,
  onOpenSettings,
  onOpenBranding,
  onOpenOfficeRadar,
  onOpenIdentity,
  onOpenChangePassword,
  onOpenUploadPhoto,
  onOpenAccount,
}) => {
  const theme = getThemeClasses(branding.themePreset);

  const hasCheckedIn = Boolean(todayAttendance?.checkInTime);
  const hasCheckedOut = Boolean(todayAttendance?.checkOutTime);

  // Actions specifically tailored for Employee Role (No reports, No admin settings)
  const employeeActions = [
    {
      id: "action-absen-masuk",
      title: "Absen Masuk",
      desc: hasCheckedIn ? `Pukul ${todayAttendance?.checkInTime}` : "Verifikasi Wajah & GPS",
      icon: Camera,
      gradient: "from-blue-600 to-indigo-600",
      badge: hasCheckedIn ? "Selesai" : "Wajib",
      badgeColor: hasCheckedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
      disabled: hasCheckedIn,
      onClick: () => onOpenAttendance("in"),
    },
    {
      id: "action-absen-pulang",
      title: "Absen Pulang",
      desc: hasCheckedOut
        ? `Pukul ${todayAttendance?.checkOutTime}`
        : hasCheckedIn
        ? `Jadwal ${schedule.checkOutTime}`
        : "Setelah absen masuk",
      icon: LogOut,
      gradient: "from-sky-500 to-blue-600",
      badge: hasCheckedOut ? "Selesai" : hasCheckedIn ? "Siap" : "Menunggu",
      badgeColor: hasCheckedOut
        ? "bg-slate-100 text-slate-600"
        : hasCheckedIn
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-400",
      disabled: !hasCheckedIn || hasCheckedOut,
      onClick: () => onOpenAttendance("out"),
    },
    {
      id: "action-ajukan-izin",
      title: "Ajukan Izin",
      desc: "Cuti, Sakit, atau Dinas",
      icon: FileText,
      gradient: "from-indigo-600 to-violet-600",
      badge: "Formulir",
      badgeColor: "bg-indigo-100 text-indigo-700",
      onClick: onOpenLeaveRequest,
    },
    {
      id: "action-chat-admin",
      title: "Chat Admin",
      desc: "Konsultasi HR Real-time",
      icon: MessageSquareText,
      gradient: "from-blue-500 to-cyan-600",
      badge: unreadChatCount > 0 ? `${unreadChatCount} Baru` : "Online",
      badgeColor: unreadChatCount > 0 ? "bg-rose-500 text-white" : "bg-emerald-100 text-emerald-700",
      onClick: onOpenChat,
    },
    {
      id: "action-radar-gps",
      title: "Radius Kantor",
      desc:
        officeDistanceMeters !== null
          ? `${officeDistanceMeters} m (${
              officeDistanceMeters <= schedule.geofenceRadiusMeters ? "Di Area" : "Di Luar"
            })`
          : "Cek Posisi GPS",
      icon: MapPin,
      gradient: "from-cyan-600 to-blue-700",
      badge: "Geofencing",
      badgeColor: "bg-cyan-100 text-cyan-700",
      onClick: onOpenOfficeRadar,
    },
    {
      id: "action-akun-pegawai",
      title: "Akun",
      desc: "Edit Identitas, Foto & Sandi",
      icon: UserCog,
      gradient: "from-blue-600 to-indigo-700",
      badge: "Profil",
      badgeColor: "bg-blue-100 text-blue-800 font-bold",
      onClick: onOpenAccount || onOpenIdentity || (() => {}),
    },
  ];

  // Actions for Manager/Admin Role
  const managerActions = [
    {
      id: "action-absen-masuk",
      title: "Absen Masuk",
      desc: hasCheckedIn ? `Pukul ${todayAttendance?.checkInTime}` : "Verifikasi Wajah & GPS",
      icon: Camera,
      gradient: "from-blue-600 to-indigo-600",
      badge: hasCheckedIn ? "Selesai" : "Wajib",
      badgeColor: hasCheckedIn ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
      disabled: hasCheckedIn,
      onClick: () => onOpenAttendance("in"),
    },
    {
      id: "action-absen-pulang",
      title: "Absen Pulang",
      desc: hasCheckedOut
        ? `Pukul ${todayAttendance?.checkOutTime}`
        : hasCheckedIn
        ? `Jadwal ${schedule.checkOutTime}`
        : "Setelah absen masuk",
      icon: LogOut,
      gradient: "from-sky-500 to-blue-600",
      badge: hasCheckedOut ? "Selesai" : hasCheckedIn ? "Siap" : "Menunggu",
      badgeColor: hasCheckedOut
        ? "bg-slate-100 text-slate-600"
        : hasCheckedIn
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-400",
      disabled: !hasCheckedIn || hasCheckedOut,
      onClick: () => onOpenAttendance("out"),
    },
    {
      id: "action-ajukan-izin",
      title: "Ajukan Izin",
      desc: "Cuti, Sakit, atau Dinas",
      icon: FileText,
      gradient: "from-indigo-600 to-violet-600",
      badge: "Formulir",
      badgeColor: "bg-indigo-100 text-indigo-700",
      onClick: onOpenLeaveRequest,
    },
    {
      id: "action-chat-admin",
      title: "Chat Pegawai",
      desc: "Konsultasi HR Real-time",
      icon: MessageSquareText,
      gradient: "from-blue-500 to-cyan-600",
      badge: unreadChatCount > 0 ? `${unreadChatCount} Baru` : "Online",
      badgeColor: unreadChatCount > 0 ? "bg-rose-500 text-white" : "bg-emerald-100 text-emerald-700",
      onClick: onOpenChat,
    },
    {
      id: "action-laporan-bulanan",
      title: "Laporan Bulanan",
      desc: "Rekapitulasi Otomatis",
      icon: BarChart3,
      gradient: "from-blue-600 to-teal-600",
      badge: "PDF / Slip",
      badgeColor: "bg-teal-100 text-teal-700",
      onClick: onOpenReports,
    },
    {
      id: "action-radar-gps",
      title: "Radius Kantor",
      desc:
        officeDistanceMeters !== null
          ? `${officeDistanceMeters} m (${
              officeDistanceMeters <= schedule.geofenceRadiusMeters ? "Di Area" : "Di Luar"
            })`
          : "Cek Posisi GPS",
      icon: MapPin,
      gradient: "from-cyan-600 to-blue-700",
      badge: "Geofencing",
      badgeColor: "bg-cyan-100 text-cyan-700",
      onClick: onOpenOfficeRadar,
    },
    {
      id: "action-riwayat-presensi",
      title: "Riwayat Presensi",
      desc: "Rekam Jejak Kehadiran",
      icon: CalendarCheck,
      gradient: "from-blue-700 to-indigo-800",
      badge: "Arsip",
      badgeColor: "bg-slate-100 text-slate-700",
      onClick: onOpenReports,
    },
    {
      id: "action-pengaturan-branding",
      title: "Branding & Banner",
      desc: "Logo, Banner & Tema",
      icon: Palette,
      gradient: "from-blue-700 to-indigo-800",
      badge: "Kustomisasi",
      badgeColor: "bg-blue-100 text-blue-800 font-bold",
      onClick: () => {
        if (onOpenBranding) {
          onOpenBranding();
        } else {
          onOpenSettings();
        }
      },
    },
  ];

  const actions = currentRole === "employee" ? employeeActions : managerActions;

  return (
    <div className="mx-4 my-3">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Menu Layanan Utama
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Tampilan Kaca Modern
        </span>
      </div>

      {/* Grid of Square Glass Buttons (Toko Online App Style) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={item.id}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`group relative flex flex-col items-center justify-between p-2.5 rounded-2xl transition-all text-center select-none ${
                item.disabled
                  ? "bg-slate-100/70 border border-slate-200/50 opacity-60 cursor-not-allowed"
                  : "bg-white/80 hover:bg-white border border-white/80 hover:border-blue-300/80 shadow-xs hover:shadow-md hover:shadow-blue-500/10 active:scale-95 backdrop-blur-md"
              }`}
            >
              {/* Badge if present */}
              <span
                className={`absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[8px] font-bold tracking-tight ${item.badgeColor}`}
              >
                {item.badge}
              </span>

              {/* Square Icon Container with Modern Blue Gradient */}
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform mt-1 border border-white/25`}
              >
                <Icon className="w-5 h-5 drop-shadow-xs" />
              </div>

              {/* Title & Micro Description */}
              <div className="mt-2 w-full">
                <p className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {item.title}
                </p>
                <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
