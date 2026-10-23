import React, { useState } from "react";
import {
  MapPin,
  Building,
  Download,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Crosshair,
  Award,
  CheckCircle2,
  Search,
  Users,
  Navigation,
  Save,
  X,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import * as XLSX from "xlsx";
import { WorkLocation, WorkScheduleConfig, EmployeeProfile } from "../types";

interface TempatTugasViewProps {
  workLocations: WorkLocation[];
  onSaveLocation: (location: WorkLocation) => void;
  onDeleteLocation: (id: string) => void;
  schedule: WorkScheduleConfig;
  employees: EmployeeProfile[];
  onBack?: () => void;
}

export const TempatTugasView: React.FC<TempatTugasViewProps> = ({
  workLocations,
  onSaveLocation,
  onDeleteLocation,
  schedule,
  employees,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [description, setDescription] = useState("");
  const [isMainOffice, setIsMainOffice] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal to add new
  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setAddress("");
    setLatitude("");
    setLongitude("");
    setRadiusMeters(150);
    setDescription("");
    setIsMainOffice(false);
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal to edit existing
  const handleOpenEdit = (loc: WorkLocation) => {
    setEditingId(loc.id);
    setName(loc.name);
    setAddress(loc.address);
    setLatitude(loc.latitude.toString());
    setLongitude(loc.longitude.toString());
    setRadiusMeters(loc.radiusMeters || 150);
    setDescription(loc.description || "");
    setIsMainOffice(Boolean(loc.isMainOffice));
    setFormError(null);
    setModalOpen(true);
  };

  // "Data titik GPS Kantor di ambil dari Input Titik GPS pimpinan"
  const handleApplyPimpinanGps = () => {
    setName(schedule.officeName || "Dinas Pendidikan Kantor Induk");
    setAddress(schedule.officeAddress || "Jl. Jend. Sudirman Kav. 52-53");
    setLatitude(schedule.officeCoordinates.latitude.toString());
    setLongitude(schedule.officeCoordinates.longitude.toString());
    setRadiusMeters(schedule.geofenceRadiusMeters || 200);
    setDescription("Lokasi kantor induk diambil langsung dari input titik GPS Pimpinan");
    setIsMainOffice(true);
    setFormError(null);
    showToast("Berhasil mengambil data nama kantor & titik koordinat GPS dari Pimpinan!");
  };

  // Detect current device GPS
  const handleDetectDeviceGps = () => {
    if (!navigator.geolocation) {
      setFormError("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsDetectingGps(false);
        showToast(`Lokasi GPS saat ini terdeteksi: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setIsDetectingGps(false);
        setFormError("Gagal mendeteksi lokasi GPS. Pastikan izin akses lokasi aktif.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Save handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Nama Tempat Tugas wajib diisi.");
      return;
    }
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setFormError("Titik koordinat Latitude dan Longitude harus berupa angka yang valid.");
      return;
    }

    const existing = workLocations.find((w) => w.id === editingId);
    const newLocation: WorkLocation = {
      id: editingId || `loc-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      latitude: latNum,
      longitude: lngNum,
      radiusMeters: Number(radiusMeters) || 150,
      description: description.trim(),
      isMainOffice: Boolean(isMainOffice),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLocation(newLocation);
    setModalOpen(false);
    showToast(editingId ? "Tempat Tugas berhasil diperbarui!" : "Tempat Tugas baru berhasil ditambahkan!");
  };

  // Download Data Tempat Tugas (Excel .xlsx)
  const handleDownloadExcel = () => {
    if (workLocations.length === 0) {
      alert("Belum ada data tempat tugas untuk diunduh.");
      return;
    }

    const dataRows = workLocations.map((loc, idx) => {
      const assigned = employees.filter(
        (e) => e.workLocationId === loc.id || e.workLocationName === loc.name
      );
      const namesList = assigned.map((e) => `${e.name} (${e.position})`).join("; ") || "-";

      return {
        "No": idx + 1,
        "Nama Tempat Tugas": loc.name,
        "Alamat Tempat Tugas": loc.address || "-",
        "Titik Latitude": loc.latitude,
        "Titik Longitude": loc.longitude,
        "Koordinat GPS": `${loc.latitude}, ${loc.longitude}`,
        "Radius Geofence (Meter)": loc.radiusMeters,
        "Jumlah Pegawai Bertugas": assigned.length,
        "Daftar Pegawai": namesList,
        "Status Kantor": loc.isMainOffice ? "Kantor Induk / Utama" : "Satuan Kerja / Unit",
        "Sumber Titik GPS": loc.isMainOffice ? "Input Titik GPS Pimpinan" : "Koordinat Khusus Satuan Kerja",
        "Tautan Google Maps": `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`,
        "Keterangan": loc.description || "-",
        "Tanggal Update": loc.updatedAt ? new Date(loc.updatedAt).toLocaleDateString("id-ID") : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tempat Tugas & GPS");

    // Auto column widths
    const max_width = dataRows.reduce((w, r) => Math.max(w, r["Nama Tempat Tugas"].length), 20);
    worksheet["!cols"] = [
      { wch: 5 },  // No
      { wch: Math.min(max_width + 5, 45) }, // Nama Tempat Tugas
      { wch: 35 }, // Alamat
      { wch: 15 }, // Lat
      { wch: 15 }, // Lng
      { wch: 25 }, // Koordinat
      { wch: 15 }, // Radius
      { wch: 15 }, // Jml Pegawai
      { wch: 40 }, // Daftar Pegawai
      { wch: 20 }, // Status
      { wch: 30 }, // Sumber GPS
      { wch: 35 }, // Link Maps
      { wch: 25 }, // Keterangan
      { wch: 15 }, // Tanggal
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Data_Tempat_Tugas_dan_Titik_GPS_Kantor_${todayStr}.xlsx`);
    showToast("Berkas Excel Data Tempat Tugas & Titik GPS berhasil diunduh!");
  };

  // Filtered list
  const filteredLocations = workLocations.filter((loc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.address.toLowerCase().includes(q) ||
      loc.latitude.toString().includes(q) ||
      loc.longitude.toString().includes(q)
    );
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
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Halaman Tempat Tugas
              </h2>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                {workLocations.length} Lokasi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola nama tempat tugas, koordinat GPS presensi, dan unduh data koordinat kantor
            </p>
          </div>
        </div>

        {/* Top Actions: Download & Add */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            id="btn-download-tempat-tugas"
            onClick={handleDownloadExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            title="Download Data Tempat & Titik GPS (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Download Data Tempat</span>
          </button>

          <button
            type="button"
            id="btn-tambah-tempat-tugas"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tempat Tugas</span>
          </button>
        </div>
      </div>

      {/* Info Card: Titik GPS Kantor Pimpinan */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/60 to-blue-50 border-2 border-purple-200 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <span>Data Titik GPS Kantor dari Pimpinan</span>
                <span className="text-[9px] bg-purple-200 text-purple-900 font-extrabold px-1.5 py-0.2 rounded">
                  Tersinkron
                </span>
              </h3>
              <p className="text-[11px] text-purple-800">
                Titik GPS resmi yang dimasukkan oleh Pimpinan dapat langsung dijadikan atau disinkronkan ke Tempat Tugas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleOpenAdd();
              setTimeout(() => handleApplyPimpinanGps(), 50);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Gunakan Titik GPS Pimpinan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-2.5 bg-white/80 rounded-xl border border-purple-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-medium">Nama Kantor Pimpinan:</span>
            <span className="font-bold text-slate-900 truncate">{schedule.officeName}</span>
          </div>
          <div className="p-2.5 bg-white/80 rounded-xl border border-purple-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-medium">Koordinat GPS Kantor:</span>
            <span className="font-bold font-mono text-purple-900">
              {schedule.officeCoordinates.latitude.toFixed(6)}, {schedule.officeCoordinates.longitude.toFixed(6)}
            </span>
          </div>
          <div className="p-2.5 bg-white/80 rounded-xl border border-purple-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-medium">Radius Geofence:</span>
            <span className="font-bold text-emerald-700">{schedule.geofenceRadiusMeters} Meter</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama tempat tugas, alamat, atau koordinat..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Grid of Work Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredLocations.map((loc) => {
          const assignedEmployees = employees.filter(
            (e) => e.workLocationId === loc.id || e.workLocationName === loc.name
          );

          return (
            <div
              key={loc.id}
              className={`p-4 rounded-3xl bg-white border transition-all hover:shadow-md flex flex-col justify-between space-y-3 ${
                loc.isMainOffice ? "border-purple-300 ring-1 ring-purple-100" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        loc.isMainOffice
                          ? "bg-purple-100 text-purple-800"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{loc.name}</h4>
                        {loc.isMainOffice && (
                          <span className="text-[9px] bg-purple-100 text-purple-900 border border-purple-200 font-extrabold px-1.5 py-0.2 rounded-full">
                            Kantor Induk
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {loc.address || "Belum ada alamat lengkap"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(loc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Tempat Tugas"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus tempat tugas "${loc.name}"?`)) {
                          onDeleteLocation(loc.id);
                          showToast(`Tempat tugas "${loc.name}" berhasil dihapus.`);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Tempat Tugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {loc.description && (
                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {loc.description}
                  </p>
                )}
              </div>

              {/* Coordinates and Employees Count */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-900 font-semibold bg-indigo-50/70 px-2 py-1 rounded-lg">
                    <Navigation className="w-3 h-3 text-indigo-600" />
                    <span>
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    Radius: {loc.radiusMeters}m
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong>{assignedEmployees.length}</strong> Pegawai Bertugas
                    </span>
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                  >
                    <span>Cek Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {filteredLocations.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Building className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Tidak ada tempat tugas yang cocok</h4>
            <p className="text-xs text-slate-400">
              {searchQuery ? "Coba ganti kata kunci pencarian Anda" : "Klik tombol 'Tambah Tempat Tugas' untuk membuat lokasi baru."}
            </p>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit Tempat Tugas */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Building className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    {editingId ? "Edit Tempat Tugas" : "Tambah Tempat Tugas Baru"}
                  </h3>
                  <p className="text-[11px] text-indigo-100">
                    Tentukan nama lokasi kerja dan titik koordinat GPS presensi
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

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action shortcut: Ambil Titik GPS Pimpinan */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-purple-900 text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gunakan Data Input Titik GPS Pimpinan:</span>
                  </p>
                  <p className="text-[10px] text-purple-700">
                    Otomatis menyalin nama kantor & koordinat GPS dari pengaturan pimpinan ({schedule.officeCoordinates.latitude.toFixed(4)}, {schedule.officeCoordinates.longitude.toFixed(4)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyPimpinanGps}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer shrink-0"
                >
                  Salin GPS Pimpinan
                </button>
              </div>

              {/* Nama Tempat Tugas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Tempat Tugas: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Dinas Pendidikan Kabupaten/Kota atau SMP Negeri 1"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-2xs"
                />
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Lengkap Tempat Tugas:
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Pendidikan No. 123, Kelurahan, Kecamatan..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800 shadow-2xs"
                />
              </div>

              {/* Titik Koordinat GPS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Titik Koordinat GPS: <span className="text-rose-500">*</span></span>
                  </label>

                  <button
                    type="button"
                    onClick={handleDetectDeviceGps}
                    disabled={isDetectingGps}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer disabled:opacity-50"
                  >
                    <Crosshair className={`w-3 h-3 ${isDetectingGps ? "animate-spin" : ""}`} />
                    <span>{isDetectingGps ? "Mendeteksi..." : "Ambil GPS Saya"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Latitude (Lintang):
                    </label>
                    <input
                      type="text"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="-6.224168"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Longitude (Bujur):
                    </label>
                    <input
                      type="text"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="106.809675"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude)) && (
                  <div className="flex justify-end pt-0.5">
                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      <span>Lihat di Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Radius Geofence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Radius Geofence Absensi:
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {radiusMeters} Meter
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="1000"
                  step="10"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>30m</span>
                  <span>150m</span>
                  <span>300m</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Keterangan / Deskripsi Unit:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Unit Satuan Pendidikan Wilayah Selatan"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Checkbox: Jadikan Kantor Induk */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMainOffice}
                  onChange={(e) => setIsMainOffice(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Tandai sebagai <strong>Kantor Induk / Tempat Tugas Utama</strong>
                </span>
              </label>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? "Perbarui Tempat Tugas" : "Simpan Tempat Tugas"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
