import { EmployeeProfile, UserRole } from "../types";

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
 * Authenticate either an admin (user: admin, pass: admin123)
 * or any employee with default pass 123456 (or updated password).
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
    return { success: false, error: "Silakan masukkan Kata Sandi Anda." };
  }

  // 1. Check if trying to log in as Admin
  const isTargetAdmin =
    cleanId.toLowerCase() === ADMIN_USERNAME.toLowerCase() ||
    cleanId.toLowerCase() === "admin@disdik.go.id" ||
    cleanId.toLowerCase() === "administrator";

  if (isTargetAdmin) {
    if (cleanPass === ADMIN_PASSWORD) {
      // Find administrator employee profile or fallback to manager
      const adminEmp =
        employees.find((e) => e.role === "manager") ||
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

  // 2. Check Employee Login (via NIP, Email, or Employee ID)
  const normalizedId = cleanId.toLowerCase();
  const matchedEmployee = employees.find((emp) => {
    // Match NIP (ignore dashes or spaces)
    const empNip = (emp.nip || "").replace(/[-\s]/g, "").toLowerCase();
    const queryNip = cleanId.replace(/[-\s]/g, "").toLowerCase();
    if (empNip && empNip === queryNip) return true;

    // Match Email
    if (emp.email && emp.email.toLowerCase() === normalizedId) return true;

    // Match ID (e.g. emp-001)
    if (emp.id && emp.id.toLowerCase() === normalizedId) return true;

    // Match exact Name
    if (emp.name.toLowerCase() === normalizedId) return true;

    return false;
  });

  if (!matchedEmployee) {
    return {
      success: false,
      error: `Akun dengan identitas "${cleanId}" tidak ditemukan. Gunakan NIP, email kantor, atau pilih akun cepat di bawah.`,
    };
  }

  // Verify password for employee
  const expectedPassword = getEmployeePassword(matchedEmployee.id);
  if (cleanPass !== expectedPassword) {
    return {
      success: false,
      error: "Kata sandi salah. Kata sandi default untuk semua pegawai adalah '123456'.",
    };
  }

  const session: AuthSession = {
    userId: matchedEmployee.id,
    username: matchedEmployee.nip || matchedEmployee.email,
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
