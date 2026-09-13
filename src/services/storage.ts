import {
  AttendanceRecord,
  CompanyBranding,
  EmployeeProfile,
  LeaveRequest,
  WorkScheduleConfig,
  ChatMessage,
  NotificationItem,
  Coordinates,
} from "../types";

// Default seed data
export const DEFAULT_CURRENT_EMPLOYEE: EmployeeProfile = {
  id: "emp-001",
  name: "Ahmad Pratama",
  email: "ahmad.pratama@perusahaan.co.id",
  role: "employee",
  position: "Senior Sales & Operations",
  department: "Commercial & Business",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  annualLeaveQuota: 12,
  usedLeave: 3,
  phone: "+62 812-3456-7890",
};

export const DEFAULT_EMPLOYEES: EmployeeProfile[] = [
  DEFAULT_CURRENT_EMPLOYEE,
  {
    id: "emp-002",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@perusahaan.co.id",
    role: "employee",
    position: "UI/UX Designer",
    department: "Product & Tech",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    annualLeaveQuota: 12,
    usedLeave: 2,
    phone: "+62 813-9876-5432",
  },
  {
    id: "emp-003",
    name: "Budi Santoso",
    email: "budi.santoso@perusahaan.co.id",
    role: "employee",
    position: "Fullstack Engineer",
    department: "Product & Tech",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    annualLeaveQuota: 12,
    usedLeave: 5,
    phone: "+62 811-2233-4455",
  },
  {
    id: "emp-004",
    name: "Rina Wijayanti",
    email: "rina.hr@perusahaan.co.id",
    role: "manager",
    position: "Admin Kepegawaian",
    department: "Human Resources",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    annualLeaveQuota: 14,
    usedLeave: 1,
    phone: "+62 815-6677-8899",
  },
];

export const DEFAULT_WORK_SCHEDULE: WorkScheduleConfig = {
  checkInTime: "08:00",
  lateToleranceMinutes: 15, // late if > 08:15
  checkOutTime: "17:00",
  officeName: "Head Office - Wisma Mandiri Lt. 12",
  officeAddress: "Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan",
  officeCoordinates: {
    latitude: -6.224168,
    longitude: 106.809675,
    accuracy: 10,
  },
  geofenceRadiusMeters: 200,
  enableAiVoiceReminder: true,
  enableFiveMinWarning: true,
};

export const DEFAULT_BRANDING: CompanyBranding = {
  companyName: "PresensiGo Digital Corp",
  tagline: "Sistem Presensi & Manajemen SDM Modern",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
  themePreset: "blue-gradient",
  banners: [
    {
      id: "b-1",
      title: "Semangat Pagi & Presensi Tepat Waktu!",
      subtitle: "Dapatkan bonus performa bulanan dengan presensi 100% disiplin",
      badge: "Reward Disiplin",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&auto=format&fit=crop&q=80",
      ctaText: "Lihat Rekor",
      active: true,
    },
    {
      id: "b-2",
      title: "Kebijakan Cuti & Pengajuan Izin Fleksibel",
      subtitle: "Pengajuan izin kini disetujui instan oleh manajer via dashboard",
      badge: "Info HRD",
      imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=900&auto=format&fit=crop&q=80",
      ctaText: "Ajukan Izin",
      active: true,
    },
    {
      id: "b-3",
      title: "Konsultasi Administrasi via Chat Admin Real-time",
      subtitle: "Hubungi tim HR kapan saja untuk info lembur, slip gaji, dan cuti",
      badge: "Layanan 24/7",
      imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&auto=format&fit=crop&q=80",
      ctaText: "Buka Chat",
      active: true,
    },
  ],
};

// Generate initial month records
export function generateSeedAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // current month (0-indexed)
  const daysInMonth = today.getDate(); // up to today

  for (let d = 1; d <= Math.min(daysInMonth, 28); d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    
    // Some variations
    if (d === 5) {
      records.push({
        id: `att-${d}`,
        employeeId: "emp-001",
        employeeName: "Ahmad Pratama",
        employeeAvatar: DEFAULT_CURRENT_EMPLOYEE.avatarUrl,
        department: DEFAULT_CURRENT_EMPLOYEE.department,
        date: dateStr,
        checkInTime: "08:24:12",
        checkOutTime: "17:15:00",
        status: "terlambat",
        location: {
          latitude: -6.22418,
          longitude: 106.80968,
          address: "Wisma Mandiri Lt. 12, Senayan",
          distanceMeters: 18,
          inRadius: true,
        },
        facePhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        verifiedByFace: true,
        notes: "Macet di tol dalam kota",
      });
    } else if (d === 12) {
      records.push({
        id: `att-${d}`,
        employeeId: "emp-001",
        employeeName: "Ahmad Pratama",
        employeeAvatar: DEFAULT_CURRENT_EMPLOYEE.avatarUrl,
        department: DEFAULT_CURRENT_EMPLOYEE.department,
        date: dateStr,
        status: "izin",
        notes: "Izin pengurusan dokumen kependudukan (Disetujui HRD)",
        verifiedByFace: false,
      });
    } else if (d === 18) {
      records.push({
        id: `att-${d}`,
        employeeId: "emp-001",
        employeeName: "Ahmad Pratama",
        employeeAvatar: DEFAULT_CURRENT_EMPLOYEE.avatarUrl,
        department: DEFAULT_CURRENT_EMPLOYEE.department,
        date: dateStr,
        status: "sakit",
        notes: "Sakit demam - Surat dokter terlampir",
        verifiedByFace: false,
      });
    } else {
      const min = Math.floor(Math.random() * 12);
      const sec = Math.floor(Math.random() * 59);
      const checkIn = `07:${String(48 + min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      records.push({
        id: `att-${d}`,
        employeeId: "emp-001",
        employeeName: "Ahmad Pratama",
        employeeAvatar: DEFAULT_CURRENT_EMPLOYEE.avatarUrl,
        department: DEFAULT_CURRENT_EMPLOYEE.department,
        date: dateStr,
        checkInTime: checkIn,
        checkOutTime: "17:08:44",
        status: "tepat_waktu",
        location: {
          latitude: -6.224168 + (Math.random() - 0.5) * 0.0003,
          longitude: 106.809675 + (Math.random() - 0.5) * 0.0003,
          address: "Wisma Mandiri Lt. 12, Senayan",
          distanceMeters: Math.floor(Math.random() * 45) + 10,
          inRadius: true,
        },
        facePhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        verifiedByFace: true,
      });
    }
  }
  return records;
}

export const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "req-101",
    employeeId: "emp-001",
    employeeName: "Ahmad Pratama",
    department: "Commercial & Business",
    leaveType: "cuti_tahunan",
    startDate: "2026-09-24",
    endDate: "2026-09-25",
    totalDays: 2,
    reason: "Acara keluarga tahunan di luar kota",
    status: "pending",
    submittedAt: "2026-09-11 14:20",
  },
  {
    id: "req-102",
    employeeId: "emp-002",
    employeeName: "Siti Nurhaliza",
    department: "Product & Tech",
    leaveType: "sakit",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    totalDays: 2,
    reason: "Flu berat dan istirahat dokter",
    attachmentName: "surat_keterangan_dokter_siti.pdf",
    attachmentUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80",
    status: "approved",
    submittedAt: "2026-09-08 07:15",
    reviewedBy: "Rina Wijayanti (Admin Kepegawaian)",
    reviewedAt: "2026-09-08 08:30",
    managerNotes: "Disetujui. Cepat sembuh dan istirahat yang cukup.",
  },
  {
    id: "req-103",
    employeeId: "emp-003",
    employeeName: "Budi Santoso",
    department: "Product & Tech",
    leaveType: "dinas_luar",
    startDate: "2026-09-15",
    endDate: "2026-09-16",
    totalDays: 2,
    reason: "Instalasi dan migrasi server di Data Center Cikarang",
    status: "approved",
    submittedAt: "2026-09-10 11:00",
    reviewedBy: "Rina Wijayanti (Admin Kepegawaian)",
    reviewedAt: "2026-09-10 13:45",
    managerNotes: "Disetujui. Harap update status tim setiap sore.",
  },
];

export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "admin",
    senderName: "Bu Rina (HR Admin)",
    text: "Halo Ahmad! Ada yang bisa tim HR bantu terkait administrasi absensi, pengajuan cuti, atau slip kehadiran Anda?",
    timestamp: "08:15",
  },
  {
    id: "m-2",
    sender: "employee",
    senderName: "Ahmad Pratama",
    text: "Selamat pagi Bu Rina. Mau bertanya mengenai batas waktu pengajuan cuti tahunan untuk akhir bulan ini apakah ada syarat khusus?",
    timestamp: "08:18",
  },
  {
    id: "m-3",
    sender: "admin",
    senderName: "Bu Rina (HR Admin)",
    text: "Pengajuan cuti tahunan disarankan disubmit paling lambat H-3 melalui tombol 'Ajukan Izin' di aplikasi ini ya, agar Manajer Divisi dapat menyetujui jadwal pengganti.",
    timestamp: "08:20",
  },
];

// Helper to calculate distance using Haversine Formula
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// LocalStorage Keys
const KEYS = {
  ATTENDANCE: "presensigo_attendance_records",
  LEAVE_REQUESTS: "presensigo_leave_requests",
  WORK_SCHEDULE: "presensigo_work_schedule",
  BRANDING: "presensigo_branding",
  CHAT_MESSAGES: "presensigo_chat_messages",
  EMPLOYEES: "presensigo_employees",
  CURRENT_ROLE: "presensigo_current_role",
};

export function getStoredAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    if (!raw) {
      const seed = generateSeedAttendance();
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    return generateSeedAttendance();
  }
}

export function saveStoredAttendance(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {}
}

export function getStoredLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(KEYS.LEAVE_REQUESTS);
    if (!raw) {
      localStorage.setItem(KEYS.LEAVE_REQUESTS, JSON.stringify(DEFAULT_LEAVE_REQUESTS));
      return DEFAULT_LEAVE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_LEAVE_REQUESTS;
  }
}

export function saveStoredLeaveRequests(requests: LeaveRequest[]): void {
  try {
    localStorage.setItem(KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
  } catch (e) {}
}

export function getStoredWorkSchedule(): WorkScheduleConfig {
  try {
    const raw = localStorage.getItem(KEYS.WORK_SCHEDULE);
    if (!raw) {
      localStorage.setItem(KEYS.WORK_SCHEDULE, JSON.stringify(DEFAULT_WORK_SCHEDULE));
      return DEFAULT_WORK_SCHEDULE;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_WORK_SCHEDULE;
  }
}

export function saveStoredWorkSchedule(config: WorkScheduleConfig): void {
  try {
    localStorage.setItem(KEYS.WORK_SCHEDULE, JSON.stringify(config));
  } catch (e) {}
}

export function getStoredBranding(): CompanyBranding {
  try {
    const raw = localStorage.getItem(KEYS.BRANDING);
    if (!raw) {
      localStorage.setItem(KEYS.BRANDING, JSON.stringify(DEFAULT_BRANDING));
      return DEFAULT_BRANDING;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_BRANDING;
  }
}

export function saveStoredBranding(branding: CompanyBranding): void {
  try {
    localStorage.setItem(KEYS.BRANDING, JSON.stringify(branding));
  } catch (e) {}
}

export function getStoredChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.CHAT_MESSAGES);
    if (!raw) {
      localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(DEFAULT_CHAT_MESSAGES));
      return DEFAULT_CHAT_MESSAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CHAT_MESSAGES;
  }
}

export function saveStoredChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  } catch (e) {}
}

export function getStoredEmployees(): EmployeeProfile[] {
  try {
    const raw = localStorage.getItem(KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
      return DEFAULT_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_EMPLOYEES;
  }
}

export function saveStoredEmployees(employees: EmployeeProfile[]): void {
  try {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {}
}

// Aliases for seamless imports
export const getStoredAttendanceRecords = getStoredAttendance;
export const getStoredSchedule = getStoredWorkSchedule;
export const getStoredChatMessages = getStoredChat;
export const saveSchedule = saveStoredWorkSchedule;
export const saveBranding = saveStoredBranding;
export const saveChatMessages = saveStoredChat;
export const saveEmployees = saveStoredEmployees;
export const saveLeaveRequests = saveStoredLeaveRequests;

export function saveAttendanceRecord(record: AttendanceRecord): void {
  const current = getStoredAttendance();
  const existingIdx = current.findIndex(
    (r) => r.employeeId === record.employeeId && r.date === record.date
  );
  if (existingIdx >= 0) {
    current[existingIdx] = {
      ...current[existingIdx],
      ...record,
    };
  } else {
    current.unshift(record);
  }
  saveStoredAttendance(current);
}

