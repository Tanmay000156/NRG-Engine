/**
 * NRG ENGINE 2.0 — COMPILER & EXECUTION SERVICE
 * Handles communication with the isolated Judge0 backend & universal graphics stream.
 */

export async function executeCode(language, sourceCode, stdin = '') {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language,
        source_code: sourceCode,
        stdin: stdin
      })
    });

    const data = await response.json();
    return {
      status: response.status,
      data
    };
  } catch (err) {
    return {
      status: 503,
      data: {
        success: false,
        status: { id: 13, description: 'Service Unavailable' },
        error: `Execution service unavailable. Please try again later. (${err.message})`,
        backend_error: true
      }
    };
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { status: 'offline' };
    return await res.json();
  } catch (e) {
    return { status: 'offline' };
  }
}

export async function getGitBranch() {
  try {
    const res = await fetch('/api/git-branch');
    if (!res.ok) return { available: false, branch: 'main' };
    return await res.json();
  } catch (e) {
    return { available: false, branch: 'main' };
  }
}

export async function getSupportedLanguages() {
  try {
    const res = await fetch('/api/languages');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

/**
 * Standardizes Judge0 status codes into consistent NRG Engine execution states
 */
export function getStatusBadge(statusId) {
  switch (statusId) {
    case 1:
      return { label: 'In Queue', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    case 2:
      return { label: 'Processing', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    case 3:
      return { label: 'Accepted', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    case 4:
      return { label: 'Wrong Answer', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    case 5:
      return { label: 'Time Limit Exceeded', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
    case 6:
      return { label: 'Compilation Error', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return { label: 'Runtime Error', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    case 13:
      return { label: 'Service Unavailable', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };
    case 14:
      return { label: 'Rate Limited', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    default:
      return { label: 'Not Executed', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' };
  }
}
