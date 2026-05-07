import { apiLogin, apiRegister } from './api.js';
// Local API driven store



function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export const DEPARTMENTS = [
  'Marketing',
  'IT / Development',
  'Human Resources',
  'Finance',
  'Operations',
  'Legal',
  'Creative / Design',
  'Admin Support',
];

const STORE_KEY = 'prime_nexus_store_v1';

const EMAIL_TEMPLATES = [
  { id: 'tmpl1', name: 'Application Received', subject: 'Application Received - PRIME Philippines', body: 'Dear {name},\n\nWe have received your application for the internship program. We will review it and get back to you soon.' },
  { id: 'tmpl2', name: 'Interview Invitation', subject: 'Interview Invitation - PRIME Philippines', body: 'Dear {name},\n\nWe would like to invite you for an initial interview on {date} at {time}.' },
  { id: 'tmpl3', name: 'Acceptance Letter', subject: 'Internship Acceptance - PRIME Philippines', body: 'Congratulations {name}!\n\nYou have been accepted into the PRIME Philippines Internship Program.' }
];

const COMPANY_DOCUMENTS = [
  { id: 'doc1', name: 'Non-Disclosure Agreement (NDA)', desc: 'Must be signed before deployment', type: 'sign' },
  { id: 'doc2', name: 'Internship Agreement', desc: 'Terms and conditions of the internship', type: 'sign' },
  { id: 'doc3', name: 'Company Rules & Regulations', desc: 'Acknowledgment of company policies', type: 'sign' },
  { id: 'doc4', name: 'Emergency Contact Form', desc: 'For emergency purposes', type: 'submit' },
  { id: 'doc5', name: 'Medical Certificate', desc: 'Fit to work certification', type: 'submit' },
];

const SEED_DATA = {
  users: [
    { id: 'hr1', email: 'hr@primeph.com', password: 'admin123', name: 'Maria Santos', role: 'hr' },
    { id: 'sup_it', email: 'sup.it@primeph.com', password: 'sup123', name: 'Jonel Belandres', role: 'supervisor', department: 'IT / Development' },
    { id: 'sup_mktg', email: 'sup.mktg@primeph.com', password: 'sup123', name: 'Franje Nuñez', role: 'supervisor', department: 'Marketing' },
    { id: 'sup_hr', email: 'sup.hr@primeph.com', password: 'sup123', name: 'Triscia Mae Ganzon', role: 'supervisor', department: 'Human Resources' },
    { id: 'sup_fin', email: 'sup.fin@primeph.com', password: 'sup123', name: 'Maria Clara', role: 'supervisor', department: 'Finance' },
    { id: 'sup_ops', email: 'sup.ops@primeph.com', password: 'sup123', name: 'Juan Santos', role: 'supervisor', department: 'Operations' },
    { id: 'sup_leg', email: 'sup.leg@primeph.com', password: 'sup123', name: 'Atty. Jose Rizal', role: 'supervisor', department: 'Legal' },
    { id: 'sup_cre', email: 'sup.cre@primeph.com', password: 'sup123', name: 'Antonio Luna', role: 'supervisor', department: 'Creative / Design' },
    { id: 'sup_adm', email: 'sup.adm@primeph.com', password: 'sup123', name: 'Emilio Aguinaldo', role: 'supervisor', department: 'Admin Support' },
  ],
  applications: [],
  dtrEntries: [],
  schoolActivities: [],
  messages: [],
  quarterSettings: { current: 'Q2-2026' },
  emailTemplates: [...EMAIL_TEMPLATES],
  companyDocuments: [...COMPANY_DOCUMENTS],
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
  legacyInterns: []
};

function generateSeedApplicants() {
  const now = new Date();
  const apps = [
    {
      id: 'app1', userId: 'u1', name: 'Juan Dela Cruz', email: 'juan@email.com', password: 'pass123', phone: '09171234567', course: 'BS Information Technology', school: 'University of the Philippines', ojtType: 'required', hoursRequired: 480, source: 'School/University Partner', status: 'accepted', appliedDate: '2026-03-15', quarter: 'Q1-2026', department: 'IT / Development', supervisor: 'Jonel Belandres', schedule: 'Mon-Fri, 8:00 AM - 5:00 PM', startDate: '2026-04-01',
      companyDocs: { doc1: 'signed', doc2: 'signed', doc3: 'submitted', doc4: 'pending', doc5: 'pending' },
      schoolDocs: [{ id: 'sd1', name: 'Endorsement Letter', status: 'submitted', signedBy: null }],
    },
    { id: 'app2', userId: 'u2', name: 'Ana Marie Garcia', email: 'ana@email.com', password: 'pass123', phone: '09181234567', course: 'BS Business Administration', school: 'De La Salle University', ojtType: 'voluntary', hoursRequired: 240, source: 'Facebook', status: 'final_interview', appliedDate: '2026-04-01', quarter: 'Q2-2026', interviewDate: '2026-05-05', interviewTime: '10:00 AM' },
    { id: 'app3', userId: 'u3', name: 'Mark Anthony Reyes', email: 'mark@email.com', password: 'pass123', phone: '09191234567', course: 'BS Computer Science', school: 'Ateneo de Manila University', ojtType: 'required', hoursRequired: 600, source: 'Referral', status: 'initial_interview', appliedDate: '2026-04-10', quarter: 'Q2-2026', interviewDate: '2026-04-30', interviewTime: '2:00 PM' },
    { id: 'app4', userId: 'u4', name: 'Sofia Lim', email: 'sofia@email.com', password: 'pass123', phone: '09201234567', course: 'BS Accountancy', school: 'University of Santo Tomas', ojtType: 'required', hoursRequired: 480, source: 'Job Portal', status: 'failed', appliedDate: '2026-03-20', quarter: 'Q1-2026' },
    { id: 'app5', userId: 'u5', name: 'Carlos Miguel Torres', email: 'carlos@email.com', password: 'pass123', phone: '09211234567', course: 'BS Marketing', school: 'Far Eastern University', ojtType: 'voluntary', hoursRequired: 300, source: 'Company Website', status: 'viewed', appliedDate: '2026-04-20', quarter: 'Q2-2026' },
    { id: 'app6', userId: 'u6', name: 'Isabella Cruz', email: 'bella@email.com', password: 'pass123', phone: '09221234567', course: 'BS Psychology', school: 'Mapua University', ojtType: 'required', hoursRequired: 480, source: 'School/University Partner', status: 'submitted', appliedDate: '2026-04-25', quarter: 'Q2-2026' },
  ];

  const users = apps.map(a => ({ id: a.userId, email: a.email, password: a.password, name: a.name, role: a.status === 'accepted' ? 'intern' : 'applicant' }));

  const dtrEntries = [
    { id: 'dtr1', appId: 'app1', date: '2026-04-01', timeIn: '08:00', timeOut: '17:30', type: 'work' },
    { id: 'dtr2', appId: 'app1', date: '2026-04-02', timeIn: '08:00', timeOut: '17:00', type: 'work' },
    { id: 'dtr3', appId: 'app1', date: '2026-04-03', timeIn: '08:00', timeOut: '18:00', type: 'work' },
    { id: 'dtr4', appId: 'app1', date: '2026-04-04', timeIn: '08:00', timeOut: '17:00', type: 'work' },
    { id: 'dtr5', appId: 'app1', date: '2026-04-07', timeIn: '08:30', timeOut: '17:30', type: 'work' },
  ];

  const messages = [
    { id: 'msg1', appId: 'app1', from: 'hr', text: 'Hi Juan! Please submit your Medical Certificate as soon as possible.', time: '2026-04-20 09:00' },
    { id: 'msg2', appId: 'app1', from: 'intern', text: 'Noted po! Will submit by Friday.', time: '2026-04-20 09:15' },
  ];

  return { users, applications: apps, dtrEntries, messages };
}


// --- HR BACKEND INTEGRATION ---
import {
  apiGetApplications,
  apiUpdateApplicationStatus,
  apiGetUsers,
  apiGetDtrEntries,
  apiAddDtrEntry,
  apiGetCompanyDocuments,
  apiAddCompanyDocument,
  apiUpdateDocStatus,
  apiSignSchoolDoc,
  apiGetMessages,
  apiSendMessage,
  apiGetEmailTemplates,
  apiSaveEmailTemplate,
  apiDeleteEmailTemplate,
  apiGetAnalytics,
  apiGetHistoricalRecords
} from './api.js';

// Remove getStore/saveStore for HR data. All data must come from backend APIs.

// Applications
export async function getApplications(params = {}) {
  return await apiGetApplications(params);
}
export async function updateAppStatus(appId, status, extra = {}) {
  return await apiUpdateApplicationStatus(appId, status, extra);
}

// Users
export async function getUsers(params = {}) {
  return await apiGetUsers(params);
}

// DTR
export async function getDtrEntries(appId) {
  return await apiGetDtrEntries(appId);
}
export async function addDtrEntry(appId, entry) {
  return await apiAddDtrEntry(appId, entry);
}

// Documents
export async function getCompanyDocuments() {
  return await apiGetCompanyDocuments();
}
export async function addCompanyDocument(doc) {
  return await apiAddCompanyDocument(doc);
}
export async function updateDocStatus(appId, docId, status) {
  return await apiUpdateDocStatus(appId, docId, status);
}
export async function signSchoolDoc(appId, docId, signerName) {
  return await apiSignSchoolDoc(appId, docId, signerName);
}

// Messages
export async function getMessages(appId) {
  return await apiGetMessages(appId);
}
export async function sendMessage(appId, from, text) {
  return await apiSendMessage(appId, from, text);
}

// Email Templates
export async function getEmailTemplates() {
  return await apiGetEmailTemplates();
}
export async function saveEmailTemplate(template) {
  return await apiSaveEmailTemplate(template);
}
export async function deleteEmailTemplate(templateId) {
  return await apiDeleteEmailTemplate(templateId);
}

// Analytics/Historical
export async function getAnalytics(params = {}) {
  return await apiGetAnalytics(params);
}
export async function getHistoricalRecords(params = {}) {
  return await apiGetHistoricalRecords(params);
}

// TODO: Refactor all UI update logic to use these async functions and handle loading/errors in the UI.

export function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function resetStore() {
  localStorage.removeItem(STORE_KEY);
  return getStore();
}

// Auth helpers
// Auth helpers (API-based)
export async function loginUser(email, password, role) {
  try {
    const result = await apiLogin(email, password, role);
    return result.user || null;
  } catch (e) {
    return null;
  }
}

export async function registerUser({ name, email, password, phone }) {
  try {
    const result = await apiRegister({ name, email, password, phone });
    if (result.error) return { error: result.error };
    return { user: result.user };
  } catch (e) {
    return { error: 'Registration failed' };
  }
}

export function updateUser(userId, updates) {
  const data = getStore();
  const user = data.users.find(u => u.id === userId);
  if (user) {
    Object.assign(user, updates);
    saveStore(data);
    return user;
  }
  return null;
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


export function deployIntern(appId) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (app) app.isDeployed = true;
  saveStore(data);
  return app;
}

// DTR helpers


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


export function markMessagesAsRead(appId, readByRole) {
  const data = getStore();
  let changed = false;
  data.messages.forEach(m => {
    if (m.appId === appId && m.from !== readByRole && !m.read) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) saveStore(data);
}

// Document helpers
export function addSchoolDoc(appId, doc) {
  const data = getStore();
  const app = data.applications.find(a => a.id === appId);
  if (!app) return;
  if (!app.schoolDocs) app.schoolDocs = [];
  app.schoolDocs.push({ id: makeId('sd'), ...doc, status: 'submitted', signedBy: null });
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

let storeCache;
let initPromise;
export function formatHours(h) {
  if (h === Math.floor(h)) return h.toString();
  const dec = h - Math.floor(h);
  if (Math.abs(dec - 0.5) < 0.01) return Math.floor(h) + '.5';
  return h.toFixed(1).replace(/\.0$/, '');
}

export async function initStore() {
  if (!initPromise) {
    initPromise = (async () => {
      storeCache = getStore();
    })();
  }
  return initPromise;
}

function normalizeStore(data) {
  // Ensure all required fields exist
  if (!data.applications) data.applications = [];
  if (!data.dtrEntries) data.dtrEntries = [];
  if (!data.messages) data.messages = [];
  if (!data.schoolActivities) data.schoolActivities = [];
  return data;
}

function queuePersist() {
  persistChain = persistChain.then(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(storeCache));
  });
}

function buildEmptyStore() {
  return { ...SEED_DATA };
}

export function getDepartments() {
  const data = getStore();
  return Object.keys(data.deptSlots || {});
}

export function getCompanyDocuments() {
  const data = getStore();
  return COMPANY_DOCUMENTS.map(doc => ({
    ...doc,
    desc: doc.desc || doc.description || '',
  }));
}

export function addCompanyDocument(doc) {
  const data = getStore();
  if (!data.companyDocuments) data.companyDocuments = [...COMPANY_DOCUMENTS];
  const newDoc = {
    id: makeId('cdoc'),
    ...doc
  };
  data.companyDocuments.push(newDoc);
  saveStore(data);
  return newDoc;
}
