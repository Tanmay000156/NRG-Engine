/**
 * NRG ENGINE — VERCEL SERVERLESS FUNCTION: /api/git-branch
 * Returns git branch state for the Home Dashboard Workspace Snapshot.
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ available: true, branch }));
};
