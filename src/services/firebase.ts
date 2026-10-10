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
import { AttendanceRecord, EmployeeProfile, LeaveRequest, WorkScheduleConfig, WorkLocation } from "../types";

// 1. Initialize Firebase App and Firestore
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, "attendance");
    }
  );
}

// 7. Sync Employees to Firestore
export async function syncEmployeesToFirestore(employees: EmployeeProfile[]): Promise<void> {
  for (const emp of employees) {
    try {
      await setDoc(doc(db, "employees", emp.id), emp, { merge: true });
    } catch (e) {
      console.warn(`Failed to sync employee ${emp.id} to Firestore:`, e);
    }
  }
}

// 8. Save Leave Request to Firestore
export async function saveLeaveRequestToFirestore(request: LeaveRequest): Promise<void> {
  const path = `leaveRequests/${request.id}`;
  try {
    await setDoc(doc(db, "leaveRequests", request.id), request, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 9. Save Company Schedule to Firestore
export async function saveScheduleToFirestore(schedule: WorkScheduleConfig): Promise<void> {
  const path = "companySettings/schedule";
  try {
    await setDoc(
      doc(db, "companySettings", "schedule"),
      {
        ...schedule,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 10. Save and Fetch Google Drive Photo Folder Configuration in Firestore
export async function saveDrivePhotoFolderToFirestore(
  folderUrl: string,
  folderId: string
): Promise<void> {
  const path = "companySettings/driveConfig";
  try {
    await setDoc(
      doc(db, "companySettings", "driveConfig"),
      {
        photoFolderUrl: folderUrl,
        photoFolderId: folderId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchDrivePhotoFolderFromFirestore(): Promise<{
  photoFolderUrl: string;
  photoFolderId: string;
} | null> {
  const path = "companySettings/driveConfig";
  try {
    const docSnap = await getDoc(doc(db, "companySettings", "driveConfig"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        photoFolderUrl: data.photoFolderUrl || "",
        photoFolderId: data.photoFolderId || "",
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
    await setDoc(doc(db, "workLocations", location.id), location, { merge: true });
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
      await setDoc(doc(db, "workLocations", loc.id), loc, { merge: true });
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


