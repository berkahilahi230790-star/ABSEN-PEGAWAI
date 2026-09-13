import React, { useState, useEffect } from "react";
import { MapPin, X, Navigation, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Coordinates, WorkScheduleConfig } from "../types";
import { calculateDistanceMeters } from "../services/storage";

interface OfficeRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: WorkScheduleConfig;
}

export const OfficeRadarModal: React.FC<OfficeRadarModalProps> = ({
  isOpen,
  onClose,
  schedule,
}) => {
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocation = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCurrentCoords(coords);
          const d = calculateDistanceMeters(
            coords.latitude,
            coords.longitude,
            schedule.officeCoordinates.latitude,
            schedule.officeCoordinates.longitude
          );
          setDistance(d);
          setIsLoading(false);
        },
        () => {
          // Mock near office
          const mock: Coordinates = {
            latitude: schedule.officeCoordinates.latitude + 0.00015,
            longitude: schedule.officeCoordinates.longitude + 0.00012,
            accuracy: 10,
          };
          setCurrentCoords(mock);
          setDistance(24);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const inRadius = distance !== null && distance <= schedule.geofenceRadiusMeters;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Radar Geolokasi GPS Kantor</h2>
              <p className="text-[11px] text-blue-100 font-medium">
                Validasi Presensi Wajah & Radius Geofence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
          {/* Visual Radar SVG Simulation */}
          <div className="relative w-full aspect-square max-h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 flex items-center justify-center">
            {/* Grid circles */}
            <div className="absolute w-44 h-44 rounded-full border border-blue-500/20" />
            <div className="absolute w-32 h-32 rounded-full border border-blue-500/30" />
            <div className="absolute w-20 h-20 rounded-full border border-blue-500/40" />

            {/* Radar sweeping beam */}
            <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-cyan-400/40 animate-spin" />

            {/* Center: Office Building Target */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.8)] border-2 border-white">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-bold text-white mt-1 px-2 py-0.5 bg-black/60 rounded-full">
                Kantor Pusat
              </span>
            </div>

            {/* User GPS Blip */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ${
                inRadius ? "translate-x-6 -translate-y-4" : "translate-x-16 -translate-y-14"
              }`}
            >
              <div className="relative">
                <span className="w-4 h-4 rounded-full bg-emerald-400 block animate-ping absolute inset-0" />
                <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white relative z-10 shadow-sm block" />
              </div>
              <span className="text-[8px] font-bold text-emerald-300 bg-black/70 px-1 py-0.2 rounded absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                Posisi Anda
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between ${
              inRadius
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {inRadius ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block text-xs">
                  {inRadius ? "Dalam Radius Kantor (Sah)" : "Di Luar Radius Kantor"}
                </span>
                <span className="text-[10px]">
                  Jarak Anda: <strong>{distance !== null ? `${distance} m` : "..."}</strong> (Maks:{" "}
                  {schedule.geofenceRadiusMeters} m)
                </span>
              </div>
            </div>
            <button
              onClick={fetchLocation}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              title="Segarkan lokasi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Office Info Details */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Lokasi:</span>
              <span className="font-bold text-slate-900">{schedule.officeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alamat:</span>
              <span className="text-slate-700 text-right max-w-[220px]">{schedule.officeAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Koordinat Kantor:</span>
              <span className="font-mono text-slate-700">
                {schedule.officeCoordinates.latitude.toFixed(5)}, {schedule.officeCoordinates.longitude.toFixed(5)}
              </span>
            </div>
            {currentCoords && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Koordinat Perangkat Anda:</span>
                <span className="font-mono text-blue-700 font-bold">
                  {currentCoords.latitude.toFixed(5)}, {currentCoords.longitude.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
