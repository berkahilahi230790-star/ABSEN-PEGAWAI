import React, { useState } from "react";
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
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  schedule,
  onSaveSchedule,
  branding,
  onSaveBranding,
  employees,
  onUpdateEmployeeQuota,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"schedule" | "gps" | "leave" | "branding">("schedule");

  // Local state for Schedule
  const [workConfig, setWorkConfig] = useState<WorkScheduleConfig>({ ...schedule });

  // Local state for Branding
  const [brandConfig, setBrandConfig] = useState<CompanyBranding>({ ...branding });

  // Banner editor state
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerBadge, setNewBannerBadge] = useState("Info Kantor");
  const [newBannerImg, setNewBannerImg] = useState("");

  const [saveToast, setSaveToast] = useState(false);

  // Logo preset list
  const logoPresets = [
    { name: "Tech Blue", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80" },
    { name: "Modern Retail", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&auto=format&fit=crop&q=80" },
    { name: "Corporate Hub", url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&auto=format&fit=crop&q=80" },
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

  // Add Banner
  const handleAddBanner = () => {
    if (!newBannerTitle.trim()) return;
    const newBanner: BannerInfo = {
      id: `b-${Date.now()}`,
      title: newBannerTitle,
      subtitle: newBannerSubtitle || "Informasi pengumuman penting perusahaan",
      badge: newBannerBadge || "Pengumuman",
      imageUrl:
        newBannerImg ||
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80",
      active: true,
      ctaText: "Lihat",
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

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBrandConfig({ ...brandConfig, logoUrl: url });
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
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs">
              Banner Informasi / Promosi Dashboard ({brandConfig.banners.length})
            </h4>

            {/* Add New Banner Form */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-[11px]">
              <span className="font-bold text-slate-700 block">Tambah Informasi Banner Baru</span>
              <input
                type="text"
                placeholder="Judul Banner (misal: Disiplin Presensi Berhadiah)"
                value={newBannerTitle}
                onChange={(e) => setNewBannerTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Sub-judul / Penjelasan ringkas..."
                value={newBannerSubtitle}
                onChange={(e) => setNewBannerSubtitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Label Badge (misal: Reward)"
                  value={newBannerBadge}
                  onChange={(e) => setNewBannerBadge(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="URL Foto Banner (opsional)"
                  value={newBannerImg}
                  onChange={(e) => setNewBannerImg(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={handleAddBanner}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 active:scale-95 transition-all text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Banner ke Dashboard</span>
              </button>
            </div>

            {/* List of current banners */}
            <div className="space-y-2">
              {brandConfig.banners.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="w-12 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 text-[11px] block truncate">
                        {b.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">{b.subtitle}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBanner(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Hapus banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveBranding}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Terapkan Seluruh Branding & Tema</span>
          </button>
        </div>
      )}
    </div>
  );
};
