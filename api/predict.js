/**
 * NRG ENGINE — /api/predict
 * Context-aware inline & multiline AI code prediction endpoint.
 */

const { predictCode } = require('./_predictor');
const { getClientIp, checkRateLimit, applySecurityHeaders, parseBody } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

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

  const limit = checkRateLimit(getClientIp(req), 'predict');
  if (!limit.allowed) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, suggestion: '', error: limit.error }));
    return;
  }

  try {
    const body = await parseBody(req, 128 * 1024);
    const result = await predictCode({
      language: body.language,
      prefix: body.prefix,
      suffix: body.suffix,
      tabSize: body.tabSize,
      trigger: body.trigger,
      aiConfig: body.aiConfig
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, ...result }));
  } catch (err) {
    res.statusCode = err.statusCode || 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, suggestion: '', source: 'error', error: err.message }));
  }
};
