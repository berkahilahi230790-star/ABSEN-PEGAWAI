import React, { useState } from "react";
import {
  Bell,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  Clock,
} from "lucide-react";
import { CompanyBranding, EmployeeProfile, NotificationItem, UserRole } from "../types";
import { getThemeClasses } from "../utils/theme";

interface NavbarProps {
  branding: CompanyBranding;
  employee: EmployeeProfile;
  currentRole: UserRole;
  onToggleRole: (role: UserRole) => void;
  onOpenRoleSelector?: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onOpenProfile: () => void;
  onTriggerVoiceWarning: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  branding,
  employee,
  currentRole,
  onToggleRole,
  onOpenRoleSelector,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  isMobileFrame,
  onToggleMobileFrame,
  onOpenProfile,
  onTriggerVoiceWarning,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const theme = getThemeClasses(branding.themePreset);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Upper Status Line - E-commerce App Header with Role Switcher */}
      <div className={`w-full bg-gradient-to-r ${theme.gradientBg} px-4 py-2 text-white text-xs`}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium tracking-wide truncate">{branding.companyName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Segmented Role Switcher */}
            <div className="flex items-center bg-black/25 backdrop-blur-md rounded-xl p-0.5 border border-white/20 shadow-xs">
              <button
                id="role-employee-btn"
                onClick={() => onToggleRole("employee")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  currentRole === "employee"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="Mode Tampilan Pegawai"
              >
                <UserCheck className="w-3 h-3" />
                <span>Pegawai</span>
              </button>
              <button
                id="role-manager-btn"
                onClick={() => onToggleRole("manager")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  currentRole === "manager"
                    ? "bg-amber-400 text-slate-900 shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title="Mode Tampilan Admin Kepegawaian"
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>

            {/* Modal opener button if provided */}
            {onOpenRoleSelector && (
              <button
                onClick={onOpenRoleSelector}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-all border border-white/20"
                title="Pilih Role Pengguna Lengkap"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Pilih Role</span>
              </button>
            )}

            {/* Mobile Viewport Switcher */}
            <button
              id="toggle-viewport-btn"
              onClick={onToggleMobileFrame}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-all text-white/90"
              title={isMobileFrame ? "Beralih ke Tampilan Penuh" : "Beralih ke Bingkai HP"}
            >
              {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar Bar */}
      <div className="px-4 py-2.5 max-w-lg mx-auto flex items-center justify-between gap-2 relative">
        {/* Pojok Kiri: Logo Perusahaan (Statis, Tidak Bisa Diklik) */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white flex items-center justify-center select-none pointer-events-none p-0.5"
            title={branding.companyName}
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.companyName}
                className="w-full h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg rounded-lg">
                {branding.companyName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Di Atas Tengah: Nama Perusahaan */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-1 min-w-0">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate max-w-[190px] sm:max-w-xs leading-tight">
            {branding.companyName}
          </h1>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">
              {currentRole === "manager" ? "Dasbor Admin Kepegawaian" : `${employee.name} • ${employee.position}`}
            </span>
          </div>
        </div>

        {/* Pojok Kanan: Aksi & Profil */}
        <div className="flex items-center gap-1.5 shrink-0 z-10">
          {/* Quick AI Voice Reminder button */}
          <button
            id="quick-voice-reminder-btn"
            onClick={onTriggerVoiceWarning}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-blue-700 hover:bg-blue-100/60 active:scale-95 transition-all shadow-xs"
            title="Tes Suara AI: Peringatan 5 Menit Terlambat"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
            <span className="hidden xs:inline">Suara AI</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div
                id="notifications-panel"
                className="absolute right-0 mt-2 w-72 xs:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50 text-left animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">Pemberitahuan Sistem</span>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAllNotifications}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-64 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Tidak ada pemberitahuan baru
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onMarkNotificationRead(item.id)}
                        className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                          item.read
                            ? "bg-slate-50/70 border-slate-100 text-slate-600"
                            : "bg-blue-50/70 border-blue-100 text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-[11px] text-slate-900 flex items-center gap-1">
                            {item.type === "warning" ? (
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            ) : (
                              <Clock className="w-3 h-3 text-blue-500" />
                            )}
                            {item.title}
                          </span>
                          <span className="text-[9px] text-slate-400">{item.timestamp}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-snug">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <button
            id="navbar-profile-avatar-btn"
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200/90 hover:ring-2 hover:ring-blue-400 transition-all shrink-0"
          >
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
