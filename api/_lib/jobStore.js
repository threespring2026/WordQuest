/**
 * 故事生成任务存储（按 jobId 存 Blob：wordquest/story_jobs/{jobId}.json）
 * 无 BLOB_READ_WRITE_TOKEN 时用内存，多实例不共享。
 */

const PREFIX = 'wordquest/story_jobs/';

const memoryJobs = {};

async function getJobBlob(jobId) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const path = PREFIX + jobId + '.json';
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(path, { access: 'private', token });
    if (!result || !result.stream) return null;
    const chunks = [];
    const reader = result.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    return JSON.parse(text || '{}');
  } catch (e) {
    if (e.name === 'BlobNotFoundError' || (e.message && String(e.message).includes('not found'))) return null;
    throw e;
  }
}

async function setJobBlob(jobId, data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  const path = PREFIX + jobId + '.json';
  const { put } = await import('@vercel/blob');
  await put(path, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token
  });
  return true;
}

async function getJob(jobId) {
  if (!jobId) return null;
  const fromBlob = await getJobBlob(jobId);
  if (fromBlob !== null) return fromBlob;
  return memoryJobs[jobId] || null;
}

async function setJob(jobId, data) {
  if (!jobId) return;
  memoryJobs[jobId] = data;
  await setJobBlob(jobId, data);
}

module.exports = { getJob, setJob };
