// Fetch user by ID
export async function apiGetUser(userId) {
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

// Fetch application by user ID
export async function apiGetApplication(userId) {
  const res = await fetch(`${API_BASE_URL}/api/application/user/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch application');
  return res.json();
}
// src/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prime-intern.herokuapp.com'; // Change to your deployed backend URL

export async function apiLogin(email, password, role) {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function apiRegister({ name, email, password, phone }) {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone })
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
}


// --- HR API FUNCTIONS ---

// Applications
export async function apiGetApplications(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/applications${q ? '?' + q : ''}`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}
export async function apiUpdateApplicationStatus(appId, status, extra = {}) {
  const res = await fetch(`${API_BASE_URL}/api/application/${appId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...extra })
  });
  if (!res.ok) throw new Error('Failed to update application status');
  return res.json();
}

// Users
export async function apiGetUsers(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/users${q ? '?' + q : ''}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// DTR
export async function apiGetDtrEntries(appId) {
  const res = await fetch(`${API_BASE_URL}/api/dtr/${appId}`);
  if (!res.ok) throw new Error('Failed to fetch DTR entries');
  return res.json();
}
export async function apiAddDtrEntry(appId, entry) {
  const res = await fetch(`${API_BASE_URL}/api/dtr/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  if (!res.ok) throw new Error('Failed to add DTR entry');
  return res.json();
}

// Documents
export async function apiGetCompanyDocuments() {
  const res = await fetch(`${API_BASE_URL}/api/company-documents`);
  if (!res.ok) throw new Error('Failed to fetch company documents');
  return res.json();
}
export async function apiAddCompanyDocument(doc) {
  const res = await fetch(`${API_BASE_URL}/api/company-documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(doc)
  });
  if (!res.ok) throw new Error('Failed to add company document');
  return res.json();
}
export async function apiUpdateDocStatus(appId, docId, status) {
  const res = await fetch(`${API_BASE_URL}/api/application/${appId}/company-doc/${docId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update document status');
  return res.json();
}
export async function apiSignSchoolDoc(appId, docId, signerName) {
  const res = await fetch(`${API_BASE_URL}/api/application/${appId}/school-doc/${docId}/sign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signerName })
  });
  if (!res.ok) throw new Error('Failed to sign school document');
  return res.json();
}

// Messages
export async function apiGetMessages(appId) {
  const res = await fetch(`${API_BASE_URL}/api/messages/${appId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}
export async function apiSendMessage(appId, from, text) {
  const res = await fetch(`${API_BASE_URL}/api/messages/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, text })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

// Email Templates
export async function apiGetEmailTemplates() {
  const res = await fetch(`${API_BASE_URL}/api/email-templates`);
  if (!res.ok) throw new Error('Failed to fetch email templates');
  return res.json();
}
export async function apiSaveEmailTemplate(template) {
  const res = await fetch(`${API_BASE_URL}/api/email-templates`, {
    method: template.id ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  });
  if (!res.ok) throw new Error('Failed to save email template');
  return res.json();
}
export async function apiDeleteEmailTemplate(templateId) {
  const res = await fetch(`${API_BASE_URL}/api/email-templates/${templateId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete email template');
  return res.json();
}

// Analytics/Historical
export async function apiGetAnalytics(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/analytics${q ? '?' + q : ''}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
export async function apiGetHistoricalRecords(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/historical${q ? '?' + q : ''}`);
  if (!res.ok) throw new Error('Failed to fetch historical records');
  return res.json();
}
