/**
 * NRG ENGINE — CENTRALIZED APPLICATION DEFAULTS & CONFIGURATION
 * Single source of truth shared between backend (/api/config), frontend UI defaults,
 * and workspace storage initialization. Zero hardcoded user-specific personal details.
 */

const DEFAULT_SETTINGS = Object.freeze({
  displayName: '',
  username: '',
  roleTitle: 'Developer',
  bio: '',
  avatarDataUrl: '',
  avatarAccent: '#0066ff',
  theme: 'crystal-obsidian',
  fontSize: 14.5,
  fontFamily: "'Consolas', 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace",
  tabSize: 4,
  wordWrap: false,
  lineNumbers: true,
  minimap: false,
  autoIndent: true,
  autoSave: true,
  autoSaveDelayMs: 2500,
  aiAutocomplete: true,
  aiPredictionDelayMs: 320,
  aiProvider: 'auto',
  aiEndpoint: '',
  aiModel: '',
  aiApiKey: '',
  soundEffects: true
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
  { label: 'Consolas', value: "'Consolas', 'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', 'Consolas', 'Fira Code', monospace" },
  { label: 'Fira Code', value: "'Fira Code', 'Cascadia Code', 'Consolas', monospace" },
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
  DEFAULT_SETTINGS,
  ACCOUNT_ROLES,
  FONT_FAMILY_OPTIONS,
  PREDICTOR_LIMITS
};
