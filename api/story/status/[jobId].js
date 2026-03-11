/**
 * GET /api/story/status/:jobId
 * 返回: { status: "pending"|"running"|"ready"|"error", synopsis?, storyConfig?, error? }
 * 若为 pending，本请求内执行 AI 并写回结果后返回。
 */

const { getJob, setJob } = require('../../_lib/jobStore');
const { runStoryJob } = require('../../_lib/ai');

const RUNNING_TIMEOUT_MS = 2 * 60 * 1000;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let jobId = req.query && req.query.jobId;
  if (!jobId && req.url) {
    const m = req.url.match(/\/api\/story\/status\/([^/?#]+)/);
    if (m) jobId = m[1];
  }
  if (!jobId) {
    return res.status(400).json({ error: 'Missing jobId' });
  }

  let job = await getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status === 'running') {
    const startedAt = job.startedAt ? parseInt(job.startedAt, 10) : 0;
    if (Date.now() - startedAt > RUNNING_TIMEOUT_MS) {
      await setJob(jobId, { ...job, status: 'pending' });
      job = await getJob(jobId);
    }
  }

  if (job.status === 'ready') {
    return res.status(200).json({
      status: 'ready',
      synopsis: job.synopsis,
      storyConfig: job.storyConfig
    });
  }

  if (job.status === 'error') {
    return res.status(200).json({ status: 'error', error: job.error });
  }

  if (job.status === 'pending') {
    await setJob(jobId, {
      ...job,
      status: 'running',
      startedAt: Date.now()
    });
    await runStoryJob(jobId, {
      wordPack: job.wordPack || [],
      difficulty: job.difficulty || 'intermediate'
    });
    job = await getJob(jobId);
  }

  if (job.status === 'ready') {
    return res.status(200).json({
      status: 'ready',
      synopsis: job.synopsis,
      storyConfig: job.storyConfig
    });
  }
  if (job.status === 'error') {
    return res.status(200).json({ status: 'error', error: job.error });
  }

  return res.status(200).json({ status: job.status || 'pending' });
};
