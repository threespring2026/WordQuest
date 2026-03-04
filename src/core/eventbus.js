/**
 * EventBus - 事件总线
 * 用于模块间解耦通信
 */

const EventBus = (function() {
  const events = {};

  return {
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
      if (!events[event]) {
        events[event] = [];
      }
      events[event].push(callback);
      return () => this.off(event, callback);
    },

    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {*} data - 传递的数据
     */
    emit(event, data) {
      if (events[event]) {
        events[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`EventBus error in "${event}":`, error);
          }
        });
      }
    },

    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 要移除的回调
     */
    off(event, callback) {
      if (events[event]) {
        events[event] = events[event].filter(cb => cb !== callback);
      }
    },

    /**
     * 一次性订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    },

    /**
     * 清除所有事件（调试用）
     */
    clear() {
      Object.keys(events).forEach(key => delete events[key]);
    }
  };
})();

// 预定义事件常量
const Events = {
  // 用户相关
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_UPDATE: 'user:update',
  
  // 游戏流程
  GAME_START: 'game:start',
  GAME_END: 'game:end',
  ROUND_START: 'round:start',
  ROUND_END: 'round:end',
  
  // 故事生成
  STORY_GENERATE_START: 'story:generate:start',
  STORY_GENERATE_DONE: 'story:generate:done',
  STORY_CONFIRM: 'story:confirm',
  
  // 对话交互
  DIALOGUE_START: 'dialogue:start',
  DIALOGUE_OPTION_SELECT: 'dialogue:option:select',
  DIALOGUE_COMPLETE: 'dialogue:complete',
  
  // 场景切换
  SCENE_CHANGE: 'scene:change',
  SCENE_READY: 'scene:ready',
  
  // UI 交互
  WORD_TOOLTIP_SHOW: 'ui:tooltip:show',
  WORD_TOOLTIP_HIDE: 'ui:tooltip:hide',
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close'
};
