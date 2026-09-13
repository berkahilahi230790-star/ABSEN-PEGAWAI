import React, { useState } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  UserCheck,
  Calendar,
  CalendarCheck,
  Search,
  BellRing,
  ExternalLink,
  MessageSquare,
  Filter,
} from "lucide-react";
import { AttendanceRecord, EmployeeProfile, LeaveRequest, WorkScheduleConfig } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface ManagerDashboardProps {
  leaveRequests: LeaveRequest[];
  onReviewLeaveRequest: (
    requestId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => void;
  employees: EmployeeProfile[];
  todayRecords: AttendanceRecord[];
  schedule: WorkScheduleConfig;
  onBroadcastLateWarning: () => void;
  onOpenSettings?: () => void;
  onOpenReports?: () => void;
  onSwitchToEmployee?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  leaveRequests,
  onReviewLeaveRequest,
  employees,
  todayRecords,
  schedule,
  onBroadcastLateWarning,
  onOpenSettings,
  onOpenReports,
  onSwitchToEmployee,
}) => {
  const [activeTab, setActiveTab] = useState<"approvals" | "monitoring">("approvals");
  const [reviewNote, setReviewNote] = useState<{ [id: string]: string }>({});
  const [leaveFilter, setLeaveFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [leaveSearch, setLeaveSearch] = useState("");

  const pendingRequests = leaveRequests.filter((r) => r.status === "pending");
  const historyRequests = leaveRequests.filter((r) => r.status !== "pending");

  const filteredRequests = leaveRequests.filter((req) => {
    // Filter by status
    if (leaveFilter === "pending" && req.status !== "pending") return false;
    if (leaveFilter === "approved" && req.status !== "approved") return false;
    if (leaveFilter === "rejected" && req.status !== "rejected") return false;

    // Filter by search term
    if (leaveSearch.trim()) {
      const q = leaveSearch.toLowerCase();
      const matchName = req.employeeName.toLowerCase().includes(q);
      const matchDept = req.department.toLowerCase().includes(q);
      const matchType = req.leaveType.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      return matchName || matchDept || matchType || matchReason;
    }
    return true;
  });

  const handleApprove = (req: LeaveRequest) => {
    const note = reviewNote[req.id] || "Disetujui oleh Admin Kepegawaian.";
    onReviewLeaveRequest(req.id, "approved", note);
    audioNotificationService.playChime("success");
  };

  const handleReject = (req: LeaveRequest) => {
    const note = reviewNote[req.id] || "Ditolak karena kuota atau pertimbangan jadwal tim.";
    onReviewLeaveRequest(req.id, "rejected", note);
    audioNotificationService.playChime("warning");
  };

  return (
    <div className="mx-4 my-3 space-y-3.5 pb-20">
      {/* Role Switch Callout Banner */}
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="text-xs font-bold text-amber-900">
            Anda sedang dalam Tampilan Admin Kepegawaian
          </span>
        </div>
        {onSwitchToEmployee && (
          <button
            onClick={onSwitchToEmployee}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-blue-700 text-[11px] font-bold border border-blue-200 shadow-xs transition-colors flex items-center gap-1 active:scale-95"
          >
            <UserCheck className="w-3 h-3" />
            <span>Lihat Tampilan Pegawai</span>
          </button>
        )}
      </div>

      {/* Manager Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-3xl border border-slate-700/80 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white">Dasbor Admin Kepegawaian</h2>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">
                  Admin Pusat
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Otorisasi perizinan & kendali kebijakan presensi terintegrasi
              </p>
            </div>
          </div>

          {/* Broadcast reminder button */}
          <button
            id="broadcast-late-warning-btn"
            onClick={onBroadcastLateWarning}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            title="Kirim pengingat suara push ke seluruh staf yang belum absen"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Broadcast 5 Menit</span>
          </button>
        </div>

        {/* Mini stats counters */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-center text-xs">
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-300 font-bold">Menunggu Review</span>
            <p className="text-base font-black text-white">{pendingRequests.length} Izin</p>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-300 font-bold">Total Staf</span>
            <p className="text-base font-black text-white">{employees.length} Pegawai</p>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-blue-300 font-bold">Presensi Hari Ini</span>
            <p className="text-base font-black text-white">{todayRecords.length} Hadir</p>
          </div>
        </div>
      </div>

      {/* Admin Action Bar: Kelola Cuti & Laporan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          id="btn-admin-kelola-cuti"
          onClick={() => {
            setActiveTab("approvals");
            const el = document.getElementById("section-kelola-cuti");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-3.5 rounded-2xl bg-white border transition-all text-left flex items-center justify-between gap-3 group ${
            activeTab === "approvals"
              ? "border-blue-500 ring-2 ring-blue-100 shadow-xs"
              : "border-slate-200 hover:border-blue-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Kelola Cuti</h4>
                {pendingRequests.length > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-bold animate-pulse">
                    {pendingRequests.length} Baru
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                    Semua Ditinjau
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Pengajuan cuti pegawai & persetujuan</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
            <span>Buka</span>
            <span>&rarr;</span>
          </span>
        </button>

        <button
          onClick={onOpenReports}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-left flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">Laporan Bulanan</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Rekapitulasi kehadiran & cetak resmi</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
            <span>Buka</span>
            <span>&rarr;</span>
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "approvals"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Kelola Cuti (Pengajuan Pegawai)</span>
          {pendingRequests.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "monitoring"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Monitoring Kehadiran Staf</span>
        </button>
      </div>

      {/* Tab Content: Kelola Cuti & Pengajuan Pegawai */}
      {activeTab === "approvals" && (
        <div id="section-kelola-cuti" className="space-y-3">
          {/* Search & Filter Controls */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900">Daftar Pengajuan Cuti Pegawai</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {leaveRequests.length} total permohonan
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                placeholder="Cari nama pegawai, divisi, atau jenis cuti..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setLeaveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  leaveFilter === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua ({leaveRequests.length})
              </button>
              <button
                onClick={() => setLeaveFilter("pending")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                  leaveFilter === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                <span>Menunggu</span>
                <span className="px-1 py-0.2 rounded bg-white/30 text-[9px] font-bold">
                  {pendingRequests.length}
                </span>
              </button>
              <button
                onClick={() => setLeaveFilter("approved")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  leaveFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Disetujui ({leaveRequests.filter((r) => r.status === "approved").length})
              </button>
              <button
                onClick={() => setLeaveFilter("rejected")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  leaveFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Ditolak ({leaveRequests.filter((r) => r.status === "rejected").length})
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5">
            <h3 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>
                {leaveFilter === "pending"
                  ? `Menunggu Otorisasi (${filteredRequests.length})`
                  : leaveFilter === "approved"
                  ? `Pengajuan Disetujui (${filteredRequests.length})`
                  : leaveFilter === "rejected"
                  ? `Pengajuan Ditolak (${filteredRequests.length})`
                  : `Daftar Pengajuan Cuti (${filteredRequests.length})`}
              </span>
            </h3>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {leaveSearch
                  ? "Tidak ada pengajuan cuti yang sesuai dengan pencarian."
                  : leaveFilter === "pending"
                  ? "Semua pengajuan cuti pegawai telah ditinjau."
                  : "Belum ada riwayat pengajuan cuti."}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => {
                  const emp = employees.find(
                    (e) => e.id === req.employeeId || e.name.toLowerCase() === req.employeeName.toLowerCase()
                  );
                  const remainingQuota = emp?.leaveQuota?.remainingDays ?? 12;

                  return (
                    <div
                      key={req.id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                        req.status === "pending"
                          ? "bg-slate-50 border-amber-200/80 shadow-xs"
                          : req.status === "approved"
                          ? "bg-emerald-50/40 border-emerald-200/80"
                          : "bg-rose-50/40 border-rose-200/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp?.avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"}
                            alt={req.employeeName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{req.employeeName}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                                {req.department}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  req.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : req.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {req.status === "approved"
                                  ? "Disetujui"
                                  : req.status === "rejected"
                                  ? "Ditolak"
                                  : "Menunggu Review"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Kategori:{" "}
                              <strong className="text-slate-800 capitalize">
                                {req.leaveType.replace("_", " ")}
                              </strong>{" "}
                              • {req.totalDays} Hari ({req.startDate} s/d {req.endDate})
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Sisa kuota cuti pegawai:{" "}
                              <strong className="text-blue-700 font-bold">{remainingQuota} Hari</strong>
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                          {req.submittedAt}
                        </span>
                      </div>

                      {/* Reason */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold block">Alasan Pengajuan Cuti:</span>
                        <p className="mt-0.5">{req.reason}</p>
                      </div>

                      {/* Attachment preview if any */}
                      {req.attachmentName && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-800">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate flex-1 font-semibold">{req.attachmentName}</span>
                          {req.attachmentUrl && (
                            <a
                              href={req.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                            >
                              <span>Buka Surat</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Manager Review Notes / Actions */}
                      {req.status === "pending" ? (
                        <>
                          <div>
                            <input
                              type="text"
                              placeholder="Catatan persetujuan / alasan penolakan (opsional)..."
                              value={reviewNote[req.id] || ""}
                              onChange={(e) =>
                                setReviewNote({ ...reviewNote, [req.id]: e.target.value })
                              }
                              className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Decision Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleReject(req)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                            <button
                              onClick={() => handleApprove(req)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Setujui Cuti</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-500 bg-white/70 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <span>
                            Ditinjau pada: <strong>{req.reviewedAt || req.submittedAt}</strong>
                          </span>
                          {req.managerNotes && (
                            <span className="italic text-slate-600 max-w-[200px] truncate">
                              "{req.managerNotes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History of Decisions */}
          {historyRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5">
              <h3 className="text-xs font-bold text-slate-800 mb-2">Riwayat Keputusan Terbaru</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {historyRequests.slice(0, 5).map((hr) => (
                  <div key={hr.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{hr.employeeName}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            hr.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {hr.status === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {hr.leaveType.replace("_", " ")} ({hr.totalDays} hari) • {hr.reviewedAt || hr.submittedAt}
                      </p>
                    </div>
                    {hr.managerNotes && (
                      <span className="text-[10px] text-slate-400 italic max-w-[120px] truncate">
                        "{hr.managerNotes}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Monitoring Today */}
      {activeTab === "monitoring" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Status Kehadiran Seluruh Staf Hari Ini</h3>
            <span className="text-[10px] text-slate-400">Jadwal Masuk: {schedule.checkInTime} WIB</span>
          </div>

          <div className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const rec = todayRecords.find((r) => r.employeeId === emp.id);
              return (
                <div key={emp.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-snug">
                        {emp.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {emp.position} • {emp.department}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {rec ? (
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            rec.status === "terlambat"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {rec.status === "terlambat" ? "Terlambat" : "Hadir"} ({rec.checkInTime})
                        </span>
                        {rec.location && (
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {rec.location.distanceMeters}m dari kantor
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                        Belum Check-In
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
