/**
 * 用户数据存储
 * 有 BLOB_READ_WRITE_TOKEN 时使用 Vercel Blob 持久化（wordquest/users.json）；
 * 否则使用内存存储（冷启动会清空）。
 */

const BLOB_PATH = 'wordquest/users.json';

let memoryStore = {};

async function readFromBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: 'private', token });
    if (!result || !result.stream) return {};
    const chunks = [];
    const reader = result.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    const data = JSON.parse(text || '{}');
    return typeof data === 'object' && data !== null ? data : {};
  } catch (e) {
    if (e.name === 'BlobNotFoundError' || (e.code === 'BLOB_NOT_FOUND') || (e.message && String(e.message).includes('not found'))) return {};
    throw e;
  }
}

async function writeToBlob(users) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  const { put } = await import('@vercel/blob');
  const body = JSON.stringify(typeof users === 'object' && users !== null ? users : {});
  await put(BLOB_PATH, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token
  });
  return true;
}

async function getUsers() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const data = await readFromBlob();
    if (data !== null) return data;
  }
  return { ...memoryStore };
}

async function saveUsers(users) {
  const obj = typeof users === 'object' && users !== null ? users : {};
  memoryStore = obj;
  const written = await writeToBlob(obj);
  if (!written) return memoryStore;
  return memoryStore;
}

module.exports = { getUsers, saveUsers };
