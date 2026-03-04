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

  // 渲染页面
  function render() {
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">WORDQUEST</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <h2 class="text-center text-gray-700 font-bold mb-3">你的单词</h2>
        
        <!-- 单词展示 -->
        <div class="card mb-4">
          <div id="word-tags" class="flex flex-wrap justify-center gap-2">
            ${wordPack.map(w => `
              <span class="word-tag-display" data-word="${w.word}">${w.word}</span>
            `).join('')}
          </div>
        </div>
        
        <!-- 法师动画区域 -->
        <div class="flex flex-col items-center my-6">
          <div id="wizard-sprite" class="text-6xl mb-2 animate-pulse">🧙‍♂️</div>
          <div id="loading-indicator" class="flex items-center gap-2">
            <div class="loader"></div>
            <span class="text-gray-600">AI 正在编织你的故事...</span>
          </div>
        </div>
        
        <!-- 故事简介 -->
        <div id="synopsis-card" class="card hidden">
          <div class="flex items-start gap-3">
            <div class="text-3xl">📜</div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 mb-2">故事简介</h3>
              <p id="synopsis-text" class="text-gray-600 text-sm leading-relaxed"></p>
            </div>
          </div>
        </div>
        
        <!-- 生成进度 -->
        <div id="progress-panel" class="mt-4 hidden">
          <div class="text-center text-gray-500 text-sm mb-2">
            <span id="progress-text">正在生成游戏配置...</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div id="progress-bar" class="h-full bg-blue-500 transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div id="story-buttons" class="p-4 flex gap-3 hidden">
        <button id="btn-regenerate" class="btn-3d btn-gray flex-1">重新生成（剩余 <span id="regenerate-left">${MAX_REGENERATE}</span> 次）</button>
        <button id="btn-confirm" class="btn-3d btn-green flex-1">确认开始</button>
      </div>
    `;

    bindEvents();
    bindWordTooltips();
    startGeneration();
  }

  // 绑定单词悬停提示
  function bindWordTooltips() {
    document.querySelectorAll('.word-tag-display').forEach(el => {
      const word = el.dataset.word;
      const wordData = wordPack.find(w => w.word === word);
      
      if (wordData) {
        el.addEventListener('mouseenter', (e) => {
          UI.showWordTooltip(wordData, e.clientX, e.clientY);
        });
        el.addEventListener('mouseleave', UI.hideWordTooltip);
      }
    });
  }

  // 开始生成故事
  async function startGeneration() {
    if (isGenerating) return;
    isGenerating = true;
    
    try {
      EventBus.emit(Events.STORY_GENERATE_START, { step: 'synopsis' });
      synopsis = await API.generateSynopsis(wordPack);
      
      showSynopsis();
      
      document.getElementById('progress-panel').classList.remove('hidden');
      updateProgress(0, '正在生成游戏配置...');
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          progress = 90;
          clearInterval(progressInterval);
        }
        updateProgress(progress);
      }, 300);
      
      storyConfig = await API.generateStoryConfig(wordPack, synopsis);
      
      clearInterval(progressInterval);
      updateProgress(100, '准备就绪！');
      
      setTimeout(() => {
        document.getElementById('progress-panel').classList.add('hidden');
        document.getElementById('story-buttons').classList.remove('hidden');
        updateRegenerateButton();
      }, 500);
      
      EventBus.emit(Events.STORY_GENERATE_DONE, { synopsis, storyConfig });
      
    } catch (error) {
      console.error('Story generation failed:', error);
      showNetworkError(error.message || '网络断开：无法连接 AI 服务');
    } finally {
      isGenerating = false;
    }
  }

  // 显示网络错误
  function showNetworkError(message) {
    document.getElementById('loading-indicator').innerHTML = `
      <div class="flex flex-col items-center text-red-500">
        <div class="text-4xl mb-2">⚠️</div>
        <div class="font-bold mb-1">网络断开</div>
        <div class="text-sm text-gray-500">${message}</div>
      </div>
    `;
    document.getElementById('wizard-sprite').classList.remove('animate-pulse');
    document.getElementById('wizard-sprite').textContent = '😵';
    document.getElementById('progress-panel').classList.add('hidden');
    
    // 显示重试按钮
    document.getElementById('story-buttons').innerHTML = `
      <button id="btn-back" class="btn-3d btn-gray flex-1">返回</button>
      <button id="btn-retry" class="btn-3d btn-blue flex-1">重试</button>
    `;
    document.getElementById('story-buttons').classList.remove('hidden');
    
    document.getElementById('btn-back')?.addEventListener('click', () => Router.back());
    document.getElementById('btn-retry')?.addEventListener('click', () => {
      location.reload();
    });
  }

  // 显示故事简介
  function showSynopsis() {
    document.getElementById('loading-indicator').classList.add('hidden');
    document.getElementById('wizard-sprite').classList.remove('animate-pulse');
    document.getElementById('synopsis-card').classList.remove('hidden');
    
    document.getElementById('synopsis-text').innerHTML = `
      <strong>背景：</strong>${synopsis.background}<br>
      <strong>任务：</strong>${synopsis.mission}
    `;
  }

  // 更新进度条
  function updateProgress(percent, text) {
    document.getElementById('progress-bar').style.width = `${percent}%`;
    if (text) {
      document.getElementById('progress-text').textContent = text;
    }
  }

  function updateRegenerateButton() {
    const btn = document.getElementById('btn-regenerate');
    const span = document.getElementById('regenerate-left');
    const left = Math.max(0, MAX_REGENERATE - regenerateCount);
    if (span) span.textContent = left;
    if (btn) {
      btn.disabled = left <= 0;
      if (left <= 0) btn.title = '已达重新生成次数上限';
    }
  }

  // 重新生成（最多 3 次）
  async function regenerate() {
    if (regenerateCount >= MAX_REGENERATE) {
      UI.showToast('重新生成次数已用完', 'info');
      return;
    }
    regenerateCount++;
    document.getElementById('loading-indicator').classList.remove('hidden');
    document.getElementById('wizard-sprite').classList.add('animate-pulse');
    document.getElementById('synopsis-card').classList.add('hidden');
    document.getElementById('story-buttons').classList.add('hidden');
    document.getElementById('progress-panel').classList.add('hidden');
    
    synopsis = null;
    storyConfig = null;
    
    await startGeneration();
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
    document.getElementById('btn-regenerate')?.addEventListener('click', regenerate);
    document.getElementById('btn-confirm')?.addEventListener('click', confirmStory);
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
