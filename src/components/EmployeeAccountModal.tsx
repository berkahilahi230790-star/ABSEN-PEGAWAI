import React, { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  UserCog,
  Camera,
  KeyRound,
  IdCard,
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Copy,
  Check,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Calendar,
  Save,
} from "lucide-react";
import { EmployeeProfile, WorkScheduleConfig } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface EmployeeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile;
  schedule: WorkScheduleConfig;
  onUpdateProfile: (updated: EmployeeProfile) => void;
  initialTab?: "identity" | "photo" | "password";
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
];

export const EmployeeAccountModal: React.FC<EmployeeAccountModalProps> = ({
  isOpen,
  onClose,
  employee,
  schedule,
  onUpdateProfile,
  initialTab = "identity",
}) => {
  const [activeTab, setActiveTab] = useState<"identity" | "photo" | "password">(initialTab);

  // Form states for Tab 1: Edit Identitas
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [phone, setPhone] = useState(employee.phone);
  const [address, setAddress] = useState("Jl. Jenderal Sudirman Kav. 52-53, Jakarta");
  const [identitySaved, setIdentitySaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form states for Tab 2: Upload Foto
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [photoSaved, setPhotoSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Tab 3: Ubah Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setName(employee.name);
      setEmail(employee.email);
      setPhone(employee.phone);
      setSelectedPhoto(null);
      setIdentitySaved(false);
      setPhotoSaved(false);
      setPwdSaved(false);
      setPwdError("");
    }
  }, [isOpen, initialTab, employee]);

  if (!isOpen) return null;

  // --- Handlers Tab 1: Identitas ---
  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: EmployeeProfile = {
      ...employee,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    onUpdateProfile(updated);
    setIdentitySaved(true);
    audioNotificationService.playChime("normal");
    setTimeout(() => setIdentitySaved(false), 2500);
  };

  const handleCopyNip = () => {
    navigator.clipboard.writeText(employee.id.toUpperCase());
    setCopiedId(true);
    audioNotificationService.playChime("normal");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // --- Handlers Tab 2: Foto ---
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file format gambar (JPG, PNG, atau WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedPhoto(reader.result);
      }
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

  const handleSavePhoto = () => {
    if (!selectedPhoto) return;
    const updated: EmployeeProfile = {
      ...employee,
      avatarUrl: selectedPhoto,
    };
    onUpdateProfile(updated);
    setPhotoSaved(true);
    audioNotificationService.playChime("normal");
    setTimeout(() => {
      setPhotoSaved(false);
      setSelectedPhoto(null);
    }, 2000);
  };

  // --- Handlers Tab 3: Password ---
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const pwdStrength = getPasswordStrength(newPassword);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSaved(false);

    if (!currentPassword) {
      setPwdError("Harap masukkan kata sandi saat ini.");
      audioNotificationService.playChime("warning");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("Kata sandi baru minimal 6 karakter.");
      audioNotificationService.playChime("warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Konfirmasi kata sandi baru tidak cocok.");
      audioNotificationService.playChime("warning");
      return;
    }
    if (newPassword === currentPassword) {
      setPwdError("Kata sandi baru tidak boleh sama dengan kata sandi lama.");
      audioNotificationService.playChime("warning");
      return;
    }

    setIsSubmittingPwd(true);
    setTimeout(() => {
      try {
        localStorage.setItem(`presensigo_pwd_updated_${employee.id}`, new Date().toISOString());
      } catch (err) {}
      setIsSubmittingPwd(false);
      setPwdSaved(true);
      audioNotificationService.playChime("normal");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSaved(false), 2500);
    }, 600);
  };

  const remainingLeave = employee.annualLeaveQuota - employee.usedLeave;

  return (
    <div
      id="account-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="account-modal-card"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 flex flex-col max-h-[90vh]"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/80 shadow-md bg-white shrink-0">
                <img
                  src={employee.avatarUrl}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold leading-tight truncate">{employee.name}</h3>
                  <span className="shrink-0 text-[10px] bg-emerald-500/90 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-blue-200 truncate mt-0.5">{employee.position} • {employee.department}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md font-mono tracking-wider font-semibold">
                    NIP: {employee.id.toUpperCase()}
                  </span>
                  <button
                    onClick={handleCopyNip}
                    className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    title="Salin NIP"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              id="close-account-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Segment Control */}
        <div className="bg-slate-100/90 p-1.5 border-b border-slate-200 shrink-0 grid grid-cols-3 gap-1">
          <button
            id="tab-btn-edit-identity"
            onClick={() => setActiveTab("identity")}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "identity"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            <span className="truncate">Edit Identitas</span>
          </button>

          <button
            id="tab-btn-upload-photo"
            onClick={() => setActiveTab("photo")}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "photo"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">Upload Foto</span>
          </button>

          <button
            id="tab-btn-change-password"
            onClick={() => setActiveTab("password")}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "password"
                ? "bg-white text-amber-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="truncate">Ubah Password</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* ======================================================== */}
          {/* TAB 1: EDIT IDENTITAS */}
          {/* ======================================================== */}
          {activeTab === "identity" && (
            <form onSubmit={handleSaveIdentity} className="space-y-3.5">
              {identitySaved && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Identitas pegawai berhasil diperbarui dan disimpan!</span>
                </div>
              )}

              {/* Form Input: Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Nama Lengkap Pegawai</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-employee-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nama Lengkap..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Form Input: Email Kantor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Email Resmi Kantor</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-employee-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@perusahaan.co.id"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Form Input: Nomor WhatsApp / Telepon */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Nomor WhatsApp / Telepon</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-employee-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Form Input: Alamat Domisili */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Alamat Domisili</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="input-employee-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat domisili saat ini..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Read-Only Info Box (Departemen & Kantor & Cuti) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-[11px] text-slate-500">Jabatan & Departemen:</span>
                  <span className="font-bold text-slate-800">{employee.position} ({employee.department})</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-[11px] text-slate-500">Kantor Penugasan:</span>
                  <span className="font-bold text-slate-800">{schedule.officeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Sisa Hak Cuti:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {remainingLeave} dari {employee.annualLeaveQuota} Hari
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  id="submit-save-identity-btn"
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Identitas</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: INPUT UPLOAD FOTO */}
          {/* ======================================================== */}
          {activeTab === "photo" && (
            <div className="space-y-4">
              {photoSaved && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Foto profil berhasil diperbarui di seluruh aplikasi!</span>
                </div>
              )}

              {/* Side by Side Preview */}
              <div className="flex items-center justify-center gap-5 py-1">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs bg-slate-100 mx-auto">
                    <img
                      src={employee.avatarUrl}
                      alt={employee.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1">Foto Saat Ini</span>
                </div>

                <div className="text-slate-300 font-bold text-sm">➔</div>

                <div className="text-center">
                  <div
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-sm mx-auto flex items-center justify-center ${
                      selectedPhoto
                        ? "border-emerald-500 bg-white ring-4 ring-emerald-100"
                        : "border-dashed border-slate-300 bg-slate-50"
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
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                    {selectedPhoto ? "Pratinjau Baru" : "Pilih Foto"}
                  </span>
                </div>
              </div>

              {/* Drag & Drop or Click Area */}
              <div
                id="account-photo-dropzone"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]"
                    : "border-slate-300 hover:border-emerald-400 bg-slate-50/70 hover:bg-slate-50"
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
                  Tarik & Lepas foto ke sini, atau <span className="text-emerald-600 underline">Pilih Berkas</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format didukung: JPG, PNG, atau WebP (Maks. 5 MB)
                </p>
              </div>

              {/* Preset Avatars Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Atau Pilih Karakter Avatar Cepat:</span>
                  {selectedPhoto && (
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      className="text-[10px] text-rose-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhoto(url)}
                      className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-95 cursor-pointer ${
                        selectedPhoto === url
                          ? "border-emerald-600 ring-2 ring-emerald-300 scale-105"
                          : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Photo Button */}
              <div className="pt-2">
                <button
                  id="submit-save-photo-btn"
                  type="button"
                  disabled={!selectedPhoto}
                  onClick={handleSavePhoto}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                    selectedPhoto
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 active:scale-98 cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terapkan Foto Profil Baru</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: FITUR UBAH PASSWORD */}
          {/* ======================================================== */}
          {activeTab === "password" && (
            <form onSubmit={handleSavePassword} className="space-y-3.5">
              {pwdError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSaved && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kata sandi Anda berhasil diperbarui dengan aman!</span>
                </div>
              )}

              {/* Current Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="account-input-current-pwd"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama..."
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Kata Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="account-input-new-pwd"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="pt-1 space-y-1">
                    <div className="flex gap-1 h-1.5">
                      <div className={`flex-1 rounded-full ${pwdStrength >= 1 ? "bg-rose-500" : "bg-slate-200"}`} />
                      <div className={`flex-1 rounded-full ${pwdStrength >= 2 ? "bg-amber-500" : "bg-slate-200"}`} />
                      <div className={`flex-1 rounded-full ${pwdStrength >= 3 ? "bg-blue-500" : "bg-slate-200"}`} />
                      <div className={`flex-1 rounded-full ${pwdStrength >= 4 ? "bg-emerald-500" : "bg-slate-200"}`} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Kekuatan Kata Sandi:</span>
                      <span className="font-semibold">
                        {pwdStrength <= 1 && "Lemah"}
                        {pwdStrength === 2 && "Cukup"}
                        {pwdStrength === 3 && "Baik"}
                        {pwdStrength >= 4 && "Sangat Kuat"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="account-input-confirm-pwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="submit-save-password-btn"
                  type="submit"
                  disabled={isSubmittingPwd}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmittingPwd ? "Memproses..." : "Simpan Kata Sandi"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
