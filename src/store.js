const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let storeCache = null;
let initPromise = null;

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const EMPTY_STORE = {
  users: [],
  applications: [],
  dtrEntries: [],
  schoolActivities: [],
  messages: [],
  // Merge all fields from both branches
  emailTemplates: typeof EMAIL_TEMPLATES !== 'undefined' ? [...EMAIL_TEMPLATES] : [],
  companyDocuments: [],
  deptSlots: {
    'Marketing': 5,
    'IT / Development': 3,
    'Human Resources': 4,
    'Finance': 2,
    'Operations': 5,
    'Legal': 1,
    'Creative / Design': 3,
    'Admin Support': 4
  },
  quarterSettings: { current: 'Q2-2026' },
  legacyInterns: []
};

function normalizeStore(data) {
  const normalized = data && typeof data === 'object' ? { ...data } : {};
  normalized.users = Array.isArray(normalized.users) ? normalized.users : [];
  normalized.applications = Array.isArray(normalized.applications) ? normalized.applications : [];
  normalized.dtrEntries = Array.isArray(normalized.dtrEntries) ? normalized.dtrEntries : [];
  normalized.schoolActivities = Array.isArray(normalized.schoolActivities) ? normalized.schoolActivities : [];
  normalized.messages = Array.isArray(normalized.messages) ? normalized.messages : [];
  normalized.emailTemplates = Array.isArray(normalized.emailTemplates) ? normalized.emailTemplates : [];
  normalized.companyDocuments = Array.isArray(normalized.companyDocuments) ? normalized.companyDocuments : [];
  normalized.deptSlots = normalized.deptSlots && typeof normalized.deptSlots === 'object'
    ? normalized.deptSlots
    : {};
  normalized.quarterSettings = normalized.quarterSettings && typeof normalized.quarterSettings === 'object'
    ? normalized.quarterSettings
    : { current: null };
  return normalized;
}

function buildEmptyStore() {
  return normalizeStore(EMPTY_STORE);
}

async function persistStore() {
  if (!storeCache) return;
  try {
    await apiFetch('/api/store', {
      method: 'PUT',
      body: JSON.stringify(storeCache),
    });
  } catch (error) {
    console.warn('Failed to persist store data.', error);
  }
}

export async function initStore() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const remote = await apiFetch('/api/store');
      storeCache = normalizeStore(remote);
    } catch (error) {
      console.warn('Failed to load store data.', error);
      storeCache = buildEmptyStore();
    }
    return storeCache;
  })();
  return initPromise;
}

export function getStore() {
  if (!storeCache) {
    storeCache = buildEmptyStore();
  }
  return storeCache;
}

export function saveStore(data) {
  storeCache = normalizeStore(data);
  void persistStore();
  return storeCache;
}

// Auth helpers
export function loginUser(email, password, role) {
  const data = getStore();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  if (role === 'hr' && user.role !== 'hr') return null;
  if (role === 'intern' && user.role === 'hr') return null;
  return user;
}

export function registerUser({ name, email, password, phone }) {
  const data = getStore();
  if (data.users.find(u => u.email === email)) return { error: 'Email already registered' };
  const user = { id: makeId('user'), email, password, name, phone, role: 'applicant' };
  data.users.push(user);
  saveStore(data);
  return { user };
}

// Application helpers
export function submitApplication(userId, formData) {
  const data = getStore();
  const now = new Date();
  const q = getQuarter(now);
  const app = {
    id: makeId('app'),
    userId,
    ...formData,
    status: 'submitted',
    appliedDate: now.toISOString().split('T')[0],
    quarter: q,
    isDeployed: false,
    companyDocs: {},
    schoolDocs: [],
  };
  data.applications.push(app);
  saveStore(data);
  return app;
}

export function getApplication(userId) {
  const data = getStore();
  return data.applications.find(a => a.userId === userId);
}

export function updateAppStatus(appId, status, extra = {}) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return;
  app.status = status;
  Object.assign(app, extra);
  if (status === 'accepted') {
    const user = data.users.find(u => u.id === app.userId);
    if (user) user.role = 'intern';
  }
  saveStore(data);
  return app;
}

export function deployIntern(appId) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (app) app.isDeployed = true;
  saveStore(data);
  return app;
}

// DTR helpers
export function addDtrEntry(appId, entry) {
  const data = getStore();
  const dtr = { id: makeId('dtr'), appId, ...entry, type: 'work' };
  data.dtrEntries.push(dtr);
  saveStore(data);
  return dtr;
}

export function getDtrEntries(appId) {
  const data = getStore();
  return data.dtrEntries.filter(d => d.appId === appId);
}

export function addSchoolActivity(appId, entry) {
  const data = getStore();
  if (!data.schoolActivities) data.schoolActivities = [];
  const sa = { id: makeId('sa'), appId, ...entry, status: 'pending', type: 'school' };
  data.schoolActivities.push(sa);
  saveStore(data);
  return sa;
}

export function getSchoolActivities(appId) {
  const data = getStore();
  return (data.schoolActivities || []).filter(s => s.appId === appId);
}

export function approveSchoolActivity(saId, approve) {
  const data = getStore();
  const sa = (data.schoolActivities || []).find(s => s.id === saId);
  if (sa) sa.status = approve ? 'approved' : 'rejected';
  saveStore(data);
}

// Message helpers
export function getMessages(appId) {
  const data = getStore();
  return data.messages.filter(m => m.appId === appId);
}

export function sendMessage(appId, from, text) {
  const data = getStore();
  const msg = { id: makeId('msg'), appId, from, text, time: new Date().toLocaleString() };
  data.messages.push(msg);
  saveStore(data);
  return msg;
}

// Document helpers
export function updateDocStatus(appId, docId, status) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return;
  if (!app.companyDocs) app.companyDocs = {};
  app.companyDocs[docId] = status;
  saveStore(data);
}

export function addSchoolDoc(appId, doc) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return;
  if (!app.schoolDocs) app.schoolDocs = [];
  app.schoolDocs.push({ id: makeId('sd'), ...doc, status: 'submitted', signedBy: null });
  saveStore(data);
}

export function signSchoolDoc(appId, docId, signerName) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return;
  const doc = (app.schoolDocs || []).find(d => d.id === docId);
  if (doc) { doc.status = 'signed'; doc.signedBy = signerName; }
  saveStore(data);
}

// Utility
export function getQuarter(date) {
  const d = date instanceof Date ? date : new Date(date);
  const m = d.getMonth();
  const q = m < 3 ? 'Q1' : m < 6 ? 'Q2' : m < 9 ? 'Q3' : 'Q4';
  return `${q}-${d.getFullYear()}`;
}

export function addLegacyIntern(data) {
  const store = getStore();
  if (!store.legacyInterns) store.legacyInterns = [];
  const entry = { id: 'leg' + Date.now(), ...data, addedAt: new Date().toISOString() };
  store.legacyInterns.push(entry);
  saveStore(store);
  return entry;
}

export function computeHours(timeIn, timeOut) {
  const start = new Date(`2000-01-01T${timeIn}`);
  const end = new Date(`2000-01-01T${timeOut}`);

  if (end <= start) return { regular: 0, overtime: 0, total: 0 };

  let totalMs = end - start;

  // Precise Lunch Deduction (12:00 - 13:00)
  const lunchStart = new Date(`2000-01-01T12:00`);
  const lunchEnd = new Date(`2000-01-01T13:00`);

  const overlapStart = new Date(Math.max(start, lunchStart));
  const overlapEnd = new Date(Math.min(end, lunchEnd));
  const overlapMs = Math.max(0, overlapEnd - overlapStart);

  let netHours = (totalMs - overlapMs) / (1000 * 60 * 60);

  let regular = Math.min(netHours, 8);
  let overtime = Math.max(netHours - 8, 0);

  // Overtime Rules: Min 0.5, Max 2.0, 0.5 increments
  if (overtime < 0.5) {
    overtime = 0;
  } else {
    overtime = Math.min(2, Math.floor(overtime * 2) / 2);
  }

  return { regular, overtime, total: regular + overtime };
}

export function formatHours(h) {
  if (h === Math.floor(h)) return h.toString();
  const dec = h - Math.floor(h);
  if (Math.abs(dec - 0.5) < 0.01) return Math.floor(h) + '.5';
  return h.toFixed(1).replace(/\.0$/, '');
}

export function getDepartments() {
  const data = getStore();
  return Object.keys(data.deptSlots || {});
}

export function getCompanyDocuments() {
  const data = getStore();
  return Array.isArray(data.companyDocuments) ? data.companyDocuments : [];
}
