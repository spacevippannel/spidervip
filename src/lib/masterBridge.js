export const MASTER_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA63yj2ToxWkILydPscFQtXgPLO7G1UUbg",
  authDomain: "ar-lua.firebaseapp.com",
  databaseURL: "https://ar-lua-default-rtdb.firebaseio.com",
  projectId: "ar-lua",
  storageBucket: "ar-lua.firebasestorage.app",
  messagingSenderId: "1006270457461",
  appId: "1:1006270457461:web:c077004fa5beaea4e33a3c"
};

const MASTER_RTDB_BASE = MASTER_FIREBASE_CONFIG.databaseURL;

export async function mirrorKeyToMaster(keyString, keyData) {
  try {
    const payload = {
      ...keyData,
      clientProject: "spacevip-2c0d6",
      source: "control_web",
      project: "space_vip",
      syncedAt: Date.now()
    };

    await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => null);

    await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: keyString,
        rawKey: keyString,
        keyMasked: keyString.length > 5 ? `${keyString.slice(0, 3)}****${keyString.slice(-3)}` : keyString,
        customerName: keyData.note || keyData.telegramId || "Client Web Key",
        customerNote: keyData.telegramId || keyData.note || "Created in Client Web",
        status: keyData.status || "active",
        deviceLimit: keyData.deviceLimit || 1,
        devicesCount: 0,
        devices: keyData.devices || {},
        expiresAt: keyData.expiresAt || 0,
        expiresAtFormatted: keyData.expiresAtFormatted || (keyData.expiresAt ? new Date(keyData.expiresAt).toLocaleString() : "Lifetime"),
        createdAt: keyData.createdAt || Date.now(),
        updatedAt: Date.now(),
        project: "space_vip",
        source: "control_web",
        createdBy: "Client Web Admin (spacevip-2c0d6)"
      })
    }).catch(() => null);

    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await fetch(`${MASTER_RTDB_BASE}/luashield/audit_logs/${auditId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: auditId,
        action: "CLIENT_CREATE_KEY",
        actor: "Client Web Admin",
        target: keyString,
        details: `Client web created key: ${keyString} for ${keyData.note || "VIP Member"}`,
        timestamp: Date.now(),
        project: "space_vip"
      })
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge mirror:", err);
  }
}

export async function mirrorUpdateToMaster(keyString, updateFields) {
  try {
    await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateFields)
    }).catch(() => null);

    await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updateFields,
        updatedAt: Date.now()
      })
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge update mirror:", err);
  }
}

export async function mirrorDeleteToMaster(keyString) {
  try {
    const checkRes = await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}.json`).catch(() => null);
    if (checkRes && checkRes.ok) {
      const data = await checkRes.json();
      if (data && (data.source === "space_vip_panel" || data.createdBy === "Space VIP Master")) {
        console.warn(`[MasterBridge] Protected Owner Key: ${keyString} cannot be deleted by client web.`);
        return;
      }
    }

    const licRes = await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}.json`).catch(() => null);
    if (licRes && licRes.ok) {
      const licData = await licRes.json();
      if (licData && (licData.source === "space_vip_panel" || licData.createdBy === "Space VIP Master")) {
        console.warn(`[MasterBridge] Protected Owner License: ${keyString} cannot be deleted by client web.`);
        return;
      }
    }

    await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}.json`, {
      method: "DELETE"
    }).catch(() => null);

    await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}.json`, {
      method: "DELETE"
    }).catch(() => null);

    const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await fetch(`${MASTER_RTDB_BASE}/luashield/audit_logs/${auditId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: auditId,
        action: "CLIENT_DELETE_KEY",
        actor: "Client Web Admin",
        target: keyString,
        details: `Client web deleted client key from both Firebases: ${keyString}`,
        timestamp: Date.now(),
        project: "space_vip"
      })
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge delete mirror:", err);
  }
}

export async function mirrorDeviceUpdateToMaster(keyString, deviceId, deviceUpdate) {
  try {
    const safeId = deviceId.replace(/[\.#$\[\]\/]/g, "_");
    await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}/devices/${encodeURIComponent(safeId)}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceUpdate)
    }).catch(() => null);

    await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}/devices/${encodeURIComponent(safeId)}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceUpdate)
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge device mirror:", err);
  }
}

export async function mirrorDeviceDeleteToMaster(keyString, deviceId) {
  try {
    const safeId = deviceId.replace(/[\.#$\[\]\/]/g, "_");
    await fetch(`${MASTER_RTDB_BASE}/keys/${encodeURIComponent(keyString)}/devices/${encodeURIComponent(safeId)}.json`, {
      method: "DELETE"
    }).catch(() => null);

    await fetch(`${MASTER_RTDB_BASE}/luashield/licenses/${encodeURIComponent(keyString)}/devices/${encodeURIComponent(safeId)}.json`, {
      method: "DELETE"
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge device delete mirror:", err);
  }
}

export async function mirrorMaintenanceToMaster(maintData) {
  try {
    await fetch(`${MASTER_RTDB_BASE}/luashield/maintenance.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintData)
    }).catch(() => null);
  } catch (err) {
    console.warn("Master bridge maintenance mirror:", err);
  }
}

