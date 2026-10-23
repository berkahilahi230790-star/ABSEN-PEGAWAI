import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Building,
  Briefcase,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Shield,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  User,
  Eye,
  ArrowLeft,
  Plus,
  Camera,
  UploadCloud,
} from "lucide-react";
import * as XLSX from "xlsx";
import { EmployeeProfile, WorkLocation, JABATAN_OPTIONS, UserRole } from "../types";

interface PegawaiViewProps {
  employees: EmployeeProfile[];
  workLocations: WorkLocation[];
  onSaveEmployee: (employee: EmployeeProfile) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onBack?: () => void;
  onOpenTempatTugas?: () => void;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

export const PegawaiView: React.FC<PegawaiViewProps> = ({
  employees,
  workLocations,
  onSaveEmployee,
  onDeleteEmployee,
  onBack,
  onOpenTempatTugas,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJabatan, setFilterJabatan] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState<string>("Guru");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [role, setRole] = useState<UserRole>("employee");
  const [department, setDepartment] = useState("");
  const [annualLeaveQuota, setAnnualLeaveQuota] = useState(12);
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih berkas foto gambar (JPG, PNG, atau WebP).");
      return;
    }

    setIsProcessingPhoto(true);
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
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressed);
        } else {
          setAvatarUrl(e.target?.result as string);
        }
        setIsProcessingPhoto(false);
      };
      img.onerror = () => {
        setIsProcessingPhoto(false);
        alert("Gagal membaca berkas gambar.");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Open modal to add employee
  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setNip("");
    setEmail("");
    setPhone("+62 ");
    setPosition("Guru");
    // Default to first work location if available
    setSelectedLocationId(workLocations.length > 0 ? workLocations[0].id : "");
    setRole("employee");
    setDepartment("Tenaga Pendidik");
    setAnnualLeaveQuota(12);
    setAvatarUrl(DEFAULT_AVATAR);
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal to edit employee
  const handleOpenEdit = (emp: EmployeeProfile) => {
    setEditingId(emp.id);
    setName(emp.name);
    setNip(emp.nip || "");
    setEmail(emp.email);
    setPhone(emp.phone);
    setPosition(emp.position);
    setSelectedLocationId(
      emp.workLocationId ||
        (workLocations.find((w) => w.name === emp.workLocationName)?.id || (workLocations[0]?.id || ""))
    );
    setRole(emp.role);
    setDepartment(emp.department);
    setAnnualLeaveQuota(emp.annualLeaveQuota || 12);
    setAvatarUrl(emp.avatarUrl || DEFAULT_AVATAR);
    setFormError(null);
    setModalOpen(true);
  };

  // Automatic department suggestion based on selected jabatan
  const handlePositionChange = (pos: string) => {
    setPosition(pos);
    if (pos === "Kadis") {
      setRole("pimpinan");
      setDepartment("Pimpinan Dinas Pendidikan");
    } else if (pos === "Kabid") {
      setRole("manager");
      setDepartment("Bidang Pembinaan & Manajemen");
    } else if (pos === "Kasubag") {
      setRole("employee");
      setDepartment("Subbagian Umum & Kepegawaian");
    } else if (pos === "Kasi") {
      setRole("employee");
      setDepartment("Seksi Kurikulum & Operasional");
    } else if (pos === "Kepala Sekolah") {
      setRole("employee");
      setDepartment("Satuan Pendidikan");
    } else if (pos === "Guru") {
      setRole("employee");
      setDepartment("Tenaga Pendidik");
    } else if (pos === "Staf") {
      setRole("employee");
      setDepartment("Tata Usaha & Administrasi");
    }
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Nama Pegawai wajib diisi.");
      return;
    }
    if (!email.trim()) {
      setFormError("Email Pegawai wajib diisi.");
      return;
    }

    const matchedLocation = workLocations.find((loc) => loc.id === selectedLocationId);
    const locationName = matchedLocation ? matchedLocation.name : "Dinas Pendidikan";

    const targetEmployee: EmployeeProfile = {
      id: editingId || `emp-${Date.now()}`,
      name: name.trim(),
      nip: nip.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || "+62 812-0000-0000",
      position: position,
      department: department.trim() || "Dinas Pendidikan",
      workLocationId: selectedLocationId || undefined,
      workLocationName: locationName,
      role: role,
      avatarUrl: avatarUrl,
      annualLeaveQuota: Number(annualLeaveQuota) || 12,
      usedLeave: editingId
        ? (employees.find((e) => e.id === editingId)?.usedLeave || 0)
        : 0,
    };

    onSaveEmployee(targetEmployee);
    setModalOpen(false);
    showToast(editingId ? `Data ${targetEmployee.name} berhasil diperbarui!` : `Pegawai ${targetEmployee.name} berhasil ditambahkan!`);
  };

  // Download Data Pegawai (.xlsx)
  const handleDownloadExcel = () => {
    if (employees.length === 0) {
      alert("Belum ada data pegawai untuk diunduh.");
      return;
    }

    const dataRows = employees.map((emp, idx) => ({
      "No": idx + 1,
      "NIP": emp.nip || "-",
      "Nama Pegawai": emp.name,
      "Jabatan": emp.position,
      "Tempat Tugas": emp.workLocationName || "-",
      "Departemen / Bidang": emp.department,
      "Email": emp.email,
      "Nomor HP / WA": emp.phone,
      "Hak Akses Role": emp.role === "pimpinan" ? "Pimpinan" : emp.role === "manager" ? "Admin" : "Pegawai",
      "Sisa Cuti": (emp.annualLeaveQuota || 12) - (emp.usedLeave || 0),
      "Kuota Cuti": emp.annualLeaveQuota || 12,
      "Cuti Terpakai": emp.usedLeave || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");

    worksheet["!cols"] = [
      { wch: 5 },  // No
      { wch: 22 }, // NIP
      { wch: 32 }, // Nama
      { wch: 18 }, // Jabatan
      { wch: 38 }, // Tempat Tugas
      { wch: 28 }, // Dept
      { wch: 28 }, // Email
      { wch: 18 }, // HP
      { wch: 15 }, // Role
      { wch: 12 }, // Sisa
      { wch: 12 }, // Kuota
      { wch: 12 }, // Terpakai
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Data_Pegawai_dan_Tempat_Tugas_${todayStr}.xlsx`);
    showToast("Berkas Excel Data Pegawai berhasil diunduh!");
  };

  // Badge style by jabatan
  const getJabatanBadge = (pos: string) => {
    switch (pos) {
      case "Kadis":
        return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
      case "Kabid":
        return "bg-purple-100 text-purple-900 border-purple-300 font-bold";
      case "Kasubag":
        return "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold";
      case "Kasi":
        return "bg-blue-100 text-blue-900 border-blue-300 font-bold";
      case "Kepala Sekolah":
        return "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
      case "Guru":
        return "bg-teal-100 text-teal-900 border-teal-300 font-bold";
      case "Staf":
      default:
        return "bg-slate-100 text-slate-800 border-slate-300 font-medium";
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    // Filter Jabatan
    if (filterJabatan !== "all" && emp.position !== filterJabatan) return false;

    // Filter Tempat Tugas
    if (filterLocation !== "all") {
      const match =
        emp.workLocationId === filterLocation ||
        emp.workLocationName === filterLocation;
      if (!match) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchNip = (emp.nip || "").toLowerCase().includes(q);
      const matchPos = emp.position.toLowerCase().includes(q);
      const matchLoc = (emp.workLocationName || "").toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      return matchName || matchNip || matchPos || matchLoc || matchEmail;
    }

    return true;
  });

  return (
    <div className="mx-4 my-3 space-y-4 pb-20 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back Button if inside Admin View */}
      {onBack && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Kembali ke Dasbor Admin</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Halaman Pegawai
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {employees.length} Pegawai
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Input identitas, pilihan jabatan (Guru, Kepala Sekolah, Staf, Kasi, Kasubag, Kabid, Kadis), dan pilihan Tempat Tugas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 flex-wrap">
          {onOpenTempatTugas && (
            <button
              type="button"
              onClick={onOpenTempatTugas}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs transition-all border border-indigo-200 shadow-2xs cursor-pointer"
              title="Buka Halaman Tempat Tugas"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ke Tempat Tugas</span>
            </button>
          )}

          <button
            type="button"
            id="btn-download-pegawai"
            onClick={handleDownloadExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            title="Download Data Pegawai & Tempat Tugas (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Download Data Pegawai</span>
          </button>

          <button
            type="button"
            id="btn-tambah-pegawai"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {/* Jabatan Summary Pills */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
          <Briefcase className="w-3 h-3 text-slate-400" />
          <span>Jabatan:</span>
        </span>
        {["all", ...JABATAN_OPTIONS].map((j) => {
          const count = j === "all" ? employees.length : employees.filter((e) => e.position === j).length;
          const label = j === "all" ? "Semua Jabatan" : j;
          const isSelected = filterJabatan === j;

          return (
            <button
              key={j}
              type="button"
              onClick={() => setFilterJabatan(j)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/80"
              }`}
            >
              <span>{label}</span>
              <span className={`ml-1 text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Location Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pegawai, NIP, jabatan, atau tempat tugas..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Filter by Tempat Tugas */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <Building className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent py-1.5 pr-2 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Tempat Tugas</option>
            {workLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee List Table & Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Tempat Tugas</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Cuti</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => {
                const assignedLoc = workLocations.find(
                  (l) => l.id === emp.workLocationId || l.name === emp.workLocationName
                );

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Pegawai Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{emp.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            NIP: {emp.nip || "Belum diisi"}
                          </p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {emp.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan Pill */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border shadow-2xs ${getJabatanBadge(emp.position)}`}>
                        {emp.position === "Guru" ? (
                          <GraduationCap className="w-3 h-3 text-teal-700" />
                        ) : emp.position === "Kadis" || emp.position === "Kabid" ? (
                          <Award className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Briefcase className="w-3 h-3" />
                        )}
                        <span>{emp.position}</span>
                      </span>
                    </td>

                    {/* Tempat Tugas */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-1.5 max-w-[220px]">
                        <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-[11px] block truncate">
                            {emp.workLocationName || (assignedLoc ? assignedLoc.name : "Dinas Pendidikan")}
                          </span>
                          {assignedLoc && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              GPS: {assignedLoc.latitude.toFixed(3)}, {assignedLoc.longitude.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cuti Info */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-center sm:text-left">
                        <span className="font-bold text-emerald-700 text-xs">
                          {(emp.annualLeaveQuota || 12) - (emp.usedLeave || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400"> / {emp.annualLeaveQuota || 12} Hari</span>
                      </div>
                    </td>

                    {/* Aksi Buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Identitas & Tempat Tugas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus pegawai "${emp.name}"?`)) {
                              onDeleteEmployee(emp.id);
                              showToast(`Pegawai "${emp.name}" berhasil dihapus.`);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-600">Tidak ada pegawai yang sesuai filter</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau filter jabatan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Identitas Pegawai */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <UserPlus className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    {editingId ? "Edit Identitas Pegawai" : "Tambah Pegawai Baru"}
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    Lengkapi identitas, jabatan resmi, dan pilih tempat tugas pegawai
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid: Nama & NIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap Pegawai: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Siti Nurhaliza, M.Pd."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP / Nomor Induk Pegawai:
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Contoh: 198003182005012004"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* PILIHAN JABATAN SESUAI REQUEST USER */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <label className="block text-[11px] font-extrabold text-blue-950 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Pilihan Jabatan Pegawai: <span className="text-rose-500">*</span></span>
                </label>
                <p className="text-[10px] text-blue-800">
                  Pilih salah satu jabatan resmi: Guru, Kepala Sekolah, Staf, Kasi, Kasubag, Kabid, Kadis
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {JABATAN_OPTIONS.map((jabatanOption) => {
                    const isSelected = position === jabatanOption;
                    return (
                      <button
                        key={jabatanOption}
                        type="button"
                        onClick={() => handlePositionChange(jabatanOption)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20"
                            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-white/80"
                        }`}
                      >
                        {jabatanOption}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PILIHAN TEMPAT TUGAS DARI HALAMAN TEMPAT TUGAS */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border-2 border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>Pilihan Tempat Tugas Pegawai: <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                    Diambil dari Halaman Tempat Tugas
                  </span>
                </div>
                <p className="text-[10px] text-indigo-800">
                  Tentukan lokasi tugas tempat pegawai wajib melakukan presensi wajah & GPS
                </p>

                <select
                  required
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Tempat Tugas --</option>
                  {workLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.isMainOffice ? "(Kantor Induk Pimpinan)" : ""} - [GPS: {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}]
                    </option>
                  ))}
                </select>

                {/* Info preview selected location */}
                {selectedLocationId && (
                  (() => {
                    const sel = workLocations.find((l) => l.id === selectedLocationId);
                    if (!sel) return null;
                    return (
                      <div className="text-[10px] text-indigo-900 font-medium bg-white/80 p-2 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <span>Alamat: {sel.address || "Belum ada alamat detail"}</span>
                        <span className="font-mono text-purple-700 font-bold">R: {sel.radiusMeters}m</span>
                      </div>
                    );
                  })()
                )}

                {onOpenTempatTugas && (
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        onOpenTempatTugas();
                      }}
                      className="text-[10px] text-indigo-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah / Kelola Lokasi di Halaman Tempat Tugas</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grid: Email & Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Pegawai: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.pegawai@disdik.go.id"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812-3456-7890"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Grid: Departemen & Kuota Cuti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Departemen / Bidang Kerja:
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Tenaga Pendidik / Subbagian TU"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kuota Cuti Tahunan (Hari):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={annualLeaveQuota}
                    onChange={(e) => setAnnualLeaveQuota(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Foto Profil Pegawai */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Foto Profil Pegawai:</span>
                  </label>
                  {avatarUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Foto Terpasang
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-0.5">
                  {/* Preview avatar */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-xs bg-slate-200 flex items-center justify-center">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Foto Pegawai"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Upload button and info */}
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handlePhotoUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingPhoto}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isProcessingPhoto ? "Memproses Foto..." : "Upload Foto Pegawai"}</span>
                    </button>

                    <p className="text-[10px] text-slate-500">
                      Pilih foto wajah resmi pegawai dari komputer atau galeri HP (JPG, PNG, WebP).
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? "Perbarui Pegawai" : "Simpan Pegawai"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
