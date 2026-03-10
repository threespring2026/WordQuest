/**
 * API - 接口封装（本地模拟版本）
 * 所有需要服务端的功能都在这里模拟
 */

const API = (function() {
  // 模拟网络延迟
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /** 解析 Free Dictionary API 返回为统一格式（entries[].pronunciations, senses） */
  function parseFreeDictResponse(wordKey, data) {
    if (!data || typeof data !== 'object') return null;
    const entries = data.entries || (Array.isArray(data) ? data : [data]);
    const first = entries[0];
    if (!first) return null;
    let phonetic = '';
    if (first.pronunciations && first.pronunciations.length) {
      const p = first.pronunciations.find(x => x.text) || first.pronunciations[0];
      phonetic = (p && p.text) || '';
    }
    const partOfSpeech = first.partOfSpeech || '';
    const senses = first.senses || [];
    const def = senses[0];
    const definition = def && def.definition ? def.definition : '';
    const examples = [];
    if (def && Array.isArray(def.examples)) examples.push(...def.examples);
    senses.slice(0, 3).forEach(s => {
      if (s.examples && Array.isArray(s.examples)) examples.push(...s.examples);
    });
    return {
      word: wordKey,
      phonetic: phonetic,
      partOfSpeech: partOfSpeech,
      definition: definition || '（暂无释义）',
      examples: examples.length ? examples.slice(0, 5) : undefined
    };
  }

  function getPersistentWordCache(wordKey, cacheKey) {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      const key = wordKey.toLowerCase();
      return obj[key] ? obj[key].data : null;
    } catch { return null; }
  }

  function setPersistentWordCache(wordKey, data, cacheKey, maxSize) {
    try {
      const raw = localStorage.getItem(cacheKey);
      const obj = raw ? JSON.parse(raw) : {};
      const key = wordKey.toLowerCase();
      const keys = Object.keys(obj);
      if (keys.length >= maxSize && !obj[key]) {
        const oldest = keys.reduce((a, b) => obj[a].at < obj[b].at ? a : b);
        delete obj[oldest];
      }
      obj[key] = { data: { ...data }, at: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(obj));
    } catch (_) {}
  }

  function getMyWordbookSnapshot(wordKey) {
    try {
      const userId = (typeof Store !== 'undefined' && Store.get('user')) ? Store.get('user').id : 'guest';
      const saved = localStorage.getItem('wordquest_wordbook_' + userId);
      if (!saved) return null;
      const list = JSON.parse(saved);
      const found = list.find(w => (w.word || '').toLowerCase() === wordKey.toLowerCase());
      if (!found) return null;
      return {
        word: found.word,
        phonetic: found.phonetic || '',
        partOfSpeech: found.partOfSpeech || '',
        definition: found.definition || '（暂无释义）',
        examples: found.examples
      };
    } catch { return null; }
  }

  // 本地用户数据存储 key
  const USERS_KEY = 'wordquest_users';
  
  // 获取本地用户列表
  function getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  }
  
  // 保存本地用户列表
  function saveLocalUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  return {
    // ==================== 用户认证 ====================
    
    /**
     * 用户注册（本地模拟）
     * @param {string} email 
     * @param {string} password 
     * @param {string} nickname 
     * @param {string} avatar - 形象：boy | girl
     */
    async register(email, password, nickname, avatar = 'boy') {
      await delay(500);
      
      const users = getLocalUsers();
      
      if (users[email]) {
        throw new Error('该邮箱已被注册');
      }
      
      const user = {
        id: 'user_' + Date.now(),
        email,
        nickname: nickname || 'Player_' + Math.floor(Math.random() * 1000),
        avatar: avatar,
        tier: 'free',
        gamesRemaining: 3,
        createdAt: new Date().toISOString(),
        checkinDays: []
      };
      
      users[email] = { ...user, password };
      saveLocalUsers(users);
      
      // 不返回密码
      const { password: _, ...safeUser } = users[email];
      return safeUser;
    },

    /**
     * 用户登录（本地模拟）
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
      await delay(300);
      
      const users = getLocalUsers();
      const user = users[email];
      
      if (!user || user.password !== password) {
        throw new Error('邮箱或密码错误');
      }
      
      const { password: _, ...safeUser } = user;
      return safeUser;
    },

    /**
     * 游客登录
     */
    async guestLogin() {
      await delay(200);
      
      return {
        id: 'guest_' + Date.now(),
        nickname: 'Guest_' + Math.floor(Math.random() * 1000),
        tier: 'guest',
        gamesRemaining: 1,
        isGuest: true
      };
    },

    /**
     * 每日签到（本地模拟）
     * @param {string} userId 
     */
    async checkin(userId) {
      await delay(200);
      
      const today = new Date().toISOString().split('T')[0];
      const users = getLocalUsers();
      
      for (const email in users) {
        if (users[email].id === userId) {
          if (!users[email].checkinDays.includes(today)) {
            users[email].checkinDays.push(today);
            saveLocalUsers(users);
          }
          return users[email].checkinDays;
        }
      }
      
      return [];
    },

    // ==================== 词书相关 ====================

    /**
     * 获取词书列表（本地 JSON）
     */
    async getWordbooks() {
      await delay(100);
      
      // 返回预置词书
      return [
        { id: 'cet4', name: 'CET-4 核心词汇', wordCount: 2000, level: '中等' },
        { id: 'cet6', name: 'CET-6 核心词汇', wordCount: 2500, level: '进阶' },
        { id: 'toefl', name: 'TOEFL 词汇', wordCount: 3000, level: '高级' },
        { id: 'demo', name: 'DEMO 测试词库', wordCount: 10, level: '入门' }
      ];
    },

    /**
     * 获取词书中的单词（本地 JSON）
     * @param {string} bookId 
     * @param {number} count - 获取数量
     */
    async getWordsFromBook(bookId, count = 10) {
      await delay(200);
      
      // DEMO 默认返回 Mock 词库
      if (bookId === 'demo' || Store.get('settings.useMockAI')) {
        return MOCK_CONFIG.wordPack.slice(0, count);
      }
      
      // 其他词书暂时返回相同数据
      return MOCK_CONFIG.wordPack.slice(0, count);
    },

    /**
     * 查询单词释义（本地 ECDICT 分片优先 + 内存/持久缓存 + 我的词库快照 + 兜底）
     * 顺序：内存缓存 → DictModule 本地分片 → 持久缓存 → 我的词库快照 → 占位
     * @param {string} word
     * @returns {Promise<{word, phonetic, partOfSpeech, definition, tag?, examples?, notFound?}>}
     */
    async lookupWord(word) {
      const key = (word || '').toLowerCase().trim();
      if (!key) return null;

      const CACHE_KEY = 'wordquest_word_cache';
      const CACHE_MAX = 200;

      // 1. 内存缓存
      if (!this._wordMemoryCache) this._wordMemoryCache = new Map();
      const mem = this._wordMemoryCache.get(key);
      if (mem) return mem;

      // 2. 本地 ECDICT 分片词库（DictModule）
      if (typeof window !== 'undefined' && window.DictModule && typeof window.DictModule.lookup === 'function') {
        try {
          const local = await window.DictModule.lookup(key);
          if (local && local.notFound) {
            const notFoundResult = { word: key, phonetic: '', partOfSpeech: '', definition: '（未找到释义）', notFound: true };
            this._wordMemoryCache.set(key, notFoundResult);
            return notFoundResult;
          }
          if (local && !local.notFound) {
            const normalized = {
              word: local.word,
              phonetic: local.phonetic || '',
              partOfSpeech: '',
              definition: local.definition || '（暂无释义）',
              tag: local.tag || '',
              notFound: false
            };
            this._wordMemoryCache.set(key, normalized);
            setPersistentWordCache(key, normalized, CACHE_KEY, CACHE_MAX);
            return normalized;
          }
        } catch (_) { /* 分片异常时继续走后续兜底 */ }
      }

      // 3. 持久缓存
      const cached = getPersistentWordCache(key, CACHE_KEY);
      if (cached) {
        this._wordMemoryCache.set(key, cached);
        return cached;
      }

      // 4. 我的词库快照
      const snapshot = getMyWordbookSnapshot(key);
      if (snapshot) {
        this._wordMemoryCache.set(key, snapshot);
        return snapshot;
      }

      // 5. 兜底
      const fallback = {
        word: key,
        phonetic: '',
        partOfSpeech: '',
        definition: '（暂无释义）',
        notFound: false
      };
      this._wordMemoryCache.set(key, fallback);
      return fallback;
    },

    /**
     * 从本地词典随机抽取单词
     * @param {number} count
     */
    getRandomDictWords(count = 8) {
      return dictRandomWords(count);
    },

    // ==================== 故事生成 ====================

    /**
     * 生成故事简介
     * @param {Array} words - 单词列表
     */
    async generateSynopsis(words) {
      // 使用 Mock 数据模式
      if (Store.get('settings.useMockAI')) {
        await delay(1500);
        return MOCK_CONFIG.synopsis;
      }
      
      // 调用真实 AI
      console.log('🤖 正在调用 AI 生成故事简介...');
      
      try {
        const response = await callAI(
          PROMPTS.synopsis.system,
          PROMPTS.synopsis.user(words)
        );
        
        // 解析 JSON（移除可能的 markdown 代码块标记）
        const cleanJson = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const result = JSON.parse(cleanJson);
        
        console.log('✅ 故事简介生成成功:', result);
        return result;
      } catch (error) {
        console.error('❌ AI 生成故事简介失败:', error);
        throw new Error('网络断开：无法连接 AI 服务');
      }
    },

    /**
     * 生成完整故事配置
     * @param {Array} words - 单词列表
     * @param {Object} synopsis - 故事简介
     */
    async generateStoryConfig(words, synopsis) {
      // 使用 Mock 数据模式
      if (Store.get('settings.useMockAI')) {
        await delay(2000);
        return MOCK_CONFIG.storyConfig;
      }
      
      // 调用真实 AI
      console.log('🤖 正在调用 AI 生成完整剧本...');
      
      try {
        const response = await callAI(
          PROMPTS.storyConfig.system,
          PROMPTS.storyConfig.user(words, synopsis)
        );
        
        // 解析 JSON（移除可能的 markdown 代码块标记）
        const cleanJson = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const result = JSON.parse(cleanJson);
        
        // 验证基本结构
        if (!result.mapId || !result.npcs || !result.dialogues) {
          throw new Error('AI 返回的数据结构不完整');
        }
        
        console.log('✅ 完整剧本生成成功:', result);
        return result;
      } catch (error) {
        console.error('❌ AI 生成剧本失败:', error);
        throw new Error('网络断开：无法连接 AI 服务');
      }
    },

    // ==================== 游戏数据 ====================

    /**
     * 保存游戏记录（本地模拟）
     * @param {Object} gameResult 
     */
    async saveGameResult(gameResult) {
      await delay(200);
      
      const key = 'wordquest_game_history';
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      
      history.push({
        ...gameResult,
        playedAt: new Date().toISOString()
      });
      
      // 只保留最近 50 条记录
      if (history.length > 50) {
        history.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(history));
      return true;
    },

    /**
     * 获取游戏历史
     * @param {string} userId 
     */
    async getGameHistory(userId) {
      await delay(100);
      
      const key = 'wordquest_game_history';
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      
      return history.filter(g => g.userId === userId);
    },

    // ==================== 地图和 NPC ====================

    /**
     * 获取地图配置（合并编辑页保存的覆盖：npcSlots / walkableBounds / blockedPolygons）
     * @param {number} mapId 
     */
    getMapConfig(mapId) {
      const base = MAPS_CONFIG[mapId] || MAPS_CONFIG[1];
      let overrides = {};
      try {
        overrides = JSON.parse(localStorage.getItem('wordquest_map_editor_overrides') || '{}')[String(mapId)] || {};
      } catch (_) {}
      return {
        ...base,
        npcSlots: overrides.npcSlots ? { ...base.npcSlots, ...overrides.npcSlots } : base.npcSlots,
        walkableBounds: overrides.walkableBounds || base.walkableBounds,
        blockedPolygons: overrides.blockedPolygons || []
      };
    },

    /**
     * 获取 NPC 配置
     * @param {string} npcId 
     */
    getNpcConfig(npcId) {
      return NPCS_CONFIG[npcId];
    },

    /**
     * 获取所有 NPC
     */
    getAllNpcs() {
      return NPCS_CONFIG;
    }
  };
})();
