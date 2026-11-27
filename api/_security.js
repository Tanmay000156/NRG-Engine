/**
 * NRG ENGINE — BACKEND SECURITY & SANDBOX GUARD MODULE
 * Enforces rate limiting, CORS origin filtering, security headers, body size caps,
 * minimal environment isolation for spawned user programs, and static resource hazard checks.
 */

const path = require('path');

// In-memory rate limiting state per bucket: bucketKey -> { recent: number[], burst: number[] }
const rateLimitMap = new Map();
const ROUTE_LIMITS = {
  execute: { maxPerMinute: 30, burstWindowMs: 800, maxBurst: 2 },
  predict: { maxPerMinute: 90, burstWindowMs: 100, maxBurst: 4 },
  ai_assist: { maxPerMinute: 45, burstWindowMs: 250, maxBurst: 4 },
  interactive: { maxPerMinute: 30, burstWindowMs: 400, maxBurst: 2 },
  auth: { maxPerMinute: 60, burstWindowMs: 200, maxBurst: 4 },
  projects: { maxPerMinute: 60, burstWindowMs: 200, maxBurst: 5 }
};

// Periodically prune stale rate-limit buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    const recent = entry.filter(ts => now - ts < 60000);
    if (recent.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, recent);
  }
}, 5 * 60 * 1000).unref();

function getClientIp(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req?.socket?.remoteAddress || req?.connection?.remoteAddress || '127.0.0.1';
}

function checkRateLimit(clientIp, routeKey = 'execute') {
  const limits = ROUTE_LIMITS[routeKey] || ROUTE_LIMITS.execute;
  const bucketKey = `${routeKey}:${clientIp || '127.0.0.1'}`;
  const now = Date.now();
  const history = rateLimitMap.get(bucketKey) || [];
  const recent = history.filter(ts => now - ts < 60000);

  // Cooldown / rapid flood guard (allows sequential API tests while blocking rapid flood bursts)
  const inBurst = recent.filter(ts => now - ts < limits.burstWindowMs);
  if (inBurst.length >= limits.maxBurst) {
    return {
      allowed: false,
      retryAfterMs: limits.burstWindowMs,
      error: 'Execution cooldown active. Please wait a moment between runs.'
    };
  }

  if (recent.length >= limits.maxPerMinute) {
    return {
      allowed: false,
      retryAfterMs: 60000 - (now - recent[0]),
      error: `Rate limit exceeded (${limits.maxPerMinute} requests/minute). Please wait before sending more requests.`
    };
  }

  recent.push(now);
  rateLimitMap.set(bucketKey, recent);
  return { allowed: true };
}

function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const lower = origin.toLowerCase();
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(lower)) return true;
  const explicit = [
    'https://nrg-engine.onrender.com',
    'https://nrg-engine.onrender.app',
    'https://nrg-engine.vercel.app',
    'https://nrg-engine-nrg18.vercel.app'
  ];
  if (explicit.some(a => lower.startsWith(a))) return true;
  if (/^https:\/\/nrg-[a-z0-9-]+\.(?:onrender\.com|onrender\.app|vercel\.app)$/.test(lower)) return true;
  const envOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return envOrigins.some(a => a === '*' || lower.startsWith(a.toLowerCase()));
}

function applySecurityHeaders(res, reqOrigin = '', options = {}) {
  if (!res || typeof res.setHeader !== 'function') return;

  if (reqOrigin && isAllowedOrigin(reqOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else if (!options.strictCors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (options.isHtml) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; worker-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' ws: wss: https:; frame-src 'self' data: blob:;"
    );
  }
}

/**
 * Shared safe JSON body parser enforcing max byte limit to avoid duplicated request parsing code.
 */
async function parseBody(req, maxBytes = 512 * 1024) {
  if (req?.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body, 'utf8') > maxBytes) {
        const err = new Error(`Payload exceeds ${Math.round(maxBytes / 1024)} KB limit.`);
        err.statusCode = 413;
        throw err;
      }
      try {
        return JSON.parse(req.body || '{}');
      } catch (_) {
        return {};
      }
    }
  }

  return new Promise((resolve, reject) => {
    let bytes = 0;
    const chunks = [];
    let aborted = false;

    req.on('data', (chunk) => {
      if (aborted) return;
      bytes += chunk.length;
      if (bytes > maxBytes) {
        aborted = true;
        try { req.destroy(); } catch (_) {}
        const err = new Error(`Payload exceeds ${Math.round(maxBytes / 1024)} KB limit.`);
        err.statusCode = 413;
        reject(err);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => {
      if (!aborted) resolve({});
    });
  });
}

/**
 * Constructs a stripped environment allowlist for child processes.
 * Critically prevents leakage of host secrets (API keys, session secrets, tokens).
 */
function buildSandboxedEnv(sessionDir, extra = {}) {
  const safeDir = sessionDir || require('os').tmpdir();
  const env = {
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
    HOME: safeDir,
    TMPDIR: safeDir,
    TEMP: safeDir,
    TMP: safeDir,
    MPLCONFIGDIR: path.join(safeDir, '.mplconfig'),
    MPLBACKEND: 'Agg',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUNBUFFERED: '1',
    PYTHONDONTWRITEBYTECODE: '1',
    NODE_NO_WARNINGS: '1',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    NRG_SANDBOX: '1'
  };

  if (process.platform === 'win32') {
    if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
    if (process.env.COMSPEC) env.COMSPEC = process.env.COMSPEC;
    if (process.env.PATHEXT) env.PATHEXT = process.env.PATHEXT;
    if (process.env.WINDIR) env.WINDIR = process.env.WINDIR;
  } else {
    if (process.env.LD_LIBRARY_PATH) env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH;
  }

  return { ...env, ...extra };
}

/**
 * Screens user code for classic fork bombs / unbounded resource exhaustion patterns
 * before local subprocess execution.
 */
function checkStaticResourceHazards(language, sourceCode) {
  if (typeof sourceCode !== 'string') return { safe: true };
  const lang = (language || '').toLowerCase().trim();

  if (lang === 'c' || lang === 'cpp') {
    if (/while\s*\(\s*(?:1|true)\s*\)\s*\{?[^{};]*\bfork\s*\(/.test(sourceCode) ||
        /for\s*\(\s*;\s*;\s*\)\s*\{?[^{};]*\bfork\s*\(/.test(sourceCode)) {
      return {
        safe: false,
        reason: 'Blocked by sandbox security policy: unbounded fork() loop / process exhaustion pattern detected.'
      };
    }
  }
  if (lang === 'python') {
    if (/(?:while\s+True|for\s+_\s+in\s+iter)\s*:\s*[\s\S]{0,120}\bos\.fork\s*\(/.test(sourceCode)) {
      return {
        safe: false,
        reason: 'Blocked by sandbox security policy: unbounded os.fork() loop detected.'
      };
    }
  }
  if (lang === 'javascript') {
    if (/child_process/.test(sourceCode) && /while\s*\(\s*true\s*\)/.test(sourceCode)) {
      return {
        safe: false,
        reason: 'Blocked by sandbox security policy: unbounded process spawning loop detected.'
      };
    }
  }
  return { safe: true };
}

module.exports = {
  getClientIp,
  checkRateLimit,
  isAllowedOrigin,
  applySecurityHeaders,
  parseBody,
  buildSandboxedEnv,
  checkStaticResourceHazards
};
