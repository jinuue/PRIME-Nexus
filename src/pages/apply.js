import { submitApplication, getApplication, DEPARTMENTS } from '../store.js';
import { renderNavbar } from '../main.js';

export function renderApply(container) {
  const user = window.APP.user;
  if (!user) { location.hash = '#login'; return; }

  // Check if already applied
  const existing = getApplication(user.id);
  if (existing) { location.hash = '#status'; return; }

  renderNavbar(container);

  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    <div class="container" style="max-width:720px">
      <div class="page-header text-center">
        <h1>📋 Internship Application</h1>
        <p>Fill out the form below to apply for the PRIME Philippines Internship Program</p>
      </div>
      <div class="card">
        <form id="apply-form">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" name="name" class="form-control" value="${user.name}" required id="input-fullname" />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" name="email" class="form-control" value="${user.email || ''}" required id="input-email" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Number</label>
              <input type="tel" name="phone" class="form-control" value="${user.phone || ''}" placeholder="09171234567" required id="input-phone" />
            </div>
            <div class="form-group">
              <label>Course / Program</label>
              <input type="text" name="course" class="form-control" placeholder="e.g. BS Information Technology" required id="input-course" />
            </div>
          </div>
          <div class="form-group">
            <label>School / University</label>
            <input type="text" name="school" class="form-control" placeholder="e.g. University of the Philippines" required id="input-school" />
          </div>
          <div class="form-group">
            <label>CV / Resume</label>
            <div class="file-upload" onclick="document.getElementById('file-cv').click()">
              <div class="icon">📄</div>
              <p>Click to upload your CV/Resume</p>
              <div id="cv-filename" class="file-name"></div>
            </div>
            <input type="file" id="file-cv" name="cv" accept=".pdf,.doc,.docx" style="display:none" required />
          </div>
          <div class="form-group">
            <label>Cover Letter / Portfolio <span class="optional">(Optional)</span></label>
            <div class="file-upload" onclick="document.getElementById('file-cover').click()">
              <div class="icon">📎</div>
              <p>Click to upload cover letter or portfolio</p>
              <div id="cover-filename" class="file-name"></div>
            </div>
            <input type="file" id="file-cover" name="cover" accept=".pdf,.doc,.docx,.zip" style="display:none" />
          </div>
          <div class="form-group">
            <label>Is OJT required by your school/university or voluntary?</label>
            <div class="radio-group">
              <label><input type="radio" name="ojtType" value="required" required /> Required by School</label>
              <label><input type="radio" name="ojtType" value="voluntary" /> Voluntary</label>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Hours Needed to Render</label>
              <input type="number" name="hoursRequired" class="form-control" placeholder="e.g. 480" min="100" max="1200" required id="input-hours" />
              <div class="form-hint">Total OJT hours required by your school</div>
            </div>
            <div class="form-group">
              <label>Where did you find us?</label>
              <select name="source" class="form-control" required id="select-source">
                <option value="">-- Select --</option>
                <option value="Facebook">Facebook</option>
                <option value="Referral">Referral</option>
                <option value="School/University Partner">School/University Partner</option>
                <option value="Job Portal">Job Portal (JobStreet, Indeed, etc.)</option>
                <option value="Company Website">Company Website</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
          <div class="divider"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="btn-submit-app">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  `;
  container.appendChild(page);

  // File upload display
  document.getElementById('file-cv').onchange = (e) => {
    const name = e.target.files[0]?.name;
    document.getElementById('cv-filename').textContent = name ? '✅ ' + name : '';
  };
  document.getElementById('file-cover').onchange = (e) => {
    const name = e.target.files[0]?.name;
    document.getElementById('cover-filename').textContent = name ? '✅ ' + name : '';
  };

  // Submit
  document.getElementById('apply-form').onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const cvFile = document.getElementById('file-cv').files[0];
    const coverFile = document.getElementById('file-cover').files[0];

    submitApplication(user.id, {
      name: fd.get('name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      course: fd.get('course'),
      school: fd.get('school'),
      cvName: cvFile ? cvFile.name : 'No file',
      coverName: coverFile ? coverFile.name : null,
      ojtType: fd.get('ojtType'),
      hoursRequired: parseInt(fd.get('hoursRequired')),
      source: fd.get('source'),
    });

    location.hash = '#status';
  };
}
