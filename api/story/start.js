/**
 * POST /api/story/start
 * Body: { "wordPack": [...], "difficulty": "elementary"|"intermediate"|"advanced" }
 * 返回: { "jobId": "job_xxx" }
 */

const { setJob } = require('../_lib/jobStore');

function generateJobId() {
  return 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const wordPack = Array.isArray(body.wordPack) ? body.wordPack : [];
  const difficulty = (body.difficulty || 'intermediate').toLowerCase();
  if (!['elementary', 'intermediate', 'advanced'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty' });
  }

  const jobId = generateJobId();
  await setJob(jobId, {
    status: 'pending',
    wordPack,
    difficulty
  });

  return res.status(200).json({ jobId });
};
