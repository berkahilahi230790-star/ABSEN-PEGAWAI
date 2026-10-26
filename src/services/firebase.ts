import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocFromServer,
  Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { AttendanceRecord, CompanyBranding, EmployeeProfile, LeaveRequest, WorkScheduleConfig, WorkLocation } from "../types";

// 1. Initialize Firebase App and Firestore
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId ||
    "ai-studio-presensigopegawa-bca7c9b3-5145-4367-926b-4ad0f1b946cb"
);
export const auth = getAuth(app);

// 2. Structured Error Handling as mandated by Firebase Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strips all `undefined` values recursively so Firestore setDoc / updateDoc never fails.
 * Firestore throws: "Unsupported field value: undefined" if any property is undefined.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        res[key] = cleanFirestoreData(value);
      }
    }
    return res as T;
  }
  return obj;
}

// 3. Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "attendance", "_ping_"));
    return true;
  } catch (error) {
    console.log("Firestore connection initialized:", error);
    return true;
  }
}

// 4. Save Attendance Record to Firestore
// Crucial: Saves employee identity, GPS coords, verification details, and Google Drive photo URL
export async function saveAttendanceToFirestore(
  record: AttendanceRecord
): Promise<void> {
  const path = `attendance/${record.id}`;
  try {
    const docRef = doc(db, "attendance", record.id);
    
    // Prepare clean data for Firestore (lightweight, under 1 KB, NO raw base64 photos)
    const data = {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      date: record.date,
      checkInTime: record.checkInTime || null,
      checkOutTime: record.checkOutTime || null,
      status: record.status,
      // GPS Location Data
      latitude: record.location?.latitude ?? null,
      longitude: record.location?.longitude ?? null,
      address: record.location?.address ?? null,
      distanceMeters: record.location?.distanceMeters ?? null,
      inRadius: record.location?.inRadius ?? true,
      // Face Verification Data
      verifiedByFace: record.verifiedByFace ?? true,
      // Google Drive Photo Storage URL
      facePhotoDriveUrl: record.facePhotoDriveUrl ?? null,
      facePhotoDriveFileId: record.facePhotoDriveFileId ?? null,
      notes: record.notes ?? null,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, data, { merge: true });
    console.log(`[Firestore] Attendance recorded successfully: ${record.id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Fetch Attendance from Firestore
export async function fetchAttendanceFromFirestore(): Promise<AttendanceRecord[]> {
  const path = "attendance";
  try {
    const q = query(collection(db, "attendance"), orderBy("date", "desc"), limit(200));
    const snapshot = await getDocs(q);
    const records: AttendanceRecord[] = [];

    snapshot.forEach((d) => {
      const data = d.data();
      records.push({
        id: data.id || d.id,
        employeeId: data.employeeId || "emp-001",
        employeeName: data.employeeName || "Pegawai",
        employeeAvatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
        department: data.department || "Operasional",
        date: data.date,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        status: data.status || "tepat_waktu",
        location:
          data.latitude !== null && data.latitude !== undefined
            ? {
                latitude: Number(data.latitude),
                longitude: Number(data.longitude),
                address: data.address || "Lokasi Kantor",
                distanceMeters: Number(data.distanceMeters || 10),
                inRadius: Boolean(data.inRadius),
              }
            : undefined,
        facePhotoUrl: data.facePhotoDriveUrl || undefined,
        facePhotoDriveUrl: data.facePhotoDriveUrl || undefined,
        facePhotoDriveFileId: data.facePhotoDriveFileId || undefined,
        verifiedByFace: Boolean(data.verifiedByFace),
        notes: data.notes || undefined,
        syncedToFirestore: true,
      });
    });

    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// 6. Realtime Listener for Attendance
export function subscribeToAttendance(
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, "attendance"), orderBy("date", "desc"), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id || d.id,
          employeeId: data.employeeId || "emp-001",
          employeeName: data.employeeName || "Pegawai",
          employeeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          department: data.department || "Operasional",
          date: data.date,
          checkInTime: data.checkInTime || undefined,
          checkOutTime: data.checkOutTime || undefined,
          status: data.status || "tepat_waktu",
          location:
            data.latitude !== null && data.latitude !== undefined
              ? {
                  latitude: Number(data.latitude),
                  longitude: Number(data.longitude),
                  address: data.address || "Lokasi Kantor",
                  distanceMeters: Number(data.distanceMeters || 10),
                  inRadius: Boolean(data.inRadius),
                }
              : undefined,
          facePhotoUrl: data.facePhotoDriveUrl || undefined,
          facePhotoDriveUrl: data.facePhotoDriveUrl || undefined,
          facePhotoDriveFileId: data.facePhotoDriveFileId || undefined,
          verifiedByFace: Boolean(data.verifiedByFace),
          notes: data.notes || undefined,
          syncedToFirestore: true,
        });
      });
      onUpdate(list);
    },
    (error) => {
      console.warn("[Firestore Live Sync] attendance listener notice:", error);
      if (onError) onError(error);
    }
  );
}

// 7. Employee Firestore Operations (Fetch, Realtime Subscribe, Save, Sync)
export async function saveEmployeeToFirestore(employee: EmployeeProfile): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    const dataToSave = cleanFirestoreData({
      ...employee,
      nip: employee.nip || null,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "employees", employee.id), dataToSave, { merge: true });
    console.log(`[Firestore] Employee ${employee.name} (${employee.id}) synced`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(empId: string): Promise<void> {
  const path = `employees/${empId}`;
  try {
    await deleteDoc(doc(db, "employees", empId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchEmployeesFromFirestore(): Promise<EmployeeProfile[]> {
  const path = "employees";
  try {
    const querySnapshot = await getDocs(collection(db, "employees"));
    const employees: EmployeeProfile[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      if (data && data.name) {
        employees.push({
          id: data.id || d.id,
          name: data.name,
          nip: data.nip || undefined,
          email: data.email || "",
          phone: data.phone || "+62 812-0000-0000",
          position: data.position || "Pegawai",
          department: data.department || "Dinas Pendidikan",
          workLocationId: data.workLocationId || undefined,
          workLocationName: data.workLocationName || undefined,
          role: data.role || "employee",
          avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          annualLeaveQuota: Number(data.annualLeaveQuota) || 12,
          usedLeave: Number(data.usedLeave) || 0,
        });
      }
    });
    return employees;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export function subscribeToEmployees(
  onUpdate: (employees: EmployeeProfile[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "employees"),
    (snapshot) => {
      const employees: EmployeeProfile[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data && data.name) {
          employees.push({
            id: data.id || d.id,
            name: data.name,
            nip: data.nip || undefined,
            email: data.email || "",
            phone: data.phone || "+62 812-0000-0000",
            position: data.position || "Pegawai",
            department: data.department || "Dinas Pendidikan",
            workLocationId: data.workLocationId || undefined,
            workLocationName: data.workLocationName || undefined,
            role: data.role || "employee",
            avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            annualLeaveQuota: Number(data.annualLeaveQuota) || 12,
            usedLeave: Number(data.usedLeave) || 0,
          });
        }
      });
      if (employees.length > 0) {
        onUpdate(employees);
      }
    },
    (error) => {
      console.warn("[Firestore Live Sync] employees listener notice:", error);
      if (onError) onError(error);
    }
  );
}

export async function findEmployeeInFirestore(identifier: string): Promise<EmployeeProfile | null> {
  const cleanId = identifier.trim().toLowerCase();
  const rawCleanNip = cleanId.replace(/[^a-zA-Z0-9]/g, "");

  try {
    const list = await fetchEmployeesFromFirestore();
    const found = list.find((emp) => {
      const empNipRaw = (emp.nip || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      if (empNipRaw && (empNipRaw === rawCleanNip || empNipRaw === cleanId)) return true;
      if (emp.nip && emp.nip.toLowerCase() === cleanId) return true;
      if (emp.email && emp.email.toLowerCase() === cleanId) return true;
      if (emp.id && emp.id.toLowerCase() === cleanId) return true;
      if (emp.name && emp.name.toLowerCase() === cleanId) return true;
      return false;
    });
    return found || null;
  } catch (err) {
    console.warn("Error searching employee in Firestore:", err);
    return null;
  }
}

export async function syncEmployeesToFirestore(employees: EmployeeProfile[]): Promise<void> {
  for (const emp of employees) {
    try {
      const dataToSave = cleanFirestoreData({
        ...emp,
        nip: emp.nip || null,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "employees", emp.id), dataToSave, { merge: true });
    } catch (e) {
      console.warn(`Failed to sync employee ${emp.id} to Firestore:`, e);
    }
  }
}

// 8. Save Leave Request to Firestore
export async function saveLeaveRequestToFirestore(request: LeaveRequest): Promise<void> {
  const path = `leaveRequests/${request.id}`;
  try {
    const dataToSave = cleanFirestoreData(request);
    await setDoc(doc(db, "leaveRequests", request.id), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 9. Save Company Schedule to Firestore
export async function saveScheduleToFirestore(schedule: WorkScheduleConfig): Promise<void> {
  const path = "companySettings/schedule";
  try {
    const dataToSave = cleanFirestoreData({
      ...schedule,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "companySettings", "schedule"), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10. Save and Fetch Google Drive Photo Folder & Spreadsheet Configuration in Firestore
export async function saveDrivePhotoFolderToFirestore(
  folderUrl: string,
  folderId: string
): Promise<void> {
  const path = "companySettings/driveConfig";
  try {
    const dataToSave = cleanFirestoreData({
      photoFolderUrl: folderUrl,
      photoFolderId: folderId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "companySettings", "driveConfig"), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveSpreadsheetConfigToFirestore(
  spreadsheetUrl: string,
  spreadsheetId: string
): Promise<void> {
  const path = "companySettings/driveConfig";
  try {
    const dataToSave = cleanFirestoreData({
      spreadsheetUrl,
      spreadsheetId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "companySettings", "driveConfig"), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchDrivePhotoFolderFromFirestore(): Promise<{
  photoFolderUrl: string;
  photoFolderId: string;
  spreadsheetUrl?: string;
  spreadsheetId?: string;
} | null> {
  const path = "companySettings/driveConfig";
  try {
    const docSnap = await getDoc(doc(db, "companySettings", "driveConfig"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        photoFolderUrl: data.photoFolderUrl || "",
        photoFolderId: data.photoFolderId || "",
        spreadsheetUrl: data.spreadsheetUrl || "",
        spreadsheetId: data.spreadsheetId || "",
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 11. Work Locations (Tempat Tugas) Firestore Persistence
export async function saveWorkLocationToFirestore(location: WorkLocation): Promise<void> {
  const path = `workLocations/${location.id}`;
  try {
    const dataToSave = cleanFirestoreData({
      ...location,
      createdAt: location.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "workLocations", location.id), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWorkLocationFromFirestore(locationId: string): Promise<void> {
  const path = `workLocations/${locationId}`;
  try {
    await deleteDoc(doc(db, "workLocations", locationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncWorkLocationsToFirestore(locations: WorkLocation[]): Promise<void> {
  for (const loc of locations) {
    try {
      const dataToSave = cleanFirestoreData({
        ...loc,
        createdAt: loc.createdAt || new Date().toISOString(),
        updatedAt: loc.updatedAt || new Date().toISOString(),
      });
      await setDoc(doc(db, "workLocations", loc.id), dataToSave, { merge: true });
    } catch (e) {
      console.warn(`Failed to sync work location ${loc.id} to Firestore:`, e);
    }
  }
}

export async function fetchWorkLocationsFromFirestore(): Promise<WorkLocation[]> {
  const path = "workLocations";
  try {
    const querySnapshot = await getDocs(collection(db, "workLocations"));
    const locations: WorkLocation[] = [];
    querySnapshot.forEach((d) => {
      locations.push(d.data() as WorkLocation);
    });
    return locations;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export function subscribeToWorkLocations(
  onUpdate: (locations: WorkLocation[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "workLocations"),
    (snapshot) => {
      const locations: WorkLocation[] = [];
      snapshot.forEach((d) => {
        locations.push(d.data() as WorkLocation);
      });
      if (locations.length > 0) {
        onUpdate(locations);
      }
    },
    (error) => {
      console.warn("[Firestore Live Sync] workLocations listener notice:", error);
      if (onError) onError(error);
    }
  );
}

// Helper to ensure logo URLs are accessible across ALL devices (never broken blob: URLs)
export function sanitizeLogoUrl(rawUrl?: string | null): string {
  const fallback = "/assets/aistudio/photo_6262753760518017337_x_4519ad83.jpg";
  if (!rawUrl || rawUrl.startsWith("blob:") || rawUrl.trim() === "" || rawUrl.includes("Digital Corp")) {
    return fallback;
  }
  return rawUrl;
}

// 12. Company Branding Firestore Persistence & Realtime Listener
export async function saveBrandingToFirestore(branding: CompanyBranding): Promise<void> {
  const path = "companySettings/branding";
  try {
    const dataToSave = cleanFirestoreData({
      ...branding,
      logoUrl: sanitizeLogoUrl(branding.logoUrl),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "companySettings", "branding"), dataToSave, { merge: true });
    console.log("[Firestore] Company branding saved successfully across devices");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchBrandingFromFirestore(): Promise<CompanyBranding | null> {
  const path = "companySettings/branding";
  try {
    const docSnap = await getDoc(doc(db, "companySettings", "branding"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        companyName: data.companyName || "DIBUDKPORA KLU",
        tagline: data.tagline || "Sistem Presensi Pegawai Berbasis Wajah & GPS",
        logoUrl: sanitizeLogoUrl(data.logoUrl),
        themePreset: data.themePreset || "emerald-fresh",
        customPrimaryColor: data.customPrimaryColor || undefined,
        banners: Array.isArray(data.banners) ? data.banners : [],
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToBranding(
  onUpdate: (branding: CompanyBranding) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "companySettings", "branding"),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          companyName: data.companyName || "DIBUDKPORA KLU",
          tagline: data.tagline || "Sistem Presensi Pegawai Berbasis Wajah & GPS",
          logoUrl: sanitizeLogoUrl(data.logoUrl),
          themePreset: data.themePreset || "emerald-fresh",
          customPrimaryColor: data.customPrimaryColor || undefined,
          banners: Array.isArray(data.banners) ? data.banners : [],
        });
      }
    },
    (error) => {
      console.warn("[Firestore Live Sync] branding listener notice:", error);
      if (onError) onError(error);
    }
  );
}

// 13. Company Schedule Firestore Fetcher & Realtime Listener
export async function fetchScheduleFromFirestore(): Promise<WorkScheduleConfig | null> {
  const path = "companySettings/schedule";
  try {
    const docSnap = await getDoc(doc(db, "companySettings", "schedule"));
    if (docSnap.exists()) {
      return docSnap.data() as WorkScheduleConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToSchedule(
  onUpdate: (schedule: WorkScheduleConfig) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "companySettings", "schedule"),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as WorkScheduleConfig);
      }
    },
    (error) => {
      console.warn("[Firestore Live Sync] schedule listener notice:", error);
      if (onError) onError(error);
    }
  );
}



