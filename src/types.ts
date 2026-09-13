export type UserRole = "employee" | "manager" | "admin";

export type AttendanceStatus = "tepat_waktu" | "terlambat" | "izin" | "sakit" | "alpa";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    distanceMeters: number;
    inRadius: boolean;
  };
  facePhotoUrl?: string;
  verifiedByFace: boolean;
  notes?: string;
}

export type LeaveType = "cuti_tahunan" | "sakit" | "izin_pribadi" | "dinas_luar" | "cuti_khusus";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  managerNotes?: string;
}

export interface ChatMessage {
  id: string;
  sender: "employee" | "admin" | "ai_assistant";
  senderName: string;
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  attachment?: {
    type: "image" | "file";
    name: string;
    url: string;
  };
}

export interface BannerInfo {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  active: boolean;
}

export interface CompanyBranding {
  companyName: string;
  tagline: string;
  logoUrl: string;
  themePreset: "blue-gradient" | "ocean-cyan" | "royal-indigo" | "emerald-fresh" | "sunset-amber";
  customPrimaryColor?: string;
  banners: BannerInfo[];
}

export interface WorkScheduleConfig {
  checkInTime: string; // e.g. "08:00"
  lateToleranceMinutes: number; // e.g. 15 -> 08:15
  checkOutTime: string; // e.g. "17:00"
  officeName: string;
  officeAddress: string;
  officeCoordinates: Coordinates;
  geofenceRadiusMeters: number; // e.g. 150
  enableAiVoiceReminder: boolean;
  enableFiveMinWarning: boolean;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  department: string;
  avatarUrl: string;
  annualLeaveQuota: number;
  usedLeave: number;
  phone: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "reminder";
  timestamp: string;
  read: boolean;
  isAiVoice?: boolean;
}
