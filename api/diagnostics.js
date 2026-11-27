/**
 * NRG ENGINE — /api/diagnostics
 * Live system health, host compiler probes, Python library status, compile cache & execution analytics.
 */

const os = require('os');
const { probeHostToolchains } = require('./_local_runner');
const { getCacheStats, clearCompileCache } = require('./_compile_cache');
const { getExecutionAnalytics } = require('./_store');
const { BRAND_IDENTITY, EXECUTION_LIMITS } = require('./_config');
const { applySecurityHeaders } = require('./_security');

module.exports = async (req, res) => {
  applySecurityHeaders(res, req.headers?.origin || '');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    const cache = clearCompileCache();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, message: 'Compile cache cleared', compileCache: cache }));
    return;
  }

  const toolchains = probeHostToolchains();
  const compileCache = getCacheStats();
  const analytics = getExecutionAnalytics();
  const mem = process.memoryUsage();

  let activeSessions = 0;
  try {
    const im = require('./_interactive_manager');
    activeSessions = im.activeSessions ? im.activeSessions.size : 0;
  } catch (_) {}

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: true,
    brand: BRAND_IDENTITY,
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSec: Math.floor(process.uptime()),
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      freeSysMemMb: Math.round(os.freemem() / (1024 * 1024))
    },
    limits: EXECUTION_LIMITS,
    activeSessions,
    toolchains,
    compileCache,
    analytics,
    security: {
      envIsolation: true,
      signedHttpOnlySessions: true,
      rateLimitingActive: true,
      staticHazardGuard: true,
      cloudScientificFallback: 'pyodide'
    }
  }));
};
