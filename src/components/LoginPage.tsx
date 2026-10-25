import React, { useState } from "react";
import {
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  Building2,
  Award,
  IdCard,
} from "lucide-react";
import { CompanyBranding, EmployeeProfile, UserRole } from "../types";
import {
  authenticateUser,
  saveAuthSession,
  AuthSession,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  DEFAULT_EMPLOYEE_PASSWORD,
} from "../services/authService";
import { audioNotificationService } from "../services/audioNotification";
import { PWAInstallButton } from "./PWAInstallButton";

interface LoginPageProps {
  branding: CompanyBranding;
  employees: EmployeeProfile[];
  onLoginSuccess: (session: AuthSession, employee?: EmployeeProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  branding,
  employees,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"pegawai" | "admin">("pegawai");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Switch tabs
  const handleSwitchTab = (tab: "pegawai" | "admin") => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === "admin") {
      setIdentifier(ADMIN_USERNAME);
      setPassword(ADMIN_PASSWORD);
    } else {
      // Default to first employee's NIP
      const firstEmp = employees[0];
      setIdentifier(firstEmp?.nip || firstEmp?.email || "198709212010011005");
      setPassword(DEFAULT_EMPLOYEE_PASSWORD);
    }
  };

  // Quick fill specific employee
  const handleQuickSelectEmployee = (emp: EmployeeProfile) => {
    setActiveTab("pegawai");
    setIdentifier(emp.nip || emp.email);
    setPassword(DEFAULT_EMPLOYEE_PASSWORD);
    setErrorMessage(null);
  };

  // Handle Login submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(identifier, password, employees);

      if (result.success && result.session) {
        audioNotificationService.playChime("success");
        if (rememberMe) {
          saveAuthSession(result.session);
        }
        onLoginSuccess(result.session, result.employee);
      } else {
        audioNotificationService.playChime("warning");
        setErrorMessage(result.error || "Gagal masuk. Periksa kembali username dan password.");
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" className="mb-3 w-full max-w-md z-10" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-white/40">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.companyName}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Building2 className="w-8 h-8 text-blue-700" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] tracking-widest font-extrabold uppercase bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20 inline-block mb-1">
                Portal Presensi Terpadu
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                {branding.companyName}
              </h1>
              <p className="text-xs text-blue-100 line-clamp-1 mt-0.5 font-medium">
                {branding.tagline || "Sistem Presensi GPS & Wajah Digital"}
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher (Pegawai vs Admin) */}
        <div className="p-2 bg-slate-100/90 border-b border-slate-200 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleSwitchTab("pegawai")}
            className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "pegawai"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Login Pegawai</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab("admin")}
            className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "admin"
                ? "bg-amber-400 text-slate-950 shadow-xs border border-amber-500 font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Login Admin</span>
          </button>
        </div>

        {/* Credentials Info Badge */}
        <div className="px-6 pt-4 pb-1">
          {activeTab === "pegawai" ? (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <IdCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Ketentuan Login Pegawai:</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Gunakan <strong className="font-bold">NIP</strong> atau <strong className="font-bold">Email Kantor</strong> Anda dengan kata sandi default:{" "}
                <span className="font-mono bg-blue-200/80 px-1.5 py-0.5 rounded-md font-bold text-blue-950">
                  123456
                </span>
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Ketentuan Login Admin:</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Username: <span className="font-mono bg-amber-200/80 px-1.5 py-0.5 rounded-md font-bold text-amber-950">admin</span> • Kata sandi:{" "}
                <span className="font-mono bg-amber-200/80 px-1.5 py-0.5 rounded-md font-bold text-amber-950">
                  admin123
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Identifier Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {activeTab === "pegawai" ? "NIP / Email Pegawai:" : "Username Admin:"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {activeTab === "pegawai" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <input
                id="login-input-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={activeTab === "pegawai" ? "Contoh: 198709212010011005" : "admin"}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs font-mono"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Kata Sandi:</label>
              <span className="text-[10px] text-slate-400">
                {activeTab === "pegawai" ? "Default: 123456" : "Default: admin123"}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-input-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">Ingat Sesi Masuk</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
              activeTab === "admin"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/20"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? "Memverifikasi..." : "Masuk ke Aplikasi"}</span>
          </button>
        </form>

        {/* Quick Demo Selector for fast evaluation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 space-y-2">
          <span className="text-[11px] font-bold text-slate-600 block">
            Pilihan Cepat Masuk Akun Pegawai (Uji Coba):
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {employees.slice(0, 4).map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleQuickSelectEmployee(emp)}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all cursor-pointer flex items-center gap-2 group shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={emp.avatarUrl}
                    alt={emp.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-slate-800 truncate block group-hover:text-blue-700">
                    {emp.name.split(" ")[0]} ({emp.position})
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">
                    NIP: {emp.nip || emp.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <p className="mt-4 text-xs text-slate-400 text-center font-medium">
        © 2026 {branding.companyName} • Sistem Presensi Kepegawaian Berbasis Wajah & GPS
      </p>
    </div>
  );
};
