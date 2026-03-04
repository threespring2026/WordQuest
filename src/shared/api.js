/**
 * API - 接口封装（本地模拟版本）
 * 所有需要服务端的功能都在这里模拟
 */

const API = (function() {
  // 模拟网络延迟
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
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
     * 查询单词释义（优先从本地词典查，再从 wordPack 查）
     * @param {string} word 
     */
    async lookupWord(word) {
      // 先查本地词典（无网络延迟）
      const dictResult = dictLookup(word);
      if (dictResult) return dictResult;

      // 再查 mock wordPack
      const found = MOCK_CONFIG.wordPack.find(w =>
        w.word.toLowerCase() === word.toLowerCase()
      );
      if (found) return found;

      await delay(50);

      // 未找到时返回占位数据
      return {
        word:        word.toLowerCase(),
        phonetic:    '',
        partOfSpeech:'',
        definition:  '（暂无释义）'
      };
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
