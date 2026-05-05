const DEFAULT_BASE = "http://localhost:8080";

export async function hashPassword(password) {
  const buf = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, "");
  }
  return DEFAULT_BASE;
}

const TOKEN_KEY = "soda_auth_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function authHeaders(token) {
  const t = token ?? getStoredToken();
  const headers = { "Content-Type": "application/json" };
  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }
  return headers;
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  const { method = "GET", body, token, skipAuth, extraHeaders } = options;
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = skipAuth
    ? { "Content-Type": "application/json" }
    : authHeaders(token);

  if (extraHeaders) {
    Object.assign(headers, extraHeaders);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error || data.detail)) ||
      res.statusText ||
      "Request failed";
    const err = new Error(typeof message === "string" ? message : "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export async function login(username, password) {
  const hashed = await hashPassword(password);
  return request("/api/auth/login", {
    method: "POST",
    body: { username, password: hashed },
    skipAuth: true,
  });
}

export async function getStatus(token) {
  return request("/api/soda", { method: "GET", token });
}

export async function takeSoda(username, token, sodaType) {
  const body = { username };
  if (sodaType) body.sodaType = sodaType;
  return request("/api/soda/take", { method: "POST", body, token });
}

export async function refillSoda(username, quantity, cost, token, sodaType) {
  const body = { username, quantity, cost };
  if (sodaType) body.sodaType = sodaType;
  return request("/api/soda/refill", { method: "POST", body, token });
}

export async function getUsers(token) {
  return request("/api/admin/users", { method: "GET", token });
}

export async function changePassword(currentPassword, newPassword, token) {
  return request("/api/user/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
    token,
  });
}

export async function addUser(name, admin, token, adminPassword) {
  return request("/api/admin/users", {
    method: "POST",
    body: { name, admin },
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export async function removeUser(username, token, adminPassword) {
  return request(`/api/admin/users/${encodeURIComponent(username)}`, {
    method: "DELETE",
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export async function verifyAdmin(password, token) {
  return request("/api/admin/verify", {
    method: "POST",
    body: { password },
    token,
  });
}

export async function updateUserStats(
  username,
  sodasTaken,
  sodasRefilled,
  totalMoneySpentOnRefills,
  token,
  adminPassword,
) {
  return request(`/api/admin/users/${encodeURIComponent(username)}/stats`, {
    method: "PATCH",
    body: { sodasTaken, sodasRefilled, totalMoneySpentOnRefills },
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export async function getSodaTypes(token) {
  return request("/api/admin/soda-types", { method: "GET", token });
}

export async function addSodaType(name, color, token, adminPassword) {
  return request("/api/admin/soda-types", {
    method: "POST",
    body: { name, color },
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export async function removeSodaType(name, token, adminPassword) {
  return request(`/api/admin/soda-types/${encodeURIComponent(name)}`, {
    method: "DELETE",
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export async function setSodaStock(stockBySodaType, token, adminPassword) {
  return request("/api/admin/soda-stock", {
    method: "PUT",
    body: { stock: stockBySodaType },
    token,
    extraHeaders: { "X-Admin-Password": adminPassword },
  });
}

export function capitalize(value) {
  if (!value) return "";
  const str = String(value);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function splitUsername(username) {
  if (!username) return { first: "", last: "" };
  const str = String(username);
  const dot = str.indexOf(".");
  if (dot < 0) return { first: str, last: "" };
  return { first: str.slice(0, dot), last: str.slice(dot + 1) };
}

export function displayName(username) {
  if (!username) return "";
  const { first } = splitUsername(username);
  return capitalize(first || username);
}

export function hasFirstNameCollision(username, allUsernames) {
  if (!username || !Array.isArray(allUsernames)) return false;
  const { first, last } = splitUsername(username);
  if (!last) return false;
  const target = first.toLowerCase();
  const self = String(username).toLowerCase();
  return allUsernames.some((u) => {
    if (!u) return false;
    if (String(u).toLowerCase() === self) return false;
    return splitUsername(u).first.toLowerCase() === target;
  });
}

export function isStockLow(remainingStock, participantCount) {
  const stock = Number(remainingStock);
  const count = Number(participantCount);
  if (!Number.isFinite(stock) || !Number.isFinite(count) || count <= 0) return false;
  return stock < count;
}

export function getNextRefiller(participants) {
  if (!Array.isArray(participants) || participants.length === 0) return null;
  return [...participants].sort((a, b) => {
    const aNet = a.netBalance ?? 0;
    const bNet = b.netBalance ?? 0;
    if (aNet !== bNet) return aNet - bNet;
    return (b.sodasTaken ?? 0) - (a.sodasTaken ?? 0);
  })[0];
}

export function contributionRatioScore(participant) {
  const taken = Number(participant?.sodasTaken) || 0;
  const contrib = Number(participant?.sodasContributed) || 0;
  const total = taken + contrib;
  if (total === 0) {
    return { score: 0, ratio: null, label: "—" };
  }
  const score = (contrib - taken) / total;
  if (taken === 0) {
    return { score, ratio: Infinity, label: "∞×" };
  }
  return { score, ratio: contrib / taken, label: `${(contrib / taken).toFixed(2)}×` };
}

export function normalizeStatus(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      remainingStock: 0,
      participants: [],
      activities: [],
      sodaTypes: [],
      stockBySodaType: {},
    };
  }

  const participants = (Array.isArray(raw.users) ? raw.users : []).map((p) => {
    const sodasTaken = p.sodasTaken ?? 0;
    const sodasContributed = p.sodasRefilled ?? 0;
    return {
      username: p.username ?? "",
      sodasTaken,
      sodasContributed,
      moneySpent: p.totalMoneySpentOnRefills ?? 0,
      netBalance: sodasContributed - sodasTaken,
    };
  });

  const activities = (Array.isArray(raw.recentEvents) ? raw.recentEvents : [])
    .slice(-20)
    .reverse()
    .map((a, idx) => {
      const type = (a.type ?? "").toUpperCase();
      return {
        id: `${a.timestamp}-${idx}`,
        timestamp: a.timestamp ? String(a.timestamp) : "",
        type,
        sodaType: a.sodaType ?? "",
        username: a.username ?? "",
        quantity: a.quantity ?? 0,
        cost: a.cost ?? 0,
      };
    });

  return {
    remainingStock: raw.totalSodasRemaining ?? 0,
    participants,
    activities,
    sodaTypes: Array.isArray(raw.sodaTypes) ? raw.sodaTypes : [],
    stockBySodaType:
      raw.stockBySodaType && typeof raw.stockBySodaType === "object"
        ? raw.stockBySodaType
        : {},
  };
}

export function normalizeLoginResponse(data) {
  if (!data || typeof data !== "object") {
    return { token: null, user: null };
  }
  return {
    token: data.token ? String(data.token) : null,
    user: data.username
      ? { username: String(data.username), role: data.role ? String(data.role) : null }
      : null,
  };
}

export function normalizeUsersList(data) {
  return Array.isArray(data) ? data : [];
}
