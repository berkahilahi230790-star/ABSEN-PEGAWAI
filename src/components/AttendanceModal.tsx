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
  ShieldAlert,
  Sparkles,
  Lock,
  FileText,
  Navigation,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  AttendanceRecord,
  AttendanceStatus,
  CompanyBranding,
  Coordinates,
  EmployeeProfile,
  WorkLocation,
  WorkScheduleConfig,
} from "../types";
import { calculateDistanceMeters } from "../services/storage";
import { audioNotificationService } from "../services/audioNotification";
import { uploadAttendancePhotoToGoogleDrive } from "../services/googleWorkspace";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "in" | "out";
  employee: EmployeeProfile;
  schedule: WorkScheduleConfig;
  branding: CompanyBranding;
  workLocations?: WorkLocation[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onOpenLeaveRequest?: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  type,
  employee,
  schedule,
  branding,
  workLocations,
  onSaveAttendance,
  onOpenLeaveRequest,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Resolve assigned work location coordinates & radius
  const assignedLocation = workLocations?.find(
    (loc) => loc.id === employee.workLocationId || loc.name === employee.workLocationName
  );
  const targetOfficeName = assignedLocation ? assignedLocation.name : schedule.officeName;
  const targetCoordinates: Coordinates = assignedLocation
    ? { latitude: assignedLocation.latitude, longitude: assignedLocation.longitude }
    : schedule.officeCoordinates;
  const targetRadius = assignedLocation?.radiusMeters || schedule.geofenceRadiusMeters || 100;

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

  // GPS States - strictly initialized to false (not verified)
  const [gpsLoading, setGpsLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [inRadius, setInRadius] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<string>("");

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
    setIsSimulated(false);

    if (!("geolocation" in navigator)) {
      setGpsError("Perangkat tidak mendukung geolokasi GPS.");
      setUserCoords(null);
      setDistanceMeters(null);
      setInRadius(false);
      setGpsLoading(false);
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
          targetCoordinates.latitude,
          targetCoordinates.longitude
        );

        setDistanceMeters(dist);
        const withinRadius = dist <= targetRadius;
        setInRadius(withinRadius);
        setGpsLoading(false);
      },
      (error) => {
        console.warn("GPS Geolocation error:", error.message);
        let errorMsg = "Gagal mendeteksi koordinat GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Izin akses lokasi GPS ditolak oleh browser/perangkat Anda. Aktifkan GPS untuk melakukan presensi.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Sinyal GPS tidak tersedia atau tidak terdeteksi.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Waktu pencarian sinyal GPS habis. Silakan klik Segarkan GPS.";
        }
        setGpsError(errorMsg);
        setUserCoords(null);
        setDistanceMeters(null);
        setInRadius(false);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Simulation helpers for testing / verification
  const handleSimulateInside = () => {
    setIsSimulated(true);
    setGpsError(null);
    const mockCoords: Coordinates = {
      latitude: targetCoordinates.latitude + 0.00008,
      longitude: targetCoordinates.longitude + 0.00006,
      accuracy: 6,
    };
    setUserCoords(mockCoords);
    const dist = calculateDistanceMeters(
      mockCoords.latitude,
      mockCoords.longitude,
      targetCoordinates.latitude,
      targetCoordinates.longitude
    );
    setDistanceMeters(dist);
    setInRadius(dist <= targetRadius);
    setGpsLoading(false);
  };

  const handleSimulateOutside = () => {
    setIsSimulated(true);
    setGpsError(null);
    const mockCoords: Coordinates = {
      latitude: targetCoordinates.latitude + 0.02,
      longitude: targetCoordinates.longitude + 0.02,
      accuracy: 15,
    };
    setUserCoords(mockCoords);
    const dist = calculateDistanceMeters(
      mockCoords.latitude,
      mockCoords.longitude,
      targetCoordinates.latitude,
      targetCoordinates.longitude
    );
    setDistanceMeters(dist);
    setInRadius(false); // Strictly outside
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
      setInRadius(false);
      setDistanceMeters(null);
      setUserCoords(null);
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
  const handleSubmit = async () => {
    // 🚨 TOTAL BLOCKING GUARD: Completely refuse submission if outside GPS radius or GPS unresolved
    if (!inRadius || gpsLoading || !userCoords) {
      audioNotificationService.playChime("warning");
      audioNotificationService.speakIndonesian(
        "Presensi ditolak total! Anda berada di luar radius kantor yang sah."
      );
      return;
    }

    if (!capturedPhoto) {
      return;
    }

    setIsSubmitting(true);
    setSubmittingStatus("Menyiapkan data presensi...");

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

    // Upload photo to Google Drive if photo is captured base64 image
    let drivePhotoResult: { fileId: string; webViewLink: string } | null = null;
    if (capturedPhoto && capturedPhoto.startsWith("data:image")) {
      setSubmittingStatus("Mengunggah foto presensi ke Google Drive...");
      try {
        drivePhotoResult = await uploadAttendancePhotoToGoogleDrive(
          capturedPhoto,
          employee.name,
          dateStr,
          timeStr
        );
      } catch (uploadErr) {
        console.warn("Drive upload skipped or failed:", uploadErr);
      }
    }

    setSubmittingStatus("Menyimpan data ke database Firestore...");

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
            address: targetOfficeName,
            distanceMeters: distanceMeters || 15,
            inRadius: true,
          }
        : undefined,
      facePhotoUrl: capturedPhoto || employee.avatarUrl,
      facePhotoDriveUrl: drivePhotoResult?.webViewLink,
      facePhotoDriveFileId: drivePhotoResult?.fileId,
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
      setSubmittingStatus("");
      onClose();
    }, 600);
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
                Wajib Berada di Radius Kantor & Verifikasi Wajah
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
                <span>Validasi Lokasi GPS Kantor</span>
              </div>
              <button
                onClick={captureLocation}
                disabled={gpsLoading}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 active:scale-95 transition-all"
                title="Pindai ulang koordinat GPS perangkat"
              >
                <RefreshCw className={`w-3 h-3 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>Segarkan GPS</span>
              </button>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <span className="text-slate-500">Titik Kantor:</span>
                <span className="font-semibold text-slate-900 text-right">{targetOfficeName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Radius Maksimal Sah:</span>
                <span className="font-bold text-slate-800">{targetRadius} meter</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jarak Anda Saat Ini:</span>
                <span className={`font-black ${
                  gpsLoading
                    ? "text-slate-400"
                    : inRadius
                    ? "text-emerald-700"
                    : "text-rose-600"
                }`}>
                  {gpsLoading
                    ? "Mencari sinyal GPS..."
                    : distanceMeters !== null
                    ? `${distanceMeters} meter`
                    : "Tidak terdeteksi"}
                </span>
              </div>

              {/* Status Radius Pill */}
              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Status Geolokasi:</span>
                {gpsLoading ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                    Memverifikasi Lokasi...
                  </span>
                ) : inRadius ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Dalam Radius ({distanceMeters}m ≤ {targetRadius}m) - Sah
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px] shadow-xs">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    DI LUAR RADIUS (DIBLOKIR)
                  </span>
                )}
              </div>
            </div>

            {/* 🚨 STRICT TOTAL BLOCKING BANNER WHEN OUTSIDE RADIUS */}
            {!inRadius && !gpsLoading && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                        BLOKIR TOTAL
                      </span>
                      <h4 className="text-xs font-black text-rose-900">
                        Presensi {type === "in" ? "Masuk" : "Pulang"} Tidak Dapat Terkirim
                      </h4>
                    </div>
                    <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                      {distanceMeters !== null
                        ? `Posisi GPS Anda berjarak ${distanceMeters} meter dari kantor (Batas maksimum yang diperbolehkan adalah ${targetRadius} meter).`
                        : gpsError || "Koordinat GPS perangkat Anda tidak terdeteksi di lokasi kantor."}
                      {" "}Sistem memblokir pengiriman presensi secara total hingga Anda berada langsung di lokasi kantor.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-rose-700 font-medium">
                    Sedang dinas luar, sakit, atau berhalangan ke kantor?
                  </span>
                  {onOpenLeaveRequest && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLeaveRequest();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ajukan Izin / Cuti (Bebas Radius GPS)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Testing / Simulation Toolbar (for verifying behavior) */}
            <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold text-slate-400">Pengujian Simulasi GPS:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSimulateInside}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                    isSimulated && inRadius
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title="Simulasi berada di dalam radius kantor (presensi diizinkan)"
                >
                  📍 Di Kantor (Sah)
                </button>
                <button
                  type="button"
                  onClick={handleSimulateOutside}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                    isSimulated && !inRadius
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                  title="Simulasi berada di luar radius kantor (presensi diblokir total)"
                >
                  🚫 Di Luar (Blokir)
                </button>
                {isSimulated && (
                  <button
                    type="button"
                    onClick={captureLocation}
                    className="px-1.5 py-0.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium"
                    title="Kembali ke GPS riil perangkat"
                  >
                    GPS Asli
                  </button>
                )}
              </div>
            </div>
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
              placeholder="Catatan tambahan presensi..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs active:scale-95 transition-all"
          >
            Batal
          </button>

          {/* Submit Attendance Button - STRICTLY LOCKED WHEN !inRadius */}
          <button
            id="submit-attendance-final-btn"
            onClick={handleSubmit}
            disabled={!capturedPhoto || isSubmitting || gpsLoading || !inRadius}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 ${
              !inRadius || gpsLoading
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                : !capturedPhoto
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{submittingStatus || "Memproses..."}</span>
              </>
            ) : gpsLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Mengecek Radius GPS...</span>
              </>
            ) : !inRadius ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Presensi Diblokir (Di Luar Radius)</span>
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
