export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-hero">
      <div style="margin-bottom: 2rem;">
        <img src="/logo.png" alt="PRIME Logo" style="height:140px;width:auto;" onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.style.display='flex'">
      </div>
      <div class="logo-big" style="display:none;width:100px;height:100px;background:var(--accent-yellow);color:var(--primary);border-radius:24px;align-items:center;justify-content:center;font-weight:800;font-size:3rem;margin:0 auto 2rem">P</div>
      <h1>Internship Management System</h1>
      <p>Apply, track your application status, and manage your internship journey all in one place.</p>
      <div class="landing-buttons">
        <button class="btn btn-yellow" style="padding: 1.25rem 3rem; font-size: 1.25rem; border-radius: 16px; display: flex; align-items: center; gap: 0.75rem;" onclick="location.hash='#login'" id="btn-intern-portal">
          <i data-lucide="clipboard-list" style="width:24px;height:24px"></i> Intern Portal
        </button>
        <button class="btn btn-landing-secondary" style="display: flex; align-items: center; gap: 0.5rem;" onclick="location.hash='#login-hr'" id="btn-hr-portal">
          <i data-lucide="shield-check" style="width:18px;height:18px"></i> HR Administration
        </button>
        <button class="btn btn-landing-secondary" style="display: flex; align-items: center; gap: 0.5rem;" onclick="location.hash='#login-supervisor'" id="btn-supervisor-portal">
          <i data-lucide="users" style="width:18px;height:18px"></i> Supervisor Portal
        </button>
      </div>
      <div class="landing-footer">© 2026 PRIME Philippines. All rights reserved.</div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}
