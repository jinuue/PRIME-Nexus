import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_INPUT = path.resolve(__dirname, '..', 'seed', 'store.json');
const args = process.argv.slice(2);
let inputPath = DEFAULT_INPUT;
let mode = 'upsert';

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

const SEED_MODES = new Set(['upsert', 'truncate']);
const CONFLICT_RULES = {
  hr_users: { columns: ['id'], action: 'nothing' },
  users: { columns: ['id'], action: 'nothing' },
  applications: { columns: ['id'], action: 'nothing' },
  dtr_entries: { columns: ['id'], action: 'nothing' },
  school_activities: { columns: ['id'], action: 'nothing' },
  messages: { columns: ['id'], action: 'nothing' },
  email_templates: { columns: ['id'], action: 'nothing' },
  company_documents: { columns: ['id'], action: 'nothing' },
  dept_slots: { columns: ['department'], action: 'update', updateColumns: ['slots'] },
  quarter_settings: { columns: ['id'], action: 'update', updateColumns: ['current'] },
};

for (const arg of args) {
  if (arg === '--truncate') {
    mode = 'truncate';
  } else if (arg === '--upsert') {
    mode = 'upsert';
  } else if (arg.startsWith('--mode=')) {
    mode = arg.slice('--mode='.length);
  } else if (!arg.startsWith('--')) {
    inputPath = path.resolve(arg);
  }
}

if (!SEED_MODES.has(mode)) {
  console.error(`Unknown seed mode: ${mode}. Use --mode=upsert or --mode=truncate.`);
  process.exit(1);
}

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

async function insertRow(client, table, row, options = {}) {
  const columns = Object.keys(row);
  if (!columns.length) return;
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const values = columns.map(column => row[column]);
  let text = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  const conflict = options.onConflict;
  if (conflict && conflict.columns && conflict.columns.length) {
    text += ` ON CONFLICT (${conflict.columns.join(', ')})`;
    if (conflict.action === 'update' && conflict.updateColumns && conflict.updateColumns.length) {
      const updates = conflict.updateColumns
        .map(column => `${column} = EXCLUDED.${column}`)
        .join(', ');
      text += ` DO UPDATE SET ${updates}`;
    } else {
      text += ' DO NOTHING';
    }
  }
  await client.query(text, values);
}

async function persistStore(client, payload, options) {
  const { mode: seedMode } = options;
  const data = normalizePayload(payload);
  const tables = await getExistingTables(client);
  const truncateTables = EXPECTED_TABLES.filter(name => tables.has(name));

  await client.query('BEGIN');
  if (seedMode === 'truncate' && truncateTables.length) {
    await client.query(`TRUNCATE TABLE ${truncateTables.join(', ')} RESTART IDENTITY CASCADE`);
  }

  const applyConflict = seedMode === 'upsert';

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
      await insertRow(client, 'hr_users', row, {
        onConflict: applyConflict ? CONFLICT_RULES.hr_users : null,
      });
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
      await insertRow(client, 'users', row, {
        onConflict: applyConflict ? CONFLICT_RULES.users : null,
      });
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
          is_deployed: app.isDeployed ?? false,
        },
        appColumns
      );
      await insertRow(client, 'applications', row, {
        onConflict: applyConflict ? CONFLICT_RULES.applications : null,
      });
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
      await insertRow(client, 'dtr_entries', row, {
        onConflict: applyConflict ? CONFLICT_RULES.dtr_entries : null,
      });
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
      await insertRow(client, 'school_activities', row, {
        onConflict: applyConflict ? CONFLICT_RULES.school_activities : null,
      });
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
      await insertRow(client, 'messages', row, {
        onConflict: applyConflict ? CONFLICT_RULES.messages : null,
      });
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
      await insertRow(client, 'email_templates', row, {
        onConflict: applyConflict ? CONFLICT_RULES.email_templates : null,
      });
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
      await insertRow(client, 'company_documents', row, {
        onConflict: applyConflict ? CONFLICT_RULES.company_documents : null,
      });
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
      await insertRow(client, 'dept_slots', row, {
        onConflict: applyConflict ? CONFLICT_RULES.dept_slots : null,
      });
    }
  }

  if (tables.has('quarter_settings')) {
    const quarterColumns = await getColumnSet(client, 'quarter_settings');
    const row = pickColumns(
      {
        id: data.quarterSettings.id ?? 1,
        current: data.quarterSettings.current,
      },
      quarterColumns
    );
    await insertRow(client, 'quarter_settings', row, {
      onConflict: applyConflict ? CONFLICT_RULES.quarter_settings : null,
    });
  }

  await client.query('COMMIT');
}

async function main() {
  const payload = await loadJson(inputPath);
  const client = await pool.connect();
  try {
    await persistStore(client, payload, { mode });
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
