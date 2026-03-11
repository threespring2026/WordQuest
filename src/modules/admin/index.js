/**
 * 管理后台模块
 * 入口：URL #admin，需密码进入。管理用户列表、在线数、增删用户、调整等级，预留扩展区。
 */

const ADMIN_TOKEN_KEY = 'wordquest_admin_token';

function getAdminToken() {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setAdminToken(token) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (_) {}
}

const AdminModule = (function() {
  let container = null;
  let token = null;
  let users = [];
  let onlineCount = 0;
  let loading = false;
  let message = '';
  /** 添加用户后的提示（重绘后仍显示） */
  let addUserMessage = '';
  let addUserMessageType = ''; // 'success' | 'error'

  function renderPasswordGate() {
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">管理后台</span>
      </div>
      <div class="flex-1 overflow-y-auto px-4 pb-4 flex flex-col items-center justify-center min-h-[200px]">
        <div class="card w-full max-w-sm">
          <p class="text-gray-600 text-sm mb-3">请输入管理员密码进入</p>
          <input type="password" id="admin-password" class="input-field w-full mb-3" placeholder="密码" autocomplete="current-password">
          <p id="admin-gate-error" class="text-red-500 text-sm mb-2 hidden"></p>
          <button id="admin-gate-submit" class="btn-3d btn-green w-full">进入</button>
        </div>
        <a href="#" id="admin-back-home" class="text-gray-500 text-sm mt-4">返回首页</a>
      </div>
    `;
    document.getElementById('admin-gate-submit').addEventListener('click', async () => {
      const input = document.getElementById('admin-password');
      const errEl = document.getElementById('admin-gate-error');
      const pwd = (input && input.value || '').trim();
      if (!pwd) {
        errEl.textContent = '请输入密码';
        errEl.classList.remove('hidden');
        return;
      }
      errEl.classList.add('hidden');
      try {
        const data = await API.adminLogin(pwd);
        if (data.token) {
          setAdminToken(data.token);
          token = data.token;
          await loadUsers();
          renderMain();
        }
      } catch (e) {
        errEl.textContent = e.message || '登录失败';
        errEl.classList.remove('hidden');
      }
    });
    const back = document.getElementById('admin-back-home');
    if (back) back.addEventListener('click', (e) => { e.preventDefault(); location.hash = ''; location.reload(); });
  }

  async function loadUsers() {
    if (!token) return;
    loading = true;
    message = '';
    try {
      const data = await API.adminGetUsers(token);
      users = data.users || [];
      onlineCount = data.onlineCount != null ? data.onlineCount : 0;
    } catch (e) {
      message = e.message || '加载失败';
      if (e.message && (e.message.includes('请先登录') || e.message.includes('401'))) {
        setAdminToken(null);
        token = null;
        renderPasswordGate();
        return;
      }
    } finally {
      loading = false;
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderMain() {
    container.innerHTML = `
      <div class="banner flex items-center justify-between px-2">
        <span class="banner-text pixel-font">管理后台</span>
        <div class="flex items-center gap-2">
          <span class="text-white text-sm">在线 <strong>${onlineCount}</strong> / ${users.length}</span>
          <button id="admin-refresh" class="text-white text-sm px-2 py-1 rounded border border-white/60">刷新</button>
          <button id="admin-logout" class="text-white text-sm px-2 py-1 rounded border border-white/60">退出</button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        ${message ? `<p class="text-red-500 text-sm mb-2">${message}</p>` : ''}
        
        <div class="card mb-4">
          <h3 class="font-bold text-gray-800 mb-2">添加用户</h3>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="email" id="admin-add-email" class="input-field" placeholder="邮箱">
            <input type="password" id="admin-add-password" class="input-field" placeholder="密码（至少6位）">
            <input type="text" id="admin-add-nickname" class="input-field" placeholder="昵称（可选）">
            <select id="admin-add-tier" class="input-field">
              <option value="free">普通</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <button id="admin-add-btn" class="btn-3d btn-green mt-2">添加</button>
          <p id="admin-add-msg" class="text-sm mt-1 ${addUserMessage ? '' : 'hidden'} ${addUserMessageType === 'success' ? 'text-green-600' : 'text-red-500'}">${addUserMessage ? escapeHtml(addUserMessage) : ''}</p>
        </div>

        <div class="card mb-4">
          <h3 class="font-bold text-gray-800 mb-2">用户列表</h3>
          ${loading ? '<p class="text-gray-500">加载中…</p>' : `
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left text-gray-600">
                  <th class="py-2 pr-2">邮箱</th>
                  <th class="py-2 pr-2">昵称</th>
                  <th class="py-2 pr-2">等级</th>
                  <th class="py-2 pr-2">在线</th>
                  <th class="py-2 pr-2">操作</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0 ? '<tr><td colspan="5" class="py-4 text-gray-500">暂无用户</td></tr>' : users.map(u => `
                <tr class="border-b border-gray-100">
                  <td class="py-2 pr-2">${escapeHtml(u.email)}</td>
                  <td class="py-2 pr-2">${escapeHtml(u.nickname || '-')}</td>
                  <td class="py-2 pr-2">${u.tier === 'vip' ? 'VIP' : '普通'}</td>
                  <td class="py-2 pr-2">${u.online ? '是' : '否'}</td>
                  <td class="py-2 pr-2">
                    <select class="admin-tier-select border rounded px-1 py-0.5 text-xs" data-email="${escapeHtml(u.email)}">
                      <option value="free" ${u.tier !== 'vip' ? 'selected' : ''}>普通</option>
                      <option value="vip" ${u.tier === 'vip' ? 'selected' : ''}>VIP</option>
                    </select>
                    <button class="admin-del-btn ml-1 text-red-600 text-xs" data-email="${escapeHtml(u.email)}">删除</button>
                  </td>
                </tr>
              `).join('')}
              </tbody>
            </table>
          </div>
          `}
        </div>

        <div class="card mb-4">
          <h3 class="font-bold text-gray-800 mb-2">更多功能（预留）</h3>
          <p class="text-gray-500 text-sm">后续将在此增加更多管理功能。</p>
        </div>
      </div>
    `;

    document.getElementById('admin-refresh').addEventListener('click', async () => {
      await loadUsers();
      renderMain();
    });
    document.getElementById('admin-logout').addEventListener('click', () => {
      setAdminToken(null);
      token = null;
      renderPasswordGate();
    });

    document.getElementById('admin-add-btn').addEventListener('click', async () => {
      const emailEl = document.getElementById('admin-add-email');
      const pwdEl = document.getElementById('admin-add-password');
      const nickEl = document.getElementById('admin-add-nickname');
      const tierEl = document.getElementById('admin-add-tier');
      const msgEl = document.getElementById('admin-add-msg');
      const email = (emailEl && emailEl.value || '').trim();
      const password = (pwdEl && pwdEl.value || '').trim();
      const nickname = (nickEl && nickEl.value || '').trim();
      const tier = (tierEl && tierEl.value) || 'free';
      if (!email) { addUserMessage = '请填写邮箱'; addUserMessageType = 'error'; renderMain(); return; }
      if (password.length < 6) { addUserMessage = '密码至少6位'; addUserMessageType = 'error'; renderMain(); return; }
      addUserMessage = '';
      try {
        await API.adminAddUser(token, { email, password, nickname: nickname || undefined, tier });
        addUserMessage = '添加成功';
        addUserMessageType = 'success';
        emailEl.value = ''; pwdEl.value = ''; nickEl.value = '';
        await loadUsers();
        renderMain();
      } catch (e) {
        addUserMessage = e.message || '添加失败';
        addUserMessageType = 'error';
        renderMain();
      }
    });

    container.querySelectorAll('.admin-tier-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const email = sel.getAttribute('data-email');
        const tier = sel.value;
        if (!email) return;
        try {
          await API.adminUpdateUser(token, email, { tier });
          await loadUsers();
          renderMain();
        } catch (e) {
          alert(e.message || '更新失败');
        }
      });
    });
    container.querySelectorAll('.admin-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.getAttribute('data-email');
        if (!email || !confirm('确定删除用户 ' + email + '？')) return;
        try {
          await API.adminDeleteUser(token, email);
          await loadUsers();
          renderMain();
        } catch (e) {
          alert(e.message || '删除失败');
        }
      });
    });

    addUserMessage = '';
    addUserMessageType = '';
  }

  return {
    mount() {
      container = document.getElementById('app');
      if (!container) return;
      token = getAdminToken();
      if (!token) {
        renderPasswordGate();
        return;
      }
      loadUsers().then(() => renderMain());
    },
    unmount() {
      container = null;
    }
  };
})();
