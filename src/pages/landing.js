export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-hero">
      <div class="logo-big">P</div>
      <h1>PRIME Philippines</h1>
      <p>Internship Management System — Apply, track your application status, and manage your internship journey all in one place.</p>
      <div class="landing-buttons">
        <button class="btn btn-yellow btn-lg" onclick="location.hash='#login'" id="btn-intern-portal">
          📋 Intern Portal
        </button>
        <button class="btn btn-lg" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3)" onclick="location.hash='#login-hr'" id="btn-hr-portal">
          🔐 HR Administration
        </button>
      </div>
      <div class="landing-footer">© 2026 PRIME Philippines. All rights reserved.</div>
    </div>
  `;
}
