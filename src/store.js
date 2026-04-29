// PRIME Philippines — Data Store (localStorage-based)
const STORE_KEY = 'prime_ims_data';

const EMAIL_TEMPLATES = [
  {
    id: 'initial_invite', name: 'Initial Interview Invitation', subject: 'PRIME Philippines — Initial Interview Schedule',
    body: `Dear {name},\n\nThank you for your interest in the PRIME Philippines Internship Program.\n\nWe are pleased to inform you that you have been shortlisted for an Initial Interview. Please see the details below:\n\nDate: {date}\nTime: {time}\nMode: {mode}\n\nPlease confirm your attendance by replying to this email.\n\nBest regards,\nHR Department\nPRIME Philippines`
  },
  {
    id: 'final_invite', name: 'Final Interview Invitation', subject: 'PRIME Philippines — Final Interview Schedule',
    body: `Dear {name},\n\nCongratulations on passing the Initial Interview!\n\nYou are now scheduled for a Final Interview. Details are as follows:\n\nDate: {date}\nTime: {time}\nMode: {mode}\n\nPlease prepare any additional documents that may be required.\n\nBest regards,\nHR Department\nPRIME Philippines`
  },
  {
    id: 'acceptance', name: 'Acceptance Letter', subject: 'PRIME Philippines — Internship Acceptance',
    body: `Dear {name},\n\nWe are delighted to inform you that you have been accepted into the PRIME Philippines Internship Program!\n\nYou will be assigned to the {department} Department. Your internship details will be available in the Intern Portal.\n\nPlease log in to your account to view your deployment information and complete the required documents.\n\nWelcome to the team!\n\nBest regards,\nHR Department\nPRIME Philippines`
  },
  {
    id: 'rejection', name: 'Application Update', subject: 'PRIME Philippines — Application Status Update',
    body: `Dear {name},\n\nThank you for taking the time to apply for the PRIME Philippines Internship Program.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time. This decision does not reflect on your abilities, and we encourage you to apply again in the future.\n\nWe wish you the best in your academic and professional endeavors.\n\nSincerely,\nHR Department\nPRIME Philippines`
  },
  {
    id: 'doc_reminder', name: 'Document Reminder', subject: 'PRIME Philippines — Document Submission Reminder',
    body: `Dear {name},\n\nThis is a friendly reminder to submit the required documents for your internship at PRIME Philippines.\n\nPending documents can be viewed and uploaded through your Intern Portal dashboard.\n\nPlease submit them at your earliest convenience to avoid delays in your onboarding process.\n\nThank you,\nHR Department\nPRIME Philippines`
  },
];

const DEPARTMENTS = ['Marketing', 'IT / Development', 'Human Resources', 'Finance', 'Operations', 'Legal', 'Creative / Design', 'Admin Support'];

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
  ],
  applications: [],
  dtrEntries: [],
  schoolActivities: [],
  messages: [],
  quarterSettings: { current: 'Q2-2026' },
  emailTemplates: [...EMAIL_TEMPLATES],
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
      id: 'app1', userId: 'u1', name: 'Juan Dela Cruz', email: 'juan@email.com', password: 'pass123', phone: '09171234567', course: 'BS Information Technology', school: 'University of the Philippines', ojtType: 'required', hoursRequired: 480, source: 'School/University Partner', status: 'accepted', appliedDate: '2026-03-15', quarter: 'Q1-2026', department: 'IT / Development', supervisor: 'Engr. Carlos Reyes', schedule: 'Mon-Fri, 8:00 AM - 5:00 PM', startDate: '2026-04-01',
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

export function saveEmailTemplate(template) {
  const data = getStore();
  if (!data.emailTemplates) data.emailTemplates = [];
  const idx = data.emailTemplates.findIndex(t => t.id === template.id);
  if (idx > -1) {
    data.emailTemplates[idx] = template;
  } else {
    data.emailTemplates.push({ ...template, id: 'temp_' + Date.now() });
  }
  saveStore(data);
}

export function deleteEmailTemplate(id) {
  const data = getStore();
  if (!data.emailTemplates) return;
  data.emailTemplates = data.emailTemplates.filter(t => t.id !== id);
  saveStore(data);
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
  if (role === 'intern' && user.role === 'hr') return null;
  return user;
}

export function registerUser({ name, email, password, phone }) {
  const data = getStore();
  if (data.users.find(u => u.email === email)) return { error: 'Email already registered' };
  const user = { id: 'u' + Date.now(), email, password, name, phone, role: 'applicant' };
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
    id: 'app' + Date.now(),
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
  const dtr = { id: 'dtr' + Date.now(), appId, ...entry, type: 'work' };
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
  const sa = { id: 'sa' + Date.now(), appId, ...entry, status: 'pending', type: 'school' };
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
  const msg = { id: 'msg' + Date.now(), appId, from, text, time: new Date().toLocaleString(), read: false };
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
  app.schoolDocs.push({ id: 'sd' + Date.now(), ...doc, status: 'submitted', signedBy: null });
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

export { EMAIL_TEMPLATES, DEPARTMENTS, COMPANY_DOCUMENTS };
