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

export function getStore() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    // Migration: ensure emailTemplates and deptSlots exist in old storage
    if (!data.emailTemplates) data.emailTemplates = [...EMAIL_TEMPLATES];
    if (!data.deptSlots) data.deptSlots = { ...SEED_DATA.deptSlots };
    if (!data.companyDocuments) data.companyDocuments = [...COMPANY_DOCUMENTS];

    // Migration: ensure ALL supervisor test accounts exist in old storage
    let changed = false;
    const seedSups = SEED_DATA.users.filter(u => u.role === 'supervisor');
    seedSups.forEach(s => {
      const existing = data.users.find(u => u.id === s.id);
      if (!existing) {
        data.users.push(s);
        changed = true;
      } else if (existing.name !== s.name) {
        existing.name = s.name;
        changed = true;
      }
    });

    // Clean up old sup1 and sup2 if they still exist to avoid duplicates
    const oldSup1 = data.users.findIndex(u => u.id === 'sup1');
    if (oldSup1 > -1) { data.users.splice(oldSup1, 1); changed = true; }
    const oldSup2 = data.users.findIndex(u => u.id === 'sup2');
    if (oldSup2 > -1) { data.users.splice(oldSup2, 1); changed = true; }

    const app1 = data.applications.find(a => a.id === 'app1');
    if (app1 && (app1.supervisor === 'Supervisor Jonel Belandres' || app1.supervisor === 'Engr. Carlos Reyes')) {
      app1.supervisor = 'Jonel Belandres';
      changed = true;
    }
    
    if (changed) localStorage.setItem(STORE_KEY, JSON.stringify(data));

    return data;
  }
  const seed = generateSeedApplicants();
  const data = {
    ...SEED_DATA,
    users: [...SEED_DATA.users, ...seed.users],
    applications: seed.applications,
    dtrEntries: seed.dtrEntries,
    schoolActivities: [],
    messages: seed.messages,
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  return data;
}

export function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function resetStore() {
  localStorage.removeItem(STORE_KEY);
  return getStore();
}

// Auth helpers
export function loginUser(email, password, role) {
  const data = getStore();
  const user = data.users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  if (role === 'hr' && user.role !== 'hr') return null;
  if (role === 'supervisor' && user.role !== 'supervisor') return null;
  if (role === 'intern' && (user.role === 'hr' || user.role === 'supervisor')) return null;
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
  const msg = { id: 'msg' + Date.now(), appId, from, text, time: new Date().toLocaleString() };
  data.messages.push(msg);
  saveStore(data);
  return msg;
}

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

export function saveEmailTemplate(template) {
  const data = getStore();
  const emailTemplates = Array.isArray(data.emailTemplates) ? data.emailTemplates : [];
  const entry = {
    id: template.id || makeId('tmpl'),
    name: template.name,
    subject: template.subject,
    body: template.body,
  };
  const existingIndex = emailTemplates.findIndex(t => t.id === entry.id);
  if (existingIndex >= 0) {
    emailTemplates[existingIndex] = entry;
  } else {
    emailTemplates.push(entry);
  }
  data.emailTemplates = emailTemplates;
  saveStore(data);
  return entry;
}

export function deleteEmailTemplate(templateId) {
  const data = getStore();
  data.emailTemplates = (data.emailTemplates || []).filter(t => t.id !== templateId);
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
