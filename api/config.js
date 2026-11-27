/**
 * NRG ENGINE — /api/config
 * Exposes centralized defaults, branding identity, limits, roles, and editor font options.
 */

const {
  BRAND_IDENTITY,
  EXECUTION_LIMITS,
  DEFAULT_SETTINGS,
  ACCOUNT_ROLES,
  FONT_FAMILY_OPTIONS,
  PREDICTOR_LIMITS
} = require('./_config');
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
    success: true,
    brand: BRAND_IDENTITY,
    limits: EXECUTION_LIMITS,
    defaults: DEFAULT_SETTINGS,
    accountRoles: ACCOUNT_ROLES,
    fontFamilies: FONT_FAMILY_OPTIONS,
    predictorLimits: PREDICTOR_LIMITS
  }));
};
