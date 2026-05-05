import { getApplication, updateAppStatus, getStore, saveStore } from '../store.js';
import { renderNavbar } from '../main.js';

const STATUS_STEPS = [
  { key: 'submitted', label: 'Submitted', icon: 'mail' },
  { key: 'viewed', label: 'Viewed', icon: 'eye' },
  { key: 'initial_interview', label: 'Initial Interview', icon: 'clipboard-list' },
  { key: 'final_interview', label: 'Final Interview', icon: 'target' },
  { key: 'final_review', label: 'Final Review', icon: 'file-edit' },
  { key: 'result', label: 'Result', icon: 'star' },
];

const STATUS_ORDER = ['submitted', 'viewed', 'initial_interview', 'final_interview', 'final_review', 'accepted', 'failed'];

function getStepState(stepKey, currentStatus) {
  const STATUS_ORDER = ['submitted', 'viewed', 'initial_interview', 'final_interview', 'final_review', 'accepted', 'failed'];
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepKey);

  // Result step logic
  if (stepKey === 'result') {
    if (currentStatus === 'accepted') return 'completed';
    if (currentStatus === 'failed') return 'failed';
    return '';
  }

  // Normal steps
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return '';
}

export function renderStatus(container) {
  const user = window.APP.user;
  if (!user) { location.hash = '#login'; return; }

  const app = getApplication(user.id);
  if (!app) { location.hash = '#apply'; return; }

  const navLinks = [];
  if (app.status === 'accepted') {
    navLinks.push({ hash: '#status', label: 'Status' });
    navLinks.push({ hash: '#intern', label: 'Dashboard' });
  }
  renderNavbar(container, navLinks);

  const page = document.createElement('div');
  page.className = 'page';
  const c = document.createElement('div');
  c.className = 'container';
  c.style.maxWidth = '800px';

  // Header
  let html = `<div class="page-header"><h1>Application Status</h1><p>Track the progress of your internship application</p></div>`;

  // Withdrawn state
  if (app.status === 'withdrawn') {
    html += `
      <div class="withdrawn-banner mb-2">
        <i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:text-bottom;margin-right:4px"></i> You have withdrawn your application. This action cannot be undone.
      </div>
      <div class="card">
        <p style="color:var(--text-secondary)">Your application was submitted on <strong>${app.appliedDate}</strong> and withdrawn by your request.</p>
      </div>
    `;
    c.innerHTML = html;
    page.appendChild(c);
    container.appendChild(page);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Stepper
  html += '<div class="stepper">';
  STATUS_STEPS.forEach(step => {
    const state = getStepState(step.key, app.status);
    let detail = '';
    if (step.key === 'initial_interview' && app.interviewDate) {
      detail = `<div class="step-detail">${app.interviewDate} at ${app.interviewTime || 'TBD'}</div>`;
    }
    if (step.key === 'final_interview' && app.finalInterviewDate) {
      detail = `<div class="step-detail">${app.finalInterviewDate} at ${app.finalInterviewTime || 'TBD'}</div>`;
    }
    if (step.key === 'result') {
      if (app.status === 'accepted') detail = `<div class="step-detail" style="color:var(--success)">Accepted <i data-lucide="check-circle" style="width:12px;height:12px;vertical-align:middle"></i></div>`;
      else if (app.status === 'failed') detail = `<div class="step-detail" style="color:var(--accent-red)">Not Selected</div>`;
    }
    const circleContent = state === 'completed' ? '<i data-lucide="check" style="width:20px;height:20px"></i>' : `<i data-lucide="${step.icon}" style="width:20px;height:20px"></i>`;
    html += `
      <div class="step ${state}">
        <div class="step-circle">${circleContent}</div>
        <div class="step-label">${step.label}</div>
        ${detail}
      </div>
    `;
  });
  html += '</div>';

  // Application info card
  html += `
    <div class="card mt-2">
      <div class="card-header flex-between">
        <h3>Application Details</h3>
        <span class="badge ${getBadgeClass(app.status)}">${formatStatus(app.status)}</span>
      </div>
      <div class="grid-2">
        <div><span class="tag">Name</span><p style="font-weight:600;margin-top:0.25rem">${app.name}</p></div>
        <div><span class="tag">School</span><p style="font-weight:600;margin-top:0.25rem">${app.school || 'N/A'}</p></div>
        <div><span class="tag">Course</span><p style="font-weight:600;margin-top:0.25rem">${app.course || 'N/A'}</p></div>
        <div><span class="tag">OJT Type</span><p style="font-weight:600;margin-top:0.25rem">${app.ojtType === 'required' ? 'Required by School' : 'Voluntary'}</p></div>
        <div><span class="tag">Hours Required</span><p style="font-weight:600;margin-top:0.25rem">${app.hoursRequired || 'N/A'}</p></div>
        <div><span class="tag">Applied On</span><p style="font-weight:600;margin-top:0.25rem">${app.appliedDate}</p></div>
      </div>
    </div>
  `;

  // Final States
  if (app.status === 'accepted') {
    html += `
      <div class="congrats-box mt-3">
        <div class="icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You have been accepted into the PRIME Philippines Internship Program! Access your intern dashboard to view your deployment information, manage documents, and log your daily time records.</p>
        <button class="btn btn-success btn-lg" onclick="location.hash='#intern'" id="btn-proceed-dashboard">
          Proceed to Intern Dashboard →
        </button>
      </div>
    `;
  } else if (app.status === 'failed') {
    html += `
      <div class="reject-box mt-3">
        <div class="icon">📄</div>
        <h2>Application Status Update</h2>
        <p>Thank you for your interest in the PRIME Philippines Internship Program. After careful review and consideration of all applicants, we regret to inform you that we are unable to move forward with your application at this time.</p>
        <p style="margin-top:1rem">This decision does not diminish your qualifications or potential. We encourage you to continue developing your skills and welcome you to apply again in future internship cycles.</p>
        <p style="margin-top:1rem;font-weight:500;color:var(--primary)">We wish you the very best in your academic and professional journey.</p>
      </div>
    `;
  }

  // Withdraw button (only if not accepted/failed/withdrawn)
  if (!['accepted', 'failed', 'withdrawn'].includes(app.status)) {
    html += `
      <div class="text-center mt-3">
        <button class="btn btn-danger btn-sm" id="btn-withdraw">Withdraw Application</button>
      </div>
    `;
  }

  c.innerHTML = html;
  page.appendChild(c);
  container.appendChild(page);
  if (window.lucide) window.lucide.createIcons();

  // Withdraw modal
  const withdrawBtn = document.getElementById('btn-withdraw');
  if (withdrawBtn) {
    withdrawBtn.onclick = () => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h2>Withdraw Application?</h2>
          <p>Are you sure you want to withdraw your internship application? This action cannot be undone and will be reflected on the HR side.</p>
          <div class="form-group mt-1 text-left">
            <label>Reason for Withdrawal</label>
            <select id="withdraw-reason" class="form-control">
              <option value="">-- Select Reason --</option>
              <option value="Accepted another offer">Accepted another offer</option>
              <option value="Schedule conflict">Schedule conflict</option>
              <option value="Personal reasons">Personal reasons</option>
              <option value="Health reasons">Health reasons</option>
              <option value="Proximity/Location issues">Proximity/Location issues</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group text-left" id="group-withdraw-other" style="display:none; margin-top:-0.5rem">
            <label>Please specify</label>
            <input type="text" id="withdraw-reason-other" class="form-control" placeholder="Enter reason" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="btn-cancel-withdraw">Cancel</button>
            <button class="btn btn-danger" id="btn-confirm-withdraw">Yes, Withdraw</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const reasonSelect = document.getElementById('withdraw-reason');
      const otherGroup = document.getElementById('group-withdraw-other');
      reasonSelect.onchange = () => {
        otherGroup.style.display = reasonSelect.value === 'Other' ? 'block' : 'none';
      };

      document.getElementById('btn-cancel-withdraw').onclick = () => overlay.remove();
      document.getElementById('btn-confirm-withdraw').onclick = () => {
        let reason = reasonSelect.value;
        if (!reason) { alert('Please select a reason for withdrawal.'); return; }
        if (reason === 'Other') {
          reason = document.getElementById('withdraw-reason-other').value;
          if (!reason) { alert('Please specify your reason.'); return; }
        }
        updateAppStatus(app.id, 'withdrawn', { withdrawReason: reason });
        overlay.remove();
        window.APP.render();
      };
    };
  }
}

function getBadgeClass(status) {
  const map = {
    submitted: 'badge-blue', viewed: 'badge-yellow', initial_interview: 'badge-orange',
    final_interview: 'badge-orange', final_review: 'badge-blue',
    accepted: 'badge-green', failed: 'badge-red', withdrawn: 'badge-gray'
  };
  return map[status] || 'badge-gray';
}

function formatStatus(status) {
  const map = {
    submitted: 'Submitted', viewed: 'Viewed', initial_interview: 'Initial Interview',
    final_interview: 'Final Interview', final_review: 'Final Review',
    accepted: 'Accepted', failed: 'Not Selected', withdrawn: 'Withdrawn'
  };
  return map[status] || status;
}
