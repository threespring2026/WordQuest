/**
 * POST /api/admin-login
 * Body: { "password": "..." }
 * 返回: { "token": "..." } 或 401
 */

const { createAdminToken } = require('./_lib/auth');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  const password = (body.password || '').trim();
  if (!password) {
    return res.status(400).json({ error: '请填写密码' });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }

  const token = createAdminToken();
  return res.status(200).json({ token });
};
