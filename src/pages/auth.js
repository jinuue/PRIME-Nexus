import { loginUser, registerUser } from '../store.js';

export function renderLogin(container, mode = 'intern') {
  const isHR = mode === 'hr';
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-section">
          <img src="/logo.png" alt="PRIME Logo" class="logo-img-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="logo-box-lg" style="display:none;width:56px;height:56px;background:var(--primary);color:var(--accent-yellow);border-radius:14px;align-items:center;justify-content:center;font-weight:800;margin:0 auto 1rem">P</div>
          <h1>${isHR ? 'HR Administration' : 'Intern Portal'}</h1>
          <p class="subtitle">${isHR ? 'Authorized HR personnel only' : 'Sign in to your account'}</p>
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
            ${isHR ? '🔐 Sign In as HR' : 'Sign In'}
          </button>
        </form>
        ${isHR ? '' : `
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
    const user = loginUser(email, password, isHR ? 'hr' : 'intern');
    if (user) {
      window.APP.login(user);
    } else {
      document.getElementById('auth-error').innerHTML = `<div class="auth-error">${isHR ? 'Access denied. HR credentials required.' : 'Invalid email or password.'}</div>`;
    }
  };
}

export function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-section">
          <img src="/logo.png" alt="PRIME Logo" class="logo-img-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
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
