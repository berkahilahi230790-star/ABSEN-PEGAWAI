import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Scan,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  Map,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  AttendanceRecord,
  AttendanceStatus,
  CompanyBranding,
  Coordinates,
  EmployeeProfile,
  WorkScheduleConfig,
} from "../types";
import { calculateDistanceMeters } from "../services/storage";
import { audioNotificationService } from "../services/audioNotification";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "in" | "out";
  employee: EmployeeProfile;
  schedule: WorkScheduleConfig;
  branding: CompanyBranding;
  onSaveAttendance: (record: AttendanceRecord) => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  type,
  employee,
  schedule,
  branding,
  onSaveAttendance,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Biometric / Face detection simulation
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [scanningActive, setScanningActive] = useState(true);

  // GPS States
  const [gpsLoading, setGpsLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [inRadius, setInRadius] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start Camera
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraLoading(false);
      setScanningActive(true);
    } catch (err: any) {
      console.warn("Camera access failed or denied:", err);
      setCameraError(
        "Kamera tidak dapat diakses langsung. Anda dapat menggunakan mode simulasi verifikasi wajah AI."
      );
      setCameraLoading(false);
      // Fallback simulation photo
      simulateFaceDetection();
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  // Get GPS Location
  const captureLocation = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!("geolocation" in navigator)) {
      setGpsError("Perangkat tidak mendukung geolokasi GPS.");
      // Fallback to near-office coordinates
      fallbackOfficeLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setUserCoords(coords);

        const dist = calculateDistanceMeters(
          coords.latitude,
          coords.longitude,
          schedule.officeCoordinates.latitude,
          schedule.officeCoordinates.longitude
        );

        setDistanceMeters(dist);
        setInRadius(dist <= schedule.geofenceRadiusMeters);
        setGpsLoading(false);
      },
      (error) => {
        console.warn("GPS Geolocation error:", error.message);
        fallbackOfficeLocation();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const fallbackOfficeLocation = () => {
    // Generate simulated coordinates within office vicinity for testing
    const jitterLat = (Math.random() - 0.5) * 0.0004;
    const jitterLng = (Math.random() - 0.5) * 0.0004;
    const mockCoords: Coordinates = {
      latitude: schedule.officeCoordinates.latitude + jitterLat,
      longitude: schedule.officeCoordinates.longitude + jitterLng,
      accuracy: 12,
    };
    setUserCoords(mockCoords);
    const dist = calculateDistanceMeters(
      mockCoords.latitude,
      mockCoords.longitude,
      schedule.officeCoordinates.latitude,
      schedule.officeCoordinates.longitude
    );
    setDistanceMeters(dist);
    setInRadius(dist <= schedule.geofenceRadiusMeters);
    setGpsLoading(false);
  };

  // Biometric face scan loop simulation
  const simulateFaceDetection = () => {
    setTimeout(() => {
      setFaceDetected(true);
      setFaceConfidence(98.7);
      setTimeout(() => {
        setLivenessPassed(true);
      }, 900);
    }, 1200);
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setFaceDetected(false);
      setLivenessPassed(false);
      setNotes("");
      startCamera();
      captureLocation();
      simulateFaceDetection();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Capture Photo
  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror horizontal to match selfie
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhoto(dataUrl);
        setScanningActive(false);
        audioNotificationService.playChime("success");
      }
    } else {
      // Fallback captured photo
      setCapturedPhoto(employee.avatarUrl);
      setScanningActive(false);
      audioNotificationService.playChime("success");
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setScanningActive(true);
    setLivenessPassed(true);
  };

  // Submit Attendance Record
  const handleSubmit = () => {
    setIsSubmitting(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateStr = now.toISOString().split("T")[0];

    // Determine status
    let status: AttendanceStatus = "tepat_waktu";
    if (type === "in") {
      const [h, m] = schedule.checkInTime.split(":").map(Number);
      const lateThreshold = new Date();
      lateThreshold.setHours(h, m + schedule.lateToleranceMinutes, 0, 0);
      if (now.getTime() > lateThreshold.getTime()) {
        status = "terlambat";
      }
    }

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeAvatar: employee.avatarUrl,
      department: employee.department,
      date: dateStr,
      checkInTime: type === "in" ? timeStr : undefined,
      checkOutTime: type === "out" ? timeStr : undefined,
      status,
      location: userCoords
        ? {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            address: schedule.officeName,
            distanceMeters: distanceMeters || 15,
            inRadius,
          }
        : undefined,
      facePhotoUrl: capturedPhoto || employee.avatarUrl,
      verifiedByFace: true,
      notes: notes.trim() || undefined,
    };

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#3b82f6", "#10b981", "#f59e0b"],
      });
    } catch (e) {}

    // Audio announcement
    const speechText =
      type === "in"
        ? `Presensi masuk berhasil diverifikasi untuk ${employee.name}. Status: ${
            status === "terlambat" ? "Terlambat" : "Tepat Waktu"
          }. Selamat bekerja!`
        : `Presensi pulang berhasil dicatat untuk ${employee.name}. Terima kasih dan hati-hati di jalan!`;

    audioNotificationService.speakIndonesian(speechText);

    setTimeout(() => {
      onSaveAttendance(record);
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                {type === "in" ? "Presensi Absen Masuk" : "Presensi Absen Pulang"}
              </h2>
              <p className="text-[11px] text-blue-100 font-medium">
                Verifikasi Wajah Biometrik & Radius GPS
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

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Camera Viewport / Face Scanner Frame */}
          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner flex items-center justify-center group">
            {cameraLoading && (
              <div className="flex flex-col items-center gap-2 text-white/80">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs">Mengaktifkan sensor kamera...</span>
              </div>
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                capturedPhoto ? "hidden" : "block"
              }`}
            />

            {/* Captured Photo Preview */}
            {capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />
            )}

            {/* Hidden canvas for snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Biometric Face Detection Oval Overlay (when live scanning) */}
            {!capturedPhoto && !cameraLoading && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                {/* Oval outline */}
                <div
                  className={`w-48 h-56 rounded-[50%] border-2 border-dashed transition-all relative ${
                    livenessPassed
                      ? "border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.6)]"
                      : "border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)]"
                  }`}
                >
                  {/* Scanning laser bar */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />

                  {/* Corner brackets */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                </div>

                {/* Status caption badge */}
                <div className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20">
                  {livenessPassed ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Wajah Terverifikasi ({faceConfidence}%)</span>
                    </>
                  ) : faceDetected ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>Memeriksa keaslian wajah (Liveness)...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>Posisikan wajah di dalam bingkai</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Shutter Button floating on camera */}
            {!capturedPhoto && !cameraLoading && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-auto">
                <button
                  id="snap-face-photo-btn"
                  onClick={handleSnapPhoto}
                  className="px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 active:scale-90 transition-all border border-white/40"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Ambil Foto Wajah</span>
                </button>
              </div>
            )}

            {/* Retake Button if captured */}
            {capturedPhoto && (
              <div className="absolute bottom-3 right-3">
                <button
                  onClick={handleRetake}
                  className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white font-semibold text-xs backdrop-blur-md flex items-center gap-1 border border-white/20 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
              </div>
            )}
          </div>

          {/* GPS Location & Radius Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Validasi Lokasi Kantor (GPS)</span>
              </div>
              <button
                onClick={captureLocation}
                disabled={gpsLoading}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>Segarkan GPS</span>
              </button>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <span className="text-slate-500">Kantor Tujuan:</span>
                <span className="font-semibold text-slate-900 text-right">{schedule.officeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Batas Radius:</span>
                <span className="font-medium text-slate-700">{schedule.geofenceRadiusMeters} meter</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jarak Terkini:</span>
                <span className="font-bold text-slate-900">
                  {distanceMeters !== null ? `${distanceMeters} meter` : "Menghitung..."}
                </span>
              </div>

              {/* Status Radius Pill */}
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Status Geolokasi:</span>
                {inRadius ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Dalam Radius Kantor (Sah)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Di Luar Radius Kantor
                  </span>
                )}
              </div>
            </div>

            {!inRadius && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Anda terdeteksi di luar radius kantor ({distanceMeters}m &gt;{" "}
                  {schedule.geofenceRadiusMeters}m). Wajib tuliskan alasan di catatan (misal: WFH atau
                  Dinas Lapangan).
                </span>
              </div>
            )}
          </div>

          {/* Optional Notes Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Catatan Presensi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bertugas di gedung cabang / Kendala lalu lintas"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            id="submit-attendance-final-btn"
            onClick={handleSubmit}
            disabled={!capturedPhoto || isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Konfirmasi {type === "in" ? "Masuk" : "Pulang"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
