import './style.css';
import { initStore, getStore, loginUser, registerUser, getApplication } from './store.js';
import { renderLanding } from './pages/landing.js';
import { renderLogin, renderRegister } from './pages/auth.js';
import { renderApply } from './pages/apply.js';
import { renderStatus } from './pages/status.js';
import { renderInternDashboard } from './pages/intern.js';
import { renderHRDashboard } from './pages/hr.js';

// App State
const storeReady = initStore();

window.APP = {
  user: JSON.parse(sessionStorage.getItem('prime_user') || 'null'),
  navigate(hash) { window.location.hash = hash; },
  login(user) {
    this.user = user;
    sessionStorage.setItem('prime_user', JSON.stringify(user));
    const app = getApplication(user.id);
    if (user.role === 'hr') this.navigate('#hr');
    else if (user.role === 'intern' || (app && app.status === 'accepted')) this.navigate('#status');
    else if (app) this.navigate('#status');
    else this.navigate('#apply');
  },
  logout() {
    this.user = null;
    sessionStorage.removeItem('prime_user');
    this.navigate('#landing');
  },
  render() { void route(); }
};

// Router
async function route() {
  await storeReady;
  const hash = window.location.hash || '#landing';
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Auth guard
  const publicPages = ['#landing', '#login', '#login-hr', '#register'];
  if (!publicPages.includes(hash) && !window.APP.user) {
    window.location.hash = '#login';
    return;
  }

  // Refresh user data from store
  if (window.APP.user) {
    const store = getStore();
    const freshUser = store.users.find(u => u.id === window.APP.user.id);
    if (freshUser) {
      window.APP.user = freshUser;
      sessionStorage.setItem('prime_user', JSON.stringify(freshUser));
    }
  }

  try {
    switch (hash) {
      case '#landing': renderLanding(app); break;
      case '#login': renderLogin(app, 'intern'); break;
      case '#login-hr': renderLogin(app, 'hr'); break;
      case '#register': renderRegister(app); break;
      case '#apply': renderApply(app); break;
      case '#status': renderStatus(app); break;
      case '#intern': renderInternDashboard(app); break;
      case '#hr': renderHRDashboard(app); break;
      default: renderLanding(app); break;
    }
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div style="padding:3rem;text-align:center;"><h2>Something went wrong</h2><p>${e.message}</p><button class="btn btn-primary mt-2" onclick="location.hash='#landing'">Go Home</button></div>`;
  }
}

window.addEventListener('hashchange', () => { void route(); });
window.addEventListener('DOMContentLoaded', () => { void route(); });

// Navbar helper (exported for pages)
export function renderNavbar(container, links = []) {
  const user = window.APP.user;
  const nav = document.createElement('nav');
  nav.className = 'navbar';
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '';

  nav.innerHTML = `
    <div class="container" style="max-width: 100%; padding: 0 1rem 0 0;">
      <div class="nav-brand" onclick="location.hash='${user?.role === 'hr' ? '#hr' : '#status'}'" style="height: 64px; margin-left: 0;">
        <div style="background:#76ABDF; padding: 0 1.5rem; height: 100%; display: flex; align-items: center; justify-content: center; border-radius: 0 24px 24px 0;">
          <img src="/logo.png" alt="PRIME Logo" class="logo-img" style="height:48px;width:auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
          <div class="logo-box" style="display:none;width:40px;height:40px;background:var(--accent-yellow);color:var(--primary);border-radius:8px;align-items:center;justify-content:center;font-weight:800;font-size:1.5rem">P</div>
        </div>
      </div>
      <div class="nav-links" style="margin-left: 1.5rem">
        ${links.map(l => `<button class="nav-link ${location.hash === l.hash ? 'active' : ''}" onclick="location.hash='${l.hash}'">${l.label}</button>`).join('')}
      </div>
      <div class="nav-user" style="padding-right: 1rem">
        <div class="avatar">${initials}</div>
        <span>${user?.name || ''}</span>
        <button class="btn-logout" onclick="APP.logout()">Logout</button>
      </div>
    </div>
  `;
  container.appendChild(nav);
}
