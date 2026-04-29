import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT = path.resolve(__dirname, '..', 'seed', 'store.json');
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;

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

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function normalizePayload(payload) {
  const data = payload && typeof payload === 'object' ? payload : {};
  return {
    users: Array.isArray(data.users) ? data.users : [],
    applications: Array.isArray(data.applications) ? data.applications : [],
    dtrEntries: Array.isArray(data.dtrEntries) ? data.dtrEntries : [],
    schoolActivities: Array.isArray(data.schoolActivities) ? data.schoolActivities : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    emailTemplates: Array.isArray(data.emailTemplates) ? data.emailTemplates : [],
    companyDocuments: Array.isArray(data.companyDocuments) ? data.companyDocuments : [],
    deptSlots: data.deptSlots && typeof data.deptSlots === 'object' ? data.deptSlots : {},
    quarterSettings: data.quarterSettings && typeof data.quarterSettings === 'object'
      ? data.quarterSettings
      : { current: null },
  };
}

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

async function persistStore(client, payload) {
  const data = normalizePayload(payload);
  const tables = await getExistingTables(client);
  const truncateTables = EXPECTED_TABLES.filter(name => tables.has(name));

  await client.query('BEGIN');
  if (truncateTables.length) {
    await client.query(`TRUNCATE TABLE ${truncateTables.join(', ')} RESTART IDENTITY CASCADE`);
  }

  const hrUsers = data.users.filter(user => user.role === 'hr');
  const regularUsers = data.users.filter(user => user.role !== 'hr');

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
    for (const app of data.applications) {
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
        },
        appColumns
      );
      await insertRow(client, 'applications', row);
    }
  }

  if (tables.has('dtr_entries')) {
    const dtrColumns = await getColumnSet(client, 'dtr_entries');
    for (const entry of data.dtrEntries) {
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
    for (const activity of data.schoolActivities) {
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
    for (const message of data.messages) {
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
    for (const template of data.emailTemplates) {
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
    for (const doc of data.companyDocuments) {
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
    for (const [department, slots] of Object.entries(data.deptSlots)) {
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
        current: data.quarterSettings.current,
      },
      quarterColumns
    );
    await insertRow(client, 'quarter_settings', row);
  }

  await client.query('COMMIT');
}

async function main() {
  const payload = await loadJson(inputPath);
  const client = await pool.connect();
  try {
    await persistStore(client, payload);
    console.log(`Seeded store data from ${inputPath}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(() => {
  process.exitCode = 1;
});
