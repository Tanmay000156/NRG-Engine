/**
 * NRG ENGINE — /api/auth
 * Signed HttpOnly cookie session management and user profile sync.
 */

const crypto = require('crypto');
const {
  getOrCreateSession,
  getSessionFromRequest,
  setSessionCookie,
  clearSessionCookie,
  normalizeRole
} = require('./_auth');
const { upsertUserProfile, getUserProfile } = require('./_store');
const { getClientIp, checkRateLimit, applySecurityHeaders, parseBody } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const limit = checkRateLimit(getClientIp(req), 'auth');
  if (!limit.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: limit.error }));
    return;
  }

  if (req.method === 'GET') {
    const { session } = getOrCreateSession(req, res, true);
    const stored = getUserProfile(session.userId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      authenticated: !session.isGuest && !!session.displayName,
      user: {
        userId: session.userId,
        displayName: stored?.displayName ?? session.displayName ?? '',
        username: stored?.username ?? session.username ?? '',
        roleTitle: normalizeRole(stored?.roleTitle ?? session.roleTitle),
        bio: stored?.bio ?? '',
        isGuest: !stored?.displayName && !!session.isGuest
      }
    }));
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req, 64 * 1024);
      const { session } = getOrCreateSession(req, res, true);
      const cleanName = String(body.displayName || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      const cleanUser = String(body.username || '').replace(/^@+/, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 28);
      const cleanRole = normalizeRole(body.roleTitle);
      const cleanBio = String(body.bio || '').trim().slice(0, 120);

      const updatedSession = {
        sessionId: session.sessionId || ('sess_' + crypto.randomBytes(12).toString('hex')),
        userId: session.userId,
        displayName: cleanName || session.displayName || '',
        username: cleanUser || session.username || '',
        roleTitle: cleanRole,
        isGuest: !cleanName
      };

      upsertUserProfile(updatedSession.userId, {
        displayName: updatedSession.displayName,
        username: updatedSession.username,
        roleTitle: updatedSession.roleTitle,
        bio: cleanBio
      });
      setSessionCookie(req, res, updatedSession);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        authenticated: !!updatedSession.displayName,
        user: { ...updatedSession, bio: cleanBio }
      }));
    } catch (err) {
      res.statusCode = err.statusCode || 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (req.method === 'DELETE') {
    const existing = getSessionFromRequest(req);
    if (existing?.userId) {
      upsertUserProfile(existing.userId, { displayName: '', username: '', bio: '' });
    }
    clearSessionCookie(req, res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, signedOut: true }));
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
};
