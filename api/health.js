/**
 * NRG ENGINE — /api/health
 * Service readiness, supported languages, and active runtime features.
 */

const { LANGUAGE_REGISTRY } = require('./_compiler');
const { BRAND_IDENTITY } = require('./_config');
const { applySecurityHeaders } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'online',
    service: `${BRAND_IDENTITY.productName} Compiler Backend`,
    studio: BRAND_IDENTITY.studioName,
    backend: 'Judge0 CE + Sandboxed Local & WASM Scientific Runtimes',
    version: BRAND_IDENTITY.version,
    supported_languages: Object.keys(LANGUAGE_REGISTRY),
    features: [
      'real_compiler',
      'compile_cache',
      'terminal_ansi_clrscr',
      'multiline_formatting',
      'ai_autocomplete',
      'ai_assistant',
      'python_turtle_graphics',
      'pyodide_scientific_fallback',
      'universal_graphics_engine',
      'session_auth',
      'rate_limiting',
      'sandboxed_execution'
    ]
  }));
};
