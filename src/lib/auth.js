import { ref, get, set } from "firebase/database";
import { db } from "./firebase";

const ADMIN_CONFIG_PATH = "admin_config";
const SESSION_KEY = "spider_admin_session";
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const DEFAULT_CREDENTIALS = {
  adminId: "admin",
  adminPass: "admin123",
  updatedAt: 0
};

export async function getAdminConfig() {
  try {
    const snapshot = await get(ref(db, ADMIN_CONFIG_PATH));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const currentConfig = {
        adminId: data.adminId || DEFAULT_CREDENTIALS.adminId,
        adminPass: data.adminPass || DEFAULT_CREDENTIALS.adminPass,
        updatedAt: data.updatedAt || 0
      };
      if (!data.updatedAt) {
        const initTime = Date.now();
        currentConfig.updatedAt = initTime;
        await set(ref(db, ADMIN_CONFIG_PATH), currentConfig);
      }
      return currentConfig;
    } else {
      const initTime = Date.now();
      await set(ref(db, ADMIN_CONFIG_PATH), {
        adminId: DEFAULT_CREDENTIALS.adminId,
        adminPass: DEFAULT_CREDENTIALS.adminPass,
        updatedAt: initTime
      });
      return {
        ...DEFAULT_CREDENTIALS,
        updatedAt: initTime
      };
    }
  } catch (error) {
    console.warn("Could not reach Firebase for admin_config, using fallback:", error);
    return DEFAULT_CREDENTIALS;
  }
}

export async function verifyAdminCredentials(inputAdminId, inputPassword) {
  if (!inputAdminId || !inputPassword) return { valid: false };
  const config = await getAdminConfig();
  const idMatch = config.adminId.trim().toLowerCase() === inputAdminId.trim().toLowerCase();
  const passMatch = String(config.adminPass) === String(inputPassword);

  if (idMatch && passMatch) {
    let epoch = config.updatedAt;
    if (!epoch || epoch === 0) {
      epoch = Date.now();
      try {
        await set(ref(db, `${ADMIN_CONFIG_PATH}/updatedAt`), epoch);
      } catch (e) {}
    }
    return {
      valid: true,
      adminId: config.adminId,
      authEpoch: epoch
    };
  }

  return { valid: false };
}

export async function updateAdminConfig(newAdminId, newAdminPass) {
  if (!newAdminId || !newAdminPass) {
    throw new Error("Admin ID and Password cannot be empty.");
  }
  const cleanId = newAdminId.trim();
  const cleanPass = String(newAdminPass).trim();
  const changeTimestamp = Date.now();

  await set(ref(db, ADMIN_CONFIG_PATH), {
    adminId: cleanId,
    adminPass: cleanPass,
    updatedAt: changeTimestamp
  });

  clearSession();
  return { success: true, timestamp: changeTimestamp };
}

export function saveSession(adminId, authEpoch) {
  if (typeof window === "undefined") return;
  const sessionData = {
    adminId: adminId,
    authEpoch: authEpoch || Date.now(),
    loginTime: Date.now()
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error("Failed to store session:", e);
  }
}

export function getStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function checkSession(currentConfig) {
  const session = getStoredSession();
  if (!session) return { valid: false };

  const now = Date.now();
  if (!session.loginTime || now - session.loginTime > SESSION_TIMEOUT_MS) {
    clearSession();
    return { valid: false, reason: "expired" };
  }

  if (currentConfig && currentConfig.updatedAt) {
    if (!session.authEpoch || session.authEpoch < currentConfig.updatedAt) {
      clearSession();
      return { valid: false, reason: "password_changed" };
    }
  }

  return { valid: true, adminId: session.adminId, authEpoch: session.authEpoch };
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

export const MASTER_BOSS_EMAIL = "linuxdevrahul@gmail.com";
const MASTER_BOSS_SESSION_KEY = "spider_arboss_session";

export function verifyMasterEmail(inputEmail) {
  if (!inputEmail) return false;
  return inputEmail.trim().toLowerCase() === MASTER_BOSS_EMAIL.toLowerCase();
}

export function saveMasterSession() {
  if (typeof window === "undefined") return;
  try {
    const sessionData = {
      email: MASTER_BOSS_EMAIL,
      unlockedAt: Date.now()
    };
    sessionStorage.setItem(MASTER_BOSS_SESSION_KEY, JSON.stringify(sessionData));
    localStorage.setItem(MASTER_BOSS_SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {}
}

export function checkMasterSession() {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(MASTER_BOSS_SESSION_KEY) || localStorage.getItem(MASTER_BOSS_SESSION_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return Boolean(data && data.email && data.email.toLowerCase() === MASTER_BOSS_EMAIL.toLowerCase());
  } catch (e) {
    return false;
  }
}

export function clearMasterSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(MASTER_BOSS_SESSION_KEY);
    localStorage.removeItem(MASTER_BOSS_SESSION_KEY);
  } catch (e) {}
}
