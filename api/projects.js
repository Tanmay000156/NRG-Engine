/**
 * NRG ENGINE — /api/projects
 * Owner-authorized project persistence CRUD backed by signed session cookies.
 */

const { getOrCreateSession, getSessionFromRequest } = require('./_auth');
const { listUserProjects, saveUserProject, deleteUserProject } = require('./_store');
const { getClientIp, checkRateLimit, applySecurityHeaders, parseBody } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const limit = checkRateLimit(getClientIp(req), 'projects');
  if (!limit.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: limit.error }));
    return;
  }

  if (req.method === 'GET') {
    const { session } = getOrCreateSession(req, res, true);
    const projects = listUserProjects(session.userId);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, ownerId: session.userId, projects }));
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { session } = getOrCreateSession(req, res, true);
    try {
      const body = await parseBody(req, 512 * 1024);
      const saved = saveUserProject(session.userId, body);
      res.statusCode = saved.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: saved.ok, ...saved }));
    } catch (err) {
      res.statusCode = err.statusCode || 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (req.method === 'DELETE') {
    const existing = getSessionFromRequest(req);
    if (!existing) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: active workspace session required.' }));
      return;
    }
    try {
      const url = new URL(req.url || '/api/projects', 'http://localhost');
      const pathMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
      const queryId = url.searchParams.get('id') || (pathMatch ? decodeURIComponent(pathMatch[1]) : '');
      const body = queryId ? { id: queryId } : await parseBody(req, 16 * 1024);
      const del = deleteUserProject(existing.userId, body.id);
      res.statusCode = del.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: del.ok, ...del }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
};
