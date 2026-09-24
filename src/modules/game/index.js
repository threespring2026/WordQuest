/**
 * 模块四：游戏主界面
 * 使用实际图片资源，支持边界限制和对话锁定
 */

const GameModule = (function() {
  let container = null;
  let storyConfig = null;
  let wordPack = [];
  let currentRound = 0;
  let errorCount = 0;
  let answers = [];
  let availableOptions = [];
  let dialogueStep = 'idle';
  let isDialogueActive = false;  // 对话中锁定移动

  // 地图、碰撞、人物脚底统一使用原图的归一化坐标。
  let mapFrame = null;
  let imageAspect = 1.6;
  let playerPosition = null;
  let mapResizeObserver = null;
  let mapInitialized = false;
  let moveAnimationId = null;
  let talkTimeoutId = null;
  const MOVE_SPEED = 140; // 屏幕像素/秒
  const TALK_RANGE = 72;

  function placeAt(element, point) {
    if (!element || !mapFrame || !point) return;
    const screen = MapGeometry.toScreen(mapFrame, point);
    element.style.left = screen.x + 'px';
    element.style.top = screen.y + 'px';
  }

  function refreshMapLayout() {
    const mapEl = document.getElementById('game-map');
    const mapImg = document.getElementById('map-bg');
    if (!mapEl || !mapImg || !mapImg.naturalWidth || !mapImg.naturalHeight) return;
    mapFrame = MapGeometry.imageFrame(mapEl.clientWidth, mapEl.clientHeight, mapImg.naturalWidth, mapImg.naturalHeight);
    imageAspect = mapImg.naturalHeight / mapImg.naturalWidth;
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    storyConfig.npcs.forEach(npc => {
      placeAt(document.getElementById(`npc-${npc.npcId}`), mapConfig.npcSlots[npc.slot]);
    });
    placeAt(document.getElementById('player'), playerPosition);
  }

  // 渲染页面
  function render() {
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const user = Store.get('user');
    
    const synopsis = Store.get('session.synopsis') || {};
    const missionText = synopsis.mission ? ` · ${synopsis.mission}` : '';
    container.innerHTML = `
      <!-- 顶部：软件名称 + 任务简报（置于对话之上，保证退出可点） -->
      <div class="game-top-bar bg-white px-4 py-2 flex justify-between items-center border-b shrink-0">
        <div class="font-bold text-gray-800 pixel-font text-sm truncate flex-1 mr-2" title="词境历险${missionText}">词境历险${missionText}</div>
        <div class="flex gap-2 shrink-0">
          <button id="btn-bgm" class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">🔊</button>
          <button id="btn-quit" class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">✕</button>
        </div>
      </div>
      
      <!-- 游戏地图区域 -->
      <div id="game-map" class="relative flex-1 overflow-hidden">
        <img id="map-bg" src="${mapConfig.image}" alt="Map" 
             class="absolute inset-0 w-full h-full object-contain">
        <!-- NPC 和玩家将由 JS 动态生成 -->
      </div>
      
      <!-- 对话面板 -->
      <div id="dialogue-panel" class="hidden">
        <div id="npc-dialogue" class="mb-4"></div>
        <div id="player-options"></div>
      </div>
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;

    // 等待图片加载后初始化地图
    const mapBg = document.getElementById('map-bg');
    mapBg.onload = initMap;
    if (mapBg.complete && mapBg.naturalWidth) initMap();
    
    bindEvents();
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 获取氛围文字
  function getMoodText(mood) {
    const moodMap = {
      warm: '温馨',
      happy: '欢乐',
      sad: '忧伤',
      funny: '诙谐'
    };
    return moodMap[mood] || mood;
  }

  // 按原图坐标放置 NPC 和玩家。图片从缓存加载时也只初始化一次。
  function initMap() {
    if (mapInitialized || !container) return;
    const mapEl = document.getElementById('game-map');
    const mapImg = document.getElementById('map-bg');
    if (!mapEl || !mapImg || !mapImg.naturalWidth) return;
    mapInitialized = true;
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const user = Store.get('user');

    storyConfig.npcs.forEach(npc => {
      const npcConfig = API.getNpcConfig(npc.npcId);
      if (!mapConfig.npcSlots[npc.slot] || !npcConfig) return;
      const npcEl = document.createElement('div');
      npcEl.className = mapConfig.npcSlots[npc.slot].y < 0.20 ? 'npc-sprite edge-top' : 'npc-sprite';
      npcEl.id = `npc-${npc.npcId}`;
      npcEl.dataset.npcId = npc.npcId;
      npcEl.innerHTML = `
        <div class="npc-name-top">${npcConfig.name}</div>
        <div class="npc-exclamation hidden">!</div>
        <img src="${npcConfig.images.idle}" alt="${npcConfig.name}"
             class="npc-image" data-idle="${npcConfig.images.idle}"
             data-surprised="${npcConfig.images.surprised}">
      `;
      npcEl.addEventListener('click', () => onNpcClick(npc.npcId));
      mapEl.appendChild(npcEl);
    });

    playerPosition = { ...mapConfig.playerStart };
    const playerEl = document.createElement('div');
    playerEl.className = 'player-sprite';
    playerEl.id = 'player';
    const avatarMap = { boy: 'assets/player/player_boy.png', girl: 'assets/player/player_girl.png' };
    const avatarImg = user?.isGuest
      ? 'assets/player/player_guest.png'
      : (avatarMap[user?.avatar] || 'assets/player/player_guest.png');
    playerEl.innerHTML = `
      <div class="player-name-top">${user?.nickname || '游客'}</div>
      <img src="${avatarImg}" alt="Player" class="player-image">
    `;
    mapEl.appendChild(playerEl);
    mapEl.addEventListener('click', onMapClick);
    refreshMapLayout();
    mapResizeObserver = new ResizeObserver(refreshMapLayout);
    mapResizeObserver.observe(mapEl);
    startRound();
  }

  // 开始当前回合
  function startRound() {
    const dialogue = storyConfig.dialogues[currentRound];
    
    if (!dialogue) {
      endGame();
      return;
    }
    
    // 隐藏所有感叹号，显示当前NPC的
    document.querySelectorAll('.npc-exclamation').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.npc-image').forEach(img => {
      img.src = img.dataset.idle;
    });
    
    const activeNpcEl = document.querySelector(`#npc-${dialogue.npcId}`);
    if (activeNpcEl) {
      activeNpcEl.querySelector('.npc-exclamation')?.classList.remove('hidden');
    }
    
    dialogueStep = 'waiting';
    availableOptions = shuffleArray([...dialogue.options]);
    isDialogueActive = false;
    document.getElementById('dialogue-panel').classList.add('hidden');
    
    EventBus.emit(Events.ROUND_START, { round: currentRound + 1, dialogue });
  }

  // 点击的位置和人物脚底都按原图坐标判断碰撞。
  function onMapClick(e) {
    if (isDialogueActive || e.target.closest('.npc-sprite') || !mapFrame) return;
    const rect = document.getElementById('game-map').getBoundingClientRect();
    const point = MapGeometry.fromScreen(mapFrame, e.clientX - rect.left, e.clientY - rect.top);
    if (!point) {
      UI.showToast('无法到达', 'info');
      return;
    }
    movePlayerTo(point);
  }

  function isPlayerNearNpc(npcId) {
    const npc = storyConfig.npcs.find(item => item.npcId === npcId);
    const slot = npc && API.getMapConfig(storyConfig.mapId).npcSlots[npc.slot];
    if (!slot || !playerPosition || !mapFrame) return false;
    const playerScreen = MapGeometry.toScreen(mapFrame, playerPosition);
    const npcScreen = MapGeometry.toScreen(mapFrame, slot);
    return Math.hypot(playerScreen.x - npcScreen.x, playerScreen.y - npcScreen.y) <= TALK_RANGE;
  }

  // 找到 NPC 附近确实可走且可抵达的位置，避免人物走进树、水或建筑。
  function onNpcClick(npcId) {
    if (isDialogueActive) return;
    const dialogue = storyConfig.dialogues[currentRound];
    if (!dialogue || dialogue.npcId !== npcId) {
      UI.showToast('这位NPC暂时没有要说的', 'info');
      return;
    }
    if (isPlayerNearNpc(npcId)) {
      startDialogue();
      return;
    }
    const npc = storyConfig.npcs.find(item => item.npcId === npcId);
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const slot = npc && mapConfig.npcSlots[npc.slot];
    if (!slot) return;
    const candidates = [
      { x: slot.x, y: slot.y + 0.06 },
      { x: slot.x - 0.05, y: slot.y + 0.015 },
      { x: slot.x + 0.05, y: slot.y + 0.015 },
      slot
    ];
    for (const point of candidates) {
      if (!MapGeometry.isWalkable(mapConfig, point.x, point.y, imageAspect)) continue;
      if (!MapGeometry.findPath(mapConfig, playerPosition, point, imageAspect).length) continue;
      movePlayerTo(point, () => { if (isPlayerNearNpc(npcId)) startDialogue(); });
      return;
    }
    UI.showToast('无法到达这位角色', 'info');
  }

  function movePlayerTo(target, callback) {
    if (!playerPosition || !mapFrame) return;
    if (moveAnimationId != null) cancelAnimationFrame(moveAnimationId);
    if (talkTimeoutId != null) clearTimeout(talkTimeoutId);
    moveAnimationId = null;
    talkTimeoutId = null;

    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const path = MapGeometry.findPath(mapConfig, playerPosition, target, imageAspect);
    if (!path.length) {
      UI.showToast('无法到达', 'info');
      return;
    }
    let pathIndex = 1;
    let lastTime = performance.now();
    function tick(now) {
      if (isDialogueActive || !document.getElementById('player')) {
        moveAnimationId = null;
        return;
      }
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const next = path[pathIndex];
      const currentScreen = MapGeometry.toScreen(mapFrame, playerPosition);
      const nextScreen = MapGeometry.toScreen(mapFrame, next);
      const distance = Math.hypot(nextScreen.x - currentScreen.x, nextScreen.y - currentScreen.y);
      const step = MOVE_SPEED * dt;
      if (distance <= step || distance < 1) {
        playerPosition = next;
        pathIndex++;
        placeAt(document.getElementById('player'), playerPosition);
        if (pathIndex >= path.length) {
          moveAnimationId = null;
          if (callback) talkTimeoutId = setTimeout(callback, 120);
          return;
        }
      } else {
        const ratio = step / distance;
        playerPosition = {
          x: playerPosition.x + (next.x - playerPosition.x) * ratio,
          y: playerPosition.y + (next.y - playerPosition.y) * ratio
        };
        placeAt(document.getElementById('player'), playerPosition);
      }
      moveAnimationId = requestAnimationFrame(tick);
    }
    moveAnimationId = requestAnimationFrame(tick);
  }

  // 开始对话
  function startDialogue() {
    isDialogueActive = true;  // 锁定移动
    
    const dialogue = storyConfig.dialogues[currentRound];
    const npcConfig = API.getNpcConfig(dialogue.npcId);
    
    // 切换NPC表情为惊讶
    const npcImg = document.querySelector(`#npc-${dialogue.npcId} .npc-image`);
    if (npcImg) {
      npcImg.src = npcImg.dataset.surprised;
    }
    
    dialogueStep = 'npc_speak';
    document.getElementById('dialogue-panel').classList.remove('hidden');
    
    // 高亮所有单词（可悬停翻译）
    const highlightedLine = highlightAllWords(dialogue.npcLine);
    
    document.getElementById('npc-dialogue').innerHTML = `
      <div class="bubble bubble-npc">
        <div class="flex items-center gap-2 mb-2">
          <img src="${npcConfig.images.head}" alt="${npcConfig.name}" class="w-10 h-10 rounded-full object-cover">
          <span class="font-bold text-gray-800">${npcConfig.name}</span>
        </div>
        <p class="text-gray-700 dialogue-text">${highlightedLine}</p>
        <button class="translate-btn" onclick="GameModule.toggleTranslation(this)">翻译</button>
        <div class="translation-text">${highlightAllWords(dialogue.npcLineCN)}</div>
      </div>
    `;
    
    renderOptions();
    bindAllWordTooltips();
    
    EventBus.emit(Events.DIALOGUE_START, { npcId: dialogue.npcId, round: currentRound + 1 });
  }

  // 高亮所有英文单词（使其可悬停翻译）
  function highlightAllWords(text) {
    // 先处理已有的 **word** 格式（关键词，红色）
    let result = text.replace(/\*\*(\w+)\*\*/g, (match, word) => {
      return `<span class="keyword word-hover" data-word="${word.toLowerCase()}">${word}</span>`;
    });
    
    // 再处理其他英文单词（普通样式，可悬停）
    result = result.replace(/\b([a-zA-Z]{2,})\b(?![^<]*>)/g, (match, word) => {
      // 跳过已经被处理的关键词
      if (result.includes(`data-word="${word.toLowerCase()}"`)) {
        return match;
      }
      return `<span class="word-hover" data-word="${word.toLowerCase()}">${word}</span>`;
    });
    
    return result;
  }

  // 绑定单词点击 → 打开释义弹层（网络查词 + 缓存，支持手机）
  function bindAllWordTooltips() {
    UI.bindWordClick(document.body);
  }

  // 渲染选项
  function renderOptions() {
    const optionsEl = document.getElementById('player-options');
    
    optionsEl.innerHTML = availableOptions.map(opt => {
      const highlightedText = highlightAllWords(opt.text);
      return `
        <button class="option-btn" data-option-id="${opt.id}" onclick="GameModule.selectOption('${opt.id}')">
          <strong>${opt.id}:</strong> ${highlightedText}
        </button>
      `;
    }).join('');
    
    bindAllWordTooltips();
  }

  // 选择选项
  function selectOption(optionId) {
    const dialogue = storyConfig.dialogues[currentRound];
    const option = dialogue.options.find(o => o.id === optionId);
    const npcConfig = API.getNpcConfig(dialogue.npcId);
    
    if (!option) return;
    
    EventBus.emit(Events.DIALOGUE_OPTION_SELECT, { optionId, isCorrect: option.isCorrect });
    
    if (option.isCorrect) {
      document.querySelector(`[data-option-id="${optionId}"]`).classList.add('correct');
      
      answers.push({
        round: currentRound + 1,
        npcId: dialogue.npcId,
        selectedOption: optionId,
        isCorrect: true,
        attempts: dialogue.options.length - availableOptions.length + 1
      });
      
      setTimeout(() => {
        showCorrectResponse(dialogue, npcConfig);
      }, 500);
    } else {
      errorCount++;
      Store.set('session.errorCount', errorCount);
      
      const btn = document.querySelector(`[data-option-id="${optionId}"]`);
      btn.classList.add('wrong', 'disabled');
      
      availableOptions = availableOptions.filter(o => o.id !== optionId);
      
      const highlightedError = highlightAllWords(option.errorReply);
      document.getElementById('npc-dialogue').innerHTML += `
        <div class="bubble bubble-npc mt-3 bg-red-50 border-red-200">
          <p class="text-red-700">${highlightedError}</p>
        </div>
      `;
      
      bindAllWordTooltips();
    }
  }

  // 显示正确响应
  function showCorrectResponse(dialogue, npcConfig) {
    const highlightedReply = highlightAllWords(dialogue.correctReply);
    
    document.getElementById('npc-dialogue').innerHTML = `
      <div class="bubble bubble-npc">
        <div class="flex items-center gap-2 mb-2">
          <img src="${npcConfig.images.head}" alt="${npcConfig.name}" class="w-10 h-10 rounded-full object-cover">
          <span class="font-bold text-gray-800">${npcConfig.name}</span>
        </div>
        <p class="text-gray-700">${highlightedReply}</p>
        <button class="translate-btn" onclick="GameModule.toggleTranslation(this)">翻译</button>
        <div class="translation-text">${highlightAllWords(dialogue.correctReplyCN)}</div>
      </div>
    `;
    
    document.getElementById('player-options').innerHTML = `
      <button class="btn-3d btn-green w-full" onclick="GameModule.nextRound()">继续 →</button>
    `;
    
    bindAllWordTooltips();
    
    EventBus.emit(Events.DIALOGUE_COMPLETE, { round: currentRound + 1 });
  }

  // 下一回合
  function nextRound() {
    isDialogueActive = false;  // 解除移动锁定
    document.getElementById('dialogue-panel').classList.add('hidden');
    currentRound++;
    Store.set('session.currentRound', currentRound);
    
    EventBus.emit(Events.ROUND_END, { round: currentRound });
    startRound();
  }

  // 切换翻译
  function toggleTranslation(btn) {
    const translationEl = btn.nextElementSibling;
    translationEl.classList.toggle('show');
    btn.textContent = translationEl.classList.contains('show') ? '收起' : '翻译';
  }

  // 结束游戏
  function endGame() {
    const previewMapId = Store.get('session.mapPreviewId');
    if (previewMapId) {
      Store.resetSession();
      Router.go('mapEditor', { mapId: previewMapId });
      UI.showToast('地图试玩结束', 'success');
      return;
    }
    Store.set('session.answers', answers);
    
    EventBus.emit(Events.GAME_END, {
      errorCount,
      answers,
      totalRounds: storyConfig.dialogues.length,
      duration: Date.now() - Store.get('session.startTime')
    });
  }

  // 退出游戏
  async function quitGame() {
    const previewMapId = Store.get('session.mapPreviewId');
    const confirmed = await UI.confirm(previewMapId ? '结束试玩并返回地图编辑？' : '确定要退出吗？进度将丢失。');
    if (confirmed) {
      Store.resetSession();
      Router.go(previewMapId ? 'mapEditor' : 'auth', previewMapId ? { mapId: previewMapId } : {});
    }
  }

  // 绑定事件
  function bindEvents() {
    document.getElementById('btn-bgm')?.addEventListener('click', () => {
      const enabled = !Store.get('ui.bgmEnabled');
      Store.set('ui.bgmEnabled', enabled);
      document.getElementById('btn-bgm').textContent = enabled ? '🔊' : '🔇';
    });
    
    document.getElementById('btn-quit')?.addEventListener('click', quitGame);
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      storyConfig = Store.get('session.storyConfig') || MOCK_CONFIG.storyConfig;
      wordPack = Store.get('session.wordPack') || MOCK_CONFIG.wordPack;
      currentRound = 0;
      errorCount = 0;
      answers = [];
      isDialogueActive = false;
      mapInitialized = false;
      mapFrame = null;
      playerPosition = null;
      
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'game' });
    },

    unmount() {
      if (moveAnimationId != null) {
        cancelAnimationFrame(moveAnimationId);
        moveAnimationId = null;
      }
      if (talkTimeoutId != null) {
        clearTimeout(talkTimeoutId);
        talkTimeoutId = null;
      }
      if (mapResizeObserver) {
        mapResizeObserver.disconnect();
        mapResizeObserver = null;
      }
      const mapBg = document.getElementById('map-bg');
      if (mapBg) mapBg.onload = null;
      mapInitialized = false;
      mapFrame = null;
      playerPosition = null;
      container = null;
      isDialogueActive = false;
    },

    // 暴露给 HTML 调用的方法
    selectOption,
    nextRound,
    toggleTranslation
  };
})();
