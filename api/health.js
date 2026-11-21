/**
 * NRG ENGINE — VERCEL SERVERLESS FUNCTION: /api/health
 * Returns service health and supported languages.
 */

const { LANGUAGE_REGISTRY } = require('./_compiler');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'online',
    service: 'NRG Engine Compiler Backend',
    backend: 'Judge0 CE',
    version: '1.0.0',
    supported_languages: Object.keys(LANGUAGE_REGISTRY)
  }));
};
