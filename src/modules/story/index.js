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
  let progressTimerId = null;
  let currentProgress = 0;
  let pollTimerId = null;
  let currentJobId = null;
  const POLL_INTERVAL_MS = 2500;

  /** 进度条速度：数值越大跑得越快，默认 0.1 约为原来的 1/10 速度，改为 1 则恢复原速 */
  const PROGRESS_SPEED = 0.1;
  /** 进度条刷新间隔（毫秒），越大越省资源、观感越平滑 */
  const PROGRESS_TICK_MS = 400;

  // 进度区间与展示文案
  const PROGRESS_STEPS = [
    { min: 0, max: 15, text: '☕ 主编已签收单词，灵感咖啡研磨中...' },
    { min: 16, max: 35, text: '🤝 正在说服顽固单词，劝它们乖乖排队。' },
    { min: 36, max: 55, text: '🥣 词义下锅，故事浓汤文火慢炖中。' },
    { min: 56, max: 75, text: '✨ 文学之神降临，正往句子缝隙注入灵魂。' },
    { min: 76, max: 95, text: '🎭 校对完毕，正给台词撒上闪亮的金粉。' },
    { min: 96, max: 100, text: '📜 手稿墨迹已干，文学杰作火速送达！' }
  ];

  function getProgressText(percent) {
    const step = PROGRESS_STEPS.find(s => percent >= s.min && percent <= s.max);
    return step ? step.text : PROGRESS_STEPS[0].text;
  }

  function updateProgressUI(percent) {
    const wrap = document.getElementById('story-progress-wrap');
    const bar = document.getElementById('story-progress-bar');
    const textEl = document.getElementById('story-progress-text');
    if (!wrap || !bar || !textEl) return;
    const pct = Math.min(100, Math.max(0, Math.round(percent)));
    bar.style.width = pct + '%';
    textEl.textContent = getProgressText(pct);
  }

  function startProgressAnimation() {
    currentProgress = 0;
    updateProgressUI(0);
    if (progressTimerId) clearInterval(progressTimerId);
    progressTimerId = setInterval(() => {
      if (currentProgress >= 95) return;
      const step = ((95 - currentProgress) * 0.12 + 1) * PROGRESS_SPEED;
      currentProgress += step;
      if (currentProgress > 95) currentProgress = 95;
      updateProgressUI(currentProgress);
    }, PROGRESS_TICK_MS);
  }

  function stopProgressAnimation() {
    if (progressTimerId) {
      clearInterval(progressTimerId);
      progressTimerId = null;
    }
  }

  // 渲染单词预热列表（与 result 单词回顾一致：单词 + 音标 + 释义，可滑动）
  function renderWordWarmupList() {
    return wordPack.map(w => `
      <div class="p-3 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-start">
          <span class="font-bold text-red-500">${w.word}</span>
          <span class="text-gray-500 text-sm">${w.partOfSpeech || ''}</span>
        </div>
        <div class="text-gray-500 text-xs mt-1">${w.phonetic || ''}</div>
        <div class="text-gray-700 text-sm mt-1">${w.definition || '（暂无释义）'}</div>
      </div>
    `).join('');
  }

  // 更新故事简介/任务/内容区域（生成完成后调用）
  function updateSynopsisBlock() {
    if (!synopsis) return;
    const introEl = document.getElementById('story-intro-text');
    const missionEl = document.getElementById('story-mission-text');
    const contentEl = document.getElementById('story-content-text');
    if (introEl) introEl.textContent = synopsis.background || '（无）';
    if (missionEl) missionEl.textContent = synopsis.mission || '（无）';
    if (contentEl) contentEl.textContent = synopsis.content || '根据背景与任务，在冒险中与多位角色对话，选择正确使用目标单词的选项完成关卡。';
  }

  // 渲染页面：故事简介/任务/内容 + 单词预热（详细可滑动）+ 生成中/开始冒险 按钮
  function render() {
    const hasSynopsis = !!synopsis;
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">词境历险</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <!-- 故事简介 + 任务信息 + 内容（合一面板） -->
        <div class="card mb-4">
          <h3 class="text-gray-800 font-bold mb-2 text-sm">故事与任务</h3>
          <div class="space-y-3 text-gray-600 text-sm">
            <div>
              <span class="font-medium text-gray-700">故事简介：</span>
              <p id="story-intro-text" class="mt-0.5">${hasSynopsis ? (synopsis.background || '（无）') : '正在生成故事简介…'}</p>
            </div>
            <div>
              <span class="font-medium text-gray-700">任务信息：</span>
              <p id="story-mission-text" class="mt-0.5">${hasSynopsis ? (synopsis.mission || '（无）') : '正在生成…'}</p>
            </div>
            <div>
              <span class="font-medium text-gray-700">内容：</span>
              <p id="story-content-text" class="mt-0.5">${hasSynopsis ? (synopsis.content || '根据背景与任务，在冒险中与多位角色对话，选择正确使用目标单词的选项完成关卡。') : '生成后将显示冒险内容说明。'}</p>
            </div>
          </div>
        </div>

        <!-- 单词预热：详细列表（与结果页单词回顾一致，可滑动） -->
        <div class="card mb-4">
          <h3 class="text-center text-gray-800 font-bold mb-1">单词预热</h3>
          <p class="text-center text-gray-500 text-xs mb-3">利用等待时间熟悉单词</p>
          <div id="story-word-warmup-list" class="space-y-3 max-h-64 overflow-y-auto">
            ${renderWordWarmupList()}
          </div>
        </div>
        
        <div id="story-error-area" class="hidden"></div>
      </div>
      
      <div class="p-4 space-y-2">
        <div id="story-progress-wrap" class="w-full">
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div id="story-progress-bar" class="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <p id="story-progress-text" class="text-center text-gray-600 text-sm min-h-[1.5rem]">☕ 主编已签收单词，灵感咖啡研磨中...</p>
        </div>
        <button id="story-start-btn" class="btn-3d btn-green w-full hidden" disabled>
          开始冒险
        </button>
      </div>
      
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;

    bindEvents();
    bindWordTooltips();
    startGeneration();
  }

  function setStartButtonReady() {
    stopProgressAnimation();
    currentProgress = 100;
    updateProgressUI(100);
    const wrap = document.getElementById('story-progress-wrap');
    const btn = document.getElementById('story-start-btn');
    if (wrap) wrap.classList.add('hidden');
    if (btn) {
      btn.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = '开始冒险';
      btn.className = 'btn-3d btn-green w-full';
    }
  }

  function setStartButtonGenerating() {
    const wrap = document.getElementById('story-progress-wrap');
    const btn = document.getElementById('story-start-btn');
    if (wrap) wrap.classList.remove('hidden');
    if (btn) {
      btn.classList.add('hidden');
      btn.disabled = true;
    }
    startProgressAnimation();
  }

  // 绑定单词点击 → 打开释义弹层
  function bindWordTooltips() {
    UI.bindWordClick(document.body);
  }

  function stopPolling() {
    if (pollTimerId) {
      clearTimeout(pollTimerId);
      pollTimerId = null;
    }
    currentJobId = null;
  }

  async function pollUntilReady(jobId) {
    if (currentJobId !== jobId || !isGenerating) return;
    try {
      const data = await API.storyStatus(jobId);
      if (data.status === 'ready') {
        stopPolling();
        synopsis = data.synopsis;
        storyConfig = data.storyConfig;
        Store.set('session.synopsis', synopsis);
        EventBus.emit(Events.STORY_GENERATE_DONE, { synopsis, storyConfig });
        stopProgressAnimation();
        updateProgressUI(100);
        const textEl = document.getElementById('story-progress-text');
        if (textEl) textEl.textContent = getProgressText(100);
        setTimeout(() => {
          setStartButtonReady();
          updateSynopsisBlock();
        }, 600);
        isGenerating = false;
        return;
      }
      if (data.status === 'error') {
        stopPolling();
        stopProgressAnimation();
        showNetworkError(data.error || '生成失败');
        isGenerating = false;
        return;
      }
    } catch (err) {
      console.error('Poll story status failed:', err);
      stopPolling();
      stopProgressAnimation();
      showNetworkError(err.message || '网络断开：无法连接 AI 服务');
      isGenerating = false;
      return;
    }
    if (currentJobId !== jobId || !isGenerating) return;
    pollTimerId = setTimeout(() => pollUntilReady(jobId), POLL_INTERVAL_MS);
  }

  // 开始生成故事：Mock 模式沿用原逻辑；否则 POST start + 轮询 status（支持锁屏后解锁继续）
  async function startGeneration() {
    if (isGenerating) return;
    isGenerating = true;
    setStartButtonGenerating();
    const difficultyLevel = Store.get('session.difficulty') || 'intermediate';
    EventBus.emit(Events.STORY_GENERATE_START, { step: 'synopsis' });

    if (Store.get('settings.useMockAI')) {
      try {
        synopsis = await API.generateSynopsis(wordPack, difficultyLevel);
        storyConfig = await API.generateStoryConfig(wordPack, synopsis, difficultyLevel);
        Store.set('session.synopsis', synopsis);
        EventBus.emit(Events.STORY_GENERATE_DONE, { synopsis, storyConfig });
        stopProgressAnimation();
        updateProgressUI(100);
        const textEl = document.getElementById('story-progress-text');
        if (textEl) textEl.textContent = getProgressText(100);
        setTimeout(() => {
          setStartButtonReady();
          updateSynopsisBlock();
        }, 600);
      } catch (error) {
        console.error('Story generation failed:', error);
        stopProgressAnimation();
        showNetworkError(error.message || '网络断开：无法连接 AI 服务');
      } finally {
        isGenerating = false;
      }
      return;
    }

    try {
      const jobId = await API.storyStart(wordPack, difficultyLevel);
      currentJobId = jobId;
      pollUntilReady(jobId);
    } catch (error) {
      console.error('Story start failed:', error);
      stopProgressAnimation();
      showNetworkError(error.message || '网络断开：无法连接 AI 服务');
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
    document.getElementById('story-progress-wrap')?.classList.add('hidden');
    document.getElementById('story-start-btn')?.classList.add('hidden');
    document.getElementById('story-btn-back')?.addEventListener('click', () => Router.back());
    document.getElementById('story-btn-retry')?.addEventListener('click', () => {
      document.getElementById('story-error-area').classList.add('hidden');
      document.getElementById('story-error-area').innerHTML = '';
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
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && currentJobId && isGenerating) {
        if (pollTimerId) clearTimeout(pollTimerId);
        pollTimerId = null;
        pollUntilReady(currentJobId);
      }
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
      stopProgressAnimation();
      stopPolling();
      container = null;
      isGenerating = false;
    }
  };
})();
