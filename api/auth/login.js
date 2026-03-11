/**
 * POST /api/auth/login
 * Body: { "email": "...", "password": "..." }
 * 返回: { "user": { id, email, nickname, avatar, tier, gamesRemaining, ... } } 或 401
 */

const { getUsers } = require('../_lib/store');

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

  const email = (body.email || '').trim().toLowerCase();
  const password = (body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: '请填写邮箱和密码' });
  }

  const users = await getUsers();
  const user = users[email];

  if (!user || user.isGuest) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const { password: _, ...safe } = user;
  return res.status(200).json({ user: safe });
};
