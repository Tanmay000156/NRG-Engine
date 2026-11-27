/**
 * NRG ENGINE — SESSION AUTHENTICATION & AUTHORIZATION MODULE
 * Manages HMAC-SHA256 signed HttpOnly session cookies, role validation, and workspace scoping.
 * Secret key never hardcoded in client responses; auto-rotates ephemeral CSPRNG secret when unset.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { ACCOUNT_ROLES } = require('./_config');
const { DATA_DIR } = require('./_store');

const COOKIE_NAME = 'nrg_session';
let cachedLocalSecret = '';

function getSigningSecret() {
  if (process.env.NRG_SESSION_SECRET) return process.env.NRG_SESSION_SECRET;
  if (cachedLocalSecret) return cachedLocalSecret;
  const secretPath = path.join(DATA_DIR, '.session_secret');
  try {
    if (fs.existsSync(secretPath)) {
      const stored = fs.readFileSync(secretPath, 'utf8').trim();
      if (stored.length >= 32) {
        cachedLocalSecret = stored;
        return cachedLocalSecret;
      }
    }
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    cachedLocalSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretPath, cachedLocalSecret, { encoding: 'utf8', mode: 0o600 });
    return cachedLocalSecret;
  } catch (_) {
    cachedLocalSecret = crypto.randomBytes(32).toString('hex');
    return cachedLocalSecret;
  }
}

function signPayload(payloadObj) {
  const data = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(data).digest('base64url');
  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!parsed || !parsed.userId || (parsed.exp && Date.now() > parsed.exp)) {
      return null;
    }
    return parsed;
  } catch (_) {
    return null;
  }
}

function parseCookies(req) {
  const header = req?.headers?.cookie;
  const out = {};
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function isHttpsRequest(req) {
  return String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase() === 'https' ||
         !!req?.socket?.encrypted;
}

function setSessionCookie(req, res, sessionData) {
  if (!res || typeof res.setHeader !== 'function') return '';
  const token = signPayload({
    ...sessionData,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${30 * 24 * 60 * 60}`
  ];
  if (isHttpsRequest(req)) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
  return token;
}

function clearSessionCookie(req, res) {
  if (!res || typeof res.setHeader !== 'function') return;
  const flags = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (isHttpsRequest(req)) flags.push('Secure');
  res.setHeader('Set-Cookie', flags.join('; '));
}

function normalizeRole(role) {
  const clean = String(role || '').trim();
  return ACCOUNT_ROLES.includes(clean) ? clean : 'Developer';
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const bearer = String(req?.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const token = cookies[COOKIE_NAME] || bearer;
  const verified = verifyToken(token);
  if (verified) return verified;
  return null;
}

function getOrCreateSession(req, res, fallbackCreate = true) {
  const existing = getSessionFromRequest(req);
  if (existing) {
    return { session: existing, isNew: false };
  }
  if (!fallbackCreate) {
    return { session: null, isNew: false };
  }
  const fresh = {
    sessionId: 'sess_' + crypto.randomBytes(12).toString('hex'),
    userId: 'usr_' + crypto.randomBytes(10).toString('hex'),
    displayName: '',
    username: '',
    roleTitle: 'Developer',
    isGuest: true
  };
  setSessionCookie(req, res, fresh);
  return { session: fresh, isNew: true };
}

module.exports = {
  COOKIE_NAME,
  signPayload,
  verifyToken,
  getSessionFromRequest,
  getOrCreateSession,
  setSessionCookie,
  clearSessionCookie,
  normalizeRole
};
