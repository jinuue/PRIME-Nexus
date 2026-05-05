import { getStore, saveStore, updateAppStatus, getDtrEntries, getSchoolActivities, approveSchoolActivity, computeHours, formatHours, getMessages, sendMessage, signSchoolDoc, updateDocStatus, getDepartments, getCompanyDocuments, getQuarter, deployIntern, addLegacyIntern, saveEmailTemplate, deleteEmailTemplate, markMessagesAsRead, addCompanyDocument } from '../store.js';
import { renderNavbar, setupPhoneMask } from '../main.js';

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
  const groups = [
    {
      title: 'Recruitment',
      items: [
        { key: 'applications', icon: '<i data-lucide="clipboard-list" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Applications' },
        { key: 'masterlist_applicants', icon: '<i data-lucide="users" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Applicants List' },
      ]
    },
    {
      title: 'Intern Management',
      items: [
        { key: 'masterlist_interns', icon: '<i data-lucide="graduation-cap" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Deployed Interns' },
        { key: 'docs', icon: '<i data-lucide="file-check-2" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Document Tracking' },
        { key: 'dtr', icon: '<i data-lucide="clock" style="width:18px;height:18px;margin-right:8px"></i>', label: 'DTR Access' },
      ]
    },
    {
      title: 'Communications',
      items: [
        { key: 'email', icon: '<i data-lucide="mail" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Email Templates' },
        { key: 'messages', icon: '<i data-lucide="message-square" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Intern Messages' },
        { key: 'sup_messages', icon: '<i data-lucide="message-circle" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Supervisor Messages' },
      ]
    },
    {
      title: 'Records & Insights',
      items: [
        { key: 'historical', icon: '<i data-lucide="archive" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Historical Records' },
        { key: 'analytics', icon: '<i data-lucide="bar-chart-2" style="width:18px;height:18px;margin-right:8px"></i>', label: 'Analytics' },
      ]
    }
  ];

  sidebar.innerHTML = groups.map(g => `
    <div class="hr-sidebar-section">${g.title}</div>
    ${g.items.map(s => `
      <button class="hr-sidebar-link ${hrSection === s.key ? 'active' : ''}" data-section="${s.key}">
        ${s.icon} <span>${s.label}</span>
      </button>
    `).join('')}
  `).join('');
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
  if (window.lucide) window.lucide.createIcons();
}

export function updateSidebarBadge() {
  const data = getStore();
  let unreadMessagesCount = 0;
  (data.applications || []).forEach(a => {
    if (a.status === 'accepted' && a.isDeployed) {
      const msgs = getMessages(a.id);
      const unreadCount = msgs.filter(m => m.from === 'intern' && !m.read).length;
      if (unreadCount > 0) unreadMessagesCount++;
    }
  });

  const sidebarBtn = document.querySelector('.hr-sidebar-link[data-section="messages"]');
  if (sidebarBtn) {
    let badge = sidebarBtn.querySelector('.nav-badge');
    if (unreadMessagesCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.style.cssText = 'background:var(--accent-red);color:white;border-radius:50%;padding:0.1rem 0.4rem;font-size:0.7rem;margin-left:auto';
        sidebarBtn.appendChild(badge);
      }
      badge.textContent = unreadMessagesCount;
    } else if (badge) {
      badge.remove();
    }
  }

  let unreadSupCount = 0;
  (data.users || []).forEach(u => {
    if (u.role === 'supervisor') {
      const msgs = getMessages(u.id);
      if (msgs.some(m => m.from === 'supervisor' && !m.read)) unreadSupCount++;
    }
  });

  const supSidebarBtn = document.querySelector('.hr-sidebar-link[data-section="sup_messages"]');
  if (supSidebarBtn) {
    let badge = supSidebarBtn.querySelector('.nav-badge');
    if (unreadSupCount > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.style.cssText = 'background:var(--accent-red);color:white;border-radius:50%;padding:0.1rem 0.4rem;font-size:0.7rem;margin-left:auto';
        supSidebarBtn.appendChild(badge);
      }
      badge.textContent = unreadSupCount;
    } else if (badge) {
      badge.remove();
    }
  }
}

function renderHRContent(content) {
  updateSidebarBadge();
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
    case 'sup_messages': renderSupervisorChat(content, data); break;
    case 'dtr': renderDTRAccess(content, apps); break;
    case 'historical': renderHistoricalData(content); break;
    case 'analytics': renderAnalytics(content, apps); break;
  }
  if (window.lucide) window.lucide.createIcons();
}

function renderDocTracking(el, apps) {
  const interns = apps.filter(a => a.status === 'accepted');
  const companyDocuments = getCompanyDocuments();
  el.innerHTML = `
    <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:1.5rem">
      <h2 style="margin:0"><i data-lucide="file-check-2" style="width:24px;height:24px;margin-right:8px;vertical-align:text-bottom"></i> Document Tracking Dashboard</h2>
      <button class="btn btn-primary" id="btn-add-company-doc"><i data-lucide="plus" style="width:18px;height:18px;margin-right:4px;vertical-align:text-bottom"></i> Add Company Document</button>
    </div>
  `;

  document.getElementById('btn-add-company-doc').onclick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2>Add Company Document</h2>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1rem">This document will be required for all interns.</p>
        <form id="add-company-doc-form">
          <div class="form-group">
            <label>Document Name</label>
            <input type="text" name="name" class="form-control" placeholder="e.g. Health & Safety Protocol" required />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" name="desc" class="form-control" placeholder="Brief instruction for interns" />
          </div>
          <div class="form-group">
            <label>Requirement Type</label>
            <select name="type" class="form-control" required>
              <option value="submit">Upload Requirement (Intern uploads file)</option>
              <option value="sign">Signature Requirement (Intern signs acknowledgment)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Template / Form (Optional)</label>
            <input type="file" name="template" class="form-control" style="padding:0.4rem" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-doc">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Document</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel-doc').onclick = () => overlay.remove();
    document.getElementById('add-company-doc-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const file = e.target.querySelector('[name=template]').files[0];
      addCompanyDocument({
        name: fd.get('name'),
        desc: fd.get('desc'),
        type: fd.get('type'),
        templateName: file ? file.name : null
      });
      overlay.remove();
      renderHRContent(el);
    };
  };

  if (!interns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-1" style="color:var(--text-secondary)"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M12 14l9-5-9-5-9 5 9 5z"></path></svg><p style="font-weight:500">No deployed interns</p>';
    el.appendChild(empty);
    return;
  }

  const selectDiv = document.createElement('div');
  selectDiv.className = 'form-group';
  selectDiv.innerHTML = `
    <label>Select Intern to View Progress</label>
    <select class="form-control" id="doc-intern-select"><option value="" disabled selected hidden>-- Choose intern --</option>${interns.map(i => `<option value="${i.id}">${i.name} — ${i.department || 'Unassigned'}</option>`).join('')}</select>
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

    companyDocuments.forEach(doc => {
      const status = companyDocs[doc.id] || 'pending';
      const badgeCls = status === 'signed' ? 'badge-green' : status === 'submitted' ? 'badge-blue' : 'badge-gray';
      html += `
        <div class="doc-item" style="padding:0.75rem">
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.85rem">${doc.name} ${doc.templateName ? `<span style="font-weight:400;font-size:0.7rem;color:var(--accent-blue);margin-left:4px;cursor:pointer" onclick="alert('Downloading template: ${doc.templateName}')"><i data-lucide="download" style="width:12px;height:12px"></i> Template</span>` : ''}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Status: <span class="badge ${badgeCls}">${status.toUpperCase()}</span></div>
          </div>
          <select class="form-control doc-status-select" style="width:110px;font-size:0.7rem;padding:0.2rem" data-appid="${appId}" data-docid="${doc.id}">
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="submitted" ${status === 'submitted' ? 'selected' : ''}>Submitted</option>
            <option value="signed" ${status === 'signed' ? 'selected' : ''}>Signed</option>
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
            ${doc.status === 'submitted' ? `<button class="btn btn-primary btn-sm sign-doc-btn" style="font-size:0.7rem" data-appid="${appId}" data-docid="${doc.id}"><i data-lucide="pen-tool" style="width:12px;height:12px;margin-right:4px;vertical-align:text-bottom"></i> Mark as Signed</button>` : ''}
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="empty-state" style="padding:1rem"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-1" style="color:var(--text-secondary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><p style="font-weight:500">No school documents uploaded</p></div>';
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
        if (confirm('Confirm that this document has been physically signed?')) {
          signSchoolDoc(btn.dataset.appid, btn.dataset.docid, 'HR Administrator');
          updateDocView(appId);
          alert('Document marked as signed.');
        }
      };
    });
  }

  document.getElementById('doc-intern-select').onchange = (e) => {
    updateDocView(e.target.value);
  };
}

function renderFilterBar(el, apps) {
  const quarters = [...new Set(apps.map(a => a.quarter).filter(Boolean))].sort();
  const depts = getDepartments();

  el.innerHTML = `
    <div class="filter-bar">
      <label style="font-size:0.85rem;font-weight:600;color:var(--primary)">Filters:</label>
      <select id="f-quarter"><option value="all">All Quarters</option>${quarters.map(q => `<option value="${q}" ${hrFilters.quarter === q ? 'selected' : ''}>${q}</option>`).join('')}</select>
      <select id="f-dept"><option value="all">All Departments</option>${depts.map(d => `<option value="${d}" ${hrFilters.dept === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
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
  el.innerHTML = '<h2 class="mb-2"><i data-lucide="clipboard-list"></i> Application Management</h2>';
  const departments = getDepartments();

  // Slots Summary (Editable)
  const slotsDiv = document.createElement('div');
  slotsDiv.className = 'card mb-2';
  slotsDiv.style.padding = '1rem';
  let slotsHTML = `
    <div class="flex-between mb-1">
      <h3>Intern Slots per Department</h3>
      <div class="flex" style="gap: 0.5rem">
        <span class="badge badge-blue">Hired / Target</span>
        <button class="btn btn-primary btn-sm" id="btn-add-dept"><i data-lucide="plus"></i> Add Department</button>
      </div>
    </div>
    <div class="grid-2" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
  `;

  departments.forEach(dept => {
    const hired = apps.filter(a => a.status === 'accepted' && a.department === dept).length;
    const total = data.deptSlots?.[dept] || 0;
    const isFull = hired >= total && total > 0;
    slotsHTML += `
      <div class="stat-card" style="padding:1.25rem; border-color: ${isFull ? 'var(--success)' : 'var(--border)'}; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <div style="font-size:0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; text-align:center;" title="${dept}">${dept}</div>
        <div class="slot-edit-btn" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--surface2); padding: 0.6rem 1rem; border-radius: var(--radius); width: 100%; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent;" data-dept="${dept}" data-total="${total}" onmouseover="this.style.borderColor='var(--accent-blue)'; this.style.transform='scale(1.02)'" onmouseout="this.style.borderColor='transparent'; this.style.transform='scale(1)'" title="Click to edit slots">
          <span style="font-size: 1.25rem; font-weight: 800; color: ${isFull ? 'var(--success)' : 'var(--text)'}">${hired}</span>
          <span style="color: var(--text-secondary); font-weight: 600; margin: 0 0.25rem">/</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: var(--primary)">${total}</span>
        </div>
      </div>
    `;
  });
  slotsHTML += '</div>';
  slotsDiv.innerHTML = slotsHTML;
  el.appendChild(slotsDiv);

  slotsDiv.querySelectorAll('.slot-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const dept = btn.dataset.dept;
      const current = btn.dataset.total;

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width: 400px">
          <h2 style="margin-bottom: 0.5rem; color: var(--primary)">Update Intern Slots</h2>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1.25rem">Set the target number of slots for <strong>${dept}</strong>.</p>
          <form id="edit-slots-form">
            <div class="form-group">
              <label>Target Slots</label>
              <input type="number" class="form-control" name="slots" value="${current}" min="0" required />
            </div>
            <div class="modal-actions" style="margin-top:1.5rem">
              <button type="button" class="btn btn-secondary" id="btn-cancel-edit">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('btn-cancel-edit').onclick = () => overlay.remove();
      document.getElementById('edit-slots-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const parsed = parseInt(fd.get('slots')) || 0;
        const currentStore = getStore();
        if (!currentStore.deptSlots) currentStore.deptSlots = {};
        currentStore.deptSlots[dept] = parsed;
        saveStore(currentStore);
        overlay.remove();
        renderHRContent(document.querySelector('.hr-content'));
      };
    };
  });

  document.getElementById('btn-add-dept').onclick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 400px">
        <h2 style="margin-bottom: 0.5rem; color: var(--primary)">Add Department</h2>
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1.25rem">Create a new department and set its target slots.</p>
        <form id="add-dept-form">
          <div class="form-group">
            <label>Department Name</label>
            <input type="text" class="form-control" name="deptName" placeholder="e.g. Finance" required />
          </div>
          <div class="form-group">
            <label>Target Slots</label>
            <input type="number" class="form-control" name="slots" value="1" min="0" required />
          </div>
          <div class="modal-actions" style="margin-top:1.5rem">
            <button type="button" class="btn btn-secondary" id="btn-cancel-add">Cancel</button>
            <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Add Department</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-add').onclick = () => overlay.remove();
    document.getElementById('add-dept-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const deptName = fd.get('deptName').trim();
      const parsed = parseInt(fd.get('slots')) || 0;
      if (deptName) {
        const currentStore = getStore();
        if (!currentStore.deptSlots) currentStore.deptSlots = {};
        currentStore.deptSlots[deptName] = parsed;
        saveStore(currentStore);
        overlay.remove();
        renderHRContent(document.querySelector('.hr-content'));
      }
    };
  };

  const filterDiv = document.createElement('div');
  el.appendChild(filterDiv);
  renderFilterBar(filterDiv, apps);

  // Status Tabs Navigation
  const statuses = ['submitted', 'viewed', 'initial_interview', 'final_interview', 'final_review', 'accepted', 'failed', 'withdrawn'];
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
    empty.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-1" style="color:var(--text-secondary)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg><p style="font-weight:500">No applications found in "${formatSt(hrAppTab)}"</p>`;
    el.appendChild(empty);
    return;
  }

  const isWithdrawn = hrAppTab === 'withdrawn';
  const renderTable = (list) => {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-wrap';
    let rows = list.map(a => {
      const statusOptions = ['submitted', 'viewed', 'initial_interview', 'final_interview', 'final_review', 'accepted', 'failed'].map(s =>
        `<option value="${s}" ${a.status === s ? 'selected' : ''}>${formatSt(s)}</option>`
      ).join('');

      const deptOptions = departments.map(d => `<option value="${d}" ${a.department === d ? 'selected' : ''}>${d}</option>`).join('');
      
      const store = getStore();
      const allowedRoles = a.status === 'initial_interview' ? ['hr'] : ['hr', 'supervisor'];
      const staff = (store.users || []).filter(u => allowedRoles.includes(u.role)).map(u => u.name);
      const currentInterviewer = a.status === 'final_interview' ? (a.finalInterviewedBy || '') : (a.interviewedBy || '');
      const interviewerOptions = ['Select Interviewer', ...staff].map(name => {
        const val = name === 'Select Interviewer' ? '' : name;
        return `<option value="${val}" ${currentInterviewer === val ? 'selected' : ''}>${name}</option>`;
      }).join('');

      return `<tr>
        <td>
          <strong>${a.name}</strong><br>
          <span style="font-size:0.78rem;color:var(--text-secondary)">${a.email}<br>${a.phone || ''}</span>
        </td>
        <td>
          <span style="font-size:0.78rem">${a.school || 'N/A'}<br>${a.course || 'N/A'}</span><br>
          <div class="flex mt-1" style="gap: 0.25rem">
            <span class="badge ${a.ojtType === 'required' ? 'badge-blue' : 'badge-yellow'}">${a.ojtType === 'required' ? 'Required' : 'Voluntary'}</span>
            ${a.cvName ? `<button class="btn btn-secondary btn-sm" style="padding: 0 0.4rem; font-size: 0.7rem" onclick="alert('Viewing CV: ${a.cvName}')"><i data-lucide="file-text"></i> CV</button>` : ''}
            ${a.coverName ? `<button class="btn btn-secondary btn-sm" style="padding: 0 0.4rem; font-size: 0.7rem" onclick="alert('Viewing Portfolio: ${a.coverName}')"><i data-lucide="paperclip"></i> Portfolio</button>` : ''}
          </div>
        </td>
        <td><span style="font-size:0.8rem">${a.appliedDate}<br>${a.quarter || ''}</span></td>
        <td>
          ${isWithdrawn
          ? `<span class="badge badge-red">${formatSt('withdrawn')}</span><div style="font-size:0.75rem;color:var(--accent-red);margin-top:0.25rem;line-height:1.2"><strong>Reason:</strong><br/>${a.withdrawReason || 'Not specified'}</div>`
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
          ${!isWithdrawn && ['initial_interview', 'final_interview'].includes(a.status) ? `
            <div style="display:flex; flex-direction:column; gap:0.25rem; max-width:140px;">
              <input type="date" class="form-control" style="font-size:0.78rem;padding:0.25rem 0.4rem" data-appid="${a.id}" data-field="interviewDate" value="${a.status === 'final_interview' ? (a.finalInterviewDate || '') : (a.interviewDate || '')}" />
              <input type="time" class="form-control" style="font-size:0.78rem;padding:0.25rem 0.4rem" data-appid="${a.id}" data-field="interviewTime" value="${a.status === 'final_interview' ? (a.finalInterviewTime || '') : (a.interviewTime || '')}" />
              <select class="form-control" style="font-size:0.78rem;padding:0.25rem 0.4rem" data-appid="${a.id}" data-field="interviewedBy">
                ${interviewerOptions}
              </select>
            </div>
          ` : a.status === 'accepted' ? `
            ${a.isDeployed
            ? '<span class="badge badge-green"><i class="fi fi-rs-rocket-lunch" style="margin-right:4px"></i> DEPLOYED</span>'
            : `<button class="btn btn-success btn-sm btn-deploy" data-appid="${a.id}"><i class="fi fi-rs-rocket-lunch" style="margin-right:4px"></i> Deploy to Office</button>`}
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

  container.querySelectorAll('input[data-field="interviewDate"],input[data-field="interviewTime"],select[data-field="interviewedBy"]').forEach(inp => {
    inp.onchange = () => {
      const store = getStore();
      const app = store.applications.find(a => a.id === inp.dataset.appid);
      if (app) {
        if (app.status === 'final_interview') {
          const fieldMap = {
            interviewDate: 'finalInterviewDate',
            interviewTime: 'finalInterviewTime',
            interviewedBy: 'finalInterviewedBy'
          };
          app[fieldMap[inp.dataset.field] || inp.dataset.field] = inp.value;
        } else {
          app[inp.dataset.field] = inp.value;
        }
        saveStore(store);
      }
    };
  });

  container.querySelectorAll('.btn-deploy').forEach(btn => {
    btn.onclick = () => {
      const store = getStore();
      const app = store.applications.find(a => a.id === btn.dataset.appid);
      if (app) {
        if (!app.department) {
          alert('Please assign a department first before deployment.');
          return;
        }

        const supervisors = store.users.filter(u => u.role === 'supervisor');
        const matchingSups = supervisors.filter(s => s.department === app.department);
        const listToUse = matchingSups.length > 0 ? matchingSups : supervisors;

        const supervisorOptions = listToUse.map(s => {
          return `<option value="${s.name}">${s.name} (${s.department})</option>`;
        }).join('');

        const overlay = document.createElement('div');
        const departments = getDepartments();
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal">
            <h2>Deploy Intern</h2>
            <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1rem">Assign the final deployment details for <strong>${app.name}</strong>.</p>
            <form id="deploy-form">
              <div class="form-group">
                <label>Assigned Supervisor</label>
                <select class="form-control" name="supervisor" required>
                  <option value="" disabled selected hidden>Select a supervisor</option>
                  ${supervisorOptions}
                </select>
              </div>
              <div class="form-group">
                <label>Work Schedule</label>
                <input type="text" class="form-control" name="schedule" value="Mon-Fri, 8:00 AM - 5:00 PM" required />
              </div>
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" class="form-control" name="startDate" value="${new Date().toISOString().split('T')[0]}" required />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="btn-cancel-deploy">Cancel</button>
                <button type="submit" class="btn btn-success"><i class="fi fi-rs-rocket-lunch" style="margin-right:4px"></i> Confirm Deployment</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-cancel-deploy').onclick = () => overlay.remove();
        document.getElementById('deploy-form').onsubmit = (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          app.supervisor = fd.get('supervisor');
          app.schedule = fd.get('schedule');
          app.startDate = fd.get('startDate');
          saveStore(store); // save these new details

          deployIntern(app.id);
          overlay.remove();
          renderHRContent(document.querySelector('.hr-content'));
          alert('Intern successfully deployed!');
        };
      }
    };
  });
}

function renderMasterlist(el, apps, type) {
  const isInterns = type === 'interns';
  el.innerHTML = `<h2 class="mb-2">${isInterns ? '<i data-lucide="graduation-cap" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Deployed Interns' : '<i data-lucide="users" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Applicants Masterlist'}</h2>`;

  const filterDiv = document.createElement('div');
  el.appendChild(filterDiv);
  renderFilterBar(filterDiv, apps);

  let filtered = filterApps(apps).sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  if (isInterns) {
    filtered = filtered.filter(a => a.status === 'accepted' && a.isDeployed && a.startDate <= today);
  } else {
    // Show non-accepted, OR accepted but not deployed, OR accepted and deployed but start date is in the future
    filtered = filtered.filter(a => a.status !== 'accepted' || (a.status === 'accepted' && (!a.isDeployed || a.startDate > today)));
  }

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-1" style="color:var(--text-secondary)"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><p style="font-weight:500">No ${isInterns ? 'deployed interns' : 'applicants'} found</p>`;
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
      return `<tr><td><strong>${a.name}</strong></td><td>${a.school || 'N/A'}</td><td>${a.course || 'N/A'}</td><td>${a.department || 'N/A'}</td><td>${a.supervisor || 'N/A'}</td><td>${formatHours(total)} / ${a.hoursRequired || 'N/A'}</td><td><span class="badge ${a.ojtType === 'required' ? 'badge-blue' : 'badge-yellow'}">${a.ojtType === 'required' ? 'Required' : 'Voluntary'}</span></td></tr>`;
    } else {
      const isIncoming = a.status === 'accepted' && a.isDeployed;
      return `<tr><td><strong>${a.name}</strong></td><td>${a.email}</td><td>${a.phone || 'N/A'}</td><td>${a.school || 'N/A'}</td><td>${a.course || 'N/A'}</td><td><span class="badge ${getBadgeCls(a.status)}">${formatSt(a.status)}${isIncoming ? ' (Incoming)' : ''}</span></td><td><span class="badge ${a.ojtType === 'required' ? 'badge-blue' : 'badge-yellow'}">${a.ojtType === 'required' ? 'Required' : 'Voluntary'}</span></td></tr>`;
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
    <div class="stat-card" style="flex:1"><div class="stat-number">${filtered.filter(a => a.ojtType === 'required').length}</div><div class="stat-label">Required</div></div>
    <div class="stat-card" style="flex:1"><div class="stat-number">${filtered.filter(a => a.ojtType === 'voluntary').length}</div><div class="stat-label">Voluntary</div></div>
  `;
  el.appendChild(countDiv);
}

function renderEmailTemplates(el, apps) {
  const store = getStore();
  const templates = store.emailTemplates || [];
  el.innerHTML = `
    <div class="flex-between mb-2">
      <h2 class="mb-0"><i data-lucide="mail" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Email Templates</h2>
      <button class="btn btn-primary btn-sm" id="btn-add-template"><i data-lucide="plus" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Add Template</button>
    </div>
  `;

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
          <h3>Edit Template</h3>
          <div class="flex" style="gap:0.5rem">
            <button class="btn btn-danger btn-sm" id="btn-delete-template"><i data-lucide="trash-2" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Delete</button>
            <button class="btn btn-primary btn-sm" id="btn-save-template"><i data-lucide="save" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Save Template</button>
          </div>
        </div>
        <div class="form-group">
          <label>Template Name</label>
          <input type="text" class="form-control" id="edit-template-name" value="${selectedTemplate.name}" />
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
        <button class="btn btn-primary mt-2" id="btn-send-email" disabled><i data-lucide="send" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Send Email (Simulated)</button>
      </div>
    `;

    document.getElementById('btn-save-template').onclick = () => {
      const name = document.getElementById('edit-template-name').value;
      const subject = document.getElementById('edit-template-subject').value;
      const body = document.getElementById('edit-template-body').value;
      const currentStore = getStore();
      currentStore.emailTemplates[selectedTemplate.index].name = name;
      currentStore.emailTemplates[selectedTemplate.index].subject = subject;
      currentStore.emailTemplates[selectedTemplate.index].body = body;
      saveStore(currentStore);
      alert('Template saved successfully!');
      renderHRContent(document.querySelector('.hr-content'));
    };

    document.getElementById('btn-delete-template').onclick = () => {
      if (confirm(`Are you sure you want to delete the template "${selectedTemplate.name}"? This action cannot be undone.`)) {
        deleteEmailTemplate(selectedTemplate.id);
        selectedTemplate = null;
        renderEmailTemplates(el, apps);
        alert('Template deleted successfully.');
      }
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
          btn.innerHTML = '<i data-lucide="check" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Email Sent!';
          btn.disabled = true;
          btn.className = 'btn btn-success mt-2';
          if (window.lucide) window.lucide.createIcons();
        };
      } else {
        document.getElementById('email-body-preview').innerHTML = '';
        btn.disabled = true;
      }
    };
  }

  document.getElementById('btn-add-template').onclick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <h2>Create New Template</h2>
        <div class="form-group">
          <label>Template Name</label>
          <input type="text" id="new-template-name" class="form-control" placeholder="e.g. Follow-up" required />
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input type="text" id="new-template-subject" class="form-control" placeholder="Email subject" required />
        </div>
        <div class="form-group">
          <label>Body</label>
          <textarea id="new-template-body" class="form-control" style="height:150px"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-cancel-add">Cancel</button>
          <button class="btn btn-primary" id="btn-confirm-add">Create</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel-add').onclick = () => overlay.remove();
    document.getElementById('btn-confirm-add').onclick = () => {
      const name = document.getElementById('new-template-name').value;
      const subject = document.getElementById('new-template-subject').value;
      const body = document.getElementById('new-template-body').value;
      if (!name || !subject) return;
      saveEmailTemplate({ name, subject, body });
      overlay.remove();
      renderEmailTemplates(el, apps);
    };
  };
}

let activeChatInternId = null;

function renderMessages(el, apps) {
  const allInterns = apps.filter(a => a.status === 'accepted' && a.isDeployed);
  const activeInterns = allInterns.filter(i => getMessages(i.id).length > 0);

  el.innerHTML = `
    <div class="flex" style="justify-content:space-between;align-items:center;margin-bottom:1rem">
      <h2 style="margin:0"><i data-lucide="message-square" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Intern Communications</h2>
      <button class="btn btn-primary btn-sm" id="btn-new-chat"><i data-lucide="plus" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> New Conversation</button>
    </div>
  `;

  // Handle New Conversation Modal
  document.getElementById('btn-new-chat').onclick = () => {
    if (!allInterns.length) {
      alert('There are no deployed interns available to start a conversation with.');
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const options = allInterns.map(i => `<option value="${i.id}">${i.name} — ${i.department || 'Unassigned'}</option>`).join('');
    overlay.innerHTML = `
      <div class="modal">
        <h2>Start New Conversation</h2>
        <div class="form-group mt-1">
          <label>Select Deployed Intern</label>
          <select id="new-chat-intern" class="form-control">
            <option value="" disabled selected hidden>-- Choose Intern --</option>
            ${options}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="btn-cancel-chat">Cancel</button>
          <button class="btn btn-primary" id="btn-start-chat">Start Chat</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel-chat').onclick = () => overlay.remove();
    document.getElementById('btn-start-chat').onclick = () => {
      const id = document.getElementById('new-chat-intern').value;
      if (!id) return;
      const intern = allInterns.find(a => a.id === id);
      if (intern) {
        activeChatInternId = intern.id;
        renderHRContent(document.querySelector('.hr-content'));
      }
      overlay.remove();
    };
  };

  if (!allInterns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-1" style="color:var(--text-secondary)"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><p style="font-weight:500">No deployed interns available to message.</p>';
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

  // Sort interns by latest message
  activeInterns.sort((a, b) => {
    const msgsA = getMessages(a.id);
    const msgsB = getMessages(b.id);
    const timeA = msgsA.length > 0 ? parseInt(msgsA[msgsA.length - 1].id.slice(3)) : 0;
    const timeB = msgsB.length > 0 ? parseInt(msgsB[msgsB.length - 1].id.slice(3)) : 0;
    return timeB - timeA;
  });

  list.innerHTML = `<div style="padding:1rem;border-bottom:1px solid var(--border);font-weight:600">Active Conversations</div>`;
  if (activeInterns.length === 0) {
    list.innerHTML += `<div style="padding:1rem;font-size:0.8rem;color:var(--text-secondary);text-align:center">No active messages. Start a new conversation.</div>`;
  }

  activeInterns.forEach(i => {
    const msgs = getMessages(i.id);
    const lastMsgObj = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const lastMsg = lastMsgObj ? lastMsgObj.text : 'No messages yet';
    const isUnread = msgs.some(m => m.from === 'intern' && !m.read);
    const timeStr = lastMsgObj ? lastMsgObj.time.split(',')[0] : '';

    const item = document.createElement('div');
    item.className = 'doc-item';
    item.style.padding = '1rem';
    item.style.borderBottom = '1px solid var(--border)';
    item.style.cursor = 'pointer';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.background = i.id === activeChatInternId ? 'var(--surface2)' : 'none';
    item.innerHTML = `
      <div style="flex:1;overflow:hidden">
        <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem">
          ${i.name} ${isUnread ? '<span style="background:var(--accent-red);width:8px;height:8px;border-radius:50%;display:inline-block"></span>' : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:${isUnread ? '600' : 'normal'}">${lastMsg}</div>
      </div>
      <div style="font-size:0.65rem;color:var(--text-secondary)">${timeStr}</div>
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
    activeChatInternId = intern.id;
    markMessagesAsRead(intern.id, 'hr');
    updateSidebarBadge();
    const messages = getMessages(intern.id);
    let msgsHTML = '';
    messages.forEach(m => {
      const cls = m.from === 'hr' ? 'sent' : 'received';
      msgsHTML += `<div class="chat-msg ${cls}"><div>${m.text}</div><div class="msg-time">${m.time}</div></div>`;
    });

    chatArea.innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border);background:var(--surface2);font-weight:600">${intern.name} — ${intern.department || 'Unassigned'}</div>
      <div class="chat-messages" style="flex:1;overflow-y:auto;padding:1rem">${msgsHTML || '<div class="empty-state"><p>No messages yet. Send the first message!</p></div>'}</div>
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
      renderHRContent(document.querySelector('.hr-content')); // Re-render to update the list
    };
    document.getElementById('hr-chat-msg-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('btn-hr-send-msg').click();
    };
  }



  // Auto-open active chat if exists
  if (activeChatInternId) {
    const intern = allInterns.find(a => a.id === activeChatInternId);
    if (intern) renderChat(intern);
  }
}

let activeChatSupId = null;

function renderSupervisorChat(el, data) {
  const supervisors = data.users.filter(u => u.role === 'supervisor');
  el.innerHTML = '<h2 class="mb-2"><i data-lucide="message-circle" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Supervisor Communications</h2>';

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

  supervisors.sort((a, b) => {
    const msgsA = getMessages(a.id);
    const msgsB = getMessages(b.id);
    const timeA = msgsA.length > 0 ? parseInt(msgsA[msgsA.length - 1].id.slice(3)) : 0;
    const timeB = msgsB.length > 0 ? parseInt(msgsB[msgsB.length - 1].id.slice(3)) : 0;
    return timeB - timeA;
  });

  list.innerHTML = `<div style="padding:1rem;border-bottom:1px solid var(--border);font-weight:600">Supervisors</div>`;
  if (supervisors.length === 0) {
    list.innerHTML += `<div style="padding:1rem;font-size:0.8rem;color:var(--text-secondary);text-align:center">No supervisors found.</div>`;
  }

  supervisors.forEach(s => {
    const msgs = getMessages(s.id);
    const lastMsgObj = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    const lastMsg = lastMsgObj ? lastMsgObj.text : 'No messages yet';
    const isUnread = msgs.some(m => m.from === 'supervisor' && !m.read);
    const timeStr = lastMsgObj ? lastMsgObj.time.split(',')[0] : '';

    const item = document.createElement('div');
    item.className = 'doc-item';
    item.style.padding = '1rem';
    item.style.borderBottom = '1px solid var(--border)';
    item.style.cursor = 'pointer';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.background = s.id === activeChatSupId ? 'var(--surface2)' : 'none';
    item.innerHTML = `
      <div style="flex:1;overflow:hidden">
        <div style="font-weight:600;font-size:0.9rem;display:flex;align-items:center;gap:0.5rem">
          ${s.name} ${isUnread ? '<span style="background:var(--accent-red);width:8px;height:8px;border-radius:50%;display:inline-block"></span>' : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:${isUnread ? '600' : 'normal'}">${lastMsg}</div>
      </div>
      <div style="font-size:0.65rem;color:var(--text-secondary)">${timeStr}</div>
    `;
    item.onclick = () => {
      list.querySelectorAll('.doc-item').forEach(d => d.style.background = 'none');
      item.style.background = 'var(--surface2)';
      renderChat(s);
    };
    list.appendChild(item);
  });
  grid.appendChild(list);

  // Right Chat Area
  const chatArea = document.createElement('div');
  chatArea.id = 'hr-sup-chat-area';
  chatArea.className = 'card';
  chatArea.style.padding = '0';
  chatArea.style.display = 'flex';
  chatArea.style.flexDirection = 'column';
  chatArea.innerHTML = '<div class="empty-state" style="margin:auto"><p>Select a supervisor to start chatting</p></div>';
  grid.appendChild(chatArea);

  function renderChat(sup) {
    activeChatSupId = sup.id;
    markMessagesAsRead(sup.id, 'hr');
    updateSidebarBadge();
    const messages = getMessages(sup.id);
    let msgsHTML = '';
    messages.forEach(m => {
      const cls = m.from === 'hr' ? 'sent' : 'received';
      msgsHTML += `<div class="chat-msg ${cls}"><div>${m.text}</div><div class="msg-time">${m.time}</div></div>`;
    });

    chatArea.innerHTML = `
      <div style="padding:1rem;border-bottom:1px solid var(--border);background:var(--surface2);font-weight:600">${sup.name} — ${sup.department}</div>
      <div class="chat-messages" style="flex:1;overflow-y:auto;padding:1rem">${msgsHTML || '<div class="empty-state"><p>No messages yet.</p></div>'}</div>
      <div class="chat-input" style="padding:1rem;border-top:1px solid var(--border)">
        <input type="text" class="form-control" id="hr-sup-chat-msg-input" placeholder="Type a message to ${sup.name}..." />
        <button class="btn btn-primary btn-sm" id="btn-hr-sup-send-msg">Send</button>
      </div>
    `;

    const chatMsgs = chatArea.querySelector('.chat-messages');
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    document.getElementById('btn-hr-sup-send-msg').onclick = () => {
      const input = document.getElementById('hr-sup-chat-msg-input');
      if (!input.value.trim()) return;
      sendMessage(sup.id, 'hr', input.value.trim());
      renderHRContent(document.querySelector('.hr-content'));
    };
    document.getElementById('hr-sup-chat-msg-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('btn-hr-sup-send-msg').click();
    };
  }

  if (activeChatSupId) {
    const sup = supervisors.find(s => s.id === activeChatSupId);
    if (sup) renderChat(sup);
  }
}

function renderDTRAccess(el, apps) {
  const interns = apps.filter(a => a.status === 'accepted');
  el.innerHTML = '<h2 class="mb-2"><i data-lucide="clock" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> DTR Access</h2>';

  if (!interns.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<div class="icon"><i data-lucide="inbox"></i></div><p>No deployed interns</p>';
    el.appendChild(empty);
    return;
  }

  const selectDiv = document.createElement('div');
  selectDiv.className = 'grid-2 mb-2';
  selectDiv.style.gap = '1rem';
  selectDiv.innerHTML = `
    <div class="form-group">
      <label>Filter by Department</label>
      <select class="form-control" id="dtr-dept-select">
        <option value="all">All Departments</option>
        ${getDepartments().map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Select Intern</label>
      <select class="form-control" id="dtr-intern-select">
        <option value="" disabled selected hidden>-- Choose intern --</option>
        ${interns.map(i => `<option value="${i.id}">${i.name} — ${i.department || 'Unassigned'}</option>`).join('')}
      </select>
    </div>
  `;
  el.appendChild(selectDiv);

  const dtrView = document.createElement('div');
  dtrView.id = 'hr-dtr-view';
  el.appendChild(dtrView);

  document.getElementById('dtr-dept-select').onchange = (e) => {
    const dept = e.target.value;
    const internSelect = document.getElementById('dtr-intern-select');
    const filteredInterns = dept === 'all' ? interns : interns.filter(i => i.department === dept);

    internSelect.innerHTML =
      `<option value="" disabled selected hidden>-- Choose intern --</option>` +
      (filteredInterns || []).map(i =>
        `<option value="${i.id}">${i.name} - ${i.department || 'Unassigned'}</option>`
      ).join('');

    dtrView.innerHTML = '';
  };

  document.getElementById('dtr-intern-select').onchange = (e) => {
    const appId = e.target.value;
    if (!appId) { dtrView.innerHTML = ''; return; }
    const app = interns.find(i => i.id === appId);
    const dtrs = getDtrEntries(appId);
    const schoolActs = getSchoolActivities(appId);

    let totalWork = 0, totalOT = 0;
    dtrs.forEach(d => { const h = computeHours(d.timeIn, d.timeOut); totalWork += h.regular; totalOT += h.overtime; });
    const approvedSchool = schoolActs.filter(s => s.status === 'approved').reduce((s, a) => s + (a.hours || 8), 0);

    const regHoursStr = formatHours(totalWork);
    const otHoursStr = formatHours(totalOT);
    const schoolHoursStr = formatHours(Math.min(approvedSchool, 30));
    const totalHoursStr = formatHours(totalWork + totalOT + Math.min(approvedSchool, 30));

    const stats = [
      { label: 'Regular', val: regHoursStr },
      { label: 'Overtime', val: otHoursStr },
      { label: 'School', val: schoolHoursStr },
      { label: 'Total', val: totalHoursStr }
    ];

    let html = `
  <div class="flex mt-2 mb-2" style="gap:0.75rem">
    ${(stats || []).map(s => `
      <div class="stat-card" style="flex:1">
        <div class="stat-number">${s?.val ?? 0}</div>
        <div class="stat-label">${s?.label ?? 'N/A'}</div>
      </div>
    `).join('')}
  </div>
`;

    if (dtrs.length) {
      const dtrRows = dtrs.map(d => {
        const h = computeHours(d.timeIn, d.timeOut);
        return `<tr><td>${d.date}</td><td>${d.timeIn}</td><td>${d.timeOut}</td><td>${formatHours(h.regular)}</td><td>${formatHours(h.overtime)}</td><td><strong>${formatHours(h.total)}</strong></td></tr>`;
      }).join('');

      html += `
        <div class="table-wrap mb-2">
          <table>
            <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Regular</th><th>OT</th><th>Total</th></tr></thead>
            <tbody>${dtrRows}</tbody>
          </table>
        </div>
      `;
    }

    if (schoolActs.length) {
      const actRows = schoolActs.map(s => {
        const bc = s.status === 'approved' ? 'badge-green' : s.status === 'rejected' ? 'badge-red' : 'badge-yellow';
        const bt = s.status === 'approved' ? '✅ Approved' : s.status === 'rejected' ? '❌ Rejected' : '⏳ Pending';
        const actions = s.status === 'pending'
          ? `<button class="btn btn-success btn-sm" data-said="${s.id}" data-action="approve">Approve</button> <button class="btn btn-danger btn-sm" data-said="${s.id}" data-action="reject">Reject</button>`
          : '—';
        const proofBtn = s.proofName
          ? `<button class="btn btn-secondary btn-sm" style="padding:0 0.4rem;font-size:0.7rem" onclick="alert('Viewing Proof: ${s.proofName}')"><i data-lucide="eye" style="width:12px;height:12px;margin-right:4px;vertical-align:text-bottom"></i> View</button>`
          : '—';
        return `<tr><td>${s.date}</td><td>${s.activity}</td><td>${proofBtn}</td><td><span class="badge ${bc}">${bt}</span></td><td>${actions}</td></tr>`;
      }).join('');

      html += `
        <h3 class="mb-1">School Activities</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Activity</th><th>Proof</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>${actRows}</tbody>
          </table>
        </div>
      `;
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

  el.innerHTML = '<h2 class="mb-2"><i data-lucide="bar-chart-2" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Analytics & Statistics</h2>';

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
        <td>${qApps.filter(a => a.ojtType === 'required').length}</td>
        <td>${qApps.filter(a => a.ojtType === 'voluntary').length}</td>
        <td>${qApps.filter(a => a.status === 'accepted').length}</td>
        <td style="width:200px"><div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:20px"><div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));height:100%;width:${barWidth}%;border-radius:4px"></div></div></td>
      </tr>`;
    }).join('');
    tDiv.innerHTML = `<table><thead><tr><th>Quarter</th><th>Total</th><th>Required</th><th>Voluntary</th><th>Accepted</th><th>Distribution</th></tr></thead><tbody>${rows}</tbody></table>`;
    el.appendChild(tDiv);
  }

  // Per department
  const deptCounts = {};
  apps.forEach(a => { const d = a.department || 'Unassigned'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
  const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  if (deptEntries.length) {
    const h3 = document.createElement('h3');
    h3.className = 'mb-1 mt-3';
    h3.textContent = 'Per Department';
    el.appendChild(h3);

    const dDiv = document.createElement('div');
    dDiv.className = 'table-wrap';
    const maxDept = Math.max(...deptEntries.map(e => e[1]));
    let dRows = deptEntries.map(([dept, count]) => {
      const bw = (count / maxDept) * 100;
      return `<tr><td><strong>${dept}</strong></td><td>${count}</td><td style="width:200px"><div style="background:var(--surface2);border-radius:4px;overflow:hidden;height:20px"><div style="background:linear-gradient(90deg,var(--primary-light),var(--primary));height:100%;width:${bw}%;border-radius:4px"></div></div></td></tr>`;
    }).join('');
    dDiv.innerHTML = `<table><thead><tr><th>Department</th><th>Count</th><th>Distribution</th></tr></thead><tbody>${dRows}</tbody></table>`;
    el.appendChild(dDiv);
  }
}

function renderHistoricalData(el) {
  const store = getStore();
  const legacy = store.legacyInterns || [];
  const departments = getDepartments();

  el.innerHTML = `
    <h2 class="mb-2"><i data-lucide="archive" style="width:20px;height:20px;margin-right:8px;vertical-align:text-bottom"></i> Historical Records</h2>
    <div class="card mb-2">
      <h3 class="mb-1">Import Old Intern Information</h3>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">Manually add records for past interns. Please include their contact details and original documents.</p>
      
      <form id="legacy-form" class="grid-2" style="gap:1rem">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" class="form-control" placeholder="Intern Name" required />
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" name="email" class="form-control" placeholder="email@example.com" required />
        </div>
        <div class="form-group">
          <label>Contact Number</label>
          <input type="text" name="phone" class="form-control" placeholder="09XX XXX XXXX" required />
        </div>
        <div class="form-group">
          <label>School / University</label>
          <input type="text" name="school" class="form-control" placeholder="University Name" required />
        </div>
        <div class="form-group">
          <label>Department</label>
          <select name="department" class="form-control" required>
            <option value="">Select Dept</option>
            ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Internship Period</label>
          <select name="period_select" class="form-control" id="select-legacy-period" required>
            <option value="">-- Select Period --</option>
            <option value="Q1-2026">Q1 (Jan-Mar) 2026</option>
            <option value="Q4-2025">Q4 (Oct-Dec) 2025</option>
            <option value="Q3-2025">Q3 (Jul-Sep) 2025</option>
            <option value="Q2-2025">Q2 (Apr-Jun) 2025</option>
            <option value="Q1-2025">Q1 (Jan-Mar) 2025</option>
            <option value="Q4-2024">Q4 (Oct-Dec) 2024</option>
            <option value="Q3-2024">Q3 (Jul-Sep) 2024</option>
            <option value="Q2-2024">Q2 (Apr-Jun) 2024</option>
            <option value="Q1-2024">Q1 (Jan-Mar) 2024</option>
            <option value="other">Add Quarter (Custom)</option>
          </select>
        </div>
        <div class="form-group" id="group-legacy-other-period" style="display:none; grid-column: span 2">
          <div class="flex" style="gap:0.75rem; align-items: flex-end">
            <div style="flex:1">
              <label>Start Month</label>
              <select id="input-legacy-start" class="form-control">
                ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div style="flex:1">
              <label>End Month</label>
              <select id="input-legacy-end" class="form-control">
                ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => `<option value="${m}">${m}</option>`).join('')}
              </select>
            </div>
            <div style="width:100px">
              <label>Year</label>
              <input type="number" id="input-legacy-y" class="form-control" placeholder="2024" value="2024" />
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Total Hours Rendered</label>
          <input type="number" name="hours" class="form-control" placeholder="e.g. 480" required />
        </div>
        <div class="form-group">
          <label>OJT Type</label>
          <select name="ojtType" class="form-control" required>
            <option value="required">Required by School</option>
            <option value="voluntary">Voluntary</option>
          </select>
        </div>
        <div class="form-group">
          <label>DTR Excel File</label>
          <input type="file" name="dtrFile" class="form-control" accept=".xlsx,.xls,.csv" style="padding:0.4rem" required />
        </div>
        <div class="form-group">
          <label>Resume / CV</label>
          <input type="file" name="resume" class="form-control" accept=".pdf,.doc,.docx" style="padding:0.4rem" required />
        </div>
        <div class="form-group">
          <label>Cover Letter / Portfolio (Optional)</label>
          <input type="file" name="portfolio" class="form-control" accept=".pdf,.doc,.docx" style="padding:0.4rem" />
        </div>
        <div class="form-group">
          <label>COC Status (Certificate of Completion)</label>
          <select name="cocStatus" class="form-control" required>
            <option value="not_released">Not Released</option>
            <option value="released">Released</option>
          </select>
        </div>
        <div style="grid-column: span 2; text-align: right; margin-top:0.5rem">
          <button type="submit" class="btn btn-primary"><i data-lucide="plus" style="width:16px;height:16px;margin-right:4px;vertical-align:text-bottom"></i> Add to Archive</button>
        </div>
      </form>
    </div>

    <div class="card">
      <div class="flex-between mb-2">
        <h3 class="mb-0">Archived Interns List</h3>
        <div class="flex" style="gap:0.75rem">
          <select id="filter-legacy-dept" class="form-control" style="width:160px; font-size:0.8rem">
            <option value="all">All Departments</option>
            ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <select id="filter-legacy-type" class="form-control" style="width:140px; font-size:0.8rem">
            <option value="all">All OJT Types</option>
            <option value="required">Required</option>
            <option value="voluntary">Voluntary</option>
          </select>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Intern Details</th>
              <th>Academic & Dept</th>
              <th>Period & Hours</th>
              <th>COC Status</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody id="legacy-table-body">
            <!-- Table content rendered by script -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  const periodSelect = el.querySelector('#select-legacy-period');
  const otherPeriodGroup = el.querySelector('#group-legacy-other-period');
  periodSelect.onchange = () => {
    otherPeriodGroup.style.display = periodSelect.value === 'other' ? 'block' : 'none';
  };

  const filterDept = el.querySelector('#filter-legacy-dept');
  const filterType = el.querySelector('#filter-legacy-type');
  const tbody = el.querySelector('#legacy-table-body');

  function renderList() {
    let list = [...legacy];

    // Filtering
    if (filterDept.value !== 'all') list = list.filter(l => l.department === filterDept.value);
    if (filterType.value !== 'all') list = list.filter(l => l.ojtType === filterType.value);

    // Sorting: Ascending per Quarter/Year (Q1-2024 format)
    list.sort((a, b) => {
      const [qA, yA] = a.period.split('-').map(s => s.replace('Q', ''));
      const [qB, yB] = b.period.split('-').map(s => s.replace('Q', ''));
      if (yA !== yB) return yA - yB;
      return qA - qB;
    });

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">No records match your filters.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(l => `
      <tr>
        <td>
          <strong>${l.name}</strong><br>
          <span style="font-size:0.75rem;color:var(--text-secondary)">${l.email}</span><br>
          <span style="font-size:0.75rem;color:var(--text-secondary)">${l.phone}</span>
        </td>
        <td>
          <span style="font-size:0.8rem">${l.school}</span><br>
          <div class="flex" style="gap:0.35rem;margin-top:0.25rem">
            <span class="badge badge-blue">${l.department}</span>
            <span class="badge ${l.ojtType === 'required' ? 'badge-blue' : 'badge-yellow'}">${l.ojtType === 'required' ? 'Req' : 'Vol'}</span>
          </div>
        </td>
        <td>
          <span style="font-size:0.8rem">${l.period.replace('-', ' ')}</span><br>
          <strong>${l.hours}h rendered</strong>
        </td>
        <td>
          <span class="badge ${l.cocStatus === 'released' ? 'badge-green' : 'badge-gray'}">
            ${l.cocStatus === 'released' ? '✅ Released' : '⏳ Pending'}
          </span>
        </td>
        <td>
          <div class="flex" style="gap:0.35rem;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;font-size:0.7rem" onclick="alert('Viewing DTR: ${l.dtrFileName}')">📊 DTR</button>
            <button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;font-size:0.7rem" onclick="alert('Viewing Resume: ${l.resumeFileName}')">📄 Resume</button>
            ${l.portfolioFileName ? `<button class="btn btn-secondary btn-sm" style="padding:0.2rem 0.5rem;font-size:0.7rem" onclick="alert('Viewing Portfolio: ${l.portfolioFileName}')">🎨 Portfolio</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterDept.onchange = renderList;
  filterType.onchange = renderList;
  renderList();

  setupPhoneMask(el.querySelector('input[name="phone"]'));

  document.getElementById('legacy-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const dtrFile = e.target.querySelector('[name=dtrFile]').files[0];
    const resumeFile = e.target.querySelector('[name=resume]').files[0];
    const portfolioFile = e.target.querySelector('[name=portfolio]').files[0];

    let period = fd.get('period_select');
    if (period === 'other') {
      const s = el.querySelector('#input-legacy-start').value;
      const e_ = el.querySelector('#input-legacy-end').value;
      const y = el.querySelector('#input-legacy-y').value;
      period = `${s}-${e_} ${y}`;
    }

    addLegacyIntern({
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      school: fd.get('school'),
      department: fd.get('department'),
      hours: fd.get('hours'),
      period: period,
      ojtType: fd.get('ojtType'),
      cocStatus: fd.get('cocStatus'),
      dtrFileName: dtrFile ? dtrFile.name : null,
      resumeFileName: resumeFile ? resumeFile.name : null,
      portfolioFileName: portfolioFile ? portfolioFile.name : null
    });

    renderHistoricalData(el);
    alert('Legacy record archived successfully!');
  };
}

function formatSt(s) {
  const m = { submitted: 'Submitted', viewed: 'Viewed', initial_interview: 'Initial Interview', final_interview: 'Final Interview', final_review: 'Final Review', accepted: 'Accepted', failed: 'Not Selected', withdrawn: 'Withdrawn' };
  return m[s] || s;
}
function getBadgeCls(s) {
  const m = { submitted: 'badge-blue', viewed: 'badge-yellow', initial_interview: 'badge-orange', final_interview: 'badge-orange', final_review: 'badge-blue', accepted: 'badge-green', failed: 'badge-red', withdrawn: 'badge-gray' };
  return m[s] || 'badge-gray';
}
