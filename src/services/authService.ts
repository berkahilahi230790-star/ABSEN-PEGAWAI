import { EmployeeProfile, UserRole } from "../types";
import { findEmployeeInFirestore } from "./firebase";
import { saveStoredEmployees, getStoredEmployees } from "./storage";

export interface AuthSession {
  userId: string;
  name: string;
  username: string;
  role: UserRole;
  isAdministrator: boolean;
  employeeId?: string;
  loginTime: string;
}

const AUTH_STORAGE_KEY = "presensigo_auth_session";
const EMPLOYEE_PWD_PREFIX = "presensigo_employee_pwd_";

export const DEFAULT_EMPLOYEE_PASSWORD = "123456";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

/**
 * Normalizes NIP string by removing all spaces, dashes, dots, and non-alphanumeric symbols.
 */
export function normalizeNip(val?: string | null): string {
  if (!val) return "";
  return val.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Get stored active authentication session from localStorage
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save authentication session to localStorage
 */
export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn("Error saving auth session:", err);
  }
}

/**
 * Clear authentication session from localStorage (Logout)
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn("Error clearing auth session:", err);
  }
}

/**
 * Retrieve the current password for an employee (default 123456 if never customized)
 */
export function getEmployeePassword(employeeId: string): string {
  try {
    const custom = localStorage.getItem(`${EMPLOYEE_PWD_PREFIX}${employeeId}`);
    return custom || DEFAULT_EMPLOYEE_PASSWORD;
  } catch {
    return DEFAULT_EMPLOYEE_PASSWORD;
  }
}

/**
 * Store a custom password for an employee
 */
export function setEmployeePassword(employeeId: string, newPassword: string): void {
  try {
    localStorage.setItem(`${EMPLOYEE_PWD_PREFIX}${employeeId}`, newPassword);
  } catch (err) {
    console.warn("Error setting employee password:", err);
  }
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  employee?: EmployeeProfile;
  error?: string;
}

/**
 * Helper to match an employee from an array by NIP, email, ID, or name
 */
export function findMatchingEmployee(
  identifier: string,
  employees: EmployeeProfile[]
): EmployeeProfile | undefined {
  const cleanId = identifier.trim();
  const normalizedId = cleanId.toLowerCase();
  const rawIdClean = normalizeNip(cleanId);

  return employees.find((emp) => {
    // 1. Match NIP (clean all spaces, dashes, dots, slashes)
    const empNipRaw = normalizeNip(emp.nip);
    if (empNipRaw && (empNipRaw === rawIdClean || empNipRaw === normalizedId)) {
      return true;
    }
    if (emp.nip && emp.nip.trim().toLowerCase() === normalizedId) {
      return true;
    }

    // 2. Match Employee ID (e.g. emp-001 or emp-1792934111712 or raw 1792934111712)
    const empIdRaw = normalizeNip(emp.id);
    if (empIdRaw && (empIdRaw === rawIdClean || empIdRaw === normalizedId)) {
      return true;
    }
    if (emp.id && emp.id.trim().toLowerCase() === normalizedId) {
      return true;
    }

    // 3. Match Email
    if (emp.email && emp.email.trim().toLowerCase() === normalizedId) {
      return true;
    }

    // 4. Match exact Name (case-insensitive)
    if (emp.name && emp.name.trim().toLowerCase() === normalizedId) {
      return true;
    }

    return false;
  });
}

/**
 * Authenticate either an admin (user: admin, pass: admin123)
 * or any employee with default pass 123456 (or custom password).
 */
export function authenticateUser(
  identifier: string,
  passwordInput: string,
  employees: EmployeeProfile[]
): LoginResult {
  const cleanId = identifier.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanId) {
    return { success: false, error: "Silakan masukkan Username, NIP, atau Email Anda." };
  }
  if (!cleanPass) {
    return { success: false, error: "Silakan masukkan Kata Sandi Anda (Default: 123456)." };
  }

  // 1. Check if trying to log in as Admin
  const isTargetAdmin =
    cleanId.toLowerCase() === ADMIN_USERNAME.toLowerCase() ||
    cleanId.toLowerCase() === "admin@disdik.go.id" ||
    cleanId.toLowerCase() === "admin@perusahaan.co.id" ||
    cleanId.toLowerCase() === "administrator";

  if (isTargetAdmin) {
    if (cleanPass === ADMIN_PASSWORD) {
      const adminEmp =
        employees.find((e) => e.role === "manager") ||
        employees.find((e) => e.role === "admin") ||
        employees[3] ||
        employees[0];

      const session: AuthSession = {
        userId: "admin",
        username: "admin",
        name: adminEmp ? adminEmp.name : "Administrator Kepegawaian",
        role: "manager",
        isAdministrator: true,
        employeeId: adminEmp?.id,
        loginTime: new Date().toISOString(),
      };

      return {
        success: true,
        session,
        employee: adminEmp,
      };
    } else {
      return {
        success: false,
        error: "Kata sandi Admin salah. Kata sandi default untuk admin adalah 'admin123'.",
      };
    }
  }

  // 2. Check Employee Login in provided array
  const matchedEmployee = findMatchingEmployee(cleanId, employees);

  if (!matchedEmployee) {
    return {
      success: false,
      error: `Akun dengan NIP atau identitas "${cleanId}" tidak ditemukan dalam data pegawai. Pastikan NIP sesuai dengan yang terdaftar.`,
    };
  }

  // 3. Verify password for employee
  // Default password "123456" is ALWAYS accepted for every employee
  const expectedPassword = getEmployeePassword(matchedEmployee.id);
  const isPasswordValid =
    cleanPass === DEFAULT_EMPLOYEE_PASSWORD ||
    cleanPass === "123456" ||
    cleanPass === expectedPassword;

  if (!isPasswordValid) {
    return {
      success: false,
      error: "Kata sandi salah. Kata sandi default untuk semua pegawai adalah '123456'.",
    };
  }

  const session: AuthSession = {
    userId: matchedEmployee.id,
    username: matchedEmployee.nip || matchedEmployee.email || matchedEmployee.id,
    name: matchedEmployee.name,
    role: matchedEmployee.role,
    isAdministrator: matchedEmployee.role === "manager" || matchedEmployee.role === "admin",
    employeeId: matchedEmployee.id,
    loginTime: new Date().toISOString(),
  };

  return {
    success: true,
    session,
    employee: matchedEmployee,
  };
}

/**
 * Asynchronous authentication:
 * Checks local employees first; if not found, queries Firestore directly
 * and merges the found employee into local cache so future lookups succeed instantly.
 */
export async function authenticateUserAsync(
  identifier: string,
  passwordInput: string,
  employees: EmployeeProfile[]
): Promise<LoginResult> {
  // First attempt synchronous lookup
  const initialResult = authenticateUser(identifier, passwordInput, employees);
  if (initialResult.success) {
    return initialResult;
  }

  // If failed because user was not found, check Firestore directly!
  const cleanId = identifier.trim();
  const isTargetAdmin = cleanId.toLowerCase() === ADMIN_USERNAME.toLowerCase();

  if (!isTargetAdmin) {
    try {
      const remoteEmp = await findEmployeeInFirestore(cleanId);
      if (remoteEmp) {
        // Merge into local employees list
        const currentList = getStoredEmployees();
        const existingIdx = currentList.findIndex((e) => e.id === remoteEmp.id);
        let updatedList: EmployeeProfile[];
        if (existingIdx >= 0) {
          updatedList = [...currentList];
          updatedList[existingIdx] = remoteEmp;
        } else {
          updatedList = [remoteEmp, ...currentList];
        }
        saveStoredEmployees(updatedList);

        // Re-attempt authentication with the freshly found employee
        return authenticateUser(identifier, passwordInput, updatedList);
      }
    } catch (e) {
      console.warn("Async Firestore employee lookup error:", e);
    }
  }

  return initialResult;
}
