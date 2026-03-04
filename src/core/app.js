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
