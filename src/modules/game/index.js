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
  let mapWidth = 0;
  let mapHeight = 0;

  // 寻路：网格与速度
  const GRID_COLS = 48;
  const GRID_ROWS = 64;
  const MOVE_SPEED = 140;  // 像素/秒
  let moveAnimationId = null;

  // 点在多边形内（射线法）
  function pointInPolygon(x, y, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  // 网格格子在可行走矩形内且不在障碍多边形内
  function isWalkable(mapConfig, gx, gy) {
    const x = (gx + 0.5) / GRID_COLS;
    const y = (gy + 0.5) / GRID_ROWS;
    const b = mapConfig.walkableBounds;
    if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) return false;
    const blocked = mapConfig.blockedPolygons || [];
    for (let i = 0; i < blocked.length; i++) {
      if (pointInPolygon(x, y, blocked[i])) return false;
    }
    return true;
  }

  // 点 (0-1) 是否在可行走区域内
  function isPointWalkable(mapConfig, x, y) {
    const b = mapConfig.walkableBounds;
    if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) return false;
    const blocked = mapConfig.blockedPolygons || [];
    for (let i = 0; i < blocked.length; i++) {
      if (pointInPolygon(x, y, blocked[i])) return false;
    }
    return true;
  }

  // 若出生点落在障碍内，返回最近的可行走点 (0-1)
  function ensureWalkableSpawn(mapConfig, x, y) {
    if (isPointWalkable(mapConfig, x, y)) return { x, y };
    let best = { x, y };
    let bestDist = Infinity;
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        if (!isWalkable(mapConfig, gx, gy)) continue;
        const cx = (gx + 0.5) / GRID_COLS;
        const cy = (gy + 0.5) / GRID_ROWS;
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = { x: cx, y: cy };
        }
      }
    }
    return best;
  }

  // A* 寻路，起点终点为地图像素坐标，返回玩家坐标序列 [ {left, top}, ... ]
  function findPath(mapConfig, startMapX, startMapY, endMapX, endMapY) {
    const toGrid = (px, py) => ({
      gx: Math.floor((px / mapWidth) * GRID_COLS),
      gy: Math.floor((py / mapHeight) * GRID_ROWS)
    });
    const toPlayer = (gx, gy) => ({
      left: ((gx + 0.5) / GRID_COLS) * mapWidth - 25,
      top: ((gy + 0.5) / GRID_ROWS) * mapHeight - 30
    });
    const clampGrid = (gx, gy) => ({
      gx: Math.max(0, Math.min(GRID_COLS - 1, gx)),
      gy: Math.max(0, Math.min(GRID_ROWS - 1, gy))
    });

    const s = clampGrid(toGrid(startMapX, startMapY).gx, toGrid(startMapX, startMapY).gy);
    const e = clampGrid(toGrid(endMapX, endMapY).gx, toGrid(endMapX, endMapY).gy);
    if (!isWalkable(mapConfig, e.gx, e.gy)) return [];

    const neighbors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const open = [{ gx: s.gx, gy: s.gy, f: 0, g: 0 }];
    const cameFrom = {};
    const gScore = { [`${s.gx},${s.gy}`]: 0 };

    const key = (gx, gy) => `${gx},${gy}`;
    const heuristic = (a, b) => Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.gx === e.gx && cur.gy === e.gy) {
        const path = [];
        let c = cur;
        while (c) {
          path.unshift(toPlayer(c.gx, c.gy));
          c = cameFrom[key(c.gx, c.gy)];
        }
        return path;
      }
      for (const [dx, dy] of neighbors) {
        const nx = cur.gx + dx;
        const ny = cur.gy + dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        if (!isWalkable(mapConfig, nx, ny)) continue;
        const tentative = (gScore[key(cur.gx, cur.gy)] || 0) + 1;
        const nk = key(nx, ny);
        if (tentative >= (gScore[nk] ?? Infinity)) continue;
        cameFrom[nk] = cur;
        gScore[nk] = tentative;
        open.push({ gx: nx, gy: ny, g: tentative, f: tentative + heuristic({ gx: nx, gy: ny }, e) });
      }
    }
    return [];
  }

  // 渲染页面
  function render() {
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const user = Store.get('user');
    
    container.innerHTML = `
      <!-- 顶部：软件名称 + 操作按钮 -->
      <div class="bg-white px-4 py-2 flex justify-between items-center border-b">
        <div class="font-bold text-gray-800 pixel-font">词境历险</div>
        <div class="flex gap-2">
          <button id="btn-bgm" class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            🔊
          </button>
          <button id="btn-quit" class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
            ✕
          </button>
        </div>
      </div>
      
      <!-- 游戏地图区域 -->
      <div id="game-map" class="relative flex-1 overflow-hidden">
        <img id="map-bg" src="${mapConfig.image}" alt="Map" 
             class="absolute inset-0 w-full h-full object-cover">
        <!-- NPC 和玩家将由 JS 动态生成 -->
      </div>
      
      <!-- 对话面板 -->
      <div id="dialogue-panel" class="hidden">
        <div id="npc-dialogue" class="mb-4"></div>
        <div id="player-options"></div>
      </div>
    `;

    // 等待图片加载后初始化地图
    const mapBg = document.getElementById('map-bg');
    mapBg.onload = () => {
      initMap();
    };
    
    // 如果图片已缓存
    if (mapBg.complete) {
      initMap();
    }
    
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

  // 初始化地图
  function initMap() {
    const mapEl = document.getElementById('game-map');
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const user = Store.get('user');
    
    mapWidth = mapEl.offsetWidth;
    mapHeight = mapEl.offsetHeight;
    
    // 放置 NPC
    storyConfig.npcs.forEach(npc => {
      const npcConfig = API.getNpcConfig(npc.npcId);
      const slotPos = mapConfig.npcSlots[npc.slot];
      
      if (!slotPos || !npcConfig) return;
      
      const x = slotPos.x * mapWidth;
      const y = slotPos.y * mapHeight;
      
      const npcEl = document.createElement('div');
      npcEl.className = 'npc-sprite';
      npcEl.id = `npc-${npc.npcId}`;
      npcEl.style.left = (x - 30) + 'px';
      npcEl.style.top = (y - 40) + 'px';
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
    
    // 放置玩家（若配置的出生点在障碍内，自动挪到最近可行走点）
    const playerPos = ensureWalkableSpawn(mapConfig, mapConfig.playerStart.x, mapConfig.playerStart.y);
    const playerX = playerPos.x * mapWidth;
    const playerY = playerPos.y * mapHeight;
    
    const playerEl = document.createElement('div');
    playerEl.className = 'player-sprite';
    playerEl.id = 'player';
    playerEl.style.left = (playerX - 25) + 'px';
    playerEl.style.top = (playerY - 30) + 'px';
    
    const avatarMap = { boy: 'assets/player/player_boy.png', girl: 'assets/player/player_girl.png' };
    const avatarImg = user?.isGuest
      ? 'assets/player/player_guest.png'
      : (avatarMap[user?.avatar] || 'assets/player/player_guest.png');

    playerEl.innerHTML = `
      <div class="player-name-top">${user?.nickname || '游客'}</div>
      <img src="${avatarImg}" alt="Player" class="player-image">
    `;
    mapEl.appendChild(playerEl);
    
    // 地图点击事件
    mapEl.addEventListener('click', onMapClick);
    
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

  // 地图点击（移动玩家）
  function onMapClick(e) {
    // 对话中不能移动
    if (isDialogueActive) return;
    if (e.target.closest('.npc-sprite')) return;
    
    const rect = document.getElementById('game-map').getBoundingClientRect();
    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const bounds = mapConfig.walkableBounds;
    
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // 应用边界限制
    const minX = bounds.minX * mapWidth;
    const maxX = bounds.maxX * mapWidth;
    const minY = bounds.minY * mapHeight;
    const maxY = bounds.maxY * mapHeight;
    
    x = Math.max(minX, Math.min(maxX - 50, x));
    y = Math.max(minY, Math.min(maxY - 60, y));
    
    // 检查是否在障碍区内（比例坐标 0-1）
    const rx = x / mapWidth;
    const ry = y / mapHeight;
    const blocked = mapConfig.blockedPolygons || [];
    for (let i = 0; i < blocked.length; i++) {
      if (pointInPolygon(rx, ry, blocked[i])) {
        UI.showToast('无法到达', 'info');
        return;
      }
    }
    
    movePlayerTo(x - 25, y - 30);
  }

  // 玩家与 NPC 的“可对话”距离（像素）
  const TALK_RANGE = 100;

  // 玩家是否在 NPC 对话范围内
  function isPlayerNearNpc(npcId) {
    const player = document.getElementById('player');
    const npcEl = document.getElementById(`npc-${npcId}`);
    if (!player || !npcEl) return false;
    const px = parseFloat(player.style.left) + 25;
    const py = parseFloat(player.style.top) + 30;
    const nx = parseFloat(npcEl.style.left) + 30;
    const ny = parseFloat(npcEl.style.top) + 40;
    return Math.hypot(px - nx, py - ny) <= TALK_RANGE;
  }

  // NPC 点击：先移动到 NPC 附近，到达且距离足够近后才开始对话
  function onNpcClick(npcId) {
    if (isDialogueActive) return;
    
    const dialogue = storyConfig.dialogues[currentRound];
    
    if (!dialogue || dialogue.npcId !== npcId) {
      UI.showToast('这位NPC暂时没有要说的', 'info');
      return;
    }
    
    const npcEl = document.getElementById(`npc-${npcId}`);
    const npcLeft = parseFloat(npcEl.style.left);
    const npcTop = parseFloat(npcEl.style.top);
    const targetLeft = npcLeft;
    const targetTop = npcTop + 80;
    
    // 已在对话范围内则直接开始对话
    if (isPlayerNearNpc(npcId)) {
      startDialogue();
      return;
    }
    
    // 否则先移动过去，到达后再检查距离并开始对话
    movePlayerTo(targetLeft, targetTop, () => {
      if (isPlayerNearNpc(npcId)) {
        startDialogue();
      }
    });
  }

  // 沿路径动画移动玩家（目标为玩家元素 left/top）
  function movePlayerTo(targetLeft, targetTop, callback) {
    const player = document.getElementById('player');
    if (!player) return;

    if (moveAnimationId != null) {
      cancelAnimationFrame(moveAnimationId);
      moveAnimationId = null;
    }

    const curLeft = parseFloat(player.style.left) || 0;
    const curTop = parseFloat(player.style.top) || 0;
    const dist = Math.hypot(targetLeft - curLeft, targetTop - curTop);
    if (dist < 4) {
      player.style.left = targetLeft + 'px';
      player.style.top = targetTop + 'px';
      if (callback) setTimeout(callback, 200);
      return;
    }

    const mapConfig = API.getMapConfig(storyConfig.mapId);
    const path = findPath(
      mapConfig,
      curLeft + 25, curTop + 30,
      targetLeft + 25, targetTop + 30
    );

    if (path.length === 0) {
      UI.showToast('无法到达', 'info');
      return;
    }

    let pathIndex = 0;
    let lastTime = performance.now();

    function tick(now) {
      if (isDialogueActive) {
        moveAnimationId = null;
        return;
      }
      const playerEl = document.getElementById('player');
      if (!playerEl) {
        moveAnimationId = null;
        return;
      }
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const left = parseFloat(playerEl.style.left) || 0;
      const top = parseFloat(playerEl.style.top) || 0;
      const next = path[pathIndex];
      const dx = next.left - left;
      const dy = next.top - top;
      const d = Math.hypot(dx, dy);
      const step = MOVE_SPEED * Math.min(dt, 0.1);
      if (d <= step || d < 1) {
        playerEl.style.left = next.left + 'px';
        playerEl.style.top = next.top + 'px';
        pathIndex++;
        if (pathIndex >= path.length) {
          moveAnimationId = null;
          if (callback) setTimeout(callback, 200);
          return;
        }
      } else {
        playerEl.style.left = (left + (dx / d) * step) + 'px';
        playerEl.style.top = (top + (dy / d) * step) + 'px';
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

  // 绑定所有单词的悬停提示
  function bindAllWordTooltips() {
    document.querySelectorAll('.word-hover').forEach(el => {
      const word = el.dataset.word;
      
      // 先从 wordPack 查找
      let wordData = wordPack.find(w => w.word.toLowerCase() === word);
      
      // 如果没找到，尝试异步查询
      el.addEventListener('mouseenter', async (e) => {
        if (!wordData) {
          wordData = await API.lookupWord(word);
        }
        if (wordData) {
          UI.showWordTooltip(wordData, e.clientX, e.clientY);
        }
      });
      
      el.addEventListener('mouseleave', UI.hideWordTooltip);
    });
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
    const confirmed = await UI.confirm('确定要退出吗？进度将丢失。');
    if (confirmed) {
      Store.resetSession();
      Router.go('auth');
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
      
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'game' });
    },

    unmount() {
      if (moveAnimationId != null) {
        cancelAnimationFrame(moveAnimationId);
        moveAnimationId = null;
      }
      container = null;
      isDialogueActive = false;
    },

    // 暴露给 HTML 调用的方法
    selectOption,
    nextRound,
    toggleTranslation
  };
})();
