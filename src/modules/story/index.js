/**
 * 模块三：故事生成
 * 中文界面，AI 生成故事配置
 */

const MAX_REGENERATE = 3;

const StoryModule = (function() {
  let container = null;
  let wordPack = [];
  let synopsis = null;
  let storyConfig = null;
  let isGenerating = false;
  let regenerateCount = 0;

  // 渲染页面：单词预热 + 生成中/开始冒险 按钮
  function render() {
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">词境历险</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <div class="card mb-4">
          <h2 class="text-center text-gray-800 font-bold mb-1">单词预热</h2>
          <p class="text-center text-gray-500 text-xs mb-3">利用等待时间熟悉单词，点击可查释义</p>
          <div id="story-word-tags" class="flex flex-wrap justify-center gap-2">
            ${wordPack.map(w => `
              <span class="word-tag-display cursor-pointer" data-word="${w.word}">${w.word}</span>
            `).join('')}
          </div>
        </div>
        
        <div id="story-error-area" class="hidden"></div>
      </div>
      
      <div class="p-4">
        <button id="story-start-btn" class="btn-3d w-full bg-gray-300 text-gray-500 cursor-not-allowed" disabled>
          正在生成故事
        </button>
      </div>
      
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;

    bindEvents();
    bindWordTooltips();
    startGeneration();
  }

  function setStartButtonReady() {
    const btn = document.getElementById('story-start-btn');
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = '开始冒险';
    btn.className = 'btn-3d btn-green w-full';
  }

  function setStartButtonGenerating() {
    const btn = document.getElementById('story-start-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '正在生成故事';
    btn.className = 'btn-3d w-full bg-gray-300 text-gray-500 cursor-not-allowed';
  }

  // 绑定单词点击 → 打开释义弹层
  function bindWordTooltips() {
    UI.bindWordClick(document.body);
  }

  // 开始生成故事（后台执行，完成后点亮「开始冒险」）
  async function startGeneration() {
    if (isGenerating) return;
    isGenerating = true;
    setStartButtonGenerating();

    try {
      EventBus.emit(Events.STORY_GENERATE_START, { step: 'synopsis' });
      synopsis = await API.generateSynopsis(wordPack);
      storyConfig = await API.generateStoryConfig(wordPack, synopsis);

      Store.set('session.synopsis', synopsis);
      EventBus.emit(Events.STORY_GENERATE_DONE, { synopsis, storyConfig });
      setStartButtonReady();
    } catch (error) {
      console.error('Story generation failed:', error);
      showNetworkError(error.message || '网络断开：无法连接 AI 服务');
    } finally {
      isGenerating = false;
    }
  }

  // 显示网络错误（在单词预热页内显示错误 + 返回/重试）
  function showNetworkError(message) {
    const area = document.getElementById('story-error-area');
    if (!area) return;
    area.classList.remove('hidden');
    area.innerHTML = `
      <div class="card border-red-200 bg-red-50">
        <div class="flex flex-col items-center text-red-600 text-sm">
          <span class="text-2xl mb-1">⚠️</span>
          <span class="font-medium">网络断开</span>
          <span class="text-gray-500 mt-1">${message}</span>
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <button id="story-btn-back" class="btn-3d btn-gray flex-1">返回</button>
        <button id="story-btn-retry" class="btn-3d btn-blue flex-1">重试</button>
      </div>
    `;
    document.getElementById('story-start-btn').classList.add('hidden');
    document.getElementById('story-btn-back')?.addEventListener('click', () => Router.back());
    document.getElementById('story-btn-retry')?.addEventListener('click', () => {
      document.getElementById('story-error-area').classList.add('hidden');
      document.getElementById('story-error-area').innerHTML = '';
      document.getElementById('story-start-btn').classList.remove('hidden');
      setStartButtonGenerating();
      startGeneration();
    });
  }

  // 确认故事
  function confirmStory() {
    if (!storyConfig) {
      UI.showToast('故事尚未准备好', 'error');
      return;
    }
    
    Store.set('session.storyConfig', storyConfig);
    EventBus.emit(Events.STORY_CONFIRM, storyConfig);
  }

  // 绑定事件
  function bindEvents() {
    document.getElementById('story-start-btn')?.addEventListener('click', () => {
      if (document.getElementById('story-start-btn').disabled) return;
      confirmStory();
    });
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      wordPack = Store.get('session.wordPack') || MOCK_CONFIG.wordPack.slice(0, 5);
      synopsis = null;
      storyConfig = null;
      isGenerating = false;
      regenerateCount = 0;
      
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'story' });
    },

    unmount() {
      container = null;
      isGenerating = false;
    }
  };
})();
