/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  AttendanceRecord,
  CompanyBranding,
  EmployeeProfile,
  LeaveRequest,
  UserRole,
  WorkScheduleConfig,
  ChatMessage,
  NotificationItem,
  Coordinates,
} from "./types";
import {
  getStoredAttendanceRecords,
  getStoredBranding,
  getStoredChatMessages,
  getStoredEmployees,
  getStoredLeaveRequests,
  getStoredSchedule,
  saveAttendanceRecord,
  saveBranding,
  saveChatMessages,
  saveEmployees,
  saveLeaveRequests,
  saveSchedule,
  calculateDistanceMeters,
} from "./services/storage";
import { audioNotificationService } from "./services/audioNotification";

// Components
import { BannerSlider } from "./components/BannerSlider";
import { QuickActions } from "./components/QuickActions";
import { AttendanceModal } from "./components/AttendanceModal";
import { LeaveRequestModal } from "./components/LeaveRequestModal";
import { AdminChatModal } from "./components/AdminChatModal";
import { MonthlyReportView } from "./components/MonthlyReportView";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { AdminSettings } from "./components/AdminSettings";
import { OfficeRadarModal } from "./components/OfficeRadarModal";
import { RoleSelectorModal } from "./components/RoleSelectorModal";
import { EmployeeAccountModal } from "./components/EmployeeAccountModal";
import { EmployeeIdentityModal } from "./components/EmployeeIdentityModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { UploadPhotoModal } from "./components/UploadPhotoModal";

import {
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Home,
  FileSpreadsheet,
  Settings,
  Shield,
  MessageSquare,
  UserCheck,
  User,
  HelpCircle,
  BellRing,
  Bell,
  FileText,
} from "lucide-react";

export default function App() {
  // Application Data States
  const [employees, setEmployees] = useState<EmployeeProfile[]>(getStoredEmployees);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeProfile>(employees[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>("employee");
  const [schedule, setSchedule] = useState<WorkScheduleConfig>(getStoredSchedule);
  const [branding, setBranding] = useState<CompanyBranding>(getStoredBranding);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(getStoredAttendanceRecords);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(getStoredLeaveRequests);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(getStoredChatMessages);

  // Active Main Navigation Tab
  const [currentView, setCurrentView] = useState<"home" | "report" | "manager" | "settings">("home");

  // Modals
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"in" | "out">("in");
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);

  // Modals for Employee Identity, Password, and Photo / Account
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountInitialTab, setAccountInitialTab] = useState<"identity" | "photo" | "password">("identity");
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [uploadPhotoModalOpen, setUploadPhotoModalOpen] = useState(false);

  // Handler for updating full employee profile (name, email, phone, avatar)
  const handleUpdateEmployeeProfile = (updatedEmployee: EmployeeProfile) => {
    setCurrentEmployee(updatedEmployee);

    const updatedEmployees = employees.map((emp) =>
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    );
    setEmployees(updatedEmployees);
    saveEmployees(updatedEmployees);
  };

  // Handler for saving employee photo
  const handleSaveEmployeePhoto = (newAvatarUrl: string) => {
    const updatedEmployee = { ...currentEmployee, avatarUrl: newAvatarUrl };
    handleUpdateEmployeeProfile(updatedEmployee);
  };

  // Role switching handler
  const handleToggleRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === "manager") {
      const mgr = employees.find((e) => e.role === "manager") || employees[3] || employees[0];
      setCurrentEmployee(mgr);
      setCurrentView("manager");
      audioNotificationService.playChime("warning");
    } else {
      const emp = employees.find((e) => e.role === "employee") || employees[0];
      setCurrentEmployee(emp);
      setCurrentView("home");
      audioNotificationService.playChime("success");
    }
  };

  // Today's record for current user
  const todayDateStr = new Date().toISOString().split("T")[0];
  const userTodayRecord = attendanceRecords.find(
    (r) => r.employeeId === currentEmployee.id && r.date === todayDateStr
  );
  const todayRecords = attendanceRecords.filter((r) => r.date === todayDateStr);

  // Office Distance calculation for GPS indicator
  const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = calculateDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            schedule.officeCoordinates.latitude,
            schedule.officeCoordinates.longitude
          );
          setDistanceToOffice(d);
        },
        () => {
          setDistanceToOffice(45); // Safe fallback in iframe/preview
        },
        { enableHighAccuracy: false, timeout: 3000 }
      );
    } else {
      setDistanceToOffice(45);
    }
  }, [schedule]);

  // Notifications state
  const pendingLeavesCount = leaveRequests.filter((r) => r.status === "pending").length;
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Presensi Wajah & GPS Aktif",
      message: `Batas toleransi masuk: ${schedule.checkInTime} (+${schedule.lateToleranceMinutes} mnt)`,
      timestamp: "08:00",
      type: "info",
      read: false,
    },
    {
      id: "notif-2",
      title: "Pemberitahuan Sistem",
      message: "Pastikan mengaktifkan izin kamera dan lokasi untuk presensi harian.",
      timestamp: "08:05",
      type: "reminder",
      read: false,
    },
  ]);

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleTriggerVoiceToast = (title: string, msg: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message: msg,
      type: "reminder",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      read: false,
      isAiVoice: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Save Handlers
  const handleSaveAttendance = (record: AttendanceRecord) => {
    // If existing record today, merge checkOutTime
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === record.employeeId && r.date === record.date
    );

    let updatedList: AttendanceRecord[];
    if (existingIndex >= 0) {
      updatedList = [...attendanceRecords];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        checkOutTime: record.checkOutTime || updatedList[existingIndex].checkOutTime,
        checkInTime: record.checkInTime || updatedList[existingIndex].checkInTime,
        location: record.location || updatedList[existingIndex].location,
        facePhotoUrl: record.facePhotoUrl || updatedList[existingIndex].facePhotoUrl,
        notes: record.notes || updatedList[existingIndex].notes,
      };
    } else {
      updatedList = [record, ...attendanceRecords];
    }

    setAttendanceRecords(updatedList);
    saveAttendanceRecord(record);
  };

  const handleSubmitLeaveRequest = (request: LeaveRequest) => {
    const updated = [request, ...leaveRequests];
    setLeaveRequests(updated);
    saveLeaveRequests(updated);
  };

  const handleReviewLeaveRequest = (
    requestId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    const updated = leaveRequests.map((req) => {
      if (req.id === requestId) {
        // If approved and cuti_tahunan, deduct employee leave balance
        if (status === "approved" && req.leaveType === "cuti_tahunan") {
          const updatedEmps = employees.map((emp) => {
            if (emp.id === req.employeeId) {
              return {
                ...emp,
                usedLeave: emp.usedLeave + req.totalDays,
              };
            }
            return emp;
          });
          setEmployees(updatedEmps);
          saveEmployees(updatedEmps);
        }

        return {
          ...req,
          status,
          managerNotes: notes,
          reviewedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };
      }
      return req;
    });

    setLeaveRequests(updated);
    saveLeaveRequests(updated);
  };

  const handleSendMessage = (msg: ChatMessage) => {
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    saveChatMessages(updated);
  };

  const handleSaveSchedule = (newSchedule: WorkScheduleConfig) => {
    setSchedule(newSchedule);
    saveSchedule(newSchedule);
  };

  const handleSaveBranding = (newBranding: CompanyBranding) => {
    setBranding(newBranding);
    saveBranding(newBranding);
  };

  const handleUpdateEmployeeQuota = (employeeId: string, newQuota: number) => {
    const updated = employees.map((e) => {
      if (e.id === employeeId) {
        return { ...e, annualLeaveQuota: newQuota };
      }
      return e;
    });
    setEmployees(updated);
    saveEmployees(updated);
  };

  // Broadcast 5-minute late warning to staff
  const handleBroadcastLateWarning = () => {
    const missingCount = employees.length - todayRecords.length;
    const msg = `Pemberitahuan darurat dari HRD! Tersisa 5 menit sebelum batas waktu keterlambatan masuk kerja. Terdapat ${missingCount} pegawai yang belum melakukan presensi wajah. Harap segera lakukan check-in di radius kantor!`;
    audioNotificationService.playChime("warning");
    audioNotificationService.speakIndonesian(msg);
  };

  // Open Attendance Modal
  const openAttendance = (type: "in" | "out") => {
    setAttendanceType(type);
    setAttendanceModalOpen(true);
  };

  // Background Theme Gradient mapping
  const getThemeBgStyle = () => {
    switch (branding.themePreset) {
      case "ocean-cyan":
        return "from-cyan-50 via-sky-50 to-blue-50";
      case "royal-indigo":
        return "from-indigo-50 via-slate-50 to-blue-50";
      case "emerald-fresh":
        return "from-teal-50 via-emerald-50 to-slate-50";
      case "sunset-amber":
        return "from-amber-50 via-orange-50 to-blue-50";
      default:
        return "from-blue-50 via-indigo-50/40 to-slate-100";
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeBgStyle()} text-slate-800 flex flex-col font-sans transition-colors duration-500 selection:bg-blue-600 selection:text-white`}>
      {/* Header Utama Aplikasi */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Pojok Kiri: Logo Perusahaan (Murni Gambar Logo, Tidak Bisa Dipilih) */}
          <div className="flex items-center gap-2.5 z-10 shrink-0 select-none pointer-events-none min-w-0">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white flex items-center justify-center p-0.5 select-none shrink-0"
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
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-base rounded-lg">
                  {branding.companyName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight truncate">
                {branding.companyName}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">
                  {currentRole === "manager" ? "Admin Kepegawaian" : `${currentEmployee.name} • ${currentEmployee.position}`}
                </span>
              </div>
            </div>
          </div>

          {/* Pojok Kanan: Notifikasi & Role Badge */}
          <div className="flex items-center gap-1.5 z-10 shrink-0 relative">
            {/* Lonceng Notifikasi */}
            <div className="relative">
              <button
                id="header-bell-btn"
                onClick={() => setShowMobileNotifications(!showMobileNotifications)}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 relative"
                title="Notifikasi Sistem"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi */}
              {showMobileNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-left animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-xs text-slate-900">Pemberitahuan</span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        Tidak ada pemberitahuan baru
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleMarkNotificationRead(item.id)}
                          className={`p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                            item.read
                              ? "bg-slate-50/70 border-slate-100 text-slate-600"
                              : "bg-blue-50/70 border-blue-100 text-slate-900 font-medium"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-slate-900">{item.title}</span>
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-[11px] line-clamp-2">{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Role Badge */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                currentRole === "manager"
                  ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  : "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
              }`}
              title="Pilih Role Tampilan"
            >
              {currentRole === "manager" ? (
                <>
                  <Shield className="w-3 h-3 text-amber-700" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3 h-3 text-blue-700" />
                  <span>Pegawai</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 flex flex-col">
        {/* Interactive Role Switcher Selector Bar */}
        <div className="mb-3 p-2 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md flex items-center justify-between gap-2 border border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-slate-300 font-medium block leading-none">Pilihan Tampilan:</span>
                  <span className="text-xs font-extrabold text-white truncate">
                    {currentRole === "manager" ? "🛡️ Mode Admin Kepegawaian" : "👤 Mode Pegawai"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="switch-to-employee-tab"
                  onClick={() => handleToggleRole("employee")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    currentRole === "employee"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white/10 hover:bg-white/20 text-slate-300"
                  }`}
                  title="Ganti ke Tampilan Pegawai"
                >
                  Pegawai
                </button>
                <button
                  id="switch-to-admin-tab"
                  onClick={() => handleToggleRole("manager")}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    currentRole === "manager"
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-white/10 hover:bg-white/20 text-slate-300"
                  }`}
                  title="Ganti ke Tampilan Admin Kepegawaian"
                >
                  Admin
                </button>
                <button
                  onClick={() => setRoleModalOpen(true)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Buka panduan & perbandingan fitur role"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* View: Home / Pegawai Beranda */}
            {currentView === "home" && (
              currentRole === "manager" ? (
                <ManagerDashboard
                  leaveRequests={leaveRequests}
                  onReviewLeaveRequest={handleReviewLeaveRequest}
                  employees={employees}
                  todayRecords={todayRecords}
                  schedule={schedule}
                  onBroadcastLateWarning={handleBroadcastLateWarning}
                  onOpenSettings={() => setCurrentView("settings")}
                  onOpenReports={() => setCurrentView("report")}
                  onSwitchToEmployee={() => handleToggleRole("employee")}
                />
              ) : (
                <div className="space-y-3.5 pb-20">
                  {/* Company Branding & Banner Carousel */}
                  <BannerSlider
                    banners={branding.banners}
                    onCtaClick={() => {
                      audioNotificationService.playChime("normal");
                    }}
                  />

                  {/* Glass Quick Actions Grid */}
                  <QuickActions
                    todayAttendance={userTodayRecord || null}
                    unreadChatCount={chatMessages.filter((m) => m.sender === "admin").length}
                    currentRole={currentRole}
                    branding={branding}
                    schedule={schedule}
                    officeDistanceMeters={distanceToOffice}
                    onOpenAttendance={(type) => openAttendance(type)}
                    onOpenLeaveRequest={() => setLeaveModalOpen(true)}
                    onOpenChat={() => setChatModalOpen(true)}
                    onOpenReports={() => setCurrentView("report")}
                    onOpenSettings={() => setCurrentView("settings")}
                    onOpenOfficeRadar={() => setRadarModalOpen(true)}
                    onOpenAccount={() => {
                      setAccountInitialTab("identity");
                      setAccountModalOpen(true);
                    }}
                    onOpenIdentity={() => {
                      setAccountInitialTab("identity");
                      setAccountModalOpen(true);
                    }}
                    onOpenChangePassword={() => {
                      setAccountInitialTab("password");
                      setAccountModalOpen(true);
                    }}
                    onOpenUploadPhoto={() => {
                      setAccountInitialTab("photo");
                      setAccountModalOpen(true);
                    }}
                  />

                  {/* Today Attendance Summary Glass Card */}
                  <div className="mx-4 p-4 rounded-3xl bg-white/80 backdrop-blur-md border border-white/60 shadow-glass space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">Rangkuman Presensi Hari Ini</h3>
                          <p className="text-[10px] text-slate-400">
                            {new Date().toLocaleDateString("id-ID", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      {currentRole === "manager" && (
                        <button
                          onClick={() => setCurrentView("report")}
                          className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>Lihat Rekap</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Check In box */}
                      <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-bold block">Masuk (In)</span>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {userTodayRecord?.checkInTime || "--:--"}
                        </p>
                        <div className="mt-1">
                          {userTodayRecord?.checkInTime ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {userTodayRecord.status === "terlambat" ? "Terlambat" : "Tepat Waktu"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Belum Presensi</span>
                          )}
                        </div>
                      </div>

                      {/* Check Out box */}
                      <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                        <span className="text-[10px] text-slate-400 font-bold block">Pulang (Out)</span>
                        <p className="text-base font-extrabold text-slate-900 mt-0.5">
                          {userTodayRecord?.checkOutTime || "--:--"}
                        </p>
                        <div className="mt-1">
                          {userTodayRecord?.checkOutTime ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-1.5 py-0.2 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Presensi Sah
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Jadwal: {schedule.checkOutTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Employee Leave Quota Mini Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Sisa Cuti Tahunan:</span>
                      </div>
                      <span className="font-extrabold text-blue-700">
                        {currentEmployee.annualLeaveQuota - currentEmployee.usedLeave} Hari
                      </span>
                    </div>
                  </div>

                  {/* Office Info & Geofence Status */}
                  <div className="mx-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-200 font-semibold block">Lokasi Presensi GPS</span>
                        <p className="text-xs font-bold text-white leading-tight">{schedule.officeName}</p>
                        <span className="text-[10px] text-blue-100 block">Radius sah: {schedule.geofenceRadiusMeters} m</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setRadarModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 active:scale-95 transition-all whitespace-nowrap"
                    >
                      Cek Radar
                    </button>
                  </div>
                </div>
              )
            )}

            {/* View: Monthly Report */}
            {currentView === "report" && (
              <MonthlyReportView
                records={attendanceRecords}
                employees={employees}
                currentEmployee={currentEmployee}
                branding={branding}
              />
            )}

            {/* View: Manager Dashboard */}
            {currentView === "manager" && (
              <ManagerDashboard
                leaveRequests={leaveRequests}
                onReviewLeaveRequest={handleReviewLeaveRequest}
                employees={employees}
                todayRecords={todayRecords}
                schedule={schedule}
                onBroadcastLateWarning={handleBroadcastLateWarning}
                onOpenSettings={() => setCurrentView("settings")}
                onOpenReports={() => setCurrentView("report")}
                onSwitchToEmployee={() => handleToggleRole("employee")}
              />
            )}

            {/* View: Admin Settings */}
            {currentView === "settings" && (
              <AdminSettings
                schedule={schedule}
                onSaveSchedule={handleSaveSchedule}
                branding={branding}
                onSaveBranding={handleSaveBranding}
                employees={employees}
                onUpdateEmployeeQuota={handleUpdateEmployeeQuota}
              />
            )}
      </main>

      {/* Bottom Fixed Navigation Bar (Tailored to current role) */}
      <nav className="sticky bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 z-30 shadow-lg shrink-0">
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around">
            {currentRole === "employee" ? (
              <>
                <button
                  id="tab-home"
                  onClick={() => setCurrentView("home")}
                  className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all ${
                    currentView === "home"
                      ? "text-blue-600 font-bold"
                      : "text-slate-400 hover:text-slate-600 font-medium"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${currentView === "home" ? "bg-blue-50 text-blue-600" : ""}`}>
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[11px]">Beranda</span>
                </button>

                {/* Center Quick Snap Presensi Button */}
                <button
                  id="tab-quick-scan"
                  onClick={() => openAttendance("in")}
                  className="relative -top-4 w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-white active:scale-95 transition-all group"
                  title="Presensi Wajah & GPS Cepat"
                >
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="text-[9px] font-bold mt-0.5">Absen</span>
                </button>

                <button
                  id="tab-chat"
                  onClick={() => setChatModalOpen(true)}
                  className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all text-slate-400 hover:text-slate-600 font-medium relative"
                >
                  <div className="p-1.5 rounded-xl hover:bg-slate-100">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px]">Chat Admin</span>
                  {chatMessages.filter((m) => m.sender === "admin").length > 0 && (
                    <span className="absolute top-0 right-2 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] flex items-center justify-center font-bold">
                      {chatMessages.filter((m) => m.sender === "admin").length}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  id="tab-manager"
                  onClick={() => setCurrentView("manager")}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all relative ${
                    currentView === "manager"
                      ? "text-amber-600 font-bold"
                      : "text-slate-400 hover:text-slate-600 font-medium"
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-colors ${currentView === "manager" ? "bg-amber-50 text-amber-600" : ""}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[10px]">Kepegawaian</span>
                  {pendingLeavesCount > 0 && (
                    <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {pendingLeavesCount}
                    </span>
                  )}
                </button>

                <button
                  id="tab-report-all"
                  onClick={() => setCurrentView("report")}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all ${
                    currentView === "report"
                      ? "text-amber-600 font-bold"
                      : "text-slate-400 hover:text-slate-600 font-medium"
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-colors ${currentView === "report" ? "bg-amber-50 text-amber-600" : ""}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px]">Semua Laporan</span>
                </button>

                {/* Center Broadcast Audio Button for Admin */}
                <button
                  id="tab-broadcast-alarm"
                  onClick={handleBroadcastLateWarning}
                  className="relative -top-4 w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-white active:scale-95 transition-all group"
                  title="Broadcast Suara AI Peringatan 5 Menit"
                >
                  <BellRing className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>

                <button
                  id="tab-settings"
                  onClick={() => setCurrentView("settings")}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all ${
                    currentView === "settings"
                      ? "text-amber-600 font-bold"
                      : "text-slate-400 hover:text-slate-600 font-medium"
                  }`}
                >
                  <div className={`p-1 rounded-xl transition-colors ${currentView === "settings" ? "bg-amber-50 text-amber-600" : ""}`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-[10px]">Pengaturan</span>
                </button>

                <button
                  id="tab-switch-emp"
                  onClick={() => handleToggleRole("employee")}
                  className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-2xl transition-all text-slate-400 hover:text-slate-600 font-medium"
                  title="Ganti ke Tampilan Pegawai"
                >
                  <div className="p-1 rounded-xl hover:bg-slate-100">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold">Ke Pegawai</span>
                </button>
              </>
            )}
          </div>
        </nav>

      {/* MODALS */}
      {/* 1. Biometric Face Detection & GPS Attendance Modal */}
      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        type={attendanceType}
        employee={currentEmployee}
        schedule={schedule}
        branding={branding}
        onSaveAttendance={handleSaveAttendance}
      />

      {/* 2. Leave / Permission Request Modal */}
      <LeaveRequestModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        employee={currentEmployee}
        onSubmitRequest={handleSubmitLeaveRequest}
      />

      {/* 3. Real-Time Admin HR Chat Modal */}
      <AdminChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        employee={currentEmployee}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* 4. Office GPS Radar Modal */}
      <OfficeRadarModal
        isOpen={radarModalOpen}
        onClose={() => setRadarModalOpen(false)}
        schedule={schedule}
      />

      {/* 5. Role Selection Modal */}
      <RoleSelectorModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleToggleRole}
        employees={employees}
      />

      {/* 6. Employee Account Modal (Akun: Edit Identitas, Upload Foto, Ubah Password) */}
      <EmployeeAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        employee={currentEmployee}
        schedule={schedule}
        onUpdateProfile={handleUpdateEmployeeProfile}
        initialTab={accountInitialTab}
      />

      {/* 7. Employee Identity Modal (Cek Identitas) */}
      <EmployeeIdentityModal
        isOpen={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        employee={currentEmployee}
        schedule={schedule}
        onOpenUploadPhoto={() => {
          setIdentityModalOpen(false);
          setAccountInitialTab("photo");
          setAccountModalOpen(true);
        }}
        onOpenChangePassword={() => {
          setIdentityModalOpen(false);
          setAccountInitialTab("password");
          setAccountModalOpen(true);
        }}
      />

      {/* 8. Change Password Modal (Ubah Password) */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        employee={currentEmployee}
      />

      {/* 9. Upload Photo Modal (Upload Foto) */}
      <UploadPhotoModal
        isOpen={uploadPhotoModalOpen}
        onClose={() => setUploadPhotoModalOpen(false)}
        employee={currentEmployee}
        onSavePhoto={handleSaveEmployeePhoto}
      />
    </div>
  );
}

