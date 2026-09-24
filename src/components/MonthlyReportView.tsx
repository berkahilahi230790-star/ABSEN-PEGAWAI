import React, { useState, useMemo } from "react";
import {
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  MapPin,
  Camera,
  Filter,
  ArrowUpDown,
  Search,
  Check,
  ShieldCheck,
  Building,
  User,
  FileText,
  Loader2,
  FileDown,
  HardDrive,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AttendanceRecord, CompanyBranding, EmployeeProfile } from "../types";
import {
  syncAllAttendanceRecords,
  uploadFileToGoogleDrive,
  getStoredSpreadsheetUrl,
} from "../services/googleWorkspace";
import { getAccessToken, googleSignIn } from "../services/googleAuth";
import { WorkspaceConfirmModal } from "./WorkspaceConfirmModal";

interface MonthlyReportViewProps {
  records: AttendanceRecord[];
  employees: EmployeeProfile[];
  currentEmployee: EmployeeProfile;
  branding: CompanyBranding;
  onOpenGoogleModal?: () => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  records,
  employees,
  currentEmployee,
  branding,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentEmployee.id);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Workspace States
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [workspaceConfirmOpen, setWorkspaceConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    actionType: "sheets_sync" | "drive_upload";
    title: string;
    description: string;
    itemCount?: number;
    details?: string[];
    onConfirm: () => Promise<void>;
  } | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to build Excel Workbook
  const createExcelWorkbook = () => {
    const worksheetData: (string | number)[][] = [
      // Baris Header Perusahaan
      [branding.companyName.toUpperCase()],
      [branding.tagline || "Sistem Manajemen Presensi & Kepegawaian Digital"],
      ["LAPORAN REKAPITULASI PRESENSI PEGAWAI"],
      [`Periode: ${selectedMonth} | Waktu Unduh: ${new Date().toLocaleString("id-ID")}`],
      [],
      // Profil Karyawan
      ["PROFIL PEGAWAI", ""],
      ["Nama Pegawai", targetEmployee.name, "", "Departemen", targetEmployee.department],
      ["NIP", targetEmployee.nip || "-", "", "Posisi / Jabatan", targetEmployee.position],
      ["Kantor / Cabang", targetEmployee.assignedOffice || "Kantor Pusat", "", "Sisa Cuti", `${targetEmployee.leaveQuota?.remainingDays ?? 12} Hari`],
      [],
      // Ringkasan Kehadiran
      ["RINGKASAN KEHADIRAN", ""],
      ["Total Hari Kerja", "Tepat Waktu", "Terlambat", "Izin / Cuti", "Sakit", "Alpa", "Skor Disiplin"],
      [
        `${stats.totalWorkingDays} Hari`,
        `${stats.onTimeCount} Hari`,
        `${stats.lateCount} Hari`,
        `${stats.leaveCount} Hari`,
        `${stats.sickCount} Hari`,
        `${stats.alpaCount} Hari`,
        `${stats.attendanceScore}%`
      ],
      [],
      // Detail Log Harian
      ["RINCIAN LOG PRESENSI HARIAN", ""],
      [
        "No",
        "ID Presensi",
        "Tanggal",
        "Hari",
        "Jam Masuk",
        "Jam Pulang",
        "Status Kehadiran",
        "Jarak GPS (Meter)",
        "Radius Kantor",
        "Verifikasi Wajah",
        "Catatan Karyawan"
      ]
    ];

    monthlyRecords.forEach((r, idx) => {
      const d = new Date(r.date);
      const dayName = isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { weekday: "long" });
      const statusLabel =
        r.status === "tepat_waktu"
          ? "Tepat Waktu"
          : r.status === "terlambat"
          ? "Terlambat"
          : r.status === "izin"
          ? "Izin Resmi"
          : r.status === "sakit"
          ? "Sakit"
          : "Alpa";

      worksheetData.push([
        idx + 1,
        r.id,
        r.date,
        dayName,
        r.checkInTime || "-",
        r.checkOutTime || "-",
        statusLabel,
        r.location?.distanceMeters ?? 0,
        r.location?.inRadius ? "Dalam Radius Area" : "Luar Radius Area",
        r.verifiedByFace ? "Biometrik Terverifikasi" : "Manual",
        r.notes || "-"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 32 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Presensi");
    return wb;
  };

  // Trigger Google Sheets Bulk Sync with Confirmation Dialog
  const handlePromptGoogleSheetsSync = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const authRes = await googleSignIn();
        if (!authRes) return;
        token = authRes.accessToken;
      } catch (e: any) {
        showNotification("Gagal masuk dengan Google. Silakan coba lagi.");
        return;
      }
    }

    setConfirmConfig({
      actionType: "sheets_sync",
      title: "Sinkronkan Laporan ke Google Sheets",
      description: `Aplikasi akan memperbarui spreadsheet Google Anda dengan seluruh catatan presensi (${records.length} baris). Baris spreadsheet akan diperbarui rapi dengan tanggal, jam masuk, jam pulang, dan status GPS.`,
      itemCount: records.length,
      details: [
        `Target: Spreadsheet "PresensiGo - Rekap Absensi Pegawai"`,
        `Jumlah data yang disinkronkan: ${records.length} baris presensi`,
        `Format kolom: Waktu Masuk, Waktu Pulang, Verifikasi Wajah, dan Koordinat GPS`,
      ],
      onConfirm: async () => {
        setIsSyncingSheets(true);
        try {
          const res = await syncAllAttendanceRecords(records);
          setWorkspaceConfirmOpen(false);
          showNotification(`Berhasil! ${res.count} data absensi disinkronkan ke Google Sheets.`);
        } catch (err: any) {
          showNotification(err?.message || "Gagal sinkron ke Google Sheets.");
        } finally {
          setIsSyncingSheets(false);
        }
      },
    });
    setWorkspaceConfirmOpen(true);
  };

  // Trigger Google Drive Report Upload with Confirmation Dialog
  const handlePromptGoogleDriveExport = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const authRes = await googleSignIn();
        if (!authRes) return;
        token = authRes.accessToken;
      } catch (e: any) {
        showNotification("Gagal masuk dengan Google. Silakan coba lagi.");
        return;
      }
    }

    const cleanComp = branding.companyName.replace(/[^a-zA-Z0-9]/g, "_");
    const cleanEmp = targetEmployee.name.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Laporan_Presensi_${cleanComp}_${cleanEmp}_${selectedMonth}.xlsx`;

    setConfirmConfig({
      actionType: "drive_upload",
      title: "Simpan Laporan ke Google Drive",
      description: `Berkas laporan presensi "${fileName}" akan diunggah dan diarsipkan langsung ke akun Google Drive Anda.`,
      itemCount: monthlyRecords.length,
      details: [
        `Nama berkas: ${fileName}`,
        `Tipe berkas: Microsoft Excel (.xlsx)`,
        `Data: ${monthlyRecords.length} catatan presensi bulan ${selectedMonth}`,
      ],
      onConfirm: async () => {
        setIsSavingDrive(true);
        try {
          const wb = createExcelWorkbook();
          const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const result = await uploadFileToGoogleDrive(
            fileName,
            blob,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          setWorkspaceConfirmOpen(false);
          showNotification(`Berkas berhasil disimpan di Google Drive!`);
        } catch (err: any) {
          showNotification(err?.message || "Gagal menyimpan berkas ke Google Drive.");
        } finally {
          setIsSavingDrive(false);
        }
      },
    });
    setWorkspaceConfirmOpen(true);
  };

  // Month options
  const monthOptions = [
    { value: "2026-09", label: "September 2026 (Bulan Ini)" },
    { value: "2026-08", label: "Agustus 2026" },
    { value: "2026-07", label: "Juli 2026" },
  ];

  const targetEmployee =
    employees.find((e) => e.id === selectedEmployeeId) || currentEmployee;

  // Filtered records for selected month & employee
  const monthlyRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesEmp = r.employeeId === targetEmployee.id;
        const matchesMonth = r.date.startsWith(selectedMonth);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesEmp && matchesMonth && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, targetEmployee.id, selectedMonth, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const allForMonth = records.filter(
      (r) => r.employeeId === targetEmployee.id && r.date.startsWith(selectedMonth)
    );

    const totalLogs = allForMonth.length;
    const onTimeCount = allForMonth.filter((r) => r.status === "tepat_waktu").length;
    const lateCount = allForMonth.filter((r) => r.status === "terlambat").length;
    const leaveCount = allForMonth.filter((r) => r.status === "izin").length;
    const sickCount = allForMonth.filter((r) => r.status === "sakit").length;
    const alpaCount = allForMonth.filter((r) => r.status === "alpa").length;

    // Working days estimate in a month ~ 22 days
    const totalWorkingDays = 22;
    const attendanceScore =
      totalLogs > 0 ? Math.round(((onTimeCount + lateCount * 0.7) / Math.max(totalLogs, 1)) * 100) : 100;

    return {
      totalWorkingDays,
      totalLogged: totalLogs,
      onTimeCount,
      lateCount,
      leaveCount,
      sickCount,
      alpaCount,
      attendanceScore,
    };
  }, [records, targetEmployee.id, selectedMonth]);

  // Ekspor Laporan Presensi ke Format Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const wb = createExcelWorkbook();

      const cleanComp = branding.companyName.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanEmp = targetEmployee.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Laporan_Presensi_${cleanComp}_${cleanEmp}_${selectedMonth}.xlsx`;

      XLSX.writeFile(wb, fileName);
      showNotification(`Laporan Excel berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error("Gagal mengekspor Excel:", err);
      showNotification("Terjadi kesalahan saat mengekspor Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Ekspor Slip Kehadiran ke Format PDF (.pdf)
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const element = document.getElementById("printable-slip-content");
      if (!element) {
        setShowPrintSlip(true);
        setIsExportingPDF(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp resolution for text, logos, and signatures
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const margin = 12;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, 12, printWidth, printHeight);

      const cleanComp = branding.companyName.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanEmp = targetEmployee.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Slip_Presensi_${cleanComp}_${cleanEmp}_${selectedMonth}.pdf`;

      pdf.save(fileName);
      showNotification(`Slip PDF berhasil diunduh: ${fileName}`);
    } catch (err) {
      console.error("Gagal generate PDF:", err);
      // Fallback ke browser print
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="mx-4 my-3 space-y-3.5 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900/90 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Laporan Presensi Bulanan
          </h2>
          <p className="text-[11px] text-slate-500">
            Rekapitulasi absensi GPS, verifikasi wajah biometrik, dan jam kerja pegawai
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Tombol Ekspor Excel */}
          <button
            id="btn-ekspor-excel"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold active:scale-95 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Download Laporan Format Excel (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* Tombol Ekspor PDF */}
          <button
            id="btn-ekspor-pdf"
            onClick={() => setShowPrintSlip(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Buka & Ekspor Slip Kehadiran ke PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          {/* Tombol Simpan ke Google Drive */}
          <button
            id="btn-save-drive"
            onClick={handlePromptGoogleDriveExport}
            disabled={isSavingDrive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold active:scale-95 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Simpan Laporan Bulanan ke Google Drive"
          >
            {isSavingDrive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Simpan ke Drive</span>
          </button>

          {/* Tombol Sinkron ke Google Sheet */}
          <button
            id="btn-sync-sheets"
            onClick={handlePromptGoogleSheetsSync}
            disabled={isSyncingSheets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold active:scale-95 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Sinkronkan Semua Data Absensi ke Google Sheets"
          >
            {isSyncingSheets ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>Sinkron Sheet</span>
          </button>

          {/* Link Buka Spreadsheet jika sudah ada */}
          {getStoredSpreadsheetUrl() && (
            <a
              href={getStoredSpreadsheetUrl()!}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 text-xs font-semibold border border-emerald-300/60 transition-colors"
              title="Buka Spreadsheet di Tab Baru"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka Sheet</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          )}
        </div>
      </div>


      {/* Selectors Bar: Month & Employee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Month Selector */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase">Periode Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Selector */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[9px] font-bold text-slate-400 uppercase">Pilih Pegawai</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Hadir Tepat Waktu */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tepat Waktu</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">{stats.onTimeCount} Hari</p>
          <span className="text-[9px] text-emerald-600 font-semibold">
            {Math.round((stats.onTimeCount / Math.max(stats.totalLogged, 1)) * 100)}% dari kehadiran
          </span>
        </div>

        {/* Terlambat */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Terlambat</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">{stats.lateCount} Hari</p>
          <span className="text-[9px] text-amber-600 font-semibold">Toleransi dicatat</span>
        </div>

        {/* Izin & Cuti */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Izin / Cuti</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-1">{stats.leaveCount} Hari</p>
          <span className="text-[9px] text-blue-600 font-semibold">Disetujui HR</span>
        </div>

        {/* Skor Disiplin */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-100 uppercase">Skor Disiplin</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <p className="text-lg font-black mt-1">{stats.attendanceScore}%</p>
          <span className="text-[9px] text-blue-100">Kategori: Sangat Baik</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: "all", label: "Semua Catatan" },
          { id: "tepat_waktu", label: "Tepat Waktu" },
          { id: "terlambat", label: "Terlambat" },
          { id: "izin", label: "Izin" },
          { id: "sakit", label: "Sakit" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Records List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Daftar Harian ({monthlyRecords.length} Log Presensi)
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Bulan {selectedMonth}</span>
        </div>

        {monthlyRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Tidak ada catatan presensi pada filter ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthlyRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-2"
              >
                {/* Left: Date & Status */}
                <div className="flex items-center gap-3">
                  {/* Face Thumbnail */}
                  <button
                    onClick={() => rec.facePhotoUrl && setPreviewPhotoUrl(rec.facePhotoUrl)}
                    className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group"
                    title="Klik untuk lihat foto verifikasi"
                  >
                    {rec.facePhotoUrl ? (
                      <img
                        src={rec.facePhotoUrl}
                        alt="Face Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                    {rec.verifiedByFace && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{rec.date}</span>
                      {rec.status === "tepat_waktu" && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                          Tepat Waktu
                        </span>
                      )}
                      {rec.status === "terlambat" && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded">
                          Terlambat
                        </span>
                      )}
                      {rec.status === "izin" && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.2 rounded">
                          Izin Resmi
                        </span>
                      )}
                      {rec.status === "sakit" && (
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-1.5 py-0.2 rounded">
                          Sakit
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span>Masuk: {rec.checkInTime || "-"}</span>
                      <span>Pulang: {rec.checkOutTime || "-"}</span>
                      {rec.location && (
                        <span className="inline-flex items-center gap-0.5 text-slate-600">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {rec.location.distanceMeters}m ({rec.location.inRadius ? "Di Area" : "Luar Area"})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes indicator */}
                {rec.notes && (
                  <div className="hidden sm:block text-right max-w-[150px]">
                    <span className="text-[10px] text-slate-400 truncate block">{rec.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Enlarge Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white p-3 rounded-2xl max-w-sm w-full overflow-hidden text-center shadow-2xl">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Foto Verifikasi Wajah Biometrik</h4>
            <img
              src={previewPhotoUrl}
              alt="Preview"
              className="w-full aspect-square object-cover rounded-xl border border-slate-200"
            />
            <p className="text-[10px] text-slate-500 mt-2">
              Terverifikasi oleh sistem kamera deteksi wajah PresensiGo
            </p>
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Official Print & PDF Slip Modal */}
      {showPrintSlip && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900 text-xs">
            {/* Modal Title & Close Bar (Non-printed) */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs text-slate-800">Pratinjau Slip Resmi Kehadiran</h3>
              </div>
              <button
                onClick={() => setShowPrintSlip(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-xs"
              >
                ✕
              </button>
            </div>

            {/* PRINTABLE SLIP CONTENT (Will be exported to PDF / Printed) */}
            <div id="printable-slip-content" className="bg-white p-2">
              {/* Slip Kop: Kiri Atas Logo, Tengah Atas Nama Perusahaan */}
              <div className="border-b-2 border-slate-900 pb-3 mb-3">
                <div className="flex items-center justify-between gap-2">
                  {/* SEBELAH KIRI ATAS: LOGO PERUSAHAAN */}
                  <div className="w-16 sm:w-20 shrink-0 flex items-center justify-start">
                    <img
                      src={branding.logoUrl}
                      alt={branding.companyName}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* BAGIAN TENGAH ATAS: NAMA PERUSAHAAN */}
                  <div className="flex-1 text-center px-1">
                    <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-slate-900 leading-tight">
                      {branding.companyName}
                    </h2>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5 leading-tight">
                      {branding.tagline || "Sistem Informasi Manajemen Presensi Digital"}
                    </p>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-700 tracking-wider uppercase border border-slate-200">
                      SLIP RESMI REKAPITULASI KEHADIRAN
                    </div>
                  </div>

                  {/* KANAN ATAS: BADGE RESMI / KODE DOKUMEN */}
                  <div className="w-16 sm:w-20 shrink-0 text-right">
                    <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded font-extrabold tracking-wider uppercase inline-block">
                      DOKUMEN RESMI
                    </span>
                    <p className="text-[8px] text-slate-400 mt-1 font-mono">
                      REC-{selectedMonth}-01
                    </p>
                  </div>
                </div>

                {/* Info Bar Subheader */}
                <div className="mt-2.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
                  <span>Periode Absensi: <strong className="text-slate-800 uppercase">{selectedMonth}</strong></span>
                  <span>Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {/* Employee Info Box */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Nama Pegawai:</span>
                  <p className="font-bold text-slate-900">{targetEmployee.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Posisi / Jabatan:</span>
                  <p className="font-semibold text-slate-800">{targetEmployee.position}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Divisi / Departemen:</span>
                  <p className="font-medium text-slate-700">{targetEmployee.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">NIP / ID:</span>
                  <p className="font-mono font-bold text-blue-700">{targetEmployee.nip || "EMP-2026-001"}</p>
                </div>
              </div>

              {/* Rekapitulasi Summary */}
              <div className="space-y-1.5 mb-3 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Total Hari Kerja:</span>
                  <span className="font-bold text-slate-800">{stats.totalWorkingDays} Hari</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                  <span>Hadir Tepat Waktu:</span>
                  <span className="font-bold">{stats.onTimeCount} Hari</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                  <span>Terlambat (Toleransi Tercatat):</span>
                  <span className="font-bold">{stats.lateCount} Hari</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-blue-700">
                  <span>Izin & Cuti Resmi:</span>
                  <span className="font-bold">{stats.leaveCount} Hari</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                  <span>Sakit:</span>
                  <span className="font-bold">{stats.sickCount} Hari</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-xs sm:text-sm bg-blue-50 px-2.5 rounded-lg text-blue-950 border border-blue-100 mt-2">
                  <span>Skor Disiplin & Performa Kehadiran:</span>
                  <span className="text-blue-700">{stats.attendanceScore}%</span>
                </div>
              </div>

              {/* Signature Area */}
              <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-4 border-t border-slate-200 mt-3">
                <div>
                  <p className="text-slate-500">Pegawai Bersangkutan,</p>
                  <div className="h-10" />
                  <p className="font-bold text-slate-800 underline">{targetEmployee.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Disahkan oleh Admin Kepegawaian,</p>
                  <div className="h-10 flex items-center justify-center">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest border border-emerald-400 px-2 py-0.5 rounded rotate-[-3deg] bg-emerald-50">
                      VERIFIED HR
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 underline">Rina Wijayanti, S.Psi</p>
                </div>
              </div>
            </div>

            {/* Actions Bar (Excluded from Print) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden flex-wrap">
              <button
                onClick={() => setShowPrintSlip(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                title="Cetak lewat printer atau simpan lewat dialog browser"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak</span>
              </button>
              <button
                id="btn-unduh-slip-pdf"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor PDF (.pdf)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Google Workspace Operations */}
      <WorkspaceConfirmModal
        isOpen={workspaceConfirmOpen}
        onClose={() => setWorkspaceConfirmOpen(false)}
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        title={confirmConfig?.title || "Konfirmasi Google Workspace"}
        description={confirmConfig?.description || ""}
        itemCount={confirmConfig?.itemCount}
        itemDetails={confirmConfig?.details}
        actionType={confirmConfig?.actionType || "sheets_sync"}
        isProcessing={isSyncingSheets || isSavingDrive}
        confirmButtonText={confirmConfig?.actionType === "drive_upload" ? "Ya, Simpan ke Drive" : "Ya, Sinkronkan"}
      />
    </div>
  );
};
