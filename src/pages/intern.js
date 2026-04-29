import { getApplication, getDtrEntries, addDtrEntry, getSchoolActivities, addSchoolActivity, getMessages, sendMessage, computeHours, formatHours, COMPANY_DOCUMENTS, updateDocStatus, addSchoolDoc, getStore } from '../store.js';
import { renderNavbar } from '../main.js';

let activeTab = 'deployment';

export function renderInternDashboard(container) {
  const user = window.APP.user;
  if (!user) { location.hash = '#login'; return; }
  const app = getApplication(user.id);
  if (!app || app.status !== 'accepted') { location.hash = '#status'; return; }

  container.innerHTML = '';
  renderNavbar(container, [
    { hash: '#status', label: 'Status' },
    { hash: '#intern', label: 'Dashboard' },
  ]);

  const page = document.createElement('div');
  page.className = 'page';
  const wrap = document.createElement('div');
  wrap.className = 'container';

  wrap.innerHTML = `<div class="page-header"><h1>Intern Dashboard</h1><p>Welcome, ${app.name}! Manage your internship here.</p></div>`;

  // Tabs
  const tabs = [
    { key: 'deployment', label: '📍 Deployment' },
    { key: 'documents', label: '📄 Documents' },
    { key: 'dtr', label: '⏱️ DTR' },
    { key: 'hours', label: '📊 Hours' },
  ];
  let tabsHTML = '<div class="tabs">';
  tabs.forEach(t => {
    tabsHTML += `<button class="tab ${activeTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`;
  });
  tabsHTML += '</div><div id="tab-content"></div>';
  wrap.innerHTML += tabsHTML;

  page.appendChild(wrap);
  container.appendChild(page);

  // Tab click handlers
  wrap.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      renderInternDashboard(document.getElementById('app'));
    };
  });

  const content = document.getElementById('tab-content');
  switch (activeTab) {
    case 'deployment': renderDeployment(content, app); break;
    case 'documents': renderDocuments(content, app); break;
    case 'dtr': renderDTR(content, app); break;
    case 'hours': renderHoursTab(content, app); break;
  }
}

function renderDeployment(el, app) {
  el.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>Deployment Information</h3></div>
      <div class="grid-2">
        <div><span class="tag">Department</span><p style="font-weight:600;margin-top:0.25rem">${app.department || 'To be assigned'}</p></div>
        <div><span class="tag">Supervisor</span><p style="font-weight:600;margin-top:0.25rem">${app.supervisor || 'To be assigned'}</p></div>
        <div><span class="tag">Schedule</span><p style="font-weight:600;margin-top:0.25rem">${app.schedule || 'To be assigned'}</p></div>
        <div><span class="tag">Start Date</span><p style="font-weight:600;margin-top:0.25rem">${app.startDate || 'To be assigned'}</p></div>
        <div><span class="tag">Total Required Hours</span><p style="font-weight:600;margin-top:0.25rem">${app.hoursRequired || 'N/A'}</p></div>
        <div><span class="tag">OJT Type</span><p style="font-weight:600;margin-top:0.25rem">${app.ojtType === 'required' ? 'Required by School' : 'Voluntary'}</p></div>
      </div>
    </div>
  `;
}

function renderDocuments(el, app) {
  const docs = COMPANY_DOCUMENTS;
  const companyDocs = app.companyDocs || {};
  const schoolDocs = app.schoolDocs || [];
  const messages = getMessages(app.id);

  // Sub-tabs
  let docSubTab = el.dataset?.subTab || 'company';

  el.innerHTML = `
    <div class="flex mb-2" style="gap:0.5rem">
      <button class="btn ${docSubTab !== 'school' && docSubTab !== 'chat' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="sub-company">Company Documents</button>
      <button class="btn ${docSubTab === 'school' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="sub-school">School Documents</button>
      <button class="btn ${docSubTab === 'chat' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="sub-chat">💬 HR Communication</button>
    </div>
    <div id="doc-content"></div>
  `;

  const docContent = document.getElementById('doc-content');

  function renderCompanyDocs() {
    let html = '<div class="doc-list">';
    docs.forEach(doc => {
      const status = companyDocs[doc.id] || 'pending';
      const badgeClass = status === 'signed' ? 'badge-green' : status === 'submitted' ? 'badge-blue' : 'badge-gray';
      const badgeText = status === 'signed' ? '✅ Signed' : status === 'submitted' ? '📤 Submitted' : '⏳ Pending';
      html += `
        <div class="doc-item">
          <div>
            <div class="doc-name">${doc.name}</div>
            <div class="doc-desc">${doc.desc}</div>
          </div>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
    });
    html += '</div>';
    docContent.innerHTML = html;
  }

  function renderSchoolDocs() {
    let html = `
      <div class="card mb-2">
        <h3 class="mb-1">Upload School Documents</h3>
        <p style="font-size:0.85rem;color:var(--text-secondary)" class="mb-2">Upload documents from your school that require signatories from PRIME Philippines employees.</p>
        <form id="school-doc-form" class="flex" style="gap:0.75rem;align-items:flex-end">
          <div class="form-group" style="flex:1;margin:0">
            <label>Document Name</label>
            <input type="text" class="form-control" name="docName" placeholder="e.g. Endorsement Letter" required />
          </div>
          <div class="form-group" style="margin:0">
            <label>File</label>
            <input type="file" class="form-control" name="docFile" required style="padding:0.4rem" />
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Upload</button>
        </form>
      </div>
    `;
    if (schoolDocs.length > 0) {
      html += '<div class="doc-list">';
      schoolDocs.forEach(doc => {
        const badgeClass = doc.status === 'signed' ? 'badge-green' : doc.status === 'submitted' ? 'badge-blue' : 'badge-gray';
        const badgeText = doc.status === 'signed' ? `✅ Signed by ${doc.signedBy}` : '📤 Submitted — Awaiting Signature';
        html += `
          <div class="doc-item">
            <div>
              <div class="doc-name">${doc.name}</div>
              <div class="doc-desc">${doc.fileName || 'Uploaded document'}</div>
            </div>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="empty-state"><div class="icon">📁</div><p>No school documents uploaded yet</p></div>';
    }
    docContent.innerHTML = html;

    document.getElementById('school-doc-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const file = e.target.querySelector('[name=docFile]').files[0];
      addSchoolDoc(app.id, { name: fd.get('docName'), fileName: file?.name || 'document' });
      renderInternDashboard(document.getElementById('app'));
    };
  }

  function renderChat() {
    let msgsHTML = '';
    messages.forEach(m => {
      const cls = m.from === 'intern' ? 'sent' : 'received';
      msgsHTML += `<div class="chat-msg ${cls}"><div>${m.text}</div><div class="msg-time">${m.time}</div></div>`;
    });
    if (!messages.length) msgsHTML = '<div class="empty-state" style="padding:2rem"><p>No messages yet. Start a conversation about your documents.</p></div>';

    docContent.innerHTML = `
      <div class="chat-box">
        <div class="chat-messages">${msgsHTML}</div>
        <div class="chat-input">
          <input type="text" class="form-control" id="chat-msg-input" placeholder="Type a message about your documents..." />
          <button class="btn btn-primary btn-sm" id="btn-send-msg">Send</button>
        </div>
      </div>
    `;

    // Scroll to bottom
    const chatMsgs = docContent.querySelector('.chat-messages');
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    document.getElementById('btn-send-msg').onclick = () => {
      const input = document.getElementById('chat-msg-input');
      if (!input.value.trim()) return;
      sendMessage(app.id, 'intern', input.value.trim());
      renderInternDashboard(document.getElementById('app'));
    };
    document.getElementById('chat-msg-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('btn-send-msg').click();
    };
  }

  renderCompanyDocs();

  document.getElementById('sub-company').onclick = () => { renderCompanyDocs(); };
  document.getElementById('sub-school').onclick = () => { renderSchoolDocs(); };
  document.getElementById('sub-chat').onclick = () => { renderChat(); };
}

function renderDTR(el, app) {
  const dtrEntries = getDtrEntries(app.id);
  const schoolActivities = getSchoolActivities(app.id);

  let totalWork = 0, totalOT = 0;
  dtrEntries.forEach(d => {
    const h = computeHours(d.timeIn, d.timeOut);
    totalWork += h.regular;
    totalOT += h.overtime;
  });

  const approvedSchoolHours = schoolActivities.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.hours || 8), 0);
  const cappedSchoolHours = Math.min(approvedSchoolHours, 30);

  const today = new Date().toISOString().split('T')[0];
  const selectedDate = el.dataset.selectedDate || today;

  const hasEntryForSelected = dtrEntries.some(d => d.date === selectedDate);
  const isFutureDate = selectedDate > today;

  el.innerHTML = `
    <div class="card mb-2">
      <div class="card-header flex-between">
        <h3>Daily Time Record</h3>
        <div class="flex" style="gap:0.5rem">
          <div class="stat-card" style="padding:0.5rem 1rem"><div class="stat-number" style="font-size:1.25rem">${formatHours(totalWork)}</div><div class="stat-label">Regular Hrs</div></div>
          <div class="stat-card" style="padding:0.5rem 1rem"><div class="stat-number" style="font-size:1.25rem">${formatHours(totalOT)}</div><div class="stat-label">Overtime</div></div>
        </div>
      </div>
      
      <div class="form-group mb-2" style="max-width: 200px">
        <label>Select Date to Log</label>
        <input type="date" id="dtr-date-picker" class="form-control" value="${selectedDate}" max="${today}" />
      </div>

      ${isFutureDate ? `
        <div class="empty-state" style="padding: 1rem; background: var(--surface2); border-radius: 8px;">
          <p style="color: var(--accent-red)">⚠️ Advanced entry is not allowed. Please select today or a past date.</p>
        </div>
      ` : hasEntryForSelected ? `
        <div class="empty-state" style="padding: 1rem; background: var(--surface2); border-radius: 8px;">
          <p style="color: var(--success)">✅ DTR for ${selectedDate} has already been submitted. One entry per day is allowed.</p>
        </div>
      ` : `
        <form id="dtr-form" class="flex mb-2" style="gap:0.75rem;align-items:flex-end;flex-wrap:wrap">
          <input type="hidden" name="date" value="${selectedDate}" />
          <div class="form-group" style="margin:0">
            <label>Time In</label>
            <input type="time" name="timeIn" class="form-control" required />
          </div>
          <div class="form-group" style="margin:0">
            <label>Time Out</label>
            <input type="time" name="timeOut" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Submit DTR</button>
        </form>
      `}

      ${dtrEntries.length > 0 ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Time In</th><th>Time Out</th><th>Regular</th><th>Overtime</th><th>Total</th></tr></thead>
            <tbody>
              ${dtrEntries.sort((a,b) => b.date.localeCompare(a.date)).map(d => {
                const h = computeHours(d.timeIn, d.timeOut);
                return `<tr><td>${d.date}</td><td>${d.timeIn}</td><td>${d.timeOut}</td><td>${formatHours(h.regular)}</td><td>${formatHours(h.overtime)}</td><td><strong>${formatHours(h.total)}</strong></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><p>No DTR entries yet</p></div>'}
    </div>

    <div class="card">
      <div class="card-header flex-between">
        <h3>🏫 School Activities</h3>
        <span class="badge badge-blue">${formatHours(cappedSchoolHours)} / 30 hrs max</span>
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary)" class="mb-2">Log school activities (webinars, seminars, etc.) — proof required. Maximum of 30 hours total. Each activity counts as 8 hours.</p>
      <form id="school-form" class="flex mb-2" style="gap:0.75rem;align-items:flex-end;flex-wrap:wrap">
        <div class="form-group" style="margin:0">
          <label>Date</label>
          <input type="date" name="date" class="form-control" required />
        </div>
        <div class="form-group" style="margin:0;flex:1;min-width:150px">
          <label>Activity</label>
          <input type="text" name="activity" class="form-control" placeholder="e.g. Webinar on AI" required />
        </div>
        <div class="form-group" style="margin:0">
          <label>Proof</label>
          <input type="file" name="proof" class="form-control" required style="padding:0.4rem" accept="image/*,.pdf,.doc,.docx" />
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Submit</button>
      </form>
      ${schoolActivities.length > 0 ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Activity</th><th>Hours</th><th>Proof</th><th>Status</th></tr></thead>
            <tbody>
              ${schoolActivities.map(s => {
                const bc = s.status === 'approved' ? 'badge-green' : s.status === 'rejected' ? 'badge-red' : 'badge-yellow';
                const bt = s.status === 'approved' ? '✅ Approved' : s.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
                return `<tr><td>${s.date}</td><td>${s.activity}</td><td>8</td><td>${s.proofName || '📎 Uploaded'}</td><td><span class="badge ${bc}">${bt}</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><p>No school activities logged</p></div>'}
    </div>
  `;

  const datePicker = document.getElementById('dtr-date-picker');
  if (datePicker) {
    datePicker.onchange = (e) => {
      el.dataset.selectedDate = e.target.value;
      renderDTR(el, app);
    };
  }

  const dtrForm = document.getElementById('dtr-form');
  if (dtrForm) {
    dtrForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      addDtrEntry(app.id, { date: fd.get('date'), timeIn: fd.get('timeIn'), timeOut: fd.get('timeOut') });
      renderInternDashboard(document.getElementById('app'));
    };
  }

  const schoolForm = document.getElementById('school-form');
  if (schoolForm) {
    schoolForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const file = e.target.querySelector('[name=proof]').files[0];
      addSchoolActivity(app.id, { date: fd.get('date'), activity: fd.get('activity'), hours: 8, proofName: file?.name || 'proof' });
      renderInternDashboard(document.getElementById('app'));
    };
  }
}

function renderHoursTab(el, app) {
  const dtrEntries = getDtrEntries(app.id);
  const schoolActivities = getSchoolActivities(app.id);

  let totalWork = 0, totalOT = 0;
  dtrEntries.forEach(d => {
    const h = computeHours(d.timeIn, d.timeOut);
    totalWork += h.regular;
    totalOT += h.overtime;
  });

  const approvedSchool = schoolActivities.filter(s => s.status === 'approved').reduce((s, a) => s + (a.hours || 8), 0);
  const cappedSchool = Math.min(approvedSchool, 30);
  const totalRendered = totalWork + totalOT + cappedSchool;
  const required = app.hoursRequired || 480;
  const remaining = Math.max(required - totalRendered, 0);
  const pct = Math.min((totalRendered / required) * 100, 100);

  el.innerHTML = `
    <div class="card mb-2">
      <div class="card-header"><h3>📊 Hours Summary</h3></div>
      <div class="grid-2 mb-2" style="grid-template-columns: repeat(4, 1fr)">
        <div class="stat-card"><div class="stat-number">${formatHours(totalWork)}</div><div class="stat-label">Regular Work</div></div>
        <div class="stat-card"><div class="stat-number">${formatHours(totalOT)}</div><div class="stat-label">Overtime</div></div>
        <div class="stat-card"><div class="stat-number">${formatHours(cappedSchool)}</div><div class="stat-label">School Activities</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--primary-light)">${formatHours(totalRendered)}</div><div class="stat-label">Total Rendered</div></div>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-text"><span>${formatHours(totalRendered)} rendered</span><span>${required} required</span></div>
      </div>
    </div>
    <div class="card">
      <div class="flex-between">
        <div>
          <h3 style="color:${remaining > 0 ? 'var(--accent-red)' : 'var(--success)'}">
            ${remaining > 0 ? `${formatHours(remaining)} hours remaining` : '🎉 All hours completed!'}
          </h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem">
            ${remaining > 0 ? `You need to render ${formatHours(remaining)} more hours to complete your internship.` : 'Congratulations! You have completed all required hours.'}
          </p>
        </div>
        <div class="stat-card" style="min-width:100px">
          <div class="stat-number" style="font-size:1.5rem">${Math.round(pct)}%</div>
          <div class="stat-label">Complete</div>
        </div>
      </div>
    </div>
  `;
}
