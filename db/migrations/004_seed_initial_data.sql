-- Migration: seed initial data for users, applications, dtr_entries, school_activities, messages, email_templates, company_documents, dept_slots, quarter_settings

-- USERS
INSERT INTO users (id, email, password, name, phone, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'hr@example.com', 'change-me', 'HR Admin', '09170000000', 'hr'),
  ('22222222-2222-2222-2222-222222222222', 'intern@example.com', 'change-me', 'Sample Intern', '09170000001', 'intern')
ON CONFLICT (id) DO NOTHING;

-- APPLICATIONS
INSERT INTO applications (id, userId, name, email, phone, course, school, cvName, coverName, ojtType, hoursRequired, source, status, appliedDate, quarter, department, supervisor, schedule, startDate, interviewDate, interviewTime, finalInterviewDate, finalInterviewTime)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Sample Intern', 'intern@example.com', '09170000001', 'BS Information Technology', 'Sample University', 'cv.pdf', 'portfolio.pdf', 'required', 480, 'LinkedIn', 'accepted', '2026-04-01', 'Q2-2026', 'IT', 'To be assigned', 'Mon-Fri, 8:00 AM - 5:00 PM', '2026-04-15', '2026-04-05', '10:00', '2026-04-10', '14:00')
ON CONFLICT (id) DO NOTHING;

-- DTR ENTRIES
INSERT INTO dtr_entries (id, appId, date, timeIn, timeOut, type)
VALUES
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '2026-04-16', '08:00', '17:00', 'work')
ON CONFLICT (id) DO NOTHING;

-- SCHOOL ACTIVITIES
INSERT INTO school_activities (id, appId, name, description, status, type)
VALUES
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Career Talk', 'School activity', 'approved', 'school')
ON CONFLICT (id) DO NOTHING;

-- MESSAGES
INSERT INTO messages (id, appId, "from", text, time)
VALUES
  ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'hr', 'Welcome to PRIME!', '2026-04-16T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- EMAIL TEMPLATES
INSERT INTO email_templates (id, name, subject, body)
VALUES
  ('tmpl_initial_interview', 'Initial Interview', 'Interview Schedule', 'Hello {name}, your interview is on {date} at {time}.')
ON CONFLICT (id) DO NOTHING;

-- COMPANY DOCUMENTS
INSERT INTO company_documents (id, name, description, type)
VALUES
  ('offer_letter', 'Offer Letter', 'Signed offer letter', 'company')
ON CONFLICT (id) DO NOTHING;

-- DEPT SLOTS
INSERT INTO dept_slots (department, slots)
VALUES
  ('IT', 3),
  ('HR', 1)
ON CONFLICT (department) DO NOTHING;

-- QUARTER SETTINGS
INSERT INTO quarter_settings (current)
VALUES ('Q2-2026')
ON CONFLICT (current) DO NOTHING;
