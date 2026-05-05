import { loginUser, registerUser } from '../store.js';
import { setupPhoneMask } from '../main.js';

export function renderLogin(container, mode = 'intern') {
  const isHR = mode === 'hr';
  const isSupervisor = mode === 'supervisor';
  
  const title = isHR ? 'HR Administration' : isSupervisor ? 'Supervisor Portal' : 'Intern Portal';
  const subtitle = isHR ? 'Authorized HR personnel only' : isSupervisor ? 'Authorized Supervisors only' : 'Sign in to your account';
  const btnText = isHR ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-bottom:2px;margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Sign In as HR' 
                : isSupervisor ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-bottom:2px;margin-right:4px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> Sign In as Supervisor'
                : 'Sign In';

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-section">
          <img src="/logo.b.png" alt="PRIME Logo" class="logo-img-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="logo-box-lg" style="display:none;width:56px;height:56px;background:var(--primary);color:var(--accent-yellow);border-radius:14px;align-items:center;justify-content:center;font-weight:800;margin:0 auto 1rem">P</div>
          <h1>${title}</h1>
          <p class="subtitle">${subtitle}</p>
        </div>
        <div id="auth-error"></div>
        <form id="login-form">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="you@email.com" required id="input-email" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" class="form-control" placeholder="Enter your password" required id="input-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-login">
            ${btnText}
          </button>
        </form>
        ${(isHR || isSupervisor) ? '' : `
          <div class="auth-toggle">
            Don't have an account? <a onclick="location.hash='#register'">Create one</a>
          </div>
        `}
        <div class="auth-toggle mt-1">
          <a onclick="location.hash='#landing'" style="font-size:0.8rem;color:var(--text-secondary)">← Back to Home</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');
    const user = loginUser(email, password, mode);
    if (user) {
      window.APP.login(user);
    } else {
      let errMsg = 'Invalid email or password.';
      if (isHR) errMsg = 'Access denied. HR credentials required.';
      if (isSupervisor) errMsg = 'Access denied. Supervisor credentials required.';
      document.getElementById('auth-error').innerHTML = `<div class="auth-error">${errMsg}</div>`;
    }
  };
}

export function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-section">
          <img src="/logo.b.png" alt="PRIME Logo" class="logo-img-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="logo-box-lg" style="display:none;width:56px;height:56px;background:var(--primary);color:var(--accent-yellow);border-radius:14px;align-items:center;justify-content:center;font-weight:800;margin:0 auto 1rem">P</div>
          <h1>Create Account</h1>
          <p class="subtitle">Start your internship application</p>
        </div>
        <div id="auth-error"></div>
        <form id="register-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" class="form-control" placeholder="Juan Dela Cruz" required id="input-name" />
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="you@email.com" required id="input-email" />
          </div>
          <div class="form-group">
            <label>Contact Number</label>
            <input type="tel" name="phone" class="form-control" placeholder="09171234567" required id="input-phone" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" class="form-control" placeholder="Create a password" required minlength="6" id="input-password" />
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-register">Create Account</button>
        </form>
        <div class="auth-toggle">
          Already have an account? <a onclick="location.hash='#login'">Sign in</a>
        </div>
        <div class="auth-toggle mt-1">
          <a onclick="location.hash='#landing'" style="font-size:0.8rem;color:var(--text-secondary)">← Back to Home</a>
        </div>
      </div>
    </div>
  `;

  setupPhoneMask(document.getElementById('input-phone'));

  document.getElementById('register-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const result = registerUser({
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      password: fd.get('password'),
    });
    if (result.error) {
      document.getElementById('auth-error').innerHTML = `<div class="auth-error">${result.error}</div>`;
    } else {
      window.APP.login(result.user);
    }
  };
}
