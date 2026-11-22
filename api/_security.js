/**
 * NRG ENGINE 2.0 — BACKEND SECURITY MODULE
 * Enforces rate limiting, CORS origin validation, and security headers.
 */

// In-memory rate limiting state: clientIp -> array of timestamps
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_MINUTE = 30;
const MIN_COOLDOWN_MS = 800; // 800ms between submissions

// Clean up stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, history] of rateLimitMap.entries()) {
    const recent = history.filter(ts => now - ts < 60000);
    if (recent.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recent);
    }
  }
}, 5 * 60 * 1000).unref();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

function checkRateLimit(clientIp) {
  const now = Date.now();
  const history = rateLimitMap.get(clientIp) || [];
  const recent = history.filter(ts => now - ts < 60000);

  // Check cooldown
  if (recent.length > 0) {
    const lastTs = recent[recent.length - 1];
    if (now - lastTs < MIN_COOLDOWN_MS) {
      return {
        allowed: false,
        error: 'Execution cooldown active. Please wait a moment between runs.'
      };
    }
  }

  // Check volume limit
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      error: 'Execution rate limit exceeded (30 requests/minute). Please wait before running more programs.'
    };
  }

  recent.push(now);
  rateLimitMap.set(clientIp, recent);
  return { allowed: true };
}

function applySecurityHeaders(res, reqOrigin) {
  // Allow localhost, 127.0.0.1, Vercel production domains, or matching origin
  const allowed = [
    'https://nrg-engine.vercel.app',
    'https://nrg-engine-nrg18.vercel.app'
  ];
  
  let originToSet = '*';
  if (reqOrigin) {
    if (reqOrigin.includes('localhost') || reqOrigin.includes('127.0.0.1') || allowed.some(a => reqOrigin.startsWith(a))) {
      originToSet = reqOrigin;
    }
  }

  res.setHeader('Access-Control-Allow-Origin', originToSet);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

module.exports = {
  getClientIp,
  checkRateLimit,
  applySecurityHeaders
};
