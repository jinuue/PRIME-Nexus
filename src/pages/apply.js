import { submitApplication, getApplication } from '../store.js';
import { renderNavbar, setupPhoneMask } from '../main.js';

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
              <select name="course_select" class="form-control" required id="select-course">
                <option value="" disabled selected hidden>-- Select --</option>
                <option value="BS Information Technology">BS Information Technology</option>
                <option value="BS Computer Science">BS Computer Science</option>
                <option value="BS Business Administration">BS Business Administration</option>
                <option value="BS Accountancy">BS Accountancy</option>
                <option value="BS Real Estate Management">BS Real Estate Management</option>
                <option value="BS Marketing Management">BS Marketing Management</option>
                <option value="BS Hospitality Management">BS Hospitality Management</option>
                <option value="BS Tourism Management">BS Tourism Management</option>
                <option value="BS Psychology">BS Psychology</option>
                <option value="AB Communication">AB Communication</option>
                <option value="BS Civil Engineering">BS Civil Engineering</option>
                <option value="BS Architecture">BS Architecture</option>
                <option value="Other">Other (Please specify)</option>
              </select>
            </div>
          </div>
          <div class="form-group" id="group-other-course" style="display:none; margin-top: -0.5rem">
            <label>Specify Course</label>
            <input type="text" name="course_other" class="form-control" placeholder="Enter your full course name" id="input-course-other" />
          </div>
          <div class="form-group">
            <label>School / University</label>
            <select name="school_select" class="form-control" required id="select-school">
              <option value="" disabled selected hidden>-- Select --</option>
              <optgroup label="Top Universities">
                <option value="University of the Philippines">University of the Philippines (UP)</option>
                <option value="Ateneo de Manila University">Ateneo de Manila University (ADMU)</option>
                <option value="De La Salle University">De La Salle University (DLSU)</option>
                <option value="University of Santo Tomas">University of Santo Tomas (UST)</option>
              </optgroup>
              <optgroup label="Major Metro Manila Schools">
                <option value="Polytechnic University of the Philippines">Polytechnic University of the Philippines (PUP)</option>
                <option value="Far Eastern University">Far Eastern University (FEU)</option>
                <option value="Mapua University">Mapua University</option>
                <option value="Adamson University">Adamson University</option>
                <option value="University of the East">University of the UE (UE)</option>
                <option value="Technological Institute of the Philippines">Technological Institute of the Philippines (TIP)</option>
                <option value="AMA University">AMA University</option>
                <option value="STI College">STI College</option>
                <option value="Centro Escolar University">Centro Escolar University (CEU)</option>
                <option value="Lyceum of the Philippines University">Lyceum of the Philippines University (LPU)</option>
                <option value="National University">National University (NU)</option>
                <option value="Pamantasan ng Lungsod ng Maynila">Pamantasan ng Lungsod ng Maynila (PLM)</option>
                <option value="University of Caloocan City">University of Caloocan City (UCC)</option>
              </optgroup>
              <optgroup label="Major Regional Schools">
                <option value="University of San Carlos">University of San Carlos (USC) - Cebu</option>
                <option value="Silliman University">Silliman University - Dumaguete</option>
                <option value="Saint Louis University">Saint Louis University (SLU) - Baguio</option>
                <option value="Mindanao State University">Mindanao State University (MSU)</option>
                <option value="University of Southeastern Philippines">University of Southeastern Philippines (USeP)</option>
                <option value="Xavier University">Xavier University - Ateneo de Cagayan</option>
              </optgroup>
              <option value="Other">Other (Please specify)</option>
            </select>
          </div>
          <div class="form-group" id="group-other-school" style="display:none; margin-top: -0.5rem">
            <label>Specify School</label>
            <input type="text" name="school_other" class="form-control" placeholder="Enter your full school name" id="input-school-other" />
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
                <option value="" disabled selected hidden>-- Select --</option>
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

  setupPhoneMask(document.getElementById('input-phone'));

  // Toggle "Other" course input
  const courseSelect = document.getElementById('select-course');
  const otherCourseGroup = document.getElementById('group-other-course');
  const otherCourseInput = document.getElementById('input-course-other');

  courseSelect.onchange = () => {
    if (courseSelect.value === 'Other') {
      otherCourseGroup.style.display = 'block';
      otherCourseInput.required = true;
    } else {
      otherCourseGroup.style.display = 'none';
      otherCourseInput.required = false;
    }
  };

  // Toggle "Other" school input
  const schoolSelect = document.getElementById('select-school');
  const otherSchoolGroup = document.getElementById('group-other-school');
  const otherSchoolInput = document.getElementById('input-school-other');

  schoolSelect.onchange = () => {
    if (schoolSelect.value === 'Other') {
      otherSchoolGroup.style.display = 'block';
      otherSchoolInput.required = true;
    } else {
      otherSchoolGroup.style.display = 'none';
      otherSchoolInput.required = false;
    }
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
      course: fd.get('course_select') === 'Other' ? fd.get('course_other') : fd.get('course_select'),
      school: fd.get('school_select') === 'Other' ? fd.get('school_other') : fd.get('school_select'),
      cvName: cvFile ? cvFile.name : 'No file',
      coverName: coverFile ? coverFile.name : null,
      ojtType: fd.get('ojtType'),
      hoursRequired: parseInt(fd.get('hoursRequired')),
      source: fd.get('source'),
    });

    location.hash = '#status';
  };
}
