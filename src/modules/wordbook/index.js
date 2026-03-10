/**
 * 模块二：词库管理
 * - 添加单词页：查询释义 + 单词选择（仅显示查询出的单词，勾选即进入选择）
 * - 我的词库页：按熟悉程度排序 + 选词 + 删除确认
 * - 选词后不跳回顶部（DOM 原地更新）
 */

const WordbookModule = (function() {
  let container = null;
  let myWordbook   = [];   // 我的词库（{word,phonetic,partOfSpeech,definition,familiarity}）
  let selectedWords = [];  // 选中要学习的单词
  let currentTab   = 'add';
  let pendingWord  = null; // 添加单词页面查到的待选单词
  let queriedWords = [];   // 单词选择列表：仅包含本次会话查询过的单词
  let invalidQueryWord = null; // 最近一次未找到释义的查询（仅做提示，不入词库、不可选）
  let difficulty = 'intermediate'; // 难度：elementary | intermediate | advanced

  /** 从 wordData 生成词库快照（含 updatedAt，不存 networkUnavailable/notFound） */
  function toWordbookSnapshot(wordData) {
    const snap = {
      word: wordData.word,
      phonetic: wordData.phonetic || '',
      partOfSpeech: wordData.partOfSpeech || '',
      definition: wordData.definition || '（暂无释义）',
      familiarity: wordData.familiarity ?? 0,
      updatedAt: new Date().toISOString()
    };
    if (wordData.examples && wordData.examples.length) snap.examples = wordData.examples;
    return snap;
  }

  /* ===== localStorage ===== */
  function loadMyWordbook() {
    const userId = Store.get('user')?.id || 'guest';
    const saved = localStorage.getItem(`wordquest_wordbook_${userId}`);
    myWordbook = saved ? JSON.parse(saved) : [];
    myWordbook.forEach(w => { if (w.familiarity === undefined) w.familiarity = 0; });
  }

  function saveMyWordbook() {
    const userId = Store.get('user')?.id || 'guest';
    localStorage.setItem(`wordquest_wordbook_${userId}`, JSON.stringify(myWordbook));
  }

  /* ===== 熟悉程度（0-5）工具 ===== */
  function familiarityLabel(f) {
    const labels = ['陌生', '初识', '了解', '熟悉', '掌握', '精通'];
    return labels[Math.min(f, 5)] || '陌生';
  }

  function familiarityDots(f) {
    const filled = Math.min(f, 5);
    const colors  = ['bg-gray-300','bg-red-400','bg-orange-400','bg-yellow-400','bg-blue-400','bg-green-500'];
    const dotColor = colors[filled] || 'bg-gray-300';
    let dots = '';
    for (let i = 0; i < 5; i++) {
      dots += `<span class="inline-block w-2 h-2 rounded-full mx-0.5 ${i < filled ? dotColor : 'bg-gray-200'}"></span>`;
    }
    return dots;
  }

  /* ===== 获取按熟悉程度排序的词库（低熟悉度在前） ===== */
  function getSortedWordbook() {
    return [...myWordbook].sort((a, b) => (a.familiarity || 0) - (b.familiarity || 0));
  }

  /* ===== 渲染整页 ===== */
  function render() {
    const sortedBook = getSortedWordbook();

    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">词境历险</span>
      </div>

      <div class="flex-1 overflow-y-auto px-4 pb-4" id="wb-scroll-area">
        <!-- 标签页 -->
        <div class="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${currentTab === 'add' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            data-tab="add">➕ 添加单词</button>
          <button class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${currentTab === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            data-tab="select">📚 我的词库 (${myWordbook.length})</button>
        </div>

        <!-- ===== 添加单词面板 ===== -->
        <div id="add-panel" class="${currentTab === 'add' ? '' : 'hidden'}">
          <div class="card mb-3">
            <h3 class="font-bold text-gray-700 mb-2">输入新单词</h3>
            <div class="flex gap-2">
              <input type="text" id="word-input" class="input-field flex-1"
                placeholder="输入英文单词" autocomplete="off" spellcheck="false">
              <button id="btn-lookup" class="btn-3d btn-blue px-4">查询</button>
            </div>
          </div>

          <!-- 查询结果：释义 或 此单词无效 -->
          <div id="lookup-result" class="mb-3 ${(pendingWord || invalidQueryWord) ? '' : 'hidden'}">
            ${pendingWord ? renderPendingWord() : invalidQueryWord ? renderInvalidWord() : ''}
          </div>

          <!-- 单词选择：仅显示查询出的单词，勾选即进入选择 -->
          <div class="card mb-3">
            <h3 class="font-bold text-gray-700 text-sm mb-2">📋 单词选择</h3>
            <div id="queried-words-list" class="space-y-1 max-h-48 overflow-y-auto">
              ${renderQueriedWordsList()}
            </div>
          </div>
        </div>

        <!-- ===== 我的词库面板 ===== -->
        <div id="select-panel" class="${currentTab === 'select' ? '' : 'hidden'}">
          ${myWordbook.length === 0 ? `
            <div class="text-center py-8 text-gray-400">
              <div class="text-4xl mb-2">📝</div>
              <p>词库为空，请先添加一些单词</p>
            </div>
          ` : `
            <div class="card mb-3">
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-gray-700 text-sm">选择要学习的单词</h3>
                <span class="text-sm text-gray-500 selection-count">${selectedWords.length}/10</span>
              </div>
              <p class="text-xs text-gray-400 mb-3">按熟悉程度排列 · 选择 3-10 个开始冒险</p>

              <div id="wordbook-list" class="space-y-2 max-h-[320px] overflow-y-auto">
                ${renderWordbookList(sortedBook)}
              </div>
            </div>

            <div class="flex gap-2 mb-1">
              <button id="btn-select-all" class="flex-1 text-sm text-blue-500 py-2">全选</button>
              <button id="btn-clear-selection" class="flex-1 text-sm text-gray-500 py-2">清空选择</button>
            </div>
          `}
        </div>
      </div>

      <!-- 底部按钮 + 难度选择 -->
      <div class="p-4 space-y-2">
        <div class="flex gap-2 items-stretch">
          <button id="btn-start-game" class="btn-3d btn-green flex-1 shrink-0"
            ${selectedWords.length < 3 ? 'disabled' : ''}>
            开始冒险 (${selectedWords.length}/10)
          </button>
          <div class="flex rounded-lg overflow-hidden border border-gray-200 shrink-0" role="group" aria-label="难度">
            <button type="button" class="difficulty-option px-2 py-2 text-xs font-medium min-w-[52px] transition-colors
              ${difficulty === 'elementary' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}" data-difficulty="elementary">初级</button>
            <button type="button" class="difficulty-option px-2 py-2 text-xs font-medium min-w-[52px] transition-colors
              ${difficulty === 'intermediate' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}" data-difficulty="intermediate">中级</button>
            <button type="button" class="difficulty-option px-2 py-2 text-xs font-medium min-w-[52px] transition-colors
              ${difficulty === 'advanced' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}" data-difficulty="advanced">高级</button>
          </div>
        </div>
        <button id="btn-back" class="btn-3d btn-gray w-full">← 返回</button>
      </div>
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;

    bindEvents();
  }

  /* ===== 未找到释义时的提示（不入词库、不可选） ===== */
  function renderInvalidWord() {
    if (!invalidQueryWord) return '';
    return `
      <div class="card border border-amber-200 bg-amber-50">
        <div class="flex items-center gap-2">
          <span class="font-bold text-gray-800">${invalidQueryWord}</span>
          <span class="text-amber-600 text-sm">此单词无效</span>
        </div>
        <p class="text-gray-500 text-xs mt-1">未找到释义，无法加入词库与选择</p>
      </div>
    `;
  }

  /* ===== 渲染查询结果：仅显示释义，选词请用下方「单词选择」 ===== */
  function renderPendingWord() {
    if (!pendingWord) return '';
    const defText = (pendingWord.definition || '').replace(/\r?\n/g, ' ');
    const tagLabel = (pendingWord.tag && typeof window.DictModule !== 'undefined' && window.DictModule.formatTag)
      ? window.DictModule.formatTag(pendingWord.tag)
      : (pendingWord.tag || '');
    return `
      <div class="card border border-gray-200">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <span class="font-bold text-gray-800">${pendingWord.word}</span>
          <span class="text-gray-400 text-xs">${pendingWord.phonetic || ''}</span>
          <span class="text-gray-500 text-xs">${pendingWord.partOfSpeech || ''}</span>
          ${tagLabel ? `<span class="text-gray-400 text-xs">${tagLabel}</span>` : ''}
        </div>
        <div class="text-gray-600 text-sm" style="white-space: pre-wrap;">${defText}</div>
        <p class="text-gray-400 text-xs mt-2">已存入词库，需选词请在下方「单词选择」中勾选</p>
      </div>
    `;
  }

  /* ===== 渲染单词选择列表（仅查询过的单词） ===== */
  function renderQueriedWordsList() {
    if (queriedWords.length === 0) {
      return '<p class="text-gray-400 text-sm py-4 text-center">请先查询单词，勾选后将出现在此处</p>';
    }
    return queriedWords.map(w => {
      const isSelected = selectedWords.some(s => s.word === w.word);
      const defText = (w.definition || '').replace(/\r?\n/g, ' ').slice(0, 60);
      return `
        <div class="queried-word-item flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer
          ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}" data-word="${w.word}">
          <div class="word-checkbox-queried w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 text-xs
            ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}">
            ${isSelected ? '✓' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-medium text-gray-800 text-sm">${w.word}</span>
            <span class="text-gray-400 text-xs ml-1">${w.phonetic || ''}</span>
            <span class="text-gray-500 text-xs block truncate">${w.partOfSpeech ? w.partOfSpeech + ' ' : ''}${defText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ===== 渲染词库列表 ===== */
  function renderWordbookList(sortedBook) {
    return sortedBook.map((word, displayIdx) => {
      // 找到原始 index（用于删除/选择操作用原始 myWordbook）
      const realIdx = myWordbook.findIndex(w => w.word === word.word);
      const isSelected = selectedWords.some(s => s.word === word.word);
      return `
        <div class="wordbook-item flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer
          ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}"
          data-index="${realIdx}" data-word="${word.word}">
          <div class="word-checkbox w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center
            ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'} text-sm">
            ${isSelected ? '✓' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-800">${word.word}</span>
              <span class="text-gray-400 text-xs">${word.phonetic || ''}</span>
            </div>
            <div class="text-gray-500 text-xs truncate">${word.partOfSpeech || ''} ${word.definition || ''}</div>
            <div class="flex items-center gap-1 mt-0.5">
              ${familiarityDots(word.familiarity || 0)}
              <span class="text-xs text-gray-400 ml-1">${familiarityLabel(word.familiarity || 0)}</span>
            </div>
          </div>
          <button class="delete-word flex-shrink-0 text-gray-300 hover:text-red-400 text-xl leading-none"
            data-word="${word.word}" title="删除">×</button>
        </div>
      `;
    }).join('');
  }

  /* ===== 查询单词 ===== */
  async function lookupWord(wordStr) {
    wordStr = wordStr.trim().toLowerCase();
    if (!wordStr) { UI.showToast('请输入单词', 'error'); return; }
    if (!/^[a-zA-Z''\-]+$/.test(wordStr)) { UI.showToast('请输入有效的英文单词', 'error'); return; }

    UI.showLoading('查询中...');
    try {
      const wordData = await API.lookupWord(wordStr);
      UI.hideLoading();
      if (wordData.notFound) {
        UI.showToast('此单词无效', 'error');
        pendingWord = null;
        invalidQueryWord = wordStr;
        render();
        document.getElementById('lookup-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (wordData.networkUnavailable) UI.showToast('网络不可用', 'error');
      invalidQueryWord = null;
      pendingWord = { ...wordData, familiarity: 0 };
      const existing = queriedWords.findIndex(w => w.word.toLowerCase() === pendingWord.word.toLowerCase());
      if (existing >= 0) queriedWords[existing] = pendingWord;
      else queriedWords.push(pendingWord);
      if (!myWordbook.some(w => w.word.toLowerCase() === pendingWord.word.toLowerCase())) {
        myWordbook.push(toWordbookSnapshot({ ...pendingWord, familiarity: 0 }));
        saveMyWordbook();
      }
      render();
      document.getElementById('lookup-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      UI.hideLoading();
      UI.showToast('查询失败', 'error');
    }
  }

  /* ===== 切换选择（单词选择列表 / 词库词） ===== */
  function toggleWord(wordData) {
    const idx = selectedWords.findIndex(w => w.word === wordData.word);
    if (idx > -1) {
      selectedWords.splice(idx, 1);
    } else if (selectedWords.length >= 10) {
      UI.showToast('最多选择10个单词', 'info');
      return false;
    } else {
      // 若词库中没有此词，自动添加（存快照）
      if (!myWordbook.some(w => w.word === wordData.word)) {
        myWordbook.push(toWordbookSnapshot({ ...wordData, familiarity: 0 }));
        saveMyWordbook();
      }
      selectedWords.push(wordData);
    }
    return true;
  }

  /* ===== 词库列表原地更新（不滚动到顶部） ===== */
  function updateWordbookItem(wordStr) {
    const isSelected = selectedWords.some(w => w.word === wordStr);
    const itemEl = document.querySelector(`.wordbook-item[data-word="${wordStr}"]`);
    if (!itemEl) return;

    // 更新容器样式
    itemEl.classList.toggle('bg-blue-50', isSelected);
    itemEl.classList.toggle('border', isSelected);
    itemEl.classList.toggle('border-blue-200', isSelected);
    itemEl.classList.toggle('bg-gray-50', !isSelected);
    itemEl.classList.toggle('hover:bg-gray-100', !isSelected);

    // 更新勾选框
    const cb = itemEl.querySelector('.word-checkbox');
    if (cb) {
      cb.classList.toggle('bg-blue-500', isSelected);
      cb.classList.toggle('border-blue-500', isSelected);
      cb.classList.toggle('text-white', isSelected);
      cb.classList.toggle('border-gray-300', !isSelected);
      cb.textContent = isSelected ? '✓' : '';
    }

    updateBottomBar();
  }

  /* ===== 更新底部按钮 ===== */
  function updateBottomBar() {
    const btn = document.getElementById('btn-start-game');
    if (btn) {
      btn.disabled = selectedWords.length < 3;
      btn.textContent = `开始冒险 (${selectedWords.length}/10)`;
    }
    const countEl = document.querySelector('.selection-count');
    if (countEl) countEl.textContent = `${selectedWords.length}/10`;
  }

  /* ===== 删除单词（内联确认） ===== */
  function showDeleteConfirm(wordStr, btnEl) {
    const item = btnEl.closest('.wordbook-item');
    if (!item) return;
    if (item.querySelector('.delete-confirm')) return; // 已显示

    btnEl.classList.add('hidden');
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'delete-confirm flex gap-1 flex-shrink-0';
    confirmDiv.innerHTML = `
      <button class="confirm-yes text-xs text-white bg-red-500 px-2 py-1 rounded">确认删除</button>
      <button class="confirm-no  text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">取消</button>
    `;
    confirmDiv.querySelector('.confirm-yes').onclick = e => {
      e.stopPropagation();
      myWordbook = myWordbook.filter(w => w.word !== wordStr);
      selectedWords = selectedWords.filter(w => w.word !== wordStr);
      saveMyWordbook();
      item.remove();
      updateBottomBar();
      // 更新标签页计数
      const tabBtn = document.querySelector('[data-tab="select"]');
      if (tabBtn) tabBtn.textContent = `📚 我的词库 (${myWordbook.length})`;
    };
    confirmDiv.querySelector('.confirm-no').onclick = e => {
      e.stopPropagation();
      btnEl.classList.remove('hidden');
      confirmDiv.remove();
    };
    item.appendChild(confirmDiv);
  }

  /* ===== 全选 / 清空 ===== */
  function selectAll() {
    selectedWords = getSortedWordbook().slice(0, 10);
    document.querySelectorAll('.wordbook-item').forEach(el => {
      updateWordbookItem(el.dataset.word);
    });
    updateBottomBar();
  }

  function clearSelection() {
    selectedWords = [];
    document.querySelectorAll('.wordbook-item').forEach(el => {
      updateWordbookItem(el.dataset.word);
    });
    updateBottomBar();
  }

  /* ===== 开始冒险 ===== */
  function startGame() {
    if (selectedWords.length < 3) {
      UI.showToast('请至少选择3个单词', 'error');
      return;
    }
    const user = Store.get('user');
    if (user && user.tier !== 'vip' && !user.isGuest) {
      Store.set('user.gamesRemaining', Math.max(0, (user.gamesRemaining || 0) - 1));
    }
    EventBus.emit(Events.GAME_START, { wordPack: selectedWords, difficulty });
  }

  /* ===== 绑定事件 ===== */
  function bindEvents() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        render();
      });
    });

    // 查询按钮
    document.getElementById('btn-lookup')?.addEventListener('click', () => {
      const input = document.getElementById('word-input');
      lookupWord(input.value);
    });

    // 回车查询
    document.getElementById('word-input')?.addEventListener('keypress', e => {
      if (e.key === 'Enter') lookupWord(e.target.value);
    });

    // 单词选择列表：点击项或复选框即勾选/取消，直接进入选择
    bindQueriedWordsEvents();

    // 词库项：选择 + 删除
    document.querySelectorAll('.wordbook-item').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.delete-word') || e.target.closest('.delete-confirm')) return;
        const wordStr = item.dataset.word;
        const realIdx = parseInt(item.dataset.index);
        const wordData = myWordbook[realIdx];
        if (!wordData) return;
        if (toggleWord(wordData)) {
          updateWordbookItem(wordStr);
        }
      });
    });

    document.querySelectorAll('.delete-word').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        showDeleteConfirm(btn.dataset.word, btn);
      });
    });

    // 全选 / 清空
    document.getElementById('btn-select-all')?.addEventListener('click', selectAll);
    document.getElementById('btn-clear-selection')?.addEventListener('click', clearSelection);

    // 开始冒险 / 返回
    document.getElementById('btn-start-game')?.addEventListener('click', startGame);
    document.getElementById('btn-back')?.addEventListener('click', () => Router.back());

    // 难度滑块
    document.querySelectorAll('.difficulty-option').forEach(btn => {
      btn.addEventListener('click', () => {
        difficulty = btn.dataset.difficulty;
        render();
      });
    });
  }

  /* ===== 单词选择列表事件：勾选即进入选择 ===== */
  function bindQueriedWordsEvents() {
    document.querySelectorAll('.queried-word-item').forEach(el => {
      el.addEventListener('click', () => {
        const wordStr = el.dataset.word;
        const wordData = queriedWords.find(w => w.word === wordStr);
        if (!wordData) return;
        if (toggleWord(wordData)) {
          const isSelected = selectedWords.some(w => w.word === wordStr);
          el.classList.toggle('bg-blue-50', isSelected);
          el.classList.toggle('border', isSelected);
          el.classList.toggle('border-blue-200', isSelected);
          const cb = el.querySelector('.word-checkbox-queried');
          if (cb) {
            cb.classList.toggle('bg-blue-500', isSelected);
            cb.classList.toggle('border-blue-500', isSelected);
            cb.classList.toggle('text-white', isSelected);
            cb.classList.toggle('border-gray-300', !isSelected);
            cb.textContent = isSelected ? '✓' : '';
          }
          updateBottomBar();
        }
      });
    });
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      loadMyWordbook();
      selectedWords = [];
      pendingWord   = null;
      queriedWords  = [];
      invalidQueryWord = null;
      difficulty = 'intermediate';
      currentTab = 'add';
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'wordbook' });
    },

    unmount() {
      container = null;
    },

    /**
     * 游戏结束后更新单词熟悉度（由 ResultModule 调用）
     * @param {string} word
     * @param {boolean} correct
     */
    updateFamiliarity(word, correct) {
      const entry = myWordbook.find(w => w.word === word);
      if (!entry) return;
      if (correct) {
        entry.familiarity = Math.min(5, (entry.familiarity || 0) + 1);
      } else {
        entry.familiarity = Math.max(0, (entry.familiarity || 0) - 1);
      }
      saveMyWordbook();
    }
  };
})();
