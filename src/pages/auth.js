import { loginUser, registerUser } from '../store.js';
import { setupPhoneMask } from '../main.js';

export function renderLogin(container, mode = 'intern') {
  const isHR = mode === 'hr';
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-sidebar">
        <div class="auth-sidebar-content">
          <div class="logo-box-lg" style="width:64px;height:64px;background:var(--accent-blue);color:#fff;border-radius:16px;align-items:center;justify-content:center;font-weight:800;font-size:1.75rem;margin-bottom:1.5rem;display:flex">P</div>
          <h1>${isHR ? 'PRIME HR Administration' : 'Start Your Journey with PRIME.'}</h1>
          <p>${isHR ? 'Secure access for authorized personnel only to manage intern deployments, tracking, and communications.' : 'Join the next generation of industry leaders. Manage your application, track your progress, and get deployed.'}</p>
        </div>
      </div>
      <div class="auth-content">
        <div class="auth-card">
          <div class="logo-section" style="text-align:left;margin-bottom:2rem">
            <h2 style="font-size:1.75rem;margin-bottom:0.25rem;color:var(--primary)">${isHR ? 'Welcome Back' : 'Sign in'}</h2>
            <p class="subtitle">${isHR ? 'Sign in to the HR portal' : 'Access your intern account'}</p>
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
            <button type="submit" class="btn btn-primary btn-block btn-lg mt-1" id="btn-login">
              ${isHR ? '🔐 Sign In as HR' : 'Sign In'}
            </button>
          </form>
          ${isHR ? '' : `
            <div class="auth-toggle mt-3" style="text-align:left">
              Don't have an account? <a onclick="location.hash='#register'">Create one</a>
            </div>
          `}
          <div class="auth-toggle mt-1" style="text-align:left">
            <a onclick="location.hash='#landing'" style="font-size:0.85rem;color:var(--text-secondary)">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email');
    const password = fd.get('password');
    const result = await loginUser(email, password, isHR ? 'hr' : 'intern');
    if (result?.user) {
      window.APP.login(result.user);
      return;
    }
    const message = result?.error?.message
      || (isHR ? 'Access denied. HR credentials required.' : 'Invalid email or password.');
    document.getElementById('auth-error').innerHTML = `<div class="auth-error">${message}</div>`;
  };
}

export function renderRegister(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-sidebar">
        <div class="auth-sidebar-content">
          <div class="logo-box-lg" style="width:64px;height:64px;background:var(--accent-blue);color:#fff;border-radius:16px;align-items:center;justify-content:center;font-weight:800;font-size:1.75rem;margin-bottom:1.5rem;display:flex">P</div>
          <h1>Begin Your Internship Application.</h1>
          <p>Create an account to submit your documents, track your progress, and secure your spot in our program.</p>
        </div>
      </div>
      <div class="auth-content">
        <div class="auth-card">
          <div class="logo-section" style="text-align:left;margin-bottom:2rem">
            <h2 style="font-size:1.75rem;margin-bottom:0.25rem;color:var(--primary)">Create Account</h2>
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
            <button type="submit" class="btn btn-primary btn-block btn-lg mt-1" id="btn-register">Create Account</button>
          </form>
          <div class="auth-toggle mt-3" style="text-align:left">
            Already have an account? <a onclick="location.hash='#login'">Sign in</a>
          </div>
          <div class="auth-toggle mt-1" style="text-align:left">
            <a onclick="location.hash='#landing'" style="font-size:0.85rem;color:var(--text-secondary)">← Back to Home</a>
          </div>
        </div>
      </div>
    </div>
  `;

  setupPhoneMask(document.getElementById('input-phone'));

  document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const result = await registerUser({
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
