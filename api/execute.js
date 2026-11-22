/**
 * NRG ENGINE — VERCEL SERVERLESS FUNCTION: /api/execute
 * Handles program compilation and execution requests with security hardening.
 */

const { executeCode } = require('./_compiler');
const { getClientIp, checkRateLimit, applySecurityHeaders } = require('./_security');

async function parseBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch (e) {
        return {};
      }
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 512 * 1024) { // 512KB limit
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async (req, res) => {
  const reqOrigin = req.headers['origin'] || req.headers['host'] || '';
  applySecurityHeaders(res, reqOrigin);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: 'Method Not Allowed. Use POST.'
    }));
    return;
  }

  // Rate Limiting Enforcement
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(clientIp);
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
    const payload = await parseBody(req);
    const result = await executeCode(payload);

    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));

  } catch (err) {
    console.error('Execution handler error:', err);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: `Compiler Service Error: ${err.message}`,
      backend_error: true
    }));
  }
};
