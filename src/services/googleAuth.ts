import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Explicitly defined SCOPES array for Google Workspace integration
export const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const SESSION_TOKEN_KEY = "presensigo_google_access_token";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Workspace scopes
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: "select_account",
  access_type: "offline",
});

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;

// Access token cached in-memory and in sessionStorage for current tab session
let cachedAccessToken: string | null = null;
try {
  cachedAccessToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
} catch {}

let currentGoogleUser: User | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentGoogleUser = user;
    if (user) {
      if (!cachedAccessToken) {
        try {
          cachedAccessToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
        } catch {}
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      } catch {}
      currentGoogleUser = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal memperoleh access token dari Google Workspace Auth.");
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem(SESSION_TOKEN_KEY, credential.accessToken);
    } catch {}
    currentGoogleUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    if (error?.code === "auth/popup-closed-by-user") {
      throw new Error(
        "Jendela login Google ditutup. Pastikan Anda menyelesaikan proses login dan mencentang izin akses Google Drive & Google Sheets."
      );
    }
    if (error?.code === "auth/popup-blocked") {
      throw new Error(
        "Jendela pop-up login Google diblokir oleh browser. Harap izinkan pop-up (Always allow pop-ups) pada bilah alamat peramban Anda, lalu coba lagi."
      );
    }
    if (error?.code === "auth/cancelled-popup-request") {
      throw new Error(
        "Permintaan login sebelumnya dibatalkan karena ada proses baru yang dibuka. Silakan coba kembali."
      );
    }
    if (error?.code === "auth/unauthorized-domain") {
      throw new Error(
        `Domain aplikasi (${window.location.hostname}) belum diizinkan pada Firebase Auth Authorized Domains.`
      );
    }
    throw new Error(error?.message || "Gagal masuk dengan akun Google Workspace.");
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {}
  }
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return currentGoogleUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
  currentGoogleUser = null;
};
