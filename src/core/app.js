/**
 * App - 应用入口
 * 负责初始化和启动游戏
 */

const App = (function() {
  let initialized = false;

  return {
    /**
     * 初始化应用
     */
    init() {
      if (initialized) {
        console.warn('App already initialized');
        return;
      }

      console.log('🎮 WordQuest Initializing...');

      // 注册所有场景模块
      this.registerModules();

      // 后台预加载所有图片资源
      this.preloadAssets();

      // 监听全局事件
      this.setupGlobalListeners();

      // 检查用户登录状态，决定初始场景
      const isLoggedIn = Store.get('isLoggedIn');
      const initialScene = isLoggedIn ? 'wordbook' : 'auth';

      // 启动初始场景
      Router.go(initialScene);

      initialized = true;
      console.log('✅ WordQuest Ready!');
    },

    /**
     * 注册所有模块
     */
    registerModules() {
      // 模块将在各自的文件中定义，这里只做注册
      if (typeof AuthModule !== 'undefined') {
        Router.register('auth', AuthModule);
      }
      if (typeof WordbookModule !== 'undefined') {
        Router.register('wordbook', WordbookModule);
      }
      if (typeof StoryModule !== 'undefined') {
        Router.register('story', StoryModule);
      }
      if (typeof GameModule !== 'undefined') {
        Router.register('game', GameModule);
      }
      if (typeof ResultModule !== 'undefined') {
        Router.register('result', ResultModule);
      }
    },

    /**
     * 设置全局事件监听
     */
    setupGlobalListeners() {
      // 用户登录成功
      EventBus.on(Events.USER_LOGIN, (user) => {
        Store.set('user', user);
        Store.set('isLoggedIn', true);
        Router.go('wordbook');
      });

      // 用户登出
      EventBus.on(Events.USER_LOGOUT, () => {
        Store.set('user', null);
        Store.set('isLoggedIn', false);
        Store.resetSession();
        Router.clearHistory();
        Router.go('auth');
      });

      // 游戏开始
      EventBus.on(Events.GAME_START, (data) => {
        Store.set('session.wordPack', data.wordPack);
        Store.set('session.startTime', Date.now());
        Router.go('story');
      });

      // 故事确认
      EventBus.on(Events.STORY_CONFIRM, (storyConfig) => {
        Store.set('session.storyConfig', storyConfig);
        Router.go('game');
      });

      // 游戏结束
      EventBus.on(Events.GAME_END, (result) => {
        Store.batch({
          'session.errorCount': result.errorCount,
          'session.answers': result.answers
        });
        Router.go('result');
      });

      // 场景切换日志
      EventBus.on(Events.SCENE_CHANGE, ({ scene }) => {
        console.log(`📍 Scene: ${scene}`);
      });
    },

    /**
     * 预加载所有游戏图片资源（静默后台加载，避免进入游戏时白屏）
     */
    preloadAssets() {
      const images = [];

      // 地图背景图
      if (typeof MAPS_CONFIG !== 'undefined') {
        Object.values(MAPS_CONFIG).forEach(m => m.image && images.push(m.image));
      }

      // NPC 图片（idle / surprised / head）
      if (typeof NPCS_CONFIG !== 'undefined') {
        Object.values(NPCS_CONFIG).forEach(npc => {
          if (npc.images) {
            Object.values(npc.images).forEach(src => src && images.push(src));
          }
        });
      }

      // 玩家形象图片
      if (typeof PLAYER_AVATARS !== 'undefined') {
        Object.values(PLAYER_AVATARS).forEach(p => p.image && images.push(p.image));
      }

      // 创建隐藏 img 元素触发浏览器缓存
      images.forEach(src => {
        const img = new Image();
        img.src = src;
      });

      console.log(`🖼️ Preloading ${images.length} assets...`);
    },

    /**
     * 获取应用版本
     */
    getVersion() {
      return '0.1.0-dev';
    }
  };
})();

// DOM 加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
