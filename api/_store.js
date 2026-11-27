/**
 * NRG ENGINE — PERSISTENT WORKSPACE, PROFILE & ANALYTICS DATA STORE
 * Provides atomic JSON storage across local and serverless hosts with strict
 * owner-based project access control and bounded execution analytics history.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function resolveDataDir() {
  if (process.env.NRG_DATA_DIR) return process.env.NRG_DATA_DIR;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'nrg_engine_store');
  }
  return path.join(__dirname, '..', '.nrg_data');
}

const DATA_DIR = resolveDataDir();
const DB_FILE = path.join(DATA_DIR, 'workspace_db.json');

const memoryFallback = {
  users: {},
  projects: {},
  analytics: []
};

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    }
    return true;
  } catch (_) {
    return false;
  }
}

function syncMemoryFallback(db) {
  if (!db || typeof db !== 'object') return;
  memoryFallback.users = db.users && typeof db.users === 'object' ? { ...db.users } : {};
  memoryFallback.projects = db.projects && typeof db.projects === 'object' ? { ...db.projects } : {};
  memoryFallback.analytics = Array.isArray(db.analytics) ? [...db.analytics] : [];
}

function readDb() {
  if (!ensureDir()) return memoryFallback;
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {
        users: { ...memoryFallback.users },
        projects: { ...memoryFallback.projects },
        analytics: [...memoryFallback.analytics]
      };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const loaded = {
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {},
      projects: parsed.projects && typeof parsed.projects === 'object' ? parsed.projects : {},
      analytics: Array.isArray(parsed.analytics) ? parsed.analytics : []
    };
    syncMemoryFallback(loaded);
    return loaded;
  } catch (_) {
    return memoryFallback;
  }
}

function writeDb(db) {
  syncMemoryFallback(db);
  if (!ensureDir()) return false;
  const serialized = JSON.stringify(db, null, 2);
  const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpFile, serialized, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmpFile, DB_FILE);
    return true;
  } catch (_) {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
    try {
      // Fallback direct write when host FS sync clients (e.g., Windows OneDrive) lock atomic rename targets
      fs.writeFileSync(DB_FILE, serialized, { encoding: 'utf8', mode: 0o600 });
      return true;
    } catch (_) {
      return false;
    }
  }
}

function upsertUserProfile(userId, profile) {
  if (!userId) return null;
  const db = readDb();
  const prev = db.users[userId] || { userId, createdAt: Date.now() };
  const next = {
    ...prev,
    ...profile,
    userId,
    updatedAt: Date.now()
  };
  db.users[userId] = next;
  writeDb(db);
  return next;
}

function getUserProfile(userId) {
  if (!userId) return null;
  const db = readDb();
  return db.users[userId] || null;
}

function listUserProjects(userId) {
  const db = readDb();
  return Object.values(db.projects)
    .filter(p => p && p.ownerId === userId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function saveUserProject(userId, proj) {
  if (!userId || !proj || !proj.id) {
    return { ok: false, status: 400, error: 'Missing project ID or user identity.' };
  }
  const db = readDb();
  const existing = db.projects[proj.id];
  if (existing && existing.ownerId && existing.ownerId !== userId) {
    return { ok: false, status: 403, error: 'Forbidden: project belongs to another workspace owner.' };
  }

  const cleanFiles = Array.isArray(proj.files)
    ? proj.files.slice(0, 32).map(f => ({
        name: String(f.name || 'file.txt').slice(0, 80),
        lang: String(f.lang || proj.lang || 'c').slice(0, 24),
        code: String(f.code || '').slice(0, 262144)
      }))
    : undefined;

  const stored = {
    id: String(proj.id).slice(0, 64),
    ownerId: userId,
    name: String(proj.name || 'untitled').slice(0, 80),
    lang: String(proj.lang || 'c').slice(0, 24),
    file: String(proj.file || 'main.c').slice(0, 80),
    code: String(proj.code || '').slice(0, 262144),
    ...(cleanFiles ? { files: cleanFiles, filesCount: cleanFiles.length } : { filesCount: proj.filesCount || 1 }),
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  db.projects[stored.id] = stored;
  writeDb(db);
  return { ok: true, status: 200, project: stored };
}

function deleteUserProject(userId, projectId) {
  if (!userId || !projectId) {
    return { ok: false, status: 400, error: 'Missing project ID.' };
  }
  const db = readDb();
  const existing = db.projects[projectId];
  if (!existing) {
    return { ok: false, status: 404, error: 'Project not found.' };
  }
  if (existing.ownerId !== userId) {
    return { ok: false, status: 403, error: 'Forbidden: cannot delete another owner\'s project.' };
  }
  delete db.projects[projectId];
  writeDb(db);
  return { ok: true, status: 200 };
}

function recordExecutionMetric(metric) {
  try {
    const db = readDb();
    db.analytics.unshift({
      language: String(metric.language || 'unknown'),
      success: Boolean(metric.success),
      compileMs: Number(metric.compileMs) || 0,
      execMs: Number(metric.execMs) || 0,
      mode: String(metric.mode || 'unknown'),
      cacheHit: Boolean(metric.cacheHit),
      timestamp: Date.now()
    });
    if (db.analytics.length > 200) db.analytics = db.analytics.slice(0, 200);
    writeDb(db);
  } catch (_) {}
}

function getExecutionAnalytics() {
  const db = readDb();
  const list = db.analytics || [];
  const total = list.length;
  const passed = list.filter(x => x.success).length;
  const avgExecMs = total ? Math.round(list.reduce((s, x) => s + (x.execMs || 0), 0) / total) : 0;
  const avgCompileMs = total ? Math.round(list.reduce((s, x) => s + (x.compileMs || 0), 0) / total) : 0;
  const byLanguage = {};
  for (const item of list) {
    byLanguage[item.language] = (byLanguage[item.language] || 0) + 1;
  }
  return {
    totalRuns: total,
    passRate: total ? Math.round((passed / total) * 100) : 100,
    avgExecMs,
    avgCompileMs,
    byLanguage,
    recent: list.slice(0, 20)
  };
}

module.exports = {
  DATA_DIR,
  upsertUserProfile,
  getUserProfile,
  listUserProjects,
  saveUserProject,
  deleteUserProject,
  recordExecutionMetric,
  getExecutionAnalytics
};
