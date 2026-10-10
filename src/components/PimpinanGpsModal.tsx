import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building,
  Navigation,
  Save,
  X,
  Check,
  ExternalLink,
  Crosshair,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { WorkScheduleConfig, Coordinates } from "../types";

interface PimpinanGpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: WorkScheduleConfig;
  onSaveSchedule: (newSchedule: WorkScheduleConfig) => void;
}

export const PimpinanGpsModal: React.FC<PimpinanGpsModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSaveSchedule,
}) => {
  const [officeName, setOfficeName] = useState(schedule.officeName);
  const [officeAddress, setOfficeAddress] = useState(schedule.officeAddress);
  const [latitude, setLatitude] = useState(schedule.officeCoordinates.latitude.toString());
  const [longitude, setLongitude] = useState(schedule.officeCoordinates.longitude.toString());
  const [radiusMeters, setRadiusMeters] = useState(schedule.geofenceRadiusMeters);

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectionSuccess, setDetectionSuccess] = useState<string | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOfficeName(schedule.officeName);
      setOfficeAddress(schedule.officeAddress);
      setLatitude(schedule.officeCoordinates.latitude.toString());
      setLongitude(schedule.officeCoordinates.longitude.toString());
      setRadiusMeters(schedule.geofenceRadiusMeters);
      setDetectionSuccess(null);
      setDetectionError(null);
      setIsSaved(false);
    }
  }, [isOpen, schedule]);

  if (!isOpen) return null;

  // Handle GPS detection using device's real location
  const handleDetectCurrentLocation = () => {
    setIsDetectingLocation(true);
    setDetectionError(null);
    setDetectionSuccess(null);

    if (!navigator.geolocation) {
      setDetectionError("Peramban Anda tidak mendukung deteksi geolokasi.");
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 10);

        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setDetectionSuccess(`Berhasil mengambil lokasi GPS saat ini! (Akurasi: ±${acc}m)`);
        setIsDetectingLocation(false);
      },
      (err) => {
        console.warn("Geolocation detection error:", err);
        let msg = "Gagal mendeteksi lokasi saat ini. Pastikan izin GPS aktif.";
        if (err.code === 1) msg = "Izin akses lokasi ditolak oleh browser.";
        if (err.code === 2) msg = "Sinyal GPS tidak tersedia atau lemah.";
        if (err.code === 3) msg = "Waktu permintaan GPS habis.";
        setDetectionError(msg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setDetectionError("Harap masukkan angka koordinat Latitude dan Longitude yang valid.");
      return;
    }

    const updatedCoordinates: Coordinates = {
      latitude: latNum,
      longitude: lngNum,
      accuracy: 10,
    };

    const updatedSchedule: WorkScheduleConfig = {
      ...schedule,
      officeName: officeName.trim() || "Kantor Pusat",
      officeAddress: officeAddress.trim() || "Alamat Kantor",
      officeCoordinates: updatedCoordinates,
      geofenceRadiusMeters: Number(radiusMeters) || 150,
    };

    onSaveSchedule(updatedSchedule);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const currentLatNum = parseFloat(latitude);
  const currentLngNum = parseFloat(longitude);
  const isValidCoords = !isNaN(currentLatNum) && !isNaN(currentLngNum);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
              <MapPin className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold">Input Titik GPS & Nama Kantor</h3>
                <span className="text-[10px] bg-purple-900/80 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold">
                  Pimpinan
                </span>
              </div>
              <p className="text-[11px] text-purple-100">
                Atur lokasi kantor resmi untuk validasi radius absensi geofence pegawai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Quick Notice */}
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80 flex items-start gap-2 text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-[11px]">Kewenangan Khusus Pimpinan:</p>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                Anda dapat langsung mengubah nama kantor dan menetapkan titik koordinat GPS presensi. Pegawai hanya dapat melakukan presensi dalam radius yang Anda tetapkan.
              </p>
            </div>
          </div>

          {/* Form: Nama & Alamat Kantor */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-purple-600" />
                <span>Nama Kantor / Lokasi Kerja:</span>
              </label>
              <input
                type="text"
                id="input-pimpinan-office-name"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Misal: Kantor Pusat Jakarta - Gedung Mandiri Lt. 12"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Alamat Lengkap Kantor:
              </label>
              <textarea
                id="input-pimpinan-office-address"
                rows={2}
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Form: Titik Koordinat GPS */}
          <div className="space-y-3 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-4 rounded-2xl border-2 border-indigo-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                <span>Titik Koordinat GPS Kantor:</span>
              </label>

              {/* Button: Ambil GPS Saat Ini */}
              <button
                type="button"
                id="btn-detect-gps-now"
                onClick={handleDetectCurrentLocation}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all disabled:opacity-50"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isDetectingLocation ? "animate-spin" : ""}`} />
                <span>{isDetectingLocation ? "Mendeteksi..." : "Ambil Titik GPS Saya Saat Ini"}</span>
              </button>
            </div>

            {/* Notification detection feedback */}
            {detectionSuccess && (
              <div className="p-2.5 bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{detectionSuccess}</span>
              </div>
            )}
            {detectionError && (
              <div className="p-2.5 bg-rose-100/90 text-rose-900 border border-rose-300 rounded-xl text-[11px] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{detectionError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Latitude (Lintang):
                </label>
                <input
                  type="text"
                  id="input-pimpinan-latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-6.224168"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Longitude (Bujur):
                </label>
                <input
                  type="text"
                  id="input-pimpinan-longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="106.809675"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* External Google Maps Preview Link */}
            {isValidCoords && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Koordinat: {currentLatNum.toFixed(5)}, {currentLngNum.toFixed(5)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${currentLatNum},${currentLngNum}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                >
                  <span>Cek Posisi di Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Form: Radius Geofence */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800">
                Radius Geofence Presensi:
              </label>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                {radiusMeters} Meter
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Jarak maksimal pegawai dari titik koordinat kantor agar presensi dinyatakan valid (dalam radius).
            </p>
            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20m</span>
              <span>100m</span>
              <span>250m</span>
              <span>500m</span>
              <span>1000m</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-save-gps-pimpinan"
            onClick={handleSave}
            disabled={isSaved}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 rounded-xl shadow-md shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Berhasil Disimpan ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Titik GPS & Kantor</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
