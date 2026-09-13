import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  MapPin,
  Palette,
  Users,
  Image,
  Save,
  Plus,
  Trash2,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Bell,
  Sliders,
  Shield,
  Layers,
  FileImage,
  X,
  Check,
  Eye,
  Camera,
} from "lucide-react";
import { BannerInfo, CompanyBranding, EmployeeProfile, WorkScheduleConfig } from "../types";
import { audioNotificationService } from "../services/audioNotification";

interface AdminSettingsProps {
  schedule: WorkScheduleConfig;
  onSaveSchedule: (config: WorkScheduleConfig) => void;
  branding: CompanyBranding;
  onSaveBranding: (branding: CompanyBranding) => void;
  employees: EmployeeProfile[];
  onUpdateEmployeeQuota: (employeeId: string, newQuota: number) => void;
  initialSubTab?: "schedule" | "gps" | "leave" | "branding";
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  schedule,
  onSaveSchedule,
  branding,
  onSaveBranding,
  employees,
  onUpdateEmployeeQuota,
  initialSubTab = "schedule",
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"schedule" | "gps" | "leave" | "branding">(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Local state for Schedule
  const [workConfig, setWorkConfig] = useState<WorkScheduleConfig>({ ...schedule });

  // Local state for Branding
  const [brandConfig, setBrandConfig] = useState<CompanyBranding>({ ...branding });

  // Banner editor state
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerBadge, setNewBannerBadge] = useState("Info Kantor");
  const [newBannerImg, setNewBannerImg] = useState("");
  const [newBannerCta, setNewBannerCta] = useState("Lihat");
  const [bannerUploadFileName, setBannerUploadFileName] = useState("");
  const [isBannerDragging, setIsBannerDragging] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [saveToast, setSaveToast] = useState(false);

  // Logo preset list
  const logoPresets = [
    { name: "Tech Blue", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80" },
    { name: "Modern Retail", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80" },
    { name: "Corporate Hub", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80" },
  ];

  // Curated Banner Presets
  const bannerPresets = [
    {
      title: "Disiplin Presensi & Apel Pagi",
      subtitle: "Presensi tepat waktu sebelum jam 08.00 untuk mendapatkan poin kinerja",
      badge: "Disiplin",
      url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80",
    },
    {
      title: "Pemberitahuan Cuti Bersama & Libur",
      subtitle: "Pengajuan cuti dapat dilakukan melalui aplikasi minimal H-3 sebelum libur",
      badge: "Info Cuti",
      url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
    },
    {
      title: "Apresiasi Pegawai Terbaik Bulan Ini",
      subtitle: "Selamat kepada pegawai dengan rekor kehadiran 100% tanpa terlambat",
      badge: "Penghargaan",
      url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&auto=format&fit=crop&q=80",
    },
    {
      title: "Gathering & Rapat Evaluasi Kinerja",
      subtitle: "Seluruh divisi dimohon hadir tepat waktu di ruang pertemuan utama",
      badge: "Acara Kantor",
      url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&auto=format&fit=crop&q=80",
    },
  ];

  // Save Schedule settings
  const handleSaveSchedule = () => {
    onSaveSchedule(workConfig);
    showSuccess();
  };

  // Save Branding settings
  const handleSaveBranding = () => {
    onSaveBranding(brandConfig);
    showSuccess();
  };

  const showSuccess = () => {
    setSaveToast(true);
    audioNotificationService.playChime("success");
    setTimeout(() => setSaveToast(false), 3000);
  };

  // GPS Device current location
  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkConfig({
            ...workConfig,
            officeCoordinates: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
            },
          });
          audioNotificationService.playChime("success");
        },
        () => {
          alert("Gagal mendeteksi lokasi GPS perangkat Anda saat ini.");
        }
      );
    }
  };

  // Process Banner File Upload
  const processBannerFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap unggah file gambar yang valid (JPG, PNG, WebP, SVG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewBannerImg(reader.result);
        setBannerUploadFileName(file.name);
        audioNotificationService.playChime("normal");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBannerFile(file);
    }
  };

  const handleClearBannerImage = () => {
    setNewBannerImg("");
    setBannerUploadFileName("");
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
  };

  // Update existing banner image upload
  const handleUpdateExistingBannerImage = (bannerId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Harap unggah file gambar yang valid (JPG, PNG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const updated = {
          ...brandConfig,
          banners: brandConfig.banners.map((b) =>
            b.id === bannerId ? { ...b, imageUrl: reader.result as string } : b
          ),
        };
        setBrandConfig(updated);
        onSaveBranding(updated);
        showSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle existing banner active state
  const handleToggleBannerActive = (bannerId: string) => {
    const updated = {
      ...brandConfig,
      banners: brandConfig.banners.map((b) =>
        b.id === bannerId ? { ...b, active: !b.active } : b
      ),
    };
    setBrandConfig(updated);
    onSaveBranding(updated);
  };

  // Add Banner
  const handleAddBanner = () => {
    if (!newBannerTitle.trim()) {
      alert("Silakan masukkan judul banner terlebih dahulu.");
      return;
    }
    const newBanner: BannerInfo = {
      id: `b-${Date.now()}`,
      title: newBannerTitle.trim(),
      subtitle: newBannerSubtitle.trim() || "Informasi pengumuman penting perusahaan",
      badge: newBannerBadge.trim() || "Pengumuman",
      imageUrl:
        newBannerImg.trim() ||
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80",
      active: true,
      ctaText: newBannerCta.trim() || "Lihat",
    };
    const updated = {
      ...brandConfig,
      banners: [newBanner, ...brandConfig.banners],
    };
    setBrandConfig(updated);
    onSaveBranding(updated);
    setNewBannerTitle("");
    setNewBannerSubtitle("");
    setNewBannerImg("");
    setNewBannerBadge("Info Kantor");
    setNewBannerCta("Lihat");
    setBannerUploadFileName("");
    if (bannerFileInputRef.current) {
      bannerFileInputRef.current.value = "";
    }
    showSuccess();
  };

  // Remove Banner
  const handleRemoveBanner = (id: string) => {
    const updated = {
      ...brandConfig,
      banners: brandConfig.banners.filter((b) => b.id !== id),
    };
    setBrandConfig(updated);
    onSaveBranding(updated);
  };

  // Handle Logo Upload with FileReader (Persists in localStorage)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Harap pilih file gambar logo (JPG, PNG, WebP, SVG).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const updated = { ...brandConfig, logoUrl: reader.result };
          setBrandConfig(updated);
          onSaveBranding(updated);
          showSuccess();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-4 my-3 space-y-3.5 pb-20">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Pengaturan berhasil disimpan & diterapkan!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pengaturan Perusahaan & Admin</h2>
            <p className="text-[11px] text-slate-500">
              Kelola jam absen fleksibel, GPS kantor, hak cuti, & kustomisasi tema
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveSubTab("schedule")}
          className={`py-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeSubTab === "schedule"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[10px]">Jam Kerja</span>
        </button>
        <button
          onClick={() => setActiveSubTab("gps")}
          className={`py-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeSubTab === "gps"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-[10px]">Radius GPS</span>
        </button>
        <button
          onClick={() => setActiveSubTab("leave")}
          className={`py-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeSubTab === "leave"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="text-[10px]">Kelola Cuti</span>
        </button>
        <button
          onClick={() => setActiveSubTab("branding")}
          className={`py-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeSubTab === "branding"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="text-[10px]">Branding</span>
        </button>
      </div>

      {/* Tab 1: Jam Kerja Fleksibel */}
      {activeSubTab === "schedule" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Kebijakan Jam Absen Masuk & Pulang Fleksibel</h3>
            <p className="text-[11px] text-slate-500">
              Atur waktu kehadiran kantor yang fleksibel dan toleransi keterlambatan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jam Masuk Kantor Standar
              </label>
              <input
                type="time"
                value={workConfig.checkInTime}
                onChange={(e) => setWorkConfig({ ...workConfig, checkInTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jam Pulang Kantor Standar
              </label>
              <input
                type="time"
                value={workConfig.checkOutTime}
                onChange={(e) => setWorkConfig({ ...workConfig, checkOutTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Batas Toleransi Keterlambatan (Menit)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="120"
                value={workConfig.lateToleranceMinutes}
                onChange={(e) =>
                  setWorkConfig({
                    ...workConfig,
                    lateToleranceMinutes: parseInt(e.target.value) || 0,
                  })
                }
                className="w-32 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold text-sm"
              />
              <span className="text-[11px] text-slate-600">
                Batas status terlambat mulai pukul:{" "}
                <strong className="text-blue-700 font-extrabold">
                  {(() => {
                    const [h, m] = workConfig.checkInTime.split(":").map(Number);
                    const dt = new Date();
                    dt.setHours(h, m + workConfig.lateToleranceMinutes);
                    return dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  })()}{" "}
                  WIB
                </strong>
              </span>
            </div>
          </div>

          {/* AI Voice reminder toggles */}
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Sistem Notifikasi Suara AI Push</span>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={workConfig.enableAiVoiceReminder}
                onChange={(e) =>
                  setWorkConfig({ ...workConfig, enableAiVoiceReminder: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-[11px] text-slate-700">
                Aktifkan pengingat jadwal absen harian secara otomatis
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={workConfig.enableFiveMinWarning}
                onChange={(e) =>
                  setWorkConfig({ ...workConfig, enableFiveMinWarning: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-[11px] text-slate-700">
                Peringatan suara darurat 5 menit sebelum batas terlambat bagi staf yang belum check-in
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveSchedule}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Waktu</span>
          </button>
        </div>
      )}

      {/* Tab 2: GPS Kantor & Geofencing */}
      {activeSubTab === "gps" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Pengaturan Lokasi GPS & Geofencing</h3>
            <p className="text-[11px] text-slate-500">
              Validasi batas jarak kehadiran pegawai menggunakan koordinat kantor
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Kantor / Gedung</label>
            <input
              type="text"
              value={workConfig.officeName}
              onChange={(e) => setWorkConfig({ ...workConfig, officeName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={workConfig.officeAddress}
              onChange={(e) => setWorkConfig({ ...workConfig, officeAddress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={workConfig.officeCoordinates.latitude}
                onChange={(e) =>
                  setWorkConfig({
                    ...workConfig,
                    officeCoordinates: {
                      ...workConfig.officeCoordinates,
                      latitude: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={workConfig.officeCoordinates.longitude}
                onChange={(e) =>
                  setWorkConfig({
                    ...workConfig,
                    officeCoordinates: {
                      ...workConfig.officeCoordinates,
                      longitude: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Radius Toleransi Geofence (Meter)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="20"
                max="5000"
                value={workConfig.geofenceRadiusMeters}
                onChange={(e) =>
                  setWorkConfig({
                    ...workConfig,
                    geofenceRadiusMeters: parseInt(e.target.value) || 100,
                  })
                }
                className="w-32 px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold"
              />
              <span className="text-[11px] text-slate-500">
                Pegawai wajib berada di dalam jarak ini saat absen
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleUseCurrentLocation}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 active:scale-95 transition-all text-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Gunakan Posisi Saya Saat Ini</span>
            </button>
            <button
              onClick={handleSaveSchedule}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Radius GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Kelola Data Cuti & Perizinan */}
      {activeSubTab === "leave" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Pengelolaan Hak Cuti & Perizinan Pegawai</h3>
            <p className="text-[11px] text-slate-500">
              Kelola saldo kuota cuti tahunan dan data izin setiap staf secara terintegrasi
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const remaining = emp.annualLeaveQuota - emp.usedLeave;
              return (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={emp.avatarUrl}
                      alt={emp.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{emp.name}</span>
                      <span className="text-[10px] text-slate-500 block">
                        {emp.position} • {emp.department}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Sisa Cuti:</span>
                      <span className="font-extrabold text-blue-700 text-xs">{remaining} Hari</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() =>
                          onUpdateEmployeeQuota(emp.id, Math.max(emp.annualLeaveQuota - 1, 0))
                        }
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                        title="Kurangi kuota tahunan"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{emp.annualLeaveQuota}</span>
                      <button
                        onClick={() => onUpdateEmployeeQuota(emp.id, emp.annualLeaveQuota + 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95"
                        title="Tambah kuota tahunan"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Kustomisasi Branding & Banner Toko Online Modern */}
      {activeSubTab === "branding" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">Kustomisasi Branding & Tampilan Aplikasi</h3>
            <p className="text-[11px] text-slate-500">
              Atur logo perusahaan, gradasi warna tema modern, dan informasi banner dashboard
            </p>
          </div>

          {/* Company Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Perusahaan</label>
              <input
                type="text"
                value={brandConfig.companyName}
                onChange={(e) => setBrandConfig({ ...brandConfig, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={brandConfig.tagline}
                onChange={(e) => setBrandConfig({ ...brandConfig, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Logo Perusahaan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Logo Perusahaan (Upload / Pilih Preset)
            </label>
            <div className="flex items-center gap-3">
              <img
                src={brandConfig.logoUrl}
                alt="Logo Preview"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200 flex items-center gap-1 active:scale-95 transition-all">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Foto Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Preset:</span>
                  {logoPresets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBrandConfig({ ...brandConfig, logoUrl: p.url })}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Color Themes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Warna Tema Aplikasi (Gaya Toko Online Modern)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "blue-gradient", name: "Gradasi Biru Modern", gradient: "from-blue-600 to-indigo-600" },
                { id: "ocean-cyan", name: "Ocean Cyan Glass", gradient: "from-cyan-600 to-blue-600" },
                { id: "royal-indigo", name: "Royal Indigo", gradient: "from-indigo-600 to-violet-600" },
                { id: "emerald-fresh", name: "Emerald Disiplin", gradient: "from-teal-600 to-emerald-600" },
                { id: "sunset-amber", name: "Sunset Amber", gradient: "from-blue-600 to-amber-600" },
              ].map((thm) => {
                const isSelected = brandConfig.themePreset === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() =>
                      setBrandConfig({
                        ...brandConfig,
                        themePreset: thm.id as CompanyBranding["themePreset"],
                      })
                    }
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-400/40 bg-blue-50/50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${thm.gradient} shrink-0`} />
                    <span className="font-semibold text-[11px] truncate">{thm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Banner Management */}
          <div className="pt-3 border-t border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-blue-600" />
                  <span>Banner Promosi & Pengumuman Dashboard</span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Unggah gambar banner promosi, pengumuman kantor, atau agenda pegawai untuk slider dashboard
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                {brandConfig.banners.length} Banner
              </span>
            </div>

            {/* Form Tambah Banner Baru */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tambah Banner Baru</span>
                </span>
                {newBannerImg && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Gambar Terpasang</span>
                  </span>
                )}
              </div>

              {/* INPUT UPLOAD GAMBAR BANNER */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Upload Gambar Banner <span className="text-rose-500">*</span>
                </label>

                {/* Hidden File Input */}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileUpload}
                  className="hidden"
                  id="banner-file-input"
                />

                {/* Kondisi 1: Gambar sudah dipilih/diunggah -> Tampilkan Preview Visual */}
                {newBannerImg ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-xs">
                    <div className="aspect-[16/6] w-full relative overflow-hidden">
                      <img
                        src={newBannerImg}
                        alt="Preview Banner"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {/* Gradient Overlay & Preview Text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-3 text-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-blue-600/90 text-[9px] font-bold uppercase tracking-wider">
                            {newBannerBadge || "Pengumuman"}
                          </span>
                          {bannerUploadFileName && (
                            <span className="text-[9px] text-slate-300 truncate max-w-[200px]">
                              File: {bannerUploadFileName}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs line-clamp-1">
                          {newBannerTitle || "Judul Banner Anda"}
                        </h4>
                        <p className="text-[10px] text-slate-200 line-clamp-1">
                          {newBannerSubtitle || "Sub-judul / keterangan singkat banner"}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar Preview */}
                    <div className="p-2 bg-slate-900/95 flex items-center justify-between gap-2 border-t border-slate-800">
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Pratinjau Tampilan Dashboard</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[10px] transition-all flex items-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" />
                          <span>Ganti Gambar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleClearBannerImage}
                          className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[10px] transition-all flex items-center gap-1"
                          title="Hapus gambar terpilih"
                        >
                          <X className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Kondisi 2: Belum ada gambar -> Dropzone Drag-and-Drop & Upload Button */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsBannerDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsBannerDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsBannerDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processBannerFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => bannerFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isBannerDragging
                        ? "border-blue-500 bg-blue-50/80 scale-[1.01]"
                        : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs mb-0.5">
                      Klik untuk Upload Foto Banner
                    </span>
                    <span className="text-[10px] text-slate-500 mb-2 max-w-xs">
                      Tarik & lepas file gambar dari perangkat Anda di sini (JPG, PNG, WebP, SVG)
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-[10px] shadow-xs hover:bg-blue-700 transition-all flex items-center gap-1">
                      <FileImage className="w-3 h-3" />
                      <span>Pilih File Dari Komputer / HP</span>
                    </span>
                  </div>
                )}

                {/* Preset Galeri Gambar Banner Cepat */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Atau pilih dari Preset Gambar Banner:</span>
                    <span className="text-[9px] text-blue-600">(1-Klik Terapkan)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {bannerPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewBannerTitle(preset.title);
                          setNewBannerSubtitle(preset.subtitle);
                          setNewBannerBadge(preset.badge);
                          setNewBannerImg(preset.url);
                          setBannerUploadFileName(`Preset: ${preset.badge}`);
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group flex flex-col gap-1"
                      >
                        <div className="w-full aspect-[16/8] rounded-lg overflow-hidden relative bg-slate-100">
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold">
                            {preset.badge}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 truncate block">
                          {preset.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input URL Alternatif */}
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Atau masukkan tautan URL Gambar eksternal:
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={newBannerImg.startsWith("data:") ? "" : newBannerImg}
                    onChange={(e) => {
                      setNewBannerImg(e.target.value);
                      setBannerUploadFileName("URL Web");
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Input Detail Banner (Judul, Subjudul, Badge, CTA) */}
              <div className="space-y-2 pt-1 border-t border-slate-200/70">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Judul Banner <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Disiplin Presensi & Apel Pagi Hari Ini"
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                    Sub-judul / Penjelasan Ringkas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Seluruh pegawai wajib mengisi presensi sebelum 08.00 WIB"
                    value={newBannerSubtitle}
                    onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Label Badge
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Info, Reward, Penting"
                      value={newBannerBadge}
                      onChange={(e) => setNewBannerBadge(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Teks Tombol Aksi (CTA)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Lihat, Detail, Absen"
                      value={newBannerCta}
                      onChange={(e) => setNewBannerCta(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Banner Baru */}
              <button
                type="button"
                onClick={handleAddBanner}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan Banner ke Slider Dashboard</span>
              </button>
            </div>

            {/* List of current banners */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 text-[11px] block">
                Daftar Banner yang Sedang Aktif ({brandConfig.banners.length})
              </span>

              {brandConfig.banners.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Belum ada banner. Silakan unggah banner baru di atas.
                </div>
              ) : (
                brandConfig.banners.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 group">
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hidden replace input for this banner */}
                        <label
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
                          title="Ganti gambar banner ini"
                        >
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpdateExistingBannerImage(b.id, file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {b.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                              {b.badge}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              b.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {b.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-xs truncate leading-tight">
                          {b.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate">{b.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      {/* Tombol Upload Ganti Gambar */}
                      <label className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                        <UploadCloud className="w-3 h-3 text-blue-600" />
                        <span>Ganti Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpdateExistingBannerImage(b.id, file);
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Tombol Toggle Aktif/Nonaktif */}
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(b.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          b.active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {b.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBanner(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus banner ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleSaveBranding}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Terapkan Seluruh Branding & Banner</span>
          </button>
        </div>
      )}
    </div>
  );
};
