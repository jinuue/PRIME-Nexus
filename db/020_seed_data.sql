-- PRIME-Nexus: Seed Data

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
) VALUES (
  (SELECT id FROM user_ref),
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
)
ON CONFLICT DO NOTHING;

-- DTR ENTRIES
INSERT INTO dtr_entries (app_id, date, time_in, time_out, type)
SELECT a.id, '2026-04-16', '08:00', '17:00', 'work'
FROM applications a
WHERE a.email = 'intern@example.com'
ON CONFLICT DO NOTHING;

-- SCHOOL ACTIVITIES
INSERT INTO school_activities (app_id, name, description, status, type)
SELECT a.id, 'Career Talk', 'School activity', 'approved', 'school'
FROM applications a
WHERE a.email = 'intern@example.com'
ON CONFLICT DO NOTHING;

-- MESSAGES
INSERT INTO messages (app_id, sender, text, time)
SELECT a.id, 'HR Admin', 'Welcome to PRIME-Nexus!', now()
FROM applications a
WHERE a.email = 'intern@example.com'
ON CONFLICT DO NOTHING;
