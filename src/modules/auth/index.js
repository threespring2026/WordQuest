/**
 * 模块一：登录注册
 * 中文界面，支持形象选择
 */

const AuthModule = (function() {
  let container = null;
  let currentTab = 'login';
  let selectedAvatar = 'boy';

  // 生成最近7天的日期
  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }

  // 渲染页面
  function render() {
    const user = Store.get('user');
    const isLoggedIn = Store.get('isLoggedIn');

    if (isLoggedIn && user) {
      renderProfileView(user);
    } else {
      renderAuthForm();
    }
  }

  // 渲染登录/注册表单
  function renderAuthForm() {
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">WORDQUEST</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <!-- 玩家预览 -->
        <div class="card mb-4">
          <div class="flex items-center justify-center gap-4 py-2">
            <div class="avatar-preview">
              <img id="avatar-preview-img" src="assets/player/player_boy.png" 
                   alt="Avatar" class="w-20 h-20 object-contain">
            </div>
            <div class="text-center">
              <div class="text-gray-500 text-sm">当前身份</div>
              <div class="font-bold text-lg text-gray-800">游客</div>
            </div>
          </div>
        </div>
        
        <!-- 登录表单 -->
        <div id="login-form" class="${currentTab === 'login' ? '' : 'hidden'}">
          <div class="input-group">
            <span class="input-icon">📧</span>
            <input type="email" id="login-email" class="input-field" placeholder="邮箱">
          </div>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="login-password" class="input-field" placeholder="密码">
          </div>
          
          <button id="btn-login" class="btn-3d btn-green w-full mb-3">登 录</button>
          <button id="btn-show-register" class="btn-3d btn-blue w-full mb-3">注册新账号</button>
        </div>
        
        <!-- 注册表单 -->
        <div id="register-form" class="${currentTab === 'register' ? '' : 'hidden'}">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input type="text" id="reg-nickname" class="input-field" placeholder="昵称（2-10个字符）">
          </div>
          <div class="input-group">
            <span class="input-icon">📧</span>
            <input type="email" id="reg-email" class="input-field" placeholder="邮箱">
          </div>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="reg-password" class="input-field" placeholder="密码（至少6位）">
          </div>
          
          <!-- 形象选择 -->
          <div class="mb-4">
            <div class="text-gray-600 text-sm mb-2 text-center">选择你的形象</div>
            <div class="flex justify-center gap-4">
              <div class="avatar-option ${selectedAvatar === 'boy' ? 'selected' : ''}" data-avatar="boy">
                <img src="assets/player/player_boy.png" alt="男孩" class="w-16 h-16 object-contain">
                <span class="text-xs text-gray-600">男孩</span>
              </div>
              <div class="avatar-option ${selectedAvatar === 'girl' ? 'selected' : ''}" data-avatar="girl">
                <img src="assets/player/player_girl.png" alt="女孩" class="w-16 h-16 object-contain">
                <span class="text-xs text-gray-600">女孩</span>
              </div>
            </div>
          </div>
          
          <button id="btn-register" class="btn-3d btn-green w-full mb-3">创建账号</button>
          <button id="btn-show-login" class="btn-3d btn-gray w-full mb-3">返回登录</button>
        </div>
        
        <!-- 游客入口 -->
        <div class="text-center mt-4">
          <button id="btn-guest" class="btn-3d btn-yellow w-full">
            🎮 游客体验（免费1次）
          </button>
        </div>
      </div>
    `;

    bindAuthEvents();
  }

  // 渲染已登录的用户资料
  function renderProfileView(user) {
    const checkinDays = user.checkinDays || [];
    const last7Days = getLast7Days();
    const avatarImg = user.avatar === 'girl' ? 'assets/player/player_girl.png' : 'assets/player/player_boy.png';
    
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">WORDQUEST</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <!-- 用户资料卡片 -->
        <div class="card mb-4">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 flex-shrink-0">
              ${user.isGuest 
                ? '<div class="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-3xl">👤</div>'
                : `<img src="${avatarImg}" alt="Avatar" class="w-full h-full object-contain">`
              }
            </div>
            <div class="flex-1">
              <div class="font-bold text-gray-800 text-lg">${user.nickname || '游客'}</div>
              <div class="text-gray-500 text-sm">${user.email || '未注册'}</div>
              <div class="mt-1">
                <span class="text-xs px-2 py-1 rounded ${user.tier === 'vip' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}">
                  ${user.tier === 'vip' ? '👑 VIP会员' : user.isGuest ? '🎮 游客' : '🆓 免费用户'}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 剩余游戏次数 -->
          <div class="mt-3 p-2 bg-blue-50 rounded-lg flex justify-between items-center">
            <span class="text-gray-600 text-sm">剩余游戏次数</span>
            <span class="font-bold text-blue-600 text-xl">${user.tier === 'vip' ? '∞' : user.gamesRemaining}</span>
          </div>
          
          <!-- 精简打卡日历 -->
          <div class="mt-3 flex justify-between items-center">
            <span class="text-gray-500 text-xs">本周打卡</span>
            <div class="flex gap-1">
              ${last7Days.map(day => `
                <div class="w-5 h-5 rounded text-xs flex items-center justify-center
                  ${checkinDays.includes(day) ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}">
                  ${checkinDays.includes(day) ? '★' : '·'}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- 开始游戏按钮 -->
        <button id="btn-start-game" class="btn-3d btn-green w-full mb-3 text-lg py-4" 
          ${user.gamesRemaining <= 0 && user.tier !== 'vip' ? 'disabled' : ''}>
          🎮 开始冒险
        </button>
        
        ${user.gamesRemaining <= 0 && user.tier !== 'vip' ? `
          <div class="text-center text-red-500 text-sm mb-3">
            今日次数已用完，明天再来吧~
          </div>
        ` : ''}
        
        <!-- 退出登录 -->
        <button id="btn-logout" class="btn-3d btn-gray w-full">
          退出登录
        </button>
      </div>
      
      ${user.tier !== 'vip' && !user.isGuest ? `
      <div class="p-4 bg-purple-50">
        <button id="btn-upgrade" class="btn-3d btn-yellow w-full flex items-center justify-center gap-2">
          <span>👑</span>
          <span>升级VIP会员</span>
        </button>
      </div>
      ` : ''}
    `;

    bindProfileEvents(user);
  }

  // 绑定登录/注册事件
  function bindAuthEvents() {
    // 形象选择
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        selectedAvatar = opt.dataset.avatar;
        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        // 更新预览
        const previewImg = document.getElementById('avatar-preview-img');
        if (previewImg) {
          previewImg.src = `assets/player/player_${selectedAvatar}.png`;
        }
      });
    });

    // 登录
    document.getElementById('btn-login')?.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      
      if (!email || !password) {
        UI.showToast('请填写完整信息', 'error');
        return;
      }
      
      try {
        UI.showLoading('登录中...');
        const user = await API.login(email, password);
        UI.hideLoading();
        EventBus.emit(Events.USER_LOGIN, user);
      } catch (error) {
        UI.hideLoading();
        UI.showToast(error.message, 'error');
      }
    });

    // 显示注册表单
    document.getElementById('btn-show-register')?.addEventListener('click', () => {
      currentTab = 'register';
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('register-form').classList.remove('hidden');
    });

    // 显示登录表单
    document.getElementById('btn-show-login')?.addEventListener('click', () => {
      currentTab = 'login';
      document.getElementById('register-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    });

    // 注册
    document.getElementById('btn-register')?.addEventListener('click', async () => {
      const nickname = document.getElementById('reg-nickname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      
      if (!nickname || nickname.length < 2 || nickname.length > 10) {
        UI.showToast('昵称需要2-10个字符', 'error');
        return;
      }
      
      if (!email) {
        UI.showToast('请输入邮箱', 'error');
        return;
      }
      
      if (password.length < 6) {
        UI.showToast('密码至少需要6位', 'error');
        return;
      }
      
      try {
        UI.showLoading('创建账号中...');
        const user = await API.register(email, password, nickname, selectedAvatar);
        UI.hideLoading();
        UI.showToast('注册成功！', 'success');
        EventBus.emit(Events.USER_LOGIN, user);
      } catch (error) {
        UI.hideLoading();
        UI.showToast(error.message, 'error');
      }
    });

    // 游客登录
    document.getElementById('btn-guest')?.addEventListener('click', async () => {
      try {
        UI.showLoading('准备中...');
        const user = await API.guestLogin();
        UI.hideLoading();
        EventBus.emit(Events.USER_LOGIN, user);
      } catch (error) {
        UI.hideLoading();
        UI.showToast(error.message, 'error');
      }
    });
  }

  // 绑定用户资料页事件
  function bindProfileEvents(user) {
    // 开始游戏
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      if (user.gamesRemaining <= 0 && user.tier !== 'vip') {
        UI.showToast('今日次数已用完', 'error');
        return;
      }
      
      // 进入词库
      Router.go('wordbook');
    });

    // 退出登录
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      const confirmed = await UI.confirm('确定要退出登录吗？');
      if (confirmed) {
        EventBus.emit(Events.USER_LOGOUT);
      }
    });

    // VIP 升级
    document.getElementById('btn-upgrade')?.addEventListener('click', () => {
      UI.showToast('VIP功能即将上线', 'info');
    });
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      currentTab = 'login';
      selectedAvatar = 'boy';
      render();
      
      Store.subscribe('user', () => {
        if (Store.get('ui.currentScene') === 'auth') {
          render();
        }
      });
      
      EventBus.emit(Events.SCENE_READY, { scene: 'auth' });
    },

    unmount() {
      container = null;
    }
  };
})();
