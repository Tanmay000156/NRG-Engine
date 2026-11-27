/**
 * NRG ENGINE — /api/execute
 * Handles program compilation and sandboxed execution requests with rate limiting & validation.
 */

const { executeCode } = require('./_compiler');
const { getClientIp, checkRateLimit, applySecurityHeaders, parseBody } = require('./_security');

module.exports = async (req, res) => {
  const reqOrigin = req.headers?.origin || req.headers?.host || '';
  applySecurityHeaders(res, reqOrigin);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(clientIp, 'execute');
  if (!rateLimitResult.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      status: { id: 14, description: 'Rate Limit Exceeded' },
      error: rateLimitResult.error
    }));
    return;
  }

  try {
    const payload = await parseBody(req, 512 * 1024);
    const result = await executeCode(payload);
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  } catch (err) {
    res.statusCode = err.statusCode || 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: `Compiler Service Error: ${err.message}`,
      backend_error: true
    }));
  }
};
