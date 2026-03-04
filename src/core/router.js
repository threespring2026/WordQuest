/**
 * Router - 路由管理器
 * 管理场景切换和模块生命周期
 */

const Router = (function() {
  // 注册的场景
  const scenes = {};
  
  // 当前场景
  let currentScene = null;
  let currentSceneName = null;
  
  // 历史记录
  const history = [];

  return {
    /**
     * 注册场景
     * @param {string} name - 场景名称
     * @param {Object} module - 模块对象，需要 mount/unmount 方法
     */
    register(name, module) {
      if (!module.mount || !module.unmount) {
        console.error(`Router: Module "${name}" must have mount() and unmount() methods`);
        return;
      }
      scenes[name] = module;
    },

    /**
     * 切换到指定场景
     * @param {string} name - 场景名称
     * @param {Object} params - 传递给场景的参数
     */
    go(name, params = {}) {
      if (!scenes[name]) {
        console.error(`Router: Scene "${name}" not found`);
        return;
      }

      // 卸载当前场景
      if (currentScene) {
        try {
          currentScene.unmount();
        } catch (e) {
          console.error(`Router: Error unmounting "${currentSceneName}"`, e);
        }
        
        // 记录历史
        history.push(currentSceneName);
      }

      // 挂载新场景
      currentSceneName = name;
      currentScene = scenes[name];
      
      try {
        currentScene.mount(params);
        Store.set('ui.currentScene', name);
        EventBus.emit(Events.SCENE_CHANGE, { scene: name, params });
      } catch (e) {
        console.error(`Router: Error mounting "${name}"`, e);
      }
    },

    /**
     * 返回上一个场景
     */
    back() {
      if (history.length === 0) {
        console.warn('Router: No history to go back');
        return;
      }
      
      const prevScene = history.pop();
      
      // 卸载当前场景
      if (currentScene) {
        currentScene.unmount();
      }
      
      // 挂载上一个场景
      currentSceneName = prevScene;
      currentScene = scenes[prevScene];
      currentScene.mount({});
      
      Store.set('ui.currentScene', prevScene);
      EventBus.emit(Events.SCENE_CHANGE, { scene: prevScene, params: {} });
    },

    /**
     * 获取当前场景名称
     * @returns {string}
     */
    getCurrentScene() {
      return currentSceneName;
    },

    /**
     * 获取历史记录
     * @returns {string[]}
     */
    getHistory() {
      return [...history];
    },

    /**
     * 清空历史
     */
    clearHistory() {
      history.length = 0;
    },

    /**
     * 预加载场景（可选优化）
     * @param {string} name - 场景名称
     */
    preload(name) {
      if (scenes[name] && scenes[name].preload) {
        scenes[name].preload();
      }
    }
  };
})();
