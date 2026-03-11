/**
 * POST /api/auth/register
 * Body: { "email": "...", "password": "...", "nickname": "...", "avatar": "boy"|"girl" }
 * 返回: { "user": { id, email, nickname, ... } } 或 400
 */

const { getUsers, saveUsers } = require('../_lib/store');

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
  const nickname = (body.nickname || '').trim() || '用户_' + Date.now();
  const avatar = (body.avatar === 'girl' ? 'girl' : 'boy');

  if (!email) return res.status(400).json({ error: '请填写邮箱' });
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

  const users = await getUsers();
  if (users[email]) {
    return res.status(400).json({ error: '该邮箱已被注册' });
  }

  const user = {
    id: 'user_' + Date.now(),
    email,
    password,
    nickname,
    avatar,
    tier: 'free',
    gamesRemaining: 3,
    createdAt: new Date().toISOString(),
    checkinDays: [],
    lastActivity: null
  };
  users[email] = user;
  await saveUsers(users);

  const { password: _, ...safe } = user;
  return res.status(200).json({ user: safe });
};
