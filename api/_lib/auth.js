/**
 * 管理员与用户 Token 签发与校验
 * 使用 HMAC-SHA256 签名，无外部依赖
 */

const crypto = require('crypto');

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'wordquest-admin-secret-change-in-prod';
const USER_SECRET = process.env.USER_JWT_SECRET || 'wordquest-user-secret-change-in-prod';
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

function sign(payload, secret) {
  const payloadStr = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadStr);
  const sig = hmac.digest('hex');
  return Buffer.from(JSON.stringify({ p: payloadStr, s: sig })).toString('base64url');
}

function verify(token, secret) {
  if (!token || typeof token !== 'string') return null;
  try {
    const raw = JSON.parse(Buffer.from(token, 'base64url').toString());
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(raw.p);
    if (hmac.digest('hex') !== raw.s) return null;
    const payload = JSON.parse(raw.p);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function createAdminToken() {
  return sign({ admin: true, exp: Date.now() + TOKEN_TTL_MS }, ADMIN_SECRET);
}

function verifyAdminToken(token) {
  const payload = verify(token, ADMIN_SECRET);
  return payload && payload.admin === true ? payload : null;
}

function createUserToken(userId, email) {
  return sign({ userId, email, exp: Date.now() + TOKEN_TTL_MS }, USER_SECRET);
}

function verifyUserToken(token) {
  return verify(token, USER_SECRET);
}

function getBearerToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || typeof auth !== 'string') return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

module.exports = {
  createAdminToken,
  verifyAdminToken,
  createUserToken,
  verifyUserToken,
  getBearerToken
};
