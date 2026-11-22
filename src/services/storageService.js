/**
 * NRG ENGINE 2.0 — PROJECT & WORKSPACE STORAGE SERVICE
 * Multi-layer persistence using IndexedDB with LocalStorage fallback & zero-data-loss migration.
 */

const DB_NAME = 'nrg_engine_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_SNIPPETS = 'snippets';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SNIPPETS)) {
        db.createObjectStore(STORE_SNIPPETS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null); // Fallback to localStorage on error
  });
}

// Initial seed projects
export const DEFAULT_PROJECTS = [
  {
    id: 'p1',
    name: 'nrg-kernel-c',
    lang: 'c',
    file: 'main.c',
    filesCount: 3,
    updated: '2 hours ago',
    timestamp: Date.now() - 7200000,
    code: `#include <stdio.h>\n\nint main() {\n    printf("NRG Kernel C Initialized.\\n");\n    return 0;\n}`
  },
  {
    id: 'p2',
    name: 'python-algo-ml',
    lang: 'python',
    file: 'main.py',
    filesCount: 4,
    updated: 'Yesterday',
    timestamp: Date.now() - 86400000,
    code: `def matrix_multiply(a, b):\n    return [[sum(x * y for x, y in zip(row, col)) for col in zip(*b)] for row in a]\n\nA = [[1, 2], [3, 4]]\nB = [[5, 6], [7, 8]]\nprint("Result:", matrix_multiply(A, B))`
  },
  {
    id: 'p3',
    name: 'rust-crypto-cli',
    lang: 'rust',
    file: 'main.rs',
    filesCount: 2,
    updated: '3 days ago',
    timestamp: Date.now() - 259200000,
    code: `fn main() {\n    println!("Rust High-Performance Crypto CLI Ready.");\n}`
  },
  {
    id: 'p4',
    name: 'web-canvas-engine',
    lang: 'javascript',
    file: 'script.js',
    filesCount: 5,
    updated: '5 days ago',
    timestamp: Date.now() - 432000000,
    code: `console.log("Web Canvas Engine Active.");`
  }
];

export const DEFAULT_SNIPPETS = [
  {
    id: 's1',
    title: 'Fast I/O & Competitive Setup',
    lang: 'c',
    tags: ['io', 'dsa'],
    code: `#include <stdio.h>\n\nvoid fast_io() {\n    setvbuf(stdin, NULL, _IONBF, 0);\n}`
  },
  {
    id: 's2',
    title: 'Binary Search with Boundary Clamp',
    lang: 'cpp',
    tags: ['binary-search', 'algo'],
    code: `int binarySearch(int arr[], int l, int r, int x) {\n    while (l <= r) {\n        int m = l + (r - l) / 2;\n        if (arr[m] == x) return m;\n        if (arr[m] < x) l = m + 1;\n        else r = m - 1;\n    }\n    return -1;\n}`
  },
  {
    id: 's3',
    title: 'Async Timing Benchmark Decorator',
    lang: 'python',
    tags: ['decorator', 'profiler'],
    code: `import time\n\ndef benchmark(func):\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        val = func(*args, **kwargs)\n        print(f"{func.__name__} took {time.perf_counter() - start:.6f}s")\n        return val\n    return wrapper`
  }
];

export async function loadProjects() {
  // Check localStorage first for seamless backwards compatibility
  let localData = null;
  try {
    const raw = localStorage.getItem('nrg_projects');
    if (raw) localData = JSON.parse(raw);
  } catch (e) {}

  if (localData && Array.isArray(localData) && localData.length > 0) {
    return localData;
  }

  // Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const all = await new Promise(res => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => res([]);
      });
      if (all && all.length > 0) return all;
    }
  } catch (e) {}

  // Fallback to default projects and save
  saveProjects(DEFAULT_PROJECTS);
  return DEFAULT_PROJECTS;
}

export async function saveProjects(projects) {
  try {
    localStorage.setItem('nrg_projects', JSON.stringify(projects));
  } catch (e) {}

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.clear();
      projects.forEach(p => store.put(p));
    }
  } catch (e) {}
}

export async function loadSnippets() {
  try {
    const raw = localStorage.getItem('nrg_snippets');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveSnippets(DEFAULT_SNIPPETS);
  return DEFAULT_SNIPPETS;
}

export async function saveSnippets(snippets) {
  try {
    localStorage.setItem('nrg_snippets', JSON.stringify(snippets));
  } catch (e) {}
}

export function loadWorkspaceState() {
  try {
    const raw = localStorage.getItem('nrg_workspace_state');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    activeProjectId: 'p1',
    activeProjectName: 'nrg-kernel-c',
    activeFileName: 'main.c',
    activeLang: 'c',
    lastModifiedTime: Date.now() - 7200000,
    lastOpenedTime: Date.now()
  };
}

export function saveWorkspaceState(state) {
  try {
    localStorage.setItem('nrg_workspace_state', JSON.stringify(state));
  } catch (e) {}
}

export function loadRecentActivities() {
  try {
    const raw = localStorage.getItem('nrg_recent_activities');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { dotClass: '', icon: '✏️', text: 'Edited main.c in nrg-kernel-c', timestamp: Date.now() - 7200000 },
    { dotClass: 'dot-green', icon: '▶', text: 'Executed python-algo-ml', timestamp: Date.now() - 86400000 },
    { dotClass: 'dot-cyan', icon: '+', text: 'Created project rust-crypto-cli', timestamp: Date.now() - 259200000 },
    { dotClass: '', icon: '📁', text: 'Opened Graphics Workspace', timestamp: Date.now() - 259200000 }
  ];
}

export function recordActivity(type, text) {
  const current = loadRecentActivities();
  let icon = '✏️';
  let dotClass = '';
  if (type === 'run') { icon = '▶'; dotClass = 'dot-green'; }
  else if (type === 'create') { icon = '+'; dotClass = 'dot-cyan'; }
  else if (type === 'error') { icon = '✕'; dotClass = 'dot-red'; }
  else if (type === 'open') { icon = '📁'; dotClass = ''; }

  const newEntry = { dotClass, icon, text, timestamp: Date.now() };
  const updated = [newEntry, ...current.slice(0, 7)];
  try {
    localStorage.setItem('nrg_recent_activities', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function formatTimeAgo(ts) {
  if (!ts) return 'Just now';
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
