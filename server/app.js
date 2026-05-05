
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';


const app = express();
app.use(express.json({ limit: '2mb' }));

// Serve static files from the frontend build (dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
// ...existing code...


// --- AUTH & USER ENDPOINTS ---
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = null; }

// Register user
app.post('/api/register', async (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
  const client = await pool.connect();
  try {
    // Check if user exists
    const exists = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Email already registered' });
    // Hash password (optional: use bcrypt if available)
    let hashed = password;
    if (bcrypt) hashed = await bcrypt.hash(password, 10);
    // Insert user
    const result = await client.query(
      'INSERT INTO users (id, email, password, name, phone, role) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING id, email, name, phone, role',
      [email, hashed, name, phone, 'applicant']
    );
    res.json({ user: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, email, password, name, phone, role FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    let valid = false;
    if (bcrypt) valid = await bcrypt.compare(password, user.password);
    else valid = user.password === password;
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    if (role && user.role !== role && !(role === 'intern' && user.role === 'applicant')) return res.status(403).json({ error: 'Access denied for this role' });
    delete user.password;
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    client.release();
  }
});

// Submit application
app.post('/api/applications', async (req, res) => {
  const { userId, name, email, phone, course, school, ojtType, hoursRequired, source, schedule, department } = req.body || {};
  if (!userId || !name || !email) return res.status(400).json({ error: 'Missing required fields' });
  const client = await pool.connect();
  try {
    // Check if already applied
    const exists = await client.query('SELECT 1 FROM applications WHERE user_id = $1', [userId]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'Already applied' });
    const now = new Date();
    const appliedDate = now.toISOString().split('T')[0];
    const result = await client.query(
      `INSERT INTO applications (id, user_id, name, email, phone, course, school, ojt_type, hours_required, source, status, applied_date, quarter, department, schedule, is_deployed, company_docs, school_docs)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'submitted', $10, $11, $12, $13, false, '{}'::jsonb, '[]'::jsonb)
       RETURNING id, user_id, name, email, phone, course, school, ojt_type, hours_required, source, status, applied_date, quarter, department, schedule, is_deployed`,
      [userId, name, email, phone, course, school, ojtType, hoursRequired, source, appliedDate, req.body.quarter || '', department, schedule]
    );
    res.json({ application: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Application failed' });
  } finally {
    client.release();
  }
});

// Catch-all: serve index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

const EXPECTED_TABLES = [
  'hr_users',
  'users',
  'applications',
  'dtr_entries',
  'school_activities',
  'messages',
  'email_templates',
  'company_documents',
  'dept_slots',
  'quarter_settings',
];

async function getExistingTables(client) {
  const result = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  return new Set(result.rows.map(row => row.table_name));
}

async function getColumnSet(client, table) {
  const result = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
    [table]
  );
  return new Set(result.rows.map(row => row.column_name));
}

function pickColumns(row, allowed) {
  const output = {};
  for (const [key, value] of Object.entries(row)) {
    if (allowed.has(key) && value !== undefined) {
      output[key] = value;
    }
  }
  return output;
}

async function insertRow(client, table, row) {
  const columns = Object.keys(row);
  if (!columns.length) return;
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const values = columns.map(column => row[column]);
  const text = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  await client.query(text, values);
}

function mapApplicationRow(app) {
  return {
    id: app.id,
    userId: app.user_id,
    name: app.name,
    email: app.email,
    phone: app.phone,
    course: app.course,
    school: app.school,
    cvName: app.cv_name,
    coverName: app.cover_name,
    ojtType: app.ojt_type,
    hoursRequired: app.hours_required,
    source: app.source,
    status: app.status,
    appliedDate: app.applied_date,
    quarter: app.quarter,
    department: app.department,
    supervisor: app.supervisor,
    schedule: app.schedule,
    startDate: app.start_date,
    companyDocs: app.company_docs || {},
    schoolDocs: app.school_docs || [],
    interviewDate: app.interview_date,
    interviewTime: app.interview_time,
    finalInterviewDate: app.final_interview_date,
    finalInterviewTime: app.final_interview_time,
    isDeployed: app.is_deployed ?? false,
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/store', async (req, res) => {
  const client = await pool.connect();
  try {
    const tables = await getExistingTables(client);
    const tasks = [];

    const hrUsersTask = tables.has('hr_users')
      ? client.query('SELECT id, email, password, name, phone FROM hr_users')
      : Promise.resolve({ rows: [] });
    const usersTask = tables.has('users')
      ? client.query('SELECT id, email, password, name, phone, role FROM users')
      : Promise.resolve({ rows: [] });
    const appsTask = tables.has('applications')
      ? client.query('SELECT to_jsonb(applications) AS app FROM applications')
      : Promise.resolve({ rows: [] });
    const dtrTask = tables.has('dtr_entries')
      ? client.query('SELECT id, app_id, date, time_in, time_out, type FROM dtr_entries')
      : Promise.resolve({ rows: [] });
    const schoolTask = tables.has('school_activities')
      ? client.query('SELECT id, app_id, name, description, status, type FROM school_activities')
      : Promise.resolve({ rows: [] });
    const msgTask = tables.has('messages')
      ? client.query('SELECT id, app_id, sender, text, time FROM messages')
      : Promise.resolve({ rows: [] });
    const templateTask = tables.has('email_templates')
      ? client.query('SELECT id, name, subject, body FROM email_templates')
      : Promise.resolve({ rows: [] });
    const companyTask = tables.has('company_documents')
      ? client.query('SELECT id, name, description, type FROM company_documents')
      : Promise.resolve({ rows: [] });
    const deptTask = tables.has('dept_slots')
      ? client.query('SELECT department, slots FROM dept_slots')
      : Promise.resolve({ rows: [] });
    const quarterTask = tables.has('quarter_settings')
      ? client.query('SELECT current FROM quarter_settings ORDER BY id DESC LIMIT 1')
      : Promise.resolve({ rows: [] });

    tasks.push(
      hrUsersTask,
      usersTask,
      appsTask,
      dtrTask,
      schoolTask,
      msgTask,
      templateTask,
      companyTask,
      deptTask,
      quarterTask
    );

    const [
      hrUsersRes,
      usersRes,
      appsRes,
      dtrRes,
      schoolRes,
      msgRes,
      templateRes,
      companyRes,
      deptRes,
      quarterRes,
    ] =
      await Promise.all(tasks);

    const users = [
      ...hrUsersRes.rows.map(row => ({
        id: row.id,
        email: row.email,
        password: row.password,
        name: row.name,
        phone: row.phone,
        role: 'hr',
      })),
      ...usersRes.rows.map(row => ({
        id: row.id,
        email: row.email,
        password: row.password,
        name: row.name,
        phone: row.phone,
        role: row.role || 'applicant',
      })),
    ];

    const applications = appsRes.rows.map(row => mapApplicationRow(row.app));

    const dtrEntries = dtrRes.rows.map(row => ({
      id: row.id,
      appId: row.app_id,
      date: row.date,
      timeIn: row.time_in,
      timeOut: row.time_out,
      type: row.type,
    }));

    const schoolActivities = schoolRes.rows.map(row => ({
      id: row.id,
      appId: row.app_id,
      name: row.name,
      description: row.description,
      status: row.status,
      type: row.type,
    }));

    const messages = msgRes.rows.map(row => ({
      id: row.id,
      appId: row.app_id,
      from: row.sender,
      text: row.text,
      time: row.time instanceof Date ? row.time.toLocaleString() : row.time,
    }));

    const emailTemplates = templateRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
    }));

    const companyDocuments = companyRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
    }));

    const deptSlots = deptRes.rows.reduce((acc, row) => {
      acc[row.department] = row.slots;
      return acc;
    }, {});

    const quarterSettings = quarterRes.rows[0]
      ? { current: quarterRes.rows[0].current }
      : { current: null };

    res.json({
      users,
      applications,
      dtrEntries,
      schoolActivities,
      messages,
      emailTemplates,
      companyDocuments,
      deptSlots,
      quarterSettings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load store data.' });
  } finally {
    client.release();
  }
});

app.put('/api/store', async (req, res) => {
  const payload = req.body || {};
  const users = Array.isArray(payload.users) ? payload.users : [];
  const applications = Array.isArray(payload.applications) ? payload.applications : [];
  const dtrEntries = Array.isArray(payload.dtrEntries) ? payload.dtrEntries : [];
  const schoolActivities = Array.isArray(payload.schoolActivities) ? payload.schoolActivities : [];
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const emailTemplates = Array.isArray(payload.emailTemplates) ? payload.emailTemplates : [];
  const companyDocuments = Array.isArray(payload.companyDocuments) ? payload.companyDocuments : [];
  const deptSlots = payload.deptSlots && typeof payload.deptSlots === 'object' ? payload.deptSlots : {};
  const quarterSettings = payload.quarterSettings || {};

  const client = await pool.connect();
  try {
    const tables = await getExistingTables(client);
    const truncateTables = EXPECTED_TABLES.filter(name => tables.has(name));

    await client.query('BEGIN');
    if (truncateTables.length) {
      await client.query(`TRUNCATE TABLE ${truncateTables.join(', ')} RESTART IDENTITY CASCADE`);
    }

    const hrUsers = users.filter(user => user.role === 'hr');
    const regularUsers = users.filter(user => user.role !== 'hr');

    if (tables.has('hr_users')) {
      const hrColumns = await getColumnSet(client, 'hr_users');
      for (const user of hrUsers) {
        const row = pickColumns(
          {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            phone: user.phone,
          },
          hrColumns
        );
        await insertRow(client, 'hr_users', row);
      }
    } else {
      regularUsers.push(...hrUsers);
    }

    if (tables.has('users')) {
      const userColumns = await getColumnSet(client, 'users');
      for (const user of regularUsers) {
        const row = pickColumns(
          {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
          userColumns
        );
        await insertRow(client, 'users', row);
      }
    }

    if (tables.has('applications')) {
      const appColumns = await getColumnSet(client, 'applications');
      for (const app of applications) {
        const row = pickColumns(
          {
            id: app.id,
            user_id: app.userId,
            name: app.name,
            email: app.email,
            phone: app.phone,
            course: app.course,
            school: app.school,
            cv_name: app.cvName,
            cover_name: app.coverName,
            ojt_type: app.ojtType,
            hours_required: app.hoursRequired,
            source: app.source,
            status: app.status,
            applied_date: app.appliedDate,
            quarter: app.quarter,
            department: app.department,
            supervisor: app.supervisor,
            schedule: app.schedule,
            start_date: app.startDate,
            company_docs: app.companyDocs || {},
            school_docs: app.schoolDocs || [],
            interview_date: app.interviewDate,
            interview_time: app.interviewTime,
            final_interview_date: app.finalInterviewDate,
            final_interview_time: app.finalInterviewTime,
            is_deployed: app.isDeployed ?? false,
          },
          appColumns
        );
        await insertRow(client, 'applications', row);
      }
    }

    if (tables.has('dtr_entries')) {
      const dtrColumns = await getColumnSet(client, 'dtr_entries');
      for (const entry of dtrEntries) {
        const row = pickColumns(
          {
            id: entry.id,
            app_id: entry.appId,
            date: entry.date,
            time_in: entry.timeIn,
            time_out: entry.timeOut,
            type: entry.type,
          },
          dtrColumns
        );
        await insertRow(client, 'dtr_entries', row);
      }
    }

    if (tables.has('school_activities')) {
      const schoolColumns = await getColumnSet(client, 'school_activities');
      for (const activity of schoolActivities) {
        const row = pickColumns(
          {
            id: activity.id,
            app_id: activity.appId,
            name: activity.name,
            description: activity.description,
            status: activity.status,
            type: activity.type,
          },
          schoolColumns
        );
        await insertRow(client, 'school_activities', row);
      }
    }

    if (tables.has('messages')) {
      const messageColumns = await getColumnSet(client, 'messages');
      for (const message of messages) {
        const row = pickColumns(
          {
            id: message.id,
            app_id: message.appId,
            sender: message.from,
            text: message.text,
            time: message.time,
          },
          messageColumns
        );
        await insertRow(client, 'messages', row);
      }
    }

    if (tables.has('email_templates')) {
      const templateColumns = await getColumnSet(client, 'email_templates');
      for (const template of emailTemplates) {
        const row = pickColumns(
          {
            id: template.id,
            name: template.name,
            subject: template.subject,
            body: template.body,
          },
          templateColumns
        );
        await insertRow(client, 'email_templates', row);
      }
    }

    if (tables.has('company_documents')) {
      const companyColumns = await getColumnSet(client, 'company_documents');
      for (const doc of companyDocuments) {
        const row = pickColumns(
          {
            id: doc.id,
            name: doc.name,
            description: doc.description,
            type: doc.type,
          },
          companyColumns
        );
        await insertRow(client, 'company_documents', row);
      }
    }

    if (tables.has('dept_slots')) {
      const deptColumns = await getColumnSet(client, 'dept_slots');
      for (const [department, slots] of Object.entries(deptSlots)) {
        const row = pickColumns(
          {
            department,
            slots,
          },
          deptColumns
        );
        await insertRow(client, 'dept_slots', row);
      }
    }

    if (tables.has('quarter_settings')) {
      const quarterColumns = await getColumnSet(client, 'quarter_settings');
      const row = pickColumns(
        {
          current: quarterSettings.current,
        },
        quarterColumns
      );
      await insertRow(client, 'quarter_settings', row);
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to persist store data.' });
  } finally {
    client.release();
  }
});

export default app;
