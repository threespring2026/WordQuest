/**
 * GET    /api/users       - 管理员：获取用户列表（含在线数）
 * POST   /api/users       - 管理员：新增用户
 * DELETE /api/users?email= - 管理员：删除用户
 * PATCH  /api/users?email= - 管理员：修改用户（如 tier）
 */

const { getUsers, saveUsers } = require('./_lib/store');
const { getBearerToken, verifyAdminToken } = require('./_lib/auth');

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟内活跃视为在线

function getEmailFromQuery(req) {
  const q = req.query || {};
  const email = (q.email || '').trim();
  return email ? decodeURIComponent(email) : null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getBearerToken(req);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return res.status(401).json({ error: '请先登录管理后台' });
  }

  const pathEmail = getEmailFromQuery(req);

  if (req.method === 'GET' && !pathEmail) {
    const users = await getUsers();
    const list = [];
    let onlineCount = 0;
    const now = Date.now();
    for (const email of Object.keys(users)) {
      const u = users[email];
      if (!u || u.isGuest) continue;
      const lastActivity = u.lastActivity ? parseInt(u.lastActivity, 10) : 0;
      if (lastActivity && now - lastActivity < ONLINE_THRESHOLD_MS) onlineCount++;
      list.push({
        email: u.email,
        id: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        tier: u.tier || 'free',
        gamesRemaining: u.gamesRemaining,
        createdAt: u.createdAt,
        lastActivity: u.lastActivity,
        online: lastActivity && now - lastActivity < ONLINE_THRESHOLD_MS
      });
    }
    return res.status(200).json({ users: list, onlineCount });
  }

  if ((req.method === 'DELETE' || req.method === 'PATCH') && pathEmail) {
    const users = await getUsers();
    const user = users[pathEmail];
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (req.method === 'DELETE') {
      delete users[pathEmail];
      await saveUsers(users);
      return res.status(200).json({ ok: true });
    }
    let body;
    try {
      body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (body.tier === 'vip' || body.tier === 'free') {
      user.tier = body.tier;
      user.gamesRemaining = body.tier === 'vip' ? 999 : (user.gamesRemaining || 3);
    }
    if (body.nickname !== undefined) user.nickname = String(body.nickname).trim() || user.nickname;
    users[pathEmail] = user;
    await saveUsers(users);
    const { password: _, ...safe } = user;
    return res.status(200).json({ user: safe });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const nickname = (body.nickname || '').trim() || '用户_' + Date.now();
    const tier = (body.tier === 'vip' ? 'vip' : 'free');

    if (!email) return res.status(400).json({ error: '请填写邮箱' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });

    const users = await getUsers();
    if (users[email]) return res.status(400).json({ error: '该邮箱已存在' });

    const user = {
      id: 'user_' + Date.now(),
      email,
      password,
      nickname,
      avatar: body.avatar || 'boy',
      tier,
      gamesRemaining: tier === 'vip' ? 999 : 3,
      createdAt: new Date().toISOString(),
      checkinDays: [],
      lastActivity: null
    };
    users[email] = user;
    await saveUsers(users);

    const { password: _, ...safe } = user;
    return res.status(200).json({ user: safe });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
