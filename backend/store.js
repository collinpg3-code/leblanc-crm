/**
 * CRM data store.
 *
 * All CRM data is one JSON document. It is held in memory (the backend runs as a
 * single instance) and every save is written through to Postgres when
 * DATABASE_URL is set, so it survives Render restarts and redeploys. Without
 * DATABASE_URL (local dev) it falls back to backend/data.json.
 */

const fs = require('fs');
const path = require('path');

const EMPTY = { engagements: [], activity: [], stats: {}, backlog: [] };
const dataFile = path.join(__dirname, 'data.json');

let state = structuredClone(EMPTY);
let pool = null;
let writeChain = Promise.resolve();

function withDefaults(data) {
  return { ...structuredClone(EMPTY), ...(data || {}) };
}

async function init() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
    await pool.query('CREATE TABLE IF NOT EXISTS crm_state (id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
    const { rows } = await pool.query('SELECT data FROM crm_state WHERE id = 1');
    state = withDefaults(rows[0]?.data);
    console.log(`🗄️  Loaded CRM data from Postgres (${state.engagements.length} engagements, ${state.backlog.length} in backlog)`);
  } else {
    try {
      if (fs.existsSync(dataFile)) state = withDefaults(JSON.parse(fs.readFileSync(dataFile, 'utf-8')));
    } catch (err) {
      console.error('Error loading data file:', err);
    }
    console.warn('⚠️  DATABASE_URL not set — using local data.json (wiped on Render restarts).');
  }
}

// Returns a copy so a route that only reads can't change shared state by accident.
function load() {
  return structuredClone(state);
}

function save(data) {
  state = withDefaults(structuredClone(data));
  const snapshot = JSON.stringify(state);
  writeChain = writeChain
    .then(() => pool
      ? pool.query(
          'INSERT INTO crm_state (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()',
          [snapshot]
        )
      : fs.promises.writeFile(dataFile, snapshot))
    .catch(err => console.error('❌ Failed to persist CRM data:', err));
  return writeChain;
}

function storageMode() {
  return pool ? 'postgres' : 'file';
}

module.exports = { init, load, save, storageMode };
