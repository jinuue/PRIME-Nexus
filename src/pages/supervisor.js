import { getStore, getDtrEntries, computeHours, formatHours, signSchoolDoc, markMessagesAsRead } from '../store.js';
import { renderNavbar } from '../main.js';

let activeSection = 'interviews';

export function renderSupervisorDashboard(container) {
  const user = window.APP.user;
  if (!user || user.role !== 'supervisor') return;

  container.innerHTML = '';
  renderNavbar(container, []);

  const layout = document.createElement('div');
  layout.className = 'hr-layout';

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'hr-sidebar';

  const sections = [
    { id: 'interviews', label: 'Final Interviews', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { id: 'incoming', label: 'Incoming Interns', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>' },
    { id: 'dtr', label: 'Deployed Interns', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"></circle><polyline points="12 9 12 13 14 15"></polyline><line x1="12" y1="2" x2="12" y2="5"></line></svg>' },
    { id: 'chat', label: 'HR Communication', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' },
    { id: 'documents', label: 'Pending Signatures', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>' },
    { id: 'withdrawn', label: 'Withdrawn', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>' },
  ];

  const store = getStore();
  const unreadCount = store.messages.filter(m => m.appId === user.id && m.from === 'hr' && !m.read).length;

  sidebar.innerHTML = `
    <div class="hr-sidebar-section">${user.department} Department</div>
    ${sections.map(s => {
    let badge = '';
    if (s.id === 'chat' && unreadCount > 0) {
      badge = `<span class="nav-badge" style="background:var(--accent-red);color:white;border-radius:50%;padding:0.1rem 0.4rem;font-size:0.7rem;margin-left:auto">${unreadCount}</span>`;
    }
    return `
      <button class="hr-sidebar-link ${activeSection === s.id ? 'active' : ''}" style="display:flex;align-items:center;width:100%" data-section="${s.id}">
        <span style="margin-right:0.5rem">${s.icon}</span> <span>${s.label}</span> ${badge}
      </button>
      `;
  }).join('')}
  `;

  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'hr-content';
  layout.appendChild(main);

  container.appendChild(layout);

  // Setup sidebar clicks
  sidebar.querySelectorAll('.hr-sidebar-link').forEach(btn => {
    btn.onclick = () => {
      activeSection = btn.dataset.section;
      renderSupervisorDashboard(container);
    };
  });

  renderSectionContent(main, user);
}

function renderSectionContent(el, user) {
  const store = getStore();
  const myApps = store.applications.filter(a => a.department === user.department);

  if (activeSection === 'interviews') {
    const interviews = myApps.filter(a => a.status === 'final_interview').sort((a, b) => {
      const dA = new Date((a.finalInterviewDate || '9999-12-31') + 'T' + (a.finalInterviewTime || '23:59'));
      const dB = new Date((b.finalInterviewDate || '9999-12-31') + 'T' + (b.finalInterviewTime || '23:59'));
      return dA - dB;
    });
    el.innerHTML = `<h2>Final Interviews</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Applicants scheduled for final interview in your department.</p>`;

    if (interviews.length === 0) {
      el.innerHTML += `<div class="empty-state"><p>No final interviews scheduled.</p></div>`;
    } else {
      const formatTime12Hour = (time24) => {
        if (!time24 || !time24.includes(':')) return time24 || 'Not set';
        const [h, m] = time24.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
      };

      let rows = interviews.map(a => `
        <tr>
          <td><strong>${a.name}</strong><br/><span style="font-size:0.8rem">${a.school}</span></td>
          <td>${a.course}</td>
          <td>${a.finalInterviewDate || 'Not set'}</td>
          <td>${formatTime12Hour(a.finalInterviewTime)}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="alert('Viewing Resume for ${a.name}\\n\\n(Mock PDF Viewer)')"><i class="fi fi-rs-document"></i> View Resume</button></td>
        </tr>
      `).join('');
      el.innerHTML += `<div class="table-wrap"><table>
        <thead><tr><th>Applicant</th><th>Course</th><th>Date</th><th>Time</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
    }
  }
  else if (activeSection === 'withdrawn') {
    const withdrawn = myApps.filter(a => a.status === 'withdrawn').sort((a, b) => a.name.localeCompare(b.name));
    el.innerHTML = `<h2>Withdrawn</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Applicants and interns from your department who have withdrawn.</p>`;

    if (withdrawn.length === 0) {
      el.innerHTML += `<div class="empty-state"><p>No withdrawn applicants or interns.</p></div>`;
    } else {
      let rows = withdrawn.map(a => `
        <tr>
          <td>
            <strong>${a.name}</strong><br/>
            <span style="font-size:0.8rem">${a.school}</span><br/>
            <span style="font-size:0.75rem;color:var(--text-secondary)">${a.course}</span>
          </td>
          <td>
            <div style="font-size:0.85rem;color:var(--accent-red);line-height:1.4">
              <strong>Reason:</strong><br/>${a.withdrawReason || 'Not specified'}
            </div>
          </td>
        </tr>
      `).join('');
      el.innerHTML += `<div class="table-wrap"><table>
        <thead><tr><th>Applicant / Intern</th><th>Withdrawal Reason</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
    }
  }
  else if (activeSection === 'incoming') {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const incoming = myApps.filter(a => a.status === 'accepted' && a.isDeployed && a.startDate > today).sort((a, b) => new Date(a.startDate || '9999-12-31') - new Date(b.startDate || '9999-12-31'));
    el.innerHTML = `<h2>Incoming Interns</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Deployed interns scheduled to start in your department in the future.</p>`;

    if (incoming.length === 0) {
      el.innerHTML += `<div class="empty-state"><p>No incoming interns.</p></div>`;
    } else {
      let rows = incoming.map(a => `
        <tr>
          <td>
            <strong>${a.name}</strong><br/>
            <span style="font-size:0.8rem">${a.school}</span><br/>
            <span style="font-size:0.75rem;color:var(--text-secondary)">${a.course}</span>
          </td>
          <td>${a.startDate || 'TBA'}</td>
          <td>${a.schedule || 'TBA'}</td>
          <td>${a.hoursRequired} hrs</td>
        </tr>
      `).join('');
      el.innerHTML += `<div class="table-wrap"><table>
        <thead><tr><th>Intern</th><th>Start Date</th><th>Schedule</th><th>Required Hours</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
    }
  }
  else if (activeSection === 'dtr') {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const deployed = myApps.filter(a => a.status === 'accepted' && a.isDeployed && a.startDate <= today).sort((a, b) => a.name.localeCompare(b.name));
    el.innerHTML = `<h2>Deployed Interns</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">View daily time records for interns deployed under your supervision.</p>`;

    if (deployed.length === 0) {
      el.innerHTML += `<div class="empty-state"><p>No deployed interns currently.</p></div>`;
    } else {
      let internRows = deployed.map(a => `
        <tr>
          <td>
            <strong>${a.name}</strong><br/>
            <span style="font-size:0.8rem">${a.school}</span><br/>
            <span style="font-size:0.75rem;color:var(--text-secondary)">${a.course}</span>
          </td>
          <td>${a.startDate || 'Not set'}</td>
          <td><button class="btn btn-secondary btn-sm btn-view-dtr" data-appid="${a.id}"><i class="fi fi-rs-eye"></i> View DTR</button></td>
        </tr>
      `).join('');

      el.innerHTML += `
        <div class="table-wrap mb-2">
          <table>
            <thead><tr><th>Intern</th><th>Start Date</th><th>Action</th></tr></thead>
            <tbody>${internRows}</tbody>
          </table>
        </div>
        <div id="sup-dtr-view"></div>
      `;

      el.querySelectorAll('.btn-view-dtr').forEach(btn => {
        btn.onclick = () => {
          const view = document.getElementById('sup-dtr-view');

          if (btn.innerText.includes('Close DTR')) {
            btn.innerHTML = '<i class="fi fi-rs-eye"></i> View DTR';
            view.innerHTML = '';
            return;
          }

          // Reset other buttons
          el.querySelectorAll('.btn-view-dtr').forEach(b => b.innerHTML = '<i class="fi fi-rs-eye"></i> View DTR');
          btn.innerHTML = '<i class="fi fi-rs-cross-small"></i> Close DTR';

          const appId = btn.dataset.appid;
          const intern = deployed.find(a => a.id === appId);

          const dtrs = getDtrEntries(appId);
          if (dtrs.length === 0) {
            view.innerHTML = `<h3 class="mb-1 mt-2">DTR: ${intern.name}</h3><div class="empty-state"><p>No DTR entries found for this intern.</p></div>`;
            view.scrollIntoView({ behavior: 'smooth' });
            return;
          }

          let totalReg = 0, totalOt = 0, totalWork = 0;
          const rows = dtrs.map(d => {
            const h = computeHours(d.timeIn, d.timeOut);
            totalReg += h.regular;
            totalOt += h.overtime;
            totalWork += h.total;
            return `<tr><td>${d.date}</td><td>${d.timeIn}</td><td>${d.timeOut}</td><td>${formatHours(h.regular)}</td><td>${formatHours(h.overtime)}</td><td><strong>${formatHours(h.total)}</strong></td></tr>`;
          }).join('');

          view.innerHTML = `
            <h3 class="mb-1 mt-2">DTR: ${intern.name}</h3>
            <div class="flex mt-2 mb-2" style="gap:0.75rem">
              <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalReg)}</div><div class="stat-label">Regular Hours</div></div>
              <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalOt)}</div><div class="stat-label">Overtime Hours</div></div>
              <div class="stat-card" style="flex:1"><div class="stat-number">${formatHours(totalWork)}</div><div class="stat-label">Total Work Hours</div></div>
            </div>
            <div class="table-wrap mb-2">
              <table>
                <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Regular</th><th>OT</th><th>Total</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          `;
          view.scrollIntoView({ behavior: 'smooth' });
        };
      });
    }
  }
  else if (activeSection === 'documents') {
    const allInterns = myApps.filter(a => a.status === 'accepted');
    const docsToSign = [];
    allInterns.forEach(a => {
      (a.schoolDocs || []).forEach(d => {
        if (d.status === 'submitted') {
          docsToSign.push({ intern: a, doc: d });
        }
      });
    });

    el.innerHTML = `<h2>Pending Signatures</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Documents requiring your physical signature. Mark them as signed here once completed on paper.</p>`;

    if (docsToSign.length === 0) {
      el.innerHTML += `<div class="empty-state"><p>No documents pending signature.</p></div>`;
    } else {
      let rows = docsToSign.map(item => `
        <tr>
          <td><strong>${item.intern.name}</strong></td>
          <td>${item.doc.name}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="alert('Viewing document: ${item.doc.name}')">📄 View File</button></td>
          <td><button class="btn btn-success btn-sm btn-sign" data-appid="${item.intern.id}" data-docid="${item.doc.id}">✅ Mark as Signed</button></td>
        </tr>
      `).join('');

      el.innerHTML += `<div class="table-wrap"><table>
        <thead><tr><th>Intern</th><th>Document</th><th>File</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;

      el.querySelectorAll('.btn-sign').forEach(btn => {
        btn.onclick = () => {
          if (confirm('Confirm that you have physically signed this document on paper?')) {
            signSchoolDoc(btn.dataset.appid, btn.dataset.docid, user.name);
            renderSupervisorDashboard(document.getElementById('app'));
            alert('Document marked as physically signed.');
          }
        };
      });
    }
  }
  else if (activeSection === 'chat') {
    const appId = user.id;
    markMessagesAsRead(appId, 'supervisor');

    el.innerHTML = `<h2>HR Communication</h2>
      <p style="color:var(--text-secondary);margin-bottom:1rem">Send and receive messages directly with the HR Department.</p>`;

    const messages = store.messages.filter(m => m.appId === appId);
    let msgsHTML = '';
    messages.forEach(m => {
      const cls = m.from === 'supervisor' ? 'sent' : 'received';
      msgsHTML += `<div class="chat-msg ${cls}"><div>${m.text}</div><div class="msg-time">${m.time}</div></div>`;
    });

    el.innerHTML += `
      <div class="chat-box" style="height: calc(100vh - 200px); max-width: 100%">
        <div class="chat-messages" id="sup-chat-msgs" style="flex:1;overflow-y:auto;padding:1rem">
          ${msgsHTML || '<div class="empty-state"><p>No messages yet.</p></div>'}
        </div>
        <div class="chat-input" style="padding:1rem;border-top:1px solid var(--border)">
          <input type="text" class="form-control" id="sup-chat-input" placeholder="Type your message to HR..." />
          <button class="btn btn-primary btn-sm" id="btn-sup-send">Send</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const chatMsgs = document.getElementById('sup-chat-msgs');
      if (chatMsgs) chatMsgs.scrollTop = chatMsgs.scrollHeight;

      document.getElementById('btn-sup-send').onclick = () => {
        const input = document.getElementById('sup-chat-input');
        if (!input.value.trim()) return;

        const data = getStore();
        data.messages.push({ id: 'msg' + Date.now(), appId, from: 'supervisor', text: input.value.trim(), time: new Date().toLocaleString(), read: false });
        localStorage.setItem('prime_ims_data', JSON.stringify(data));

        renderSupervisorDashboard(document.getElementById('app'));
      };

      document.getElementById('sup-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') document.getElementById('btn-sup-send').click();
      };
    }, 0);
  }
}

