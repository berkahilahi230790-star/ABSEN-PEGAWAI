import { AttendanceRecord } from "../types";
import { getAccessToken } from "./googleAuth";

const STORAGE_SHEET_ID_KEY = "presensigo_google_spreadsheet_id";
const STORAGE_SHEET_URL_KEY = "presensigo_google_spreadsheet_url";
const STORAGE_AUTO_SYNC_KEY = "presensigo_google_auto_sync";
const STORAGE_DRIVE_FOLDER_ID_KEY = "presensigo_google_drive_folder_id";
const STORAGE_DRIVE_FOLDER_URL_KEY = "presensigo_google_drive_folder_url";
const STORAGE_DRIVE_PHOTO_FOLDER_ID_KEY = "presensigo_google_drive_photo_folder_id";
const STORAGE_DRIVE_PHOTO_FOLDER_URL_KEY = "presensigo_google_drive_photo_folder_url";

export interface GoogleSpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSynced?: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  size?: string;
}

export function extractDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Standard format: drive.google.com/drive/folders/ID or /drive/u/0/folders/ID
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Format with id query param: drive.google.com/open?id=ID or ?id=ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  // Raw folder ID check (typically 15-45 characters alphanumeric with dashes and underscores)
  const cleanId = trimmed.split(/[?#/]/).filter(Boolean).pop();
  if (cleanId && /^[a-zA-Z0-9_-]{15,}$/.test(cleanId)) return cleanId;
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) return trimmed;
  return null;
}

export function getStoredDriveFolderId(): string | null {
  try {
    return localStorage.getItem(STORAGE_DRIVE_FOLDER_ID_KEY);
  } catch {
    return null;
  }
}

export function getStoredDriveFolderUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_DRIVE_FOLDER_URL_KEY);
  } catch {
    return null;
  }
}

export function setStoredDriveFolder(urlOrId: string): void {
  try {
    const trimmed = urlOrId.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_DRIVE_FOLDER_ID_KEY);
      localStorage.removeItem(STORAGE_DRIVE_FOLDER_URL_KEY);
      return;
    }
    const folderId = extractDriveFolderId(trimmed);
    if (folderId) {
      localStorage.setItem(STORAGE_DRIVE_FOLDER_ID_KEY, folderId);
      const url = trimmed.startsWith("http")
        ? trimmed
        : `https://drive.google.com/drive/folders/${folderId}`;
      localStorage.setItem(STORAGE_DRIVE_FOLDER_URL_KEY, url);
    }
  } catch {}
}

export function getStoredPhotoDriveFolderId(): string | null {
  try {
    return localStorage.getItem(STORAGE_DRIVE_PHOTO_FOLDER_ID_KEY);
  } catch {
    return null;
  }
}

export function getStoredPhotoDriveFolderUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_DRIVE_PHOTO_FOLDER_URL_KEY);
  } catch {
    return null;
  }
}

export function setStoredPhotoDriveFolder(urlOrId: string): void {
  try {
    const trimmed = urlOrId.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_DRIVE_PHOTO_FOLDER_ID_KEY);
      localStorage.removeItem(STORAGE_DRIVE_PHOTO_FOLDER_URL_KEY);
      return;
    }
    const folderId = extractDriveFolderId(trimmed);
    if (folderId) {
      localStorage.setItem(STORAGE_DRIVE_PHOTO_FOLDER_ID_KEY, folderId);
      const url = trimmed.startsWith("http")
        ? trimmed
        : `https://drive.google.com/drive/folders/${folderId}`;
      localStorage.setItem(STORAGE_DRIVE_PHOTO_FOLDER_URL_KEY, url);
    }
  } catch {}
}

export function getStoredSpreadsheetId(): string | null {
  try {
    return localStorage.getItem(STORAGE_SHEET_ID_KEY);
  } catch {
    return null;
  }
}

export function getStoredSpreadsheetUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_SHEET_URL_KEY);
  } catch {
    return null;
  }
}

export function getGoogleAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_AUTO_SYNC_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setGoogleAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_AUTO_SYNC_KEY, String(enabled));
  } catch {}
}

/**
 * Format status attendance into human-readable Indonesian text
 */
function formatStatus(status: string): string {
  switch (status) {
    case "tepat_waktu":
      return "Tepat Waktu";
    case "terlambat":
      return "Terlambat";
    case "izin":
      return "Izin";
    case "sakit":
      return "Sakit";
    case "alpa":
      return "Alpa / Tanpa Keterangan";
    default:
      return status;
  }
}

/**
 * Helper to get or create the attendance spreadsheet in Google Sheets
 */
export async function getOrCreateAttendanceSpreadsheet(
  customTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; isNew: boolean }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Token autentikasi Google tidak tersedia. Silakan masuk terlebih dahulu.");
  }

  // 1. Check if we have an existing spreadsheetId stored
  const existingId = getStoredSpreadsheetId();
  if (existingId) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${existingId}?fields=spreadsheetId,spreadsheetUrl,properties.title`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (checkRes.ok) {
        const data = await checkRes.json();
        const url = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${existingId}/edit`;
        localStorage.setItem(STORAGE_SHEET_URL_KEY, url);
        return { spreadsheetId: existingId, spreadsheetUrl: url, isNew: false };
      }
    } catch (e) {
      console.warn("Stored spreadsheet not accessible, searching or creating new:", e);
    }
  }

  // 2. Search in Google Drive for existing PresensiGo spreadsheet
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name contains 'PresensiGo - Rekap Absensi' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false&fields=files(id,name,webViewLink)&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const file = searchData.files[0];
        localStorage.setItem(STORAGE_SHEET_ID_KEY, file.id);
        localStorage.setItem(STORAGE_SHEET_URL_KEY, file.webViewLink);
        return { spreadsheetId: file.id, spreadsheetUrl: file.webViewLink, isNew: false };
      }
    }
  } catch (err) {
    console.warn("Drive search error, proceeding to create new sheet:", err);
  }

  // 3. Create a new Google Spreadsheet
  const title = customTitle || `PresensiGo - Rekap Absensi Pegawai (${new Date().getFullYear()})`;
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: "Rekap Presensi",
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.text();
    throw new Error(`Gagal membuat spreadsheet baru di Google Sheets: ${errBody}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  localStorage.setItem(STORAGE_SHEET_ID_KEY, spreadsheetId);
  localStorage.setItem(STORAGE_SHEET_URL_KEY, spreadsheetUrl);

  // 4. Initialize Headers & Styling
  const headers = [
    [
      "ID Presensi",
      "Tanggal",
      "Waktu Masuk",
      "Waktu Pulang",
      "ID Pegawai",
      "Nama Pegawai",
      "Departemen",
      "Status Kehadiran",
      "Jarak GPS",
      "Lokasi / Alamat",
      "Verifikasi Wajah AI",
      "Catatan",
      "Waktu Sinkronisasi",
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekap Presensi'!A1:M1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: "'Rekap Presensi'!A1:M1",
        values: headers,
      }),
    }
  );

  // Format header row (background blue #1e40af, bold white font)
  try {
    const firstSheetId = createdData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: firstSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 13,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.25, blue: 0.69 }, // dark blue
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: "CENTER",
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: firstSheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 13,
              },
            },
          },
        ],
      }),
    });
  } catch (formatErr) {
    console.warn("Could not apply batch styling to new sheet:", formatErr);
  }

  return { spreadsheetId, spreadsheetUrl, isNew: true };
}

/**
 * Append a single attendance record to the Google Sheet
 */
export async function appendAttendanceToSheet(
  record: AttendanceRecord
): Promise<{ success: boolean; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Token Google tidak aktif. Harap hubungkan akun Google terlebih dahulu.");
  }

  const { spreadsheetId, spreadsheetUrl } = await getOrCreateAttendanceSpreadsheet();

  const syncTime = new Date().toLocaleString("id-ID");
  const rowValues = [
    [
      record.id,
      record.date,
      record.checkInTime || "-",
      record.checkOutTime || "-",
      record.employeeId,
      record.employeeName,
      record.department,
      formatStatus(record.status),
      record.location
        ? `${record.location.distanceMeters}m (${record.location.inRadius ? "Dalam Radius" : "Luar Radius"})`
        : "-",
      record.location?.address || "-",
      record.verifiedByFace ? "Terverifikasi AI" : "Manual",
      record.notes || "-",
      syncTime,
    ],
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekap Presensi'!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: rowValues,
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.text();
    throw new Error(`Gagal menyimpan baris ke Google Sheets: ${err}`);
  }

  return { success: true, spreadsheetUrl };
}

/**
 * Sync all attendance records to the Google Sheet
 */
export async function syncAllAttendanceRecords(
  records: AttendanceRecord[]
): Promise<{ count: number; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Token Google tidak aktif. Harap hubungkan akun Google terlebih dahulu.");
  }

  const { spreadsheetId, spreadsheetUrl } = await getOrCreateAttendanceSpreadsheet();

  // Sort ascending by date & time for neat spreadsheet display
  const sorted = [...records].sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return (a.checkInTime || "").localeCompare(b.checkInTime || "");
  });

  const syncTime = new Date().toLocaleString("id-ID");
  const rows = sorted.map((r) => [
    r.id,
    r.date,
    r.checkInTime || "-",
    r.checkOutTime || "-",
    r.employeeId,
    r.employeeName,
    r.department,
    formatStatus(r.status),
    r.location
      ? `${r.location.distanceMeters}m (${r.location.inRadius ? "Dalam Radius" : "Luar Radius"})`
      : "-",
    r.location?.address || "-",
    r.verifiedByFace ? "Terverifikasi AI" : "Manual",
    r.notes || "-",
    syncTime,
  ]);

  // 1. Clear existing values from row 2 downwards
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekap Presensi'!A2:M1000:clear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (clearErr) {
    console.warn("Clear error (can proceed):", clearErr);
  }

  // 2. Insert rows
  if (rows.length > 0) {
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rekap Presensi'!A2:M${rows.length + 1}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          range: `'Rekap Presensi'!A2:M${rows.length + 1}`,
          values: rows,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Gagal memperbarui data Google Sheet: ${err}`);
    }
  }

  return { count: records.length, spreadsheetUrl };
}

/**
 * Upload a document or export file directly to Google Drive
 */
export async function uploadFileToGoogleDrive(
  filename: string,
  fileContent: Blob,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Token Google tidak aktif. Harap hubungkan akun Google terlebih dahulu.");
  }

  const folderId = getStoredDriveFolderId();

  // Helper to execute multipart upload
  const doUpload = async (useFolder: boolean) => {
    const metadata: any = {
      name: filename,
      description: "Laporan presensi pegawai PresensiGo HR",
      mimeType,
    };
    if (useFolder && folderId) {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" })
    );
    form.append("file", fileContent, filename);

    return fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );
  };

  let res = await doUpload(Boolean(folderId));

  // If specific folder failed (e.g. 404 or folder not found), fallback to root Drive
  if (!res.ok && folderId) {
    console.warn("Upload to specific Google Drive folder failed, retrying to root Drive...");
    res = await doUpload(false);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengunggah berkas ke Google Drive: ${errText}`);
  }

  const result = await res.json();
  const fileId = result.id;
  const webViewLink = result.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return { fileId, webViewLink };
}

/**
 * Upload an employee attendance verification photo to Google Drive
 * Saves storage in Firestore by only storing the Drive URL in the database
 */
export async function uploadAttendancePhotoToGoogleDrive(
  dataUrlOrBase64: string,
  employeeName: string,
  date: string,
  time: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  const token = await getAccessToken();
  if (!token) {
    console.warn("Google token not available for photo upload");
    return null;
  }

  try {
    let blob: Blob;
    if (dataUrlOrBase64.startsWith("data:")) {
      const parts = dataUrlOrBase64.split(";base64,");
      const mime = parts[0].split(":")[1] || "image/jpeg";
      const binary = atob(parts[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      blob = new Blob([array], { type: mime });
    } else {
      return null;
    }

    const cleanEmpName = employeeName.replace(/[^a-zA-Z0-9]/g, "_");
    const cleanTime = (time || "08-00-00").replace(/:/g, "-");
    const filename = `PresensiGo_Foto_${cleanEmpName}_${date}_${cleanTime}.jpg`;

    const folderId = getStoredPhotoDriveFolderId() || getStoredDriveFolderId();

    const doUpload = async (useFolder: boolean) => {
      const metadata: any = {
        name: filename,
        description: `Foto presensi wajah ${employeeName} pada tanggal ${date} (${time}) - PresensiGo HR`,
        mimeType: "image/jpeg",
      };
      if (useFolder && folderId) {
        metadata.parents = [folderId];
      }

      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json; charset=UTF-8" })
      );
      form.append("file", blob, filename);

      return fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );
    };

    let res = await doUpload(Boolean(folderId));
    if (!res.ok && folderId) {
      const folderErr = await res.text();
      console.warn(`Unggah ke folder (${folderId}) gagal (${res.status}: ${folderErr}), mencoba unggah ke My Drive root...`);
      res = await doUpload(false);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Google Drive photo upload failed:", errText);
      return null;
    }

    const json = await res.json();
    return {
      fileId: json.id,
      webViewLink: json.webViewLink || `https://drive.google.com/file/d/${json.id}/view`,
    };
  } catch (err) {
    console.warn("Exception during photo upload to Google Drive:", err);
    return null;
  }
}

/**
 * Verify whether the currently connected Google account can access and write to the specified Drive folder
 */
export async function verifyDriveFolderAccess(
  folderIdOrUrl: string
): Promise<{ success: boolean; folderName?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      error: "Akun Google Workspace belum terhubung. Silakan klik tombol 'Hubungkan Akun Google' terlebih dahulu.",
    };
  }
  const folderId = extractDriveFolderId(folderIdOrUrl);
  if (!folderId) {
    return {
      success: false,
      error: "Tautan atau ID folder Google Drive tidak valid.",
    };
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,capabilities,trashed`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error:
            "Folder tidak ditemukan di Google Drive atau akun yang sedang login belum diberi izin akses ke folder ini.",
        };
      }
      if (res.status === 403) {
        return {
          success: false,
          error:
            "Izin akses folder ditolak oleh Google. Pastikan folder dibagikan dengan hak 'Editor' ke akun Google yang terhubung.",
        };
      }
      const errText = await res.text();
      return { success: false, error: `Gagal mengakses folder (${res.status}): ${errText}` };
    }
    const data = await res.json();
    if (data.trashed) {
      return { success: false, error: "Folder ini berada di dalam Sampah (Trash) Google Drive." };
    }
    if (data.mimeType !== "application/vnd.google-apps.folder") {
      return { success: false, error: "Tautan yang dimasukkan mengarah ke berkas, bukan folder Google Drive." };
    }
    return { success: true, folderName: data.name };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal memverifikasi folder." };
  }
}

/**
 * List files created in Google Drive by PresensiGo
 */
export async function listDriveAttendanceFiles(): Promise<DriveFileInfo[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const q = encodeURIComponent(
      "trashed = false and (name contains 'PresensiGo' or mimeType = 'application/vnd.google-apps.spreadsheet')"
    );
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&pageSize=15&fields=files(id,name,mimeType,webViewLink,createdTime,size)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn("Failed to list Google Drive files:", err);
    return [];
  }
}
