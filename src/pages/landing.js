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
        <button class="btn btn-yellow" style="padding: 1.25rem 3rem; font-size: 1.25rem; border-radius: 16px" onclick="location.hash='#login'" id="btn-intern-portal">
          📋 Intern Portal
        </button>
        <button class="btn btn-landing-secondary" onclick="location.hash='#login-hr'" id="btn-hr-portal">
          🔐 HR Administration
        </button>
      </div>

      <div class="scroll-hint" style="position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.6); font-size: 0.85rem; animation: bounce 2s infinite; cursor: pointer; z-index: 10;" id="scroll-to-team">
        <span>Scroll to see our team</span>
        <i data-lucide="chevron-down" style="width:20px;height:20px"></i>
      </div>
    </div>

    <div class="developers-section" id="dev-section" style="padding: 4rem 0; background: var(--primary); border-top: 1px solid rgba(255,255,255,0.1); width: 100%; overflow: hidden;">
      <h2 style="color: white; margin-bottom: 3rem; font-size: 1.5rem; text-align: center; padding: 0 1rem;">The Minds Behind PRIME Internship Management System</h2>
      <div class="carousel-container">
        <div class="carousel-track">
            <!-- IT Interns -->
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>CJ Trono</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Aldrin Epino</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar" style="background: rgba(0, 112, 243, 0.1); color: var(--accent-blue);"><i data-lucide="database"></i></div>
              <h3>Michael Baynosa</h3>
              <p>Lead Backend Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar" style="background: rgba(0, 112, 243, 0.1); color: var(--accent-blue);"><i data-lucide="layout"></i></div>
              <h3>Sarah Grace Guiling</h3>
              <p>Lead Frontend Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Ericka Raquino</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Fiona Winslette Dantes</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Lawrence Afable</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="user-cog"></i></div>
              <h3>Julie Ann Gonzales</h3>
              <p>HR Intern / Management</p>
            </div>
            
            <!-- Duplicated for Loop -->
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>CJ Trono</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Aldrin Epino</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar" style="background: rgba(0, 112, 243, 0.1); color: var(--accent-blue);"><i data-lucide="database"></i></div>
              <h3>Michael Baynosa</h3>
              <p>Lead Backend Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar" style="background: rgba(0, 112, 243, 0.1); color: var(--accent-blue);"><i data-lucide="layout"></i></div>
              <h3>Sarah Grace Guiling</h3>
              <p>Lead Frontend Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Ericka Raquino</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Fiona Winslette Dantes</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="code-2"></i></div>
              <h3>Lawrence Afable</h3>
              <p>IT Intern / Developer</p>
            </div>
            <div class="dev-card" style="border-color: var(--accent-blue);">
              <div class="dev-avatar"><i data-lucide="user-cog"></i></div>
              <h3>Julie Ann Gonzales</h3>
              <p>HR Intern / Management</p>
            </div>
          </div>
        </div>
        <div class="landing-footer" style="padding: 2rem 1rem 3rem; background: transparent; opacity: 0.5; text-align: center;">
          <p>© 2026 PRIME Philippines. All rights reserved.</p>
        </div>
      </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const scrollHint = document.getElementById('scroll-to-team');
  if (scrollHint) {
    scrollHint.onclick = () => {
      document.getElementById('dev-section').scrollIntoView({ behavior: 'smooth' });
    };
  }
}
