-- Migration: seed initial data for users, applications, dtr_entries, school_activities, messages, email_templates, company_documents, dept_slots, quarter_settings

-- HR USERS
INSERT INTO hr_users (email, password, name, phone)
VALUES
  ('hr@example.com', 'change-me', 'HR Admin', '09170000000')
ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- USERS
INSERT INTO users (email, password, name, phone, role)
VALUES
  ('intern@example.com', 'change-me', 'Sample Intern', '09170000001', 'intern')
ON CONFLICT (email) DO UPDATE
SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

-- APPLICATIONS
WITH user_ref AS (
  SELECT id
  FROM users
  WHERE email = 'intern@example.com'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO applications (
  user_id,
  name,
  email,
  phone,
  course,
  school,
  cv_name,
  cover_name,
  ojt_type,
  hours_required,
  source,
  status,
  applied_date,
  quarter,
  department,
  supervisor,
  schedule,
  start_date,
  company_docs,
  school_docs
)
SELECT
  user_ref.id,
  'Sample Intern',
  'intern@example.com',
  '09170000001',
  'BS Information Technology',
  'Sample University',
  'cv.pdf',
  'portfolio.pdf',
  'required',
  480,
  'LinkedIn',
  'accepted',
  '2026-04-01',
  'Q2-2026',
  'IT',
  'To be assigned',
  'Mon-Fri, 8:00 AM - 5:00 PM',
  '2026-04-15',
  '{"offer_letter":"submitted"}'::jsonb,
  '[{"id":"sd_001","name":"Endorsement Letter","fileName":"endorsement.pdf","status":"submitted","signedBy":null}]'::jsonb
FROM user_ref
WHERE NOT EXISTS (
  SELECT 1
  FROM applications
  WHERE email = 'intern@example.com'
    AND applied_date = '2026-04-01'
);

-- DTR ENTRIES
WITH app_ref AS (
  SELECT id
  FROM applications
  WHERE email = 'intern@example.com'
    AND applied_date = '2026-04-01'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO dtr_entries (app_id, date, time_in, time_out, type)
SELECT
  app_ref.id,
  '2026-04-16',
  '08:00',
  '17:00',
  'work'
FROM app_ref
WHERE app_ref.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM dtr_entries
    WHERE app_id = app_ref.id
      AND date = '2026-04-16'
      AND time_in = '08:00'
      AND time_out = '17:00'
      AND type = 'work'
  );

-- SCHOOL ACTIVITIES
WITH app_ref AS (
  SELECT id
  FROM applications
  WHERE email = 'intern@example.com'
    AND applied_date = '2026-04-01'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO school_activities (app_id, name, description, status, type)
SELECT
  app_ref.id,
  'Career Talk',
  'School activity',
  'approved',
  'school'
FROM app_ref
WHERE app_ref.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM school_activities
    WHERE app_id = app_ref.id
      AND name = 'Career Talk'
      AND type = 'school'
  );

-- MESSAGES
WITH app_ref AS (
  SELECT id
  FROM applications
  WHERE email = 'intern@example.com'
    AND applied_date = '2026-04-01'
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO messages (app_id, sender, text, time)
SELECT
  app_ref.id,
  'hr',
  'Welcome to PRIME!',
  '2026-04-16T09:00:00Z'
FROM app_ref
WHERE app_ref.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM messages
    WHERE app_id = app_ref.id
      AND sender = 'hr'
      AND text = 'Welcome to PRIME!'
      AND time = '2026-04-16T09:00:00Z'
  );

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
ON CONFLICT (department) DO UPDATE SET slots = EXCLUDED.slots;

-- QUARTER SETTINGS
INSERT INTO quarter_settings (id, current)
VALUES (1, 'Q2-2026')
ON CONFLICT (id) DO UPDATE SET current = EXCLUDED.current;
