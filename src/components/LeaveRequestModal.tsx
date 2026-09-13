import React, { useState } from "react";
import {
  FileText,
  Calendar,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Clock,
  Briefcase,
  HeartPulse,
} from "lucide-react";
import { EmployeeProfile, LeaveRequest, LeaveType } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile;
  onSubmitRequest: (request: LeaveRequest) => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSubmitRequest,
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>("cuti_tahunan");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate day count
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalDays = calculateDays();
  const remainingQuota = employee.annualLeaveQuota - employee.usedLeave;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // Create local preview URL
      const url = URL.createObjectURL(file);
      setAttachmentUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (totalDays <= 0) {
      setErrorMsg("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    if (leaveType === "cuti_tahunan" && totalDays > remainingQuota) {
      setErrorMsg(`Kuota cuti tahunan Anda tidak mencukupi (Tersisa ${remainingQuota} hari).`);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Harap masukkan alasan permohonan izin/cuti.");
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const formattedSubmitted = `${now.toISOString().split("T")[0]} ${now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
      attachmentName: attachmentName || undefined,
      attachmentUrl: attachmentUrl || undefined,
      status: "pending",
      submittedAt: formattedSubmitted,
    };

    audioNotificationService.playChime("success");
    audioNotificationService.speakIndonesian(
      `Permohonan ${
        leaveType === "cuti_tahunan" ? "cuti tahunan" : "izin"
      } berhasil diajukan ke dasbor manajerial. Menunggu peninjauan Admin Kepegawaian.`
    );

    setTimeout(() => {
      onSubmitRequest(newRequest);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Pengajuan Izin & Cuti</h2>
              <p className="text-[11px] text-blue-100 font-medium">
                Terintegrasi Langsung ke Dasbor Admin Kepegawaian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {/* Quota Overview Card */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-blue-800 font-semibold">Sisa Kuota Cuti Tahunan</span>
              <p className="text-base font-black text-blue-900">{remainingQuota} Hari</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500">Terpakai: {employee.usedLeave} hari</span>
              <p className="text-[10px] text-slate-500">Total: {employee.annualLeaveQuota} hari / thn</p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Jenis Izin Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Kategori Pengajuan Izin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "cuti_tahunan", label: "Cuti Tahunan", icon: Calendar },
                { id: "sakit", label: "Sakit (Surat Dokter)", icon: HeartPulse },
                { id: "izin_pribadi", label: "Izin Keperluan Pribadi", icon: Clock },
                { id: "dinas_luar", label: "Tugas Dinas Lapangan", icon: Briefcase },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = leaveType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLeaveType(item.id as LeaveType)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs font-semibold"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-blue-600"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Duration Summary */}
          <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Durasi Pengajuan:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-slate-200">
              {totalDays > 0 ? `${totalDays} Hari Kerja` : "Tanggal tidak valid"}
            </span>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Alasan & Keterangan Lengkap
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan keperluan izin atau cuti Anda dengan jelas..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* File Attachment Upload */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Lampiran Dokumen / Surat Dokter (Opsional)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-3.5 text-center bg-slate-50/60 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {attachmentName ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="truncate max-w-[200px]">{attachmentName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500">
                  <UploadCloud className="w-6 h-6 text-blue-500" />
                  <span className="text-[11px] font-semibold text-slate-700">
                    Klik atau seret file dokumen / foto surat dokter
                  </span>
                  <span className="text-[10px] text-slate-400">Format: JPG, PNG, PDF (Maks 5MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 active:scale-95 transition-all"
            >
              Batal
            </button>
            <button
              id="submit-leave-request-btn"
              type="submit"
              disabled={isSubmitting || totalDays <= 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Mengirim ke Manajer...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Kirim Pengajuan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
