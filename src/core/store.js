/**
 * Store - 全局状态管理
 * 响应式数据存储，支持订阅变化
 */

const Store = (function() {
  const STORAGE_KEY = 'wordquest_state';
  
  // 默认状态
  const defaultState = {
    // 用户信息
    user: null,
    isLoggedIn: false,
    
    // 当前游戏会话
    session: {
      wordPack: [],
      storyConfig: null,
      currentRound: 0,
      errorCount: 0,
      startTime: null,
      answers: []
    },
    
    // UI 状态
    ui: {
      currentScene: 'auth',
      bgmEnabled: true,
      sfxEnabled: true,
      loading: false
    },
    
    // 设置
    settings: {
      useMockAI: false,  // false = 使用真实 AI，true = 使用 Mock 数据
      language: 'zh-CN'
    }
  };

  // 当前状态
  let state = JSON.parse(JSON.stringify(defaultState));
  
  // 订阅者
  const subscribers = {};

  // 从 localStorage 恢复状态
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 只恢复持久化数据（用户信息、设置）
        if (parsed.user) state.user = parsed.user;
        if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
        state.isLoggedIn = !!parsed.user;
      }
      // 强制使用真实 AI（覆盖旧的 localStorage 设置）
      state.settings.useMockAI = false;
    } catch (e) {
      console.warn('Store: Failed to load from localStorage', e);
    }
  }

  // 保存到 localStorage
  function saveToStorage() {
    try {
      const toSave = {
        user: state.user,
        settings: state.settings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Store: Failed to save to localStorage', e);
    }
  }

  // 通知订阅者
  function notifySubscribers(path) {
    const parts = path.split('.');
    let currentPath = '';
    
    parts.forEach(part => {
      currentPath = currentPath ? `${currentPath}.${part}` : part;
      if (subscribers[currentPath]) {
        const value = getValueByPath(state, currentPath);
        subscribers[currentPath].forEach(cb => cb(value, currentPath));
      }
    });
    
    // 通知根订阅者
    if (subscribers['*']) {
      subscribers['*'].forEach(cb => cb(state, path));
    }
  }

  // 根据路径获取值
  function getValueByPath(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
  }

  // 根据路径设置值
  function setValueByPath(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, k) => {
      if (o[k] === undefined) o[k] = {};
      return o[k];
    }, obj);
    target[last] = value;
  }

  // 初始化
  loadFromStorage();

  return {
    /**
     * 获取状态值
     * @param {string} path - 状态路径，如 'user.nickname'
     * @returns {*} 状态值
     */
    get(path) {
      if (!path) return JSON.parse(JSON.stringify(state));
      return getValueByPath(state, path);
    },

    /**
     * 设置状态值
     * @param {string} path - 状态路径
     * @param {*} value - 新值
     */
    set(path, value) {
      setValueByPath(state, path, value);
      notifySubscribers(path);
      
      // 持久化关键数据
      if (path.startsWith('user') || path.startsWith('settings')) {
        saveToStorage();
      }
    },

    /**
     * 订阅状态变化
     * @param {string} path - 状态路径，'*' 表示监听所有变化
     * @param {Function} callback - 回调函数 (newValue, path)
     * @returns {Function} 取消订阅函数
     */
    subscribe(path, callback) {
      if (!subscribers[path]) {
        subscribers[path] = [];
      }
      subscribers[path].push(callback);
      
      return () => {
        subscribers[path] = subscribers[path].filter(cb => cb !== callback);
      };
    },

    /**
     * 重置游戏会话
     */
    resetSession() {
      state.session = JSON.parse(JSON.stringify(defaultState.session));
      notifySubscribers('session');
    },

    /**
     * 重置所有状态
     */
    reset() {
      state = JSON.parse(JSON.stringify(defaultState));
      localStorage.removeItem(STORAGE_KEY);
      notifySubscribers('*');
    },

    /**
     * 批量更新
     * @param {Object} updates - { path: value, ... }
     */
    batch(updates) {
      Object.entries(updates).forEach(([path, value]) => {
        setValueByPath(state, path, value);
      });
      Object.keys(updates).forEach(path => notifySubscribers(path));
      saveToStorage();
    }
  };
})();
