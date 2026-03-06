#!/usr/bin/env node
/**
 * 构建时注入 API Key 到 ai.env.js
 * 在 Vercel 中设置环境变量 WORDQUEST_API_KEY，部署时会自动写入
 */
const fs = require('fs');
const path = require('path');

const key = process.env.WORDQUEST_API_KEY || '';
const outPath = path.join(__dirname, '..', 'src', 'config', 'ai.env.js');
const content = `/**
 * AI API Key（由构建时注入，勿提交真实 Key）
 * 本地开发：可留空，或在 Vercel 部署时设置环境变量 WORDQUEST_API_KEY
 */
window.WORDQUEST_API_KEY = ${JSON.stringify(key)};
`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('inject-env: wrote ai.env.js (key length:', key ? key.length : 0, ')');
