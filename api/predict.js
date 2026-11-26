/**
 * NRG ENGINE — VERCEL SERVERLESS FUNCTION: /api/predict
 * Context-aware inline code prediction endpoint (Mode: LLM if configured / Structural AST analyzer).
 */

const { predictCode } = require('./_predictor');
const { applySecurityHeaders } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers.origin || '');

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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body || '{}');
    } else if (!body || typeof body !== 'object') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    }

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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, suggestion: '', source: 'error', error: err.message }));
  }
};
