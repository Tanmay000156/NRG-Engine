/**
 * NRG ENGINE — /api/ai/assist | /api/ai/chat | /api/ai/status | /api/ai/test
 * Unified real AI endpoint supporting status checks, connection verification,
 * single-turn code intelligence (explain/debug/optimize), dependency parsing,
 * and Server-Sent Events (SSE) multi-turn AI Chat streaming.
 */

const { analyzeAndAssist, streamAssistChat } = require('./_assistant');
const { getAiPublicStatus, testAiConnection } = require('./_ai_provider');
const { getClientIp, checkRateLimit, applySecurityHeaders, parseBody } = require('./_security');

function resolveRouteMode(req, bodyMode) {
  const urlStr = String(req.url || '');
  const pathOnly = urlStr.split('?')[0];
  if (pathOnly.endsWith('/api/ai/status')) return 'status';
  if (pathOnly.endsWith('/api/ai/test')) return 'test';
  if (pathOnly.endsWith('/api/ai/chat')) return 'chat';
  try {
    const u = new URL(urlStr, 'http://localhost');
    const qMode = u.searchParams.get('mode');
    if (qMode) return qMode;
  } catch (_) {}
  return bodyMode || 'explain';
}

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const routeMode = resolveRouteMode(req, '');

  // Allow GET /api/ai/status (or ?mode=status) cleanly
  if (req.method === 'GET') {
    if (routeMode === 'status') {
      const status = getAiPublicStatus({});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, ...status }));
      return;
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  const limit = checkRateLimit(getClientIp(req), 'ai_assist');
  if (!limit.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, errorCode: 'RATE_LIMITED', error: limit.error }));
    return;
  }

  try {
    const body = await parseBody(req, 512 * 1024);
    const mode = resolveRouteMode(req, body.mode);
    const aiConfig = body.aiConfig && typeof body.aiConfig === 'object' ? body.aiConfig : {};

    if (mode === 'status') {
      const status = getAiPublicStatus(aiConfig);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, ...status }));
      return;
    }

    if (mode === 'test') {
      const testRes = await testAiConnection(aiConfig);
      res.statusCode = testRes.ok ? 200 : (testRes.statusCode || (testRes.configured ? 502 : 503));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: testRes.ok, ...testRes }));
      return;
    }

    if (body.stream === true) {
      await streamAssistChat({
        mode,
        language: body.language,
        code: body.code,
        errorOutput: body.errorOutput,
        messages: body.messages,
        aiConfig
      }, res);
      return;
    }

    const result = await analyzeAndAssist({
      mode,
      language: body.language,
      code: body.code,
      errorOutput: body.errorOutput,
      messages: body.messages,
      aiConfig
    });

    res.statusCode = result.success === false ? (result.statusCode || 503) : 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = err.statusCode || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      errorCode: err.errorCode || 'AI_HANDLER_ERROR',
      error: err.message
    }));
  }
};
