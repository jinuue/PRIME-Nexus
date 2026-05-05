import './style.css';
import { initStore, getStore, getApplication, updateUser } from './store.js';
import { renderLanding } from './pages/landing.js';
import { renderLogin, renderRegister } from './pages/auth.js';
import { renderApply } from './pages/apply.js';
import { renderStatus } from './pages/status.js';
import { renderInternDashboard } from './pages/intern.js';
import { renderHRDashboard } from './pages/hr.js';

// Theme Management
function initTheme() {
  const theme = localStorage.getItem('prime_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('prime_theme', next);
}

// App State
const storeReady = (async () => {
  await initStore();
  initTheme();
  const restoredUser = sessionStorage.getItem('prime_user');
  if (restoredUser) {
    window.APP.user = JSON.parse(restoredUser);
  }
})();

window.APP = {
  user: null,
  navigate(hash) { window.location.hash = hash; },
  login(user) {
    this.user = user;
    sessionStorage.setItem('prime_user', JSON.stringify(user));
    const app = getApplication(user.id);
    if (user.role === 'hr') this.navigate('#hr');
    else if (user.role === 'supervisor') this.navigate('#supervisor');
    else if (user.role === 'intern' || (app && app.status === 'accepted')) this.navigate('#status');
    else if (app) this.navigate('#status');
    else this.navigate('#apply');
  },
  async logout() {
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
  const publicPages = ['#landing', '#login', '#login-hr', '#login-supervisor', '#register'];
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
      case '#login-supervisor': renderLogin(app, 'supervisor'); break;
      case '#register': renderRegister(app); break;
      case '#apply': renderApply(app); break;
      case '#status': renderStatus(app); break;
      case '#intern': renderInternDashboard(app); break;
      case '#hr': renderHRDashboard(app); break;
      case '#supervisor':
        import('./pages/supervisor.js').then(mod => mod.renderSupervisorDashboard(app));
        break;
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
  const avatarHTML = user?.avatar 
    ? `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : initials;

  let isDeployedIntern = false;
  let unreadCount = 0;
  if (user && (user.role === 'intern' || user.role === 'applicant')) {
    const data = getStore();
    const app = (data.applications || []).find(a => a.userId === user.id);
    if (app && app.status === 'accepted') {
      const msgs = (data.messages || []).filter(m => m.appId === app.id);
      unreadCount = msgs.filter(m => m.from === 'hr' && !m.read).length;
    }
    if (app && app.isDeployed) {
      isDeployedIntern = true;
    }
  }

  nav.innerHTML = `
    <div class="container" style="max-width: 100%; padding: 0 1rem 0 0;">
      <div class="nav-brand" style="height: 64px; margin-left: 0; cursor: default;">
        <div style="width: 240px; height: 100%; display: flex; align-items: center; justify-content: center;">
          <img src="/logo.png" alt="PRIME Logo" class="logo-img" style="height:48px;width:auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
          <div class="logo-box" style="display:none;width:40px;height:40px;background:var(--accent-yellow);color:var(--primary);border-radius:8px;align-items:center;justify-content:center;font-weight:800;font-size:1.5rem">P</div>
        </div>
        <div style="font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; color: #fff; margin-left: 0.5rem; letter-spacing: 0.5px;">
          Internship Management System
          ${user?.role === 'supervisor' ? ' / <span style="color:var(--accent-yellow)">Supervisor Dashboard</span>' : ''}
          ${user?.role === 'hr' ? ' / <span style="color:var(--accent-yellow)">HR Dashboard</span>' : ''}
          ${isDeployedIntern ? ' / <span style="color:var(--accent-yellow)">Intern Dashboard</span>' : ''}
        </div>
      </div>
      <div class="nav-links" style="margin-left: 1.5rem">
        ${links.map(l => {
    let badge = '';
    if (unreadCount > 0 && l.label === 'Dashboard') {
      badge = `<span style="background:var(--accent-red);color:white;border-radius:50%;padding:0.1rem 0.35rem;font-size:0.65rem;margin-left:6px;vertical-align:middle">${unreadCount}</span>`;
    }
    return `<button class="nav-link ${location.hash === l.hash ? 'active' : ''}" style="display:flex;align-items:center" onclick="location.hash='${l.hash}'"><span>${l.label}</span> ${badge}</button>`;
  }).join('')}
      </div>
      <div class="nav-user" style="padding-right: 1rem; gap: 1rem;">
        <button class="nav-link" id="theme-toggle" style="padding: 0.5rem; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1);">
          <i data-lucide="sun" class="sun-icon" style="width:18px;height:18px;display:none;"></i>
          <i data-lucide="moon" class="moon-icon" style="width:18px;height:18px;"></i>
        </button>
        <div class="flex" style="align-items:center; gap: 0.75rem; cursor: pointer;" id="nav-profile-trigger">
          <div class="avatar">${avatarHTML}</div>
          <span style="font-weight: 500;">${user?.name || ''}</span>
        </div>
        <button class="btn-logout" onclick="APP.logout()">Logout</button>
      </div>
    </div>
  `;
  container.appendChild(nav);

  // Theme Toggle Logic
  const themeBtn = nav.querySelector('#theme-toggle');
  const sunIcon = themeBtn.querySelector('.sun-icon');
  const moonIcon = themeBtn.querySelector('.moon-icon');
  
  const updateIcons = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    sunIcon.style.display = isDark ? 'block' : 'none';
    moonIcon.style.display = isDark ? 'none' : 'block';
  };
  updateIcons();

  themeBtn.onclick = () => {
    toggleTheme();
    updateIcons();
  };

  // Profile Click Logic
  const profileTrigger = nav.querySelector('#nav-profile-trigger');
  if (profileTrigger && user) {
    profileTrigger.onclick = () => showProfileModal(user);
  }

  if (window.lucide) window.lucide.createIcons();
}

function showProfileModal(user) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Update Profile</h2>
      <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1.5rem">Change your profile picture and account information.</p>
      
      <div style="text-align:center;margin-bottom:1.5rem">
        <div id="profile-preview" style="width:100px;height:100px;border-radius:50%;background:var(--surface2);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid var(--border)">
          ${user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:2rem;font-weight:700;color:var(--text-secondary)">${user.name[0]}</span>`}
        </div>
        <input type="file" id="avatar-input" accept="image/*" style="display:none">
        <div class="flex justify-center" style="gap:0.5rem">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('avatar-input').click()">
            <i data-lucide="camera" style="width:14px;height:14px;margin-right:6px"></i> Change Photo
          </button>
          <button class="btn btn-danger btn-sm" id="btn-remove-avatar" style="${user.avatar ? '' : 'display:none'}">
            <i data-lucide="trash-2" style="width:14px;height:14px;margin-right:6px"></i> Remove
          </button>
        </div>
      </div>

      <form id="profile-form">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" class="form-control" value="${user.name}" required />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" name="phone" id="profile-phone" class="form-control" value="${user.phone || ''}" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-profile">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  if (window.lucide) window.lucide.createIcons();
  setupPhoneMask(document.getElementById('profile-phone'));

  let pendingAvatar = user.avatar;
  const removeBtn = document.getElementById('btn-remove-avatar');

  document.getElementById('avatar-input').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        pendingAvatar = re.target.result;
        document.getElementById('profile-preview').innerHTML = `<img src="${pendingAvatar}" style="width:100%;height:100%;object-fit:cover;">`;
        removeBtn.style.display = 'inline-flex';
      };
      reader.readAsDataURL(file);
    }
  };

  removeBtn.onclick = () => {
    pendingAvatar = null;
    document.getElementById('profile-preview').innerHTML = `<span style="font-size:2rem;font-weight:700;color:var(--text-secondary)">${user.name[0]}</span>`;
    removeBtn.style.display = 'none';
    document.getElementById('avatar-input').value = '';
  };

  document.getElementById('btn-cancel-profile').onclick = () => overlay.remove();
  document.getElementById('profile-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updated = updateUser(user.id, {
      name: fd.get('name'),
      phone: fd.get('phone'),
      avatar: pendingAvatar
    });
    if (updated) {
      window.APP.user = updated;
      sessionStorage.setItem('prime_user', JSON.stringify(updated));
      overlay.remove();
      window.APP.render();
    }
  };
}

// Global UI Utilities
export function setupPhoneMask(input) {
  if (!input) return;
  input.maxLength = 13; // 09XX XXX XXXX is 13 chars including spaces
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.slice(0, 11);

    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 4);
      if (value.length > 4) {
        formatted += ' ' + value.substring(4, 7);
      }
      if (value.length > 7) {
        formatted += ' ' + value.substring(7, 11);
      }
    }
    e.target.value = formatted;
  });
}
