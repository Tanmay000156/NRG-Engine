/**
 * NRG ENGINE — CENTRALIZED APPLICATION DEFAULTS & CONFIGURATION
 * Studio: NRG CoreX Studios | Creator: Tanmay NRG
 * Single source of truth shared between backend (/api/config), frontend defaults,
 * and workspace persistence. Zero hardcoded user-specific personal details.
 */

const BRAND_IDENTITY = Object.freeze({
  productName: 'NRG Engine',
  studioName: 'NRG CoreX Studios',
  creatorCredit: 'Developed by Tanmay NRG',
  version: '1.0.0',
  license: 'MIT'
});

const EXECUTION_LIMITS = Object.freeze({
  COMPILE_TIMEOUT_MS: 10000,
  MAX_EXECUTION_TIMEOUT_MS: 30000,
  INACTIVITY_TIMEOUT_MS: 30000,
  MAX_SOURCE_BYTES: 262144,
  MAX_STDIN_BYTES: 65536,
  MAX_OUTPUT_BYTES: 5 * 1024 * 1024,
  MAX_CONCURRENT_SESSIONS: 25
});

const DEFAULT_SETTINGS = Object.freeze({
  displayName: '',
  username: '',
  roleTitle: 'Developer',
  bio: '',
  avatarDataUrl: '',
  avatarAccent: '#171A21',
  theme: 'glass-light',
  fontSize: 14.5,
  fontFamily: "'Consolas', 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, monospace",
  tabSize: 4,
  wordWrap: false,
  lineNumbers: true,
  minimap: false,
  bracketMatching: true,
  codeFolding: true,
  autoIndent: true,
  autoSave: true,
  autoSaveDelayMs: 2500,
  aiAutocomplete: true,
  aiPredictionDelayMs: 320,
  aiProvider: 'auto',
  aiEndpoint: '',
  aiModel: '',
  aiApiKey: '',
  executionMode: 'auto',
  pyodideFallback: true,
  soundEffects: true,
  desktopToasts: true
});

const ACCOUNT_ROLES = Object.freeze([
  'Developer',
  'Student',
  'User',
  'Software Engineer',
  'Researcher',
  'Educator'
]);

const FONT_FAMILY_OPTIONS = Object.freeze([
  { label: 'Consolas', value: "'Consolas', 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, monospace" },
  { label: 'Fira Code', value: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', 'Consolas', 'Fira Code', monospace" },
  { label: 'Cascadia Code', value: "'Cascadia Code', 'Consolas', 'Courier New', monospace" },
  { label: 'Lucida Console', value: "'Lucida Console', 'DejaVu Sans Mono', Monaco, monospace" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" }
]);

const PREDICTOR_LIMITS = Object.freeze({
  MIN_DELAY_MS: 100,
  MAX_DELAY_MS: 1500,
  MAX_CONTEXT_CHARS: 12000,
  LLM_TIMEOUT_MS: 3800
});

module.exports = {
  BRAND_IDENTITY,
  EXECUTION_LIMITS,
  DEFAULT_SETTINGS,
  ACCOUNT_ROLES,
  FONT_FAMILY_OPTIONS,
  PREDICTOR_LIMITS
};
