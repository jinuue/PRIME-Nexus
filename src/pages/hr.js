import { getStore, saveStore, updateAppStatus, getDtrEntries, getSchoolActivities, approveSchoolActivity, computeHours, formatHours, getMessages, sendMessage, signSchoolDoc, updateDocStatus, EMAIL_TEMPLATES, DEPARTMENTS, COMPANY_DOCUMENTS, getQuarter } from '../store.js';
import { renderNavbar } from '../main.js';

let hrSection = 'applications';
let hrFilters = { quarter: 'all', dept: 'all', type: 'all' };

export function renderHRDashboard(container) {
  const user = window.APP.user;
  if (!user || user.role !== 'hr') { location.hash = '#login-hr'; return; }

  container.innerHTML = '';
  renderNavbar(container, []);

  const layout = document.createElement('div');
  layout.className = 'hr-layout';

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'hr-sidebar';
  const sections = [
    { key: 'applications', icon: '📋', label: 'Applications' },
    { key: 'masterlist_applicants', icon: '👤', label: 'Applicants List' },
    { key: 'masterlist_interns', icon: '🎓', label: 'Deployed Interns' },
    { key: 'docs', icon: '📄', label: 'Document Tracking' },
    { key: 'email', icon: '✉️', label: 'Email Templates' },
    { key: 'messages', icon: '💬', label: 'Communications' },
    { key: 'dtr', icon: '⏱️', label: 'DTR Access' },
    { key: 'analytics', icon: '📊', label: 'Analytics' },
  ];
  sidebar.innerHTML = `<div class="hr-sidebar-section">Management</div>` +
    sections.map(s => `<button class="hr-sidebar-link ${hrSection === s.key ? 'active' : ''}" data-section="${s.key}">${s.icon} ${s.label}</button>`).join('');
  layout.appendChild(sidebar);

  // Content area
  const content = document.createElement('div');
  content.className = 'hr-content';
  layout.appendChild(content);

  container.appendChild(layout);

  // Sidebar clicks
  sidebar.querySelectorAll('.hr-sidebar-link').forEach(btn => {
    btn.onclick = () => { 
      hrSection = btn.dataset.section; 
      renderHRContent(content);
      // Update sidebar active state
      sidebar.querySelectorAll('.hr-sidebar-link').forEach(b => b.classList.toggle('active', b.dataset.section === hrSection));
    };
  });

  renderHRContent(content);
}

function renderHRContent(content) {
  const data = getStore();
  const apps = data.applications || [];
  content.innerHTML = '';

  switch (hrSection) {
    case 'applications': renderApplications(content, apps, data); break;
    case 'masterlist_applicants': renderMasterlist(content, apps, 'applicants'); break;
    case 'masterlist_interns': renderMasterlist(content, apps, 'interns'); break;
    case 'docs': renderDocTracking(content, apps); break;
    case 'email': renderEmailTemplates(content, apps); break;
    case 'messages': renderMessages(content, apps); break;
    case 'dtr': renderDTRAccess(content, apps); break;
    case 'analytics': renderAnalytics(content, apps); break;
  }
}

function renderDocTracking(el, apps) {
  const interns = apps.filter(a => a.status === 'accepted');
  el.innerHTML = '<h2 class="mb-2">📄 Document Tracking Dashboard</h2>';

  if (!interns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="icon">📭</div><p>No deployed interns</p>';
    el.appendChild(empty);
    return;
  }

  const selectDiv = document.createElement('div');
  selectDiv.className = 'form-group';
  selectDiv.innerHTML = `
    <label>Select Intern to View Progress</label>
    <select class="form-control" id="doc-intern-select"><option value="">-- Choose intern --</option>${interns.map(i => `<option value="${i.id}">${i.name} — ${i.department||'Unassigned'}</option>`).join('')}</select>
  `;
  el.appendChild(selectDiv);

  const docView = document.createElement('div');
  docView.id = 'hr-doc-view';
  el.appendChild(docView);

  function updateDocView(appId) {
    const data = getStore();
    const app = (data.applications || []).find(i => i.id === appId);
    if (!app) { docView.innerHTML = ''; return; }
    
    const companyDocs = app.companyDocs || {};
    const schoolDocs = app.schoolDocs || [];

    let html = `
      <div class="grid-2 mt-2">
        <div class="card">
          <h3 class="mb-2">Company Documents</h3>
          <div class="doc-list">
    `;

    COMPANY_DOCUMENTS.forEach(doc => {
      const status = companyDocs[doc.id] || 'pending';
      const badgeCls = status === 'signed' ? 'badge-green' : status === 'submitted' ? 'badge-blue' : 'badge-gray';
      html += `
        <div class="doc-item" style="padding:0.75rem">
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.85rem">${doc.name}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Status: <span class="badge ${badgeCls}">${status.toUpperCase()}</span></div>
          </div>
          <select class="form-control doc-status-select" style="width:110px;font-size:0.7rem;padding:0.2rem" data-appid="${appId}" data-docid="${doc.id}">
            <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
            <option value="submitted" ${status==='submitted'?'selected':''}>Submitted</option>
            <option value="signed" ${status==='signed'?'selected':''}>Signed</option>
          </select>
        </div>
      `;
    });

    html += `
          </div>
        </div>
        <div class="card">
          <h3 class="mb-2">School Documents</h3>
    `;

    if (schoolDocs.length > 0) {
      html += '<div class="doc-list">';
      schoolDocs.forEach(doc => {
        const badgeCls = doc.status === 'signed' ? 'badge-green' : 'badge-blue';
        html += `
          <div class="doc-item" style="padding:0.75rem">
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.85rem">${doc.name}</div>
              <div style="font-size:0.7rem;color:var(--text-secondary)">${doc.fileName}</div>
              <div class="mt-1"><span class="badge ${badgeCls}">${doc.status.toUpperCase()}</span></div>
            </div>
            ${doc.status === 'submitted' ? `<button class="btn btn-primary btn-sm sign-doc-btn" style="font-size:0.7rem" data-appid="${appId}" data-docname="${doc.name}">Sign Now</button>` : ''}
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="empty-state" style="padding:1rem"><p>No school documents uploaded</p></div>';
    }

    html += `
        </div>
      </div>
    `;
    docView.innerHTML = html;

    // Local Listeners
    docView.querySelectorAll('.doc-status-select').forEach(sel => {
      sel.onchange = () => {
        updateDocStatus(sel.dataset.appid, sel.dataset.docid, sel.value);
        updateDocView(appId);
      };
    });

    docView.querySelectorAll('.sign-doc-btn').forEach(btn => {
      btn.onclick = () => {
        signSchoolDoc(btn.dataset.appid, btn.dataset.docname, 'HR Administrator');
        updateDocView(appId);
      };
    });
  }

  document.getElementById('doc-intern-select').onchange = (e) => {
    updateDocView(e.target.value);
  };
}

function renderFilterBar(el, apps) {
  const quarters = [...new Set(apps.map(a => a.quarter).filter(Boolean))].sort();
  const depts = [...new Set(apps.map(a => a.department).filter(Boolean))];

  el.innerHTML = `
    <div class="filter-bar">
      <label style="font-size:0.85rem;font-weight:600;color:var(--primary)">Filters:</label>
      <select id="f-quarter"><option value="all">All Quarters</option>${quarters.map(q => `<option value="${q}" ${hrFilters.quarter === q ? 'selected' : ''}>${q}</option>`).join('')}</select>
      <select id="f-dept"><option value="all">All Departments</option>${DEPARTMENTS.map(d => `<option value="${d}" ${hrFilters.dept === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
      <select id="f-type"><option value="all">All Types</option><option value="required" ${hrFilters.type === 'required' ? 'selected' : ''}>Required</option><option value="voluntary" ${hrFilters.type === 'voluntary' ? 'selected' : ''}>Voluntary</option></select>
    </div>
  `;

  ['f-quarter', 'f-dept', 'f-type'].forEach(id => {
    document.getElementById(id).onchange = (e) => {
      const key = id.replace('f-', '');
      hrFilters[key === 'quarter' ? 'quarter' : key === 'dept' ? 'dept' : 'type'] = e.target.value;
      renderHRContent(document.querySelector('.hr-content'));
    };
  });
}

function filterApps(apps) {
  return apps.filter(a => {
    if (hrFilters.quarter !== 'all' && a.quarter !== hrFilters.quarter) return false;
    if (hrFilters.dept !== 'all' && a.department !== hrFilters.dept) return false;
    if (hrFilters.type !== 'all' && a.ojtType !== hrFilters.type) return false;
    return true;
  });
}

let hrAppTab = 'submitted';

function renderApplications(el, apps, data) {
  el.innerHTML = '<h2 class="mb-2">📋 Application Management</h2>';
  
  // Slots Summary (Editable)
  const slotsDiv = document.createElement('div');
  slotsDiv.className = 'card mb-2';
  slotsDiv.style.padding = '1rem';
  let slotsHTML = `
    <div class="flex-between mb-1">
      <h3>Intern Slots per Department</h3>
      <div class="flex" style="gap: 0.5rem">
        <span class="badge badge-blue">Hired / Target</span>
        <button class="btn btn-primary btn-sm" id="btn-save-slots">💾 Save Slots</button>
      </div>
    </div>
    <div class="grid-2" style="grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
  `;
  
  DEPARTMENTS.forEach(dept => {
    const hired = apps.filter(a => a.status === 'accepted' && a.department === dept).length;
    const total = data.deptSlots?.[dept] || 0;
    const isFull = hired >= total && total > 0;
    slotsHTML += `
      <div class="stat-card" style="padding:0.75rem; border-color: ${isFull ? 'var(--accent-red)' : 'var(--border)'}">
        <div class="stat-label" style="font-size:0.7rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${dept}">${dept}</div>
        <div class="flex" style="align-items: center; gap: 0.5rem">
          <span style="font-size: 0.9rem; font-weight: 700">${hired} / </span>
          <input type="number" class="form-control" style="width: 50px; padding: 0.2rem; font-size: 0.9rem" data-dept="${dept}" value="${total}" min="0" />
        </div>
      </div>
    `;
  });
  slotsHTML += '</div>';
  slotsDiv.innerHTML = slotsHTML;
  el.appendChild(slotsDiv);

  document.getElementById('btn-save-slots').onclick = () => {
    const inputs = slotsDiv.querySelectorAll('input[data-dept]');
    const newSlots = {};
    inputs.forEach(inp => { newSlots[inp.dataset.dept] = parseInt(inp.value) || 0; });
    const currentStore = getStore();
    currentStore.deptSlots = newSlots;
    saveStore(currentStore);
    alert('Department slots updated successfully!');
    renderHRContent(document.querySelector('.hr-content'));
  };

  const filterDiv = document.createElement('div');
  el.appendChild(filterDiv);
  renderFilterBar(filterDiv, apps);

  // Status Tabs Navigation
  const statuses = ['submitted','viewed','initial_interview','final_interview','final_review','accepted','failed','withdrawn'];
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'tabs mb-2';
  statuses.forEach(st => {
    const count = filterApps(apps).filter(a => a.status === st).length;
    const btn = document.createElement('button');
    btn.className = `tab ${hrAppTab === st ? 'active' : ''}`;
    btn.innerHTML = `${formatSt(st)} <span style="font-size:0.75rem;opacity:0.7">(${count})</span>`;
    btn.onclick = () => { hrAppTab = st; renderHRContent(document.querySelector('.hr-content')); };
    tabsWrap.appendChild(btn);
  });
  el.appendChild(tabsWrap);

  const filtered = filterApps(apps).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  const activeGroup = filtered.filter(a => a.status === hrAppTab);

  if (!activeGroup.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="icon">📭</div><p>No applications found in "${formatSt(hrAppTab)}"</p>`;
    el.appendChild(empty);
    return;
  }

  const isWithdrawn = hrAppTab === 'withdrawn';
  const renderTable = (list) => {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-wrap';
    let rows = list.map(a => {
      const statusOptions = ['submitted','viewed','initial_interview','final_interview','final_review','accepted','failed'].map(s =>
        `<option value="${s}" ${a.status === s ? 'selected' : ''}>${formatSt(s)}</option>`
      ).join('');

      const deptOptions = DEPARTMENTS.map(d => `<option value="${d}" ${a.department === d ? 'selected' : ''}>${d}</option>`).join('');

      return `<tr>
        <td>
          <strong>${a.name}</strong><br>
          <span style="font-size:0.78rem;color:var(--text-secondary)">${a.email}<br>${a.phone || ''}</span>
        </td>
        <td>
          <span style="font-size:0.78rem">${a.school || 'N/A'}<br>${a.course || 'N/A'}</span><br>
          <div class="flex mt-1" style="gap: 0.25rem">
            <span class="badge ${a.ojtType === 'required' ? 'badge-blue' : 'badge-yellow'}">${a.ojtType === 'required' ? 'Required' : 'Voluntary'}</span>
            ${a.cvName ? `<button class="btn btn-secondary btn-sm" style="padding: 0 0.4rem; font-size: 0.7rem" onclick="alert('Viewing CV: ${a.cvName}')">📄 CV</button>` : ''}
            ${a.coverName ? `<button class="btn btn-secondary btn-sm" style="padding: 0 0.4rem; font-size: 0.7rem" onclick="alert('Viewing Portfolio: ${a.coverName}')">📎 Portfolio</button>` : ''}
          </div>
        </td>
        <td><span style="font-size:0.8rem">${a.appliedDate}<br>${a.quarter || ''}</span></td>
        <td>
          ${isWithdrawn 
            ? `<span class="badge badge-red">${formatSt('withdrawn')}</span>`
            : `<select class="form-control" style="font-size:0.8rem;padding:0.3rem 0.5rem" data-appid="${a.id}" data-field="status">${statusOptions}</select>`
          }
        </td>
        <td>
          ${isWithdrawn || a.status === 'failed'
            ? `<span style="font-size:0.8rem">${a.department || '—'}</span>`
            : `<select class="form-control" style="font-size:0.8rem;padding:0.3rem 0.5rem" data-appid="${a.id}" data-field="department">
                <option value="">Assign Dept</option>${deptOptions}
              </select>`
          }
        </td>
        <td>
          ${!isWithdrawn && ['initial_interview','final_interview'].includes(a.status) ? `
            <input type="date" class="form-control" style="font-size:0.78rem;padding:0.25rem 0.4rem;margin-bottom:0.25rem" data-appid="${a.id}" data-field="interviewDate" value="${a.status === 'final_interview' ? (a.finalInterviewDate||'') : (a.interviewDate||'')}" />
            <input type="time" class="form-control" style="font-size:0.78rem;padding:0.25rem 0.4rem" data-appid="${a.id}" data-field="interviewTime" value="${a.status === 'final_interview' ? (a.finalInterviewTime||'') : (a.interviewTime||'')}" />
          ` : '<span style="font-size:0.78rem;color:var(--text-secondary)">—</span>'}
        </td>
      </tr>`;
    }).join('');

    tableDiv.innerHTML = `<table>
      <thead><tr><th>Applicant</th><th>Academic Info</th><th>Applied</th><th>Status</th><th>Department</th><th>Schedule</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    return tableDiv;
  };

  const currentTable = renderTable(activeGroup);
  el.appendChild(currentTable);
  attachAppListeners(currentTable, data);
}

function getBadgeColor(status) {
  const map = { submitted: '#2E419E', viewed: '#FAEE01', initial_interview: '#F59E0B', final_interview: '#F59E0B', final_review: '#003A6D', accepted: '#16A34A', failed: '#ED0000', withdrawn: '#5A6478' };
  return map[status] || '#D8DEE8';
}

function attachAppListeners(container, data) {
  container.querySelectorAll('select[data-field="status"]').forEach(sel => {
    sel.onchange = () => {
      const extra = {};
      if (sel.value === 'accepted') {
        extra.department = data.applications.find(a => a.id === sel.dataset.appid)?.department;
        extra.supervisor = 'To be assigned';
        extra.schedule = 'Mon-Fri, 8:00 AM - 5:00 PM';
        extra.startDate = new Date().toISOString().split('T')[0];
      }
      updateAppStatus(sel.dataset.appid, sel.value, extra);
      if (sel.value === 'accepted') {
        const store = getStore();
        const app = store.applications.find(a => a.id === sel.dataset.appid);
        if (app) {
          const u = store.users.find(u => u.id === app.userId);
          if (u) { u.role = 'intern'; saveStore(store); }
        }
      }
      renderHRContent(document.querySelector('.hr-content'));
    };
  });

  container.querySelectorAll('select[data-field="department"]').forEach(sel => {
    sel.onchange = () => {
      const store = getStore();
      const app = store.applications.find(a => a.id === sel.dataset.appid);
      if (app) { app.department = sel.value; saveStore(store); }
    };
  });

  container.querySelectorAll('input[data-field="interviewDate"],input[data-field="interviewTime"]').forEach(inp => {
    inp.onchange = () => {
      const store = getStore();
      const app = store.applications.find(a => a.id === inp.dataset.appid);
      if (app) {
        if (app.status === 'final_interview') {
          app[inp.dataset.field === 'interviewDate' ? 'finalInterviewDate' : 'finalInterviewTime'] = inp.value;
        } else {
          app[inp.dataset.field] = inp.value;
        }
        saveStore(store);
      }
    };
  });
}

function renderMasterlist(el, apps, type) {
  const isInterns = type === 'interns';
  el.innerHTML = `<h2 class="mb-2">${isInterns ? '🎓 Deployed Interns' : '👤 Applicants Masterlist'}</h2>`;

  const filterDiv = document.createElement('div');
  el.appendChild(filterDiv);
  renderFilterBar(filterDiv, apps);

  let filtered = filterApps(apps).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  if (isInterns) {
    filtered = filtered.filter(a => a.status === 'accepted');
  } else {
    filtered = filtered.filter(a => a.status !== 'accepted');
  }

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="icon">${isInterns ? '🎓' : '📭'}</div><p>No ${isInterns ? 'deployed interns' : 'applicants'} found</p>`;
    el.appendChild(empty);
    return;
  }

  const tableDiv = document.createElement('div');
  tableDiv.className = 'table-wrap';
  let cols = isInterns
    ? '<th>Name</th><th>School</th><th>Course</th><th>Department</th><th>Supervisor</th><th>Hours</th><th>Type</th>'
    : '<th>Name</th><th>Email</th><th>Phone</th><th>School</th><th>Course</th><th>Status</th><th>Type</th>';

  let rows = filtered.map(a => {
    if (isInterns) {
      const dtrs = getDtrEntries(a.id);
      let total = 0;
      dtrs.forEach(d => { const h = computeHours(d.timeIn, d.timeOut); total += h.total; });
      return `<tr><td><strong>${a.name}</strong></td><td>${a.school||'N/A'}</td><td>${a.course||'N/A'}</td><td>${a.department||'N/A'}</td><td>${a.supervisor||'N/A'}</td><td>${formatHours(total)} / ${a.hoursRequired||'N/A'}</td><td><span class="badge ${a.ojtType==='required'?'badge-blue':'badge-yellow'}">${a.ojtType==='required'?'Required':'Voluntary'}</span></td></tr>`;
    } else {
      return `<tr><td><strong>${a.name}</strong></td><td>${a.email}</td><td>${a.phone||'N/A'}</td><td>${a.school||'N/A'}</td><td>${a.course||'N/A'}</td><td><span class="badge ${getBadgeCls(a.status)}">${formatSt(a.status)}</span></td><td><span class="badge ${a.ojtType==='required'?'badge-blue':'badge-yellow'}">${a.ojtType==='required'?'Required':'Voluntary'}</span></td></tr>`;
    }
  }).join('');

  tableDiv.innerHTML = `<table><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table>`;
  el.appendChild(tableDiv);

  // Count summary
  const countDiv = document.createElement('div');
  countDiv.className = 'flex mt-2';
  countDiv.style.gap = '0.75rem';
  countDiv.innerHTML = `
    <div class="stat-card" style="flex:1"><div class="stat-number">${filtered.length}</div><div class="stat-label">Total</div></div>
    <div class="stat-card" style="flex:1"><div class="stat-number">${filtered.filter(a=>a.ojtType==='required').length}</div><div class="stat-label">Required</div></div>
    <div class="stat-card" style="flex:1"><div class="stat-number">${filtered.filter(a=>a.ojtType==='voluntary').length}</div><div class="stat-label">Voluntary</div></div>
  `;
  el.appendChild(countDiv);
}

function renderEmailTemplates(el, apps) {
  const store = getStore();
  const templates = store.emailTemplates || [];
  el.innerHTML = '<h2 class="mb-2">✉️ Email Templates</h2>';

  let selectedTemplate = null;
  const templatesDiv = document.createElement('div');
  templatesDiv.className = 'grid-2 mb-2';
  templates.forEach((t, idx) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `<h3 style="font-size:0.9rem">${t.name}</h3><p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">${t.subject}</p>`;
    card.onclick = () => {
      templatesDiv.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedTemplate = { ...t, index: idx };
      renderEditor();
    };
    templatesDiv.appendChild(card);
  });
  el.appendChild(templatesDiv);

  const editorArea = document.createElement('div');
  editorArea.id = 'email-editor-area';
  el.appendChild(editorArea);

  function renderEditor() {
    if (!selectedTemplate) return;
    
    editorArea.innerHTML = `
      <div class="card mb-2">
        <div class="flex-between mb-1">
          <h3>Edit Template: ${selectedTemplate.name}</h3>
          <button class="btn btn-primary btn-sm" id="btn-save-template">💾 Save Template</button>
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input type="text" class="form-control" id="edit-template-subject" value="${selectedTemplate.subject}" />
        </div>
        <div class="form-group">
          <label>Body (Use {name}, {date}, {time}, {department}, {mode} as placeholders)</label>
          <textarea class="form-control" id="edit-template-body" style="height:200px">${selectedTemplate.body}</textarea>
        </div>
      </div>
      <div class="card">
        <h3 class="mb-1">Test & Send Preview</h3>
        <div class="form-group">
          <label>Select Applicant</label>
          <select class="form-control" id="email-recipient"><option value="">-- Choose recipient --</option>${apps.filter(a => !['withdrawn'].includes(a.status)).map(a => `<option value="${a.id}">${a.name} (${a.email})</option>`).join('')}</select>
        </div>
        <div id="email-body-preview"></div>
        <button class="btn btn-primary mt-2" id="btn-send-email" disabled>📤 Send Email (Simulated)</button>
      </div>
    `;

    document.getElementById('btn-save-template').onclick = () => {
      const subject = document.getElementById('edit-template-subject').value;
      const body = document.getElementById('edit-template-body').value;
      const currentStore = getStore();
      currentStore.emailTemplates[selectedTemplate.index].subject = subject;
      currentStore.emailTemplates[selectedTemplate.index].body = body;
      saveStore(currentStore);
      alert('Template saved successfully!');
      renderHRContent(document.querySelector('.hr-content'));
    };

    document.getElementById('email-recipient').onchange = (e) => {
      const appId = e.target.value;
      const app = apps.find(a => a.id === appId);
      const btn = document.getElementById('btn-send-email');
      const subject = document.getElementById('edit-template-subject').value;
      const bodyText = document.getElementById('edit-template-body').value;
      
      if (app) {
        let body = bodyText
          .replace(/\{name\}/g, app.name)
          .replace(/\{date\}/g, app.interviewDate || '[Date TBD]')
          .replace(/\{time\}/g, app.interviewTime || '[Time TBD]')
          .replace(/\{department\}/g, app.department || '[Department TBD]')
          .replace(/\{mode\}/g, 'Online via Google Meet');
        document.getElementById('email-body-preview').innerHTML = `
          <div class="template-preview mt-1"><strong>To:</strong> ${app.email}<br><strong>Subject:</strong> ${subject}<br><br>${body.replace(/\n/g, '<br>')}</div>
        `;
        btn.disabled = false;
        btn.onclick = () => {
          btn.textContent = '✅ Email Sent!';
          btn.disabled = true;
          btn.className = 'btn btn-success mt-2';
        };
      } else {
        document.getElementById('email-body-preview').innerHTML = '';
        btn.disabled = true;
      }
    };
  }
}

function renderMessages(el, apps) {
  const interns = apps.filter(a => a.status === 'accepted');
  el.innerHTML = '<h2 class="mb-2">💬 Intern Communications</h2>';

  if (!interns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="icon">📭</div><p>No deployed interns</p>';
    el.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.style.gridTemplateColumns = '300px 1fr';
  grid.style.height = 'calc(100vh - 200px)';
  el.appendChild(grid);

  // Left List
  const list = document.createElement('div');
  list.className = 'card';
  list.style.padding = '0';
  list.style.overflowY = 'auto';
  list.innerHTML = `<div style="padding:1rem;border-bottom:1px solid var(--border);font-weight:600">Interns</div>`;
  interns.forEach(i => {
    const msgs = getMessages(i.id);
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].text : 'No messages yet';
    const item = document.createElement('div');
    item.className = 'doc-item';
    item.style.padding = '1rem';
    item.style.borderBottom = '1px solid var(--border)';
    item.style.cursor = 'pointer';
    item.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.9rem">${i.name}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lastMsg}</div>
      </div>
    `;
    item.onclick = () => {
      list.querySelectorAll('.doc-item').forEach(d => d.style.background = 'none');
      item.style.background = 'var(--surface2)';
      renderChat(i);
    };
    list.appendChild(item);
  });
  grid.appendChild(list);

  // Right Chat Area
  const chatArea = document.createElement('div');
  chatArea.id = 'hr-chat-area';
  chatArea.className = 'card';
  chatArea.style.padding = '0';
  chatArea.style.display = 'flex';
  chatArea.style.flexDirection = 'column';
  chatArea.innerHTML = '<div class="empty-state" style="margin:auto"><p>Select an intern to start chatting</p></div>';
  grid.appendChild(chatArea);

  function renderChat(intern) {
    const messages = getMessages(intern.id);
    let msgsHTML = '';
    messages.forEach(m => {
      const cls = m.from === 'hr' ? 'sent' : 'received';
      msgsHTML += `<div class="chat-msg ${cls}"><div>${m.text}</div><div class="msg-time">${m.time}</div></div>`;
    });

    chatArea.innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border);background:var(--surface2);font-weight:600">${intern.name} — ${intern.department || 'Unassigned'}</div>
      <div class="chat-messages" style="flex:1;overflow-y:auto;padding:1rem">${msgsHTML || '<div class="empty-state"><p>No messages yet</p></div>'}</div>
      <div class="chat-input" style="padding:1rem;border-top:1px solid var(--border)">
        <input type="text" class="form-control" id="hr-chat-msg-input" placeholder="Type a message to ${intern.name}..." />
        <button class="btn btn-primary btn-sm" id="btn-hr-send-msg">Send</button>
      </div>
    `;

    const chatMsgs = chatArea.querySelector('.chat-messages');
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    document.getElementById('btn-hr-send-msg').onclick = () => {
      const input = document.getElementById('hr-chat-msg-input');
      if (!input.value.trim()) return;
      sendMessage(intern.id, 'hr', input.value.trim());
      renderChat(intern);
    };
    document.getElementById('hr-chat-msg-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('btn-hr-send-msg').click();
    };
  }
}

function renderDTRAccess(el, apps) {
  const interns = apps.filter(a => a.status === 'accepted');
  el.innerHTML = '<h2 class="mb-2">⏱️ DTR Access</h2>';

  if (!interns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="icon">📭</div><p>No deployed interns</p>';
    el.appendChild(empty);
    return;
  }

  const selectDiv = document.createElement('div');
  selectDiv.className = 'form-group';
  selectDiv.innerHTML = `
    <label>Select Intern</label>
    <select class="form-control" id="dtr-intern-select"><option value="">-- Choose intern --</option>${interns.map(i => `<option value="${i.id}">${i.name} — ${i.department||'Unassigned'}</option>`).join('')}</select>
  `;
  el.appendChild(selectDiv);

  const dtrView = document.createElement('div');
  dtrView.id = 'hr-dtr-view';
  el.appendChild(dtrView);

  document.getElementById('dtr-intern-select').onchange = (e) => {
    const appId = e.target.value;
    if (!appId) { dtrView.innerHTML = ''; return; }
    const app = interns.find(i => i.id === appId);
    const dtrs = getDtrEntries(appId);
    const schoolActs = getSchoolActivities(appId);

    let totalWork = 0, totalOT = 0;
    dtrs.forEach(d => { const h = computeHours(d.timeIn, d.timeOut); totalWork += h.regular; totalOT += h.overtime; });
    const approvedSchool = schoolActs.filter(s => s.status === 'approved').reduce((s, a) => s + (a.hours||8), 0);

    let html = `
      <div class="flex mt-2 mb-2" style="gap:0.75rem">
        <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalWork)}</div><div class="stat-label">Regular</div></div>
        <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalOT)}</div><div class="stat-label">Overtime</div></div>
        <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(Math.min(approvedSchool,30))}</div><div class="stat-label">School</div></div>
        <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalWork+totalOT+Math.min(approvedSchool,30))}</div><div class="stat-label">Total</div></div>
      </div>
    `;

    if (dtrs.length) {
      html += '<div class="table-wrap mb-2"><table><thead><tr><th>Date</th><th>In</th><th>Out</th><th>Regular</th><th>OT</th><th>Total</th></tr></thead><tbody>';
      dtrs.forEach(d => {
        const h = computeHours(d.timeIn, d.timeOut);
        html += `<tr><td>${d.date}</td><td>${d.timeIn}</td><td>${d.timeOut}</td><td>${formatHours(h.regular)}</td><td>${formatHours(h.overtime)}</td><td><strong>${formatHours(h.total)}</strong></td></tr>`;
      });
      html += '</tbody></table></div>';
    }

    if (schoolActs.length) {
      html += '<h3 class="mb-1">School Activities</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Activity</th><th>Proof</th><th>Status</th><th>Action</th></tr></thead><tbody>';
      schoolActs.forEach(s => {
        const bc = s.status === 'approved' ? 'badge-green' : s.status === 'rejected' ? 'badge-red' : 'badge-yellow';
        const bt = s.status === 'approved' ? '✅ Approved' : s.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
        const actions = s.status === 'pending'
          ? `<button class="btn btn-success btn-sm" data-said="${s.id}" data-action="approve">Approve</button> <button class="btn btn-danger btn-sm" data-said="${s.id}" data-action="reject">Reject</button>`
          : '—';
        const proofBtn = s.proofName 
          ? `<button class="btn btn-secondary btn-sm" style="padding:0 0.4rem;font-size:0.7rem" onclick="alert('Viewing Proof: ${s.proofName}')">📄 View</button>`
          : '—';
        html += `<tr><td>${s.date}</td><td>${s.activity}</td><td>${proofBtn}</td><td><span class="badge ${bc}">${bt}</span></td><td>${actions}</td></tr>`;
      });
      html += '</tbody></table></div>';
    }

    dtrView.innerHTML = html;

    dtrView.querySelectorAll('[data-said]').forEach(btn => {
      btn.onclick = () => {
        approveSchoolActivity(btn.dataset.said, btn.dataset.action === 'approve');
        document.getElementById('dtr-intern-select').dispatchEvent(new Event('change'));
      };
    });
  };
}

function renderAnalytics(el, apps) {
  const quarters = [...new Set(apps.map(a => a.quarter).filter(Boolean))].sort();

  el.innerHTML = '<h2 class="mb-2">📊 Analytics & Statistics</h2>';

  // Overall stats
  const total = apps.length;
  const required = apps.filter(a => a.ojtType === 'required').length;
  const voluntary = apps.filter(a => a.ojtType === 'voluntary').length;
  const accepted = apps.filter(a => a.status === 'accepted').length;
  const pending = apps.filter(a => !['accepted', 'failed', 'withdrawn'].includes(a.status)).length;

  const statsDiv = document.createElement('div');
  statsDiv.className = 'flex mb-2';
  statsDiv.style.gap = '0.75rem';
  statsDiv.style.flexWrap = 'wrap';
  statsDiv.innerHTML = `
      <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-number">${total}</div><div class="stat-label">Total Applicants</div></div>
      <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-number">${required}</div><div class="stat-label">Required OJT</div></div>
      <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-number">${voluntary}</div><div class="stat-label">Voluntary</div></div>
      <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-number">${accepted}</div><div class="stat-label">Accepted</div></div>
      <div class="stat-card" style="flex:1;min-width:120px"><div class="stat-number">${pending}</div><div class="stat-label">Pending</div></div>
  `;
  el.appendChild(statsDiv);

  // Per quarter
  if (quarters.length) {
    const h3 = document.createElement('h3');
    h3.className = 'mb-1 mt-3';
    h3.textContent = 'Per Quarter';
    el.appendChild(h3);
    
    const tDiv = document.createElement('div');
    tDiv.className = 'table-wrap mb-2';
    let rows = quarters.map(q => {
      const qApps = apps.filter(a => a.quarter === q);
      const maxCount = Math.max(...quarters.map(qq => apps.filter(a => a.quarter === qq).length));
      const barWidth = maxCount ? (qApps.length / maxCount) * 100 : 0;
      return `<tr>
        <td><strong>${q}</strong></td>
        <td>${qApps.length}</td>
        <td>${qApps.filter(a=>a.ojtType==='required').length}</td>
        <td>${qApps.filter(a=>a.ojtType==='voluntary').length}</td>
        <td>${qApps.filter(a=>a.status==='accepted').length}</td>
        <td style="width:200px"><div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:20px"><div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;width:${barWidth}%;border-radius:4px"></div></div></td>
      </tr>`;
    }).join('');
    tDiv.innerHTML = `<table><thead><tr><th>Quarter</th><th>Total</th><th>Required</th><th>Voluntary</th><th>Accepted</th><th>Distribution</th></tr></thead><tbody>${rows}</tbody></table>`;
    el.appendChild(tDiv);
  }

  // Per department
  const deptCounts = {};
  apps.forEach(a => { const d = a.department || 'Unassigned'; deptCounts[d] = (deptCounts[d]||0) + 1; });
  const deptEntries = Object.entries(deptCounts).sort((a,b) => b[1]-a[1]);
  if (deptEntries.length) {
    const h3 = document.createElement('h3');
    h3.className = 'mb-1 mt-3';
    h3.textContent = 'Per Department';
    el.appendChild(h3);
    
    const dDiv = document.createElement('div');
    dDiv.className = 'table-wrap';
    const maxDept = Math.max(...deptEntries.map(e=>e[1]));
    let dRows = deptEntries.map(([dept, count]) => {
      const bw = (count/maxDept)*100;
      return `<tr><td><strong>${dept}</strong></td><td>${count}</td><td style="width:200px"><div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:20px"><div style="background:linear-gradient(90deg,var(--primary-light),var(--primary));height:100%;width:${bw}%;border-radius:4px"></div></div></td></tr>`;
    }).join('');
    dDiv.innerHTML = `<table><thead><tr><th>Department</th><th>Count</th><th>Distribution</th></tr></thead><tbody>${dRows}</tbody></table>`;
    el.appendChild(dDiv);
  }
}

function formatSt(s) {
  const m = { submitted:'Submitted', viewed:'Viewed', initial_interview:'Initial Interview', final_interview:'Final Interview', final_review:'Final Review', accepted:'Accepted', failed:'Not Selected', withdrawn:'Withdrawn' };
  return m[s]||s;
}
function getBadgeCls(s) {
  const m = { submitted:'badge-blue', viewed:'badge-yellow', initial_interview:'badge-orange', final_interview:'badge-orange', final_review:'badge-blue', accepted:'badge-green', failed:'badge-red', withdrawn:'badge-gray' };
  return m[s]||'badge-gray';
}
