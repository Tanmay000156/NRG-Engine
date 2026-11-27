/**
 * NRG ENGINE — BOUNDED COMPILATION ARTIFACT CACHE (C / C++)
 * Caches compiled binaries by SHA-256 of normalized source + compiler flags
 * using bounded LRU eviction so repeated C/C++ builds finish almost instantaneously.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.tmpdir(), 'nrg_compile_cache');
const MAX_CACHE_ENTRIES = 24;
const indexMap = new Map(); // hashKey -> { binPath, compileMs, lastUsed }
let stats = { hits: 0, misses: 0 };

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true, mode: 0o700 });
    }
    return true;
  } catch (_) {
    return false;
  }
}

function makeCompileKey(language, normalizedSource, compilerFlags) {
  return crypto
    .createHash('sha256')
    .update(`${language}|${process.platform}|${compilerFlags}|${normalizedSource}`)
    .digest('hex')
    .slice(0, 32);
}

function getCachedBinary(key, destExePath) {
  const entry = indexMap.get(key);
  if (!entry || !fs.existsSync(entry.binPath)) {
    if (entry) indexMap.delete(key);
    stats.misses++;
    return null;
  }
  try {
    fs.copyFileSync(entry.binPath, destExePath);
    if (process.platform !== 'win32') {
      fs.chmodSync(destExePath, 0o700);
    }
    entry.lastUsed = Date.now();
    // Refresh insertion order for LRU
    indexMap.delete(key);
    indexMap.set(key, entry);
    stats.hits++;
    return { hit: true, origCompileMs: entry.compileMs };
  } catch (_) {
    stats.misses++;
    return null;
  }
}

function putCachedBinary(key, builtExePath, compileMs) {
  if (!ensureCacheDir() || !fs.existsSync(builtExePath)) return false;
  try {
    while (indexMap.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = indexMap.keys().next().value;
      const oldest = indexMap.get(oldestKey);
      indexMap.delete(oldestKey);
      if (oldest && oldest.binPath && fs.existsSync(oldest.binPath)) {
        try { fs.unlinkSync(oldest.binPath); } catch (_) {}
      }
    }
    const ext = process.platform === 'win32' ? '.exe' : '.bin';
    const cachePath = path.join(CACHE_DIR, `${key}${ext}`);
    fs.copyFileSync(builtExePath, cachePath);
    if (process.platform !== 'win32') {
      fs.chmodSync(cachePath, 0o700);
    }
    indexMap.set(key, { binPath: cachePath, compileMs: Number(compileMs) || 0, lastUsed: Date.now() });
    return true;
  } catch (_) {
    return false;
  }
}

function getCacheStats() {
  return {
    hits: stats.hits,
    misses: stats.misses,
    entries: indexMap.size,
    maxEntries: MAX_CACHE_ENTRIES
  };
}

function clearCompileCache() {
  for (const entry of indexMap.values()) {
    try {
      if (entry.binPath && fs.existsSync(entry.binPath)) fs.unlinkSync(entry.binPath);
    } catch (_) {}
  }
  indexMap.clear();
  stats = { hits: 0, misses: 0 };
  return getCacheStats();
}

module.exports = {
  makeCompileKey,
  getCachedBinary,
  putCachedBinary,
  getCacheStats,
  clearCompileCache
};
