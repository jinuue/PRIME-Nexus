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

// Add more API functions as needed (get user, applications, etc.)
