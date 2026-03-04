/**
 * 模块二：词库管理
 * 输入单词→添加到我的词库→选择要学习的单词
 */

const WordbookModule = (function() {
  let container = null;
  let myWordbook = [];       // 我的词库
  let selectedWords = [];    // 选中要学习的单词
  let currentTab = 'add';    // add | select

  // 从 localStorage 加载我的词库
  function loadMyWordbook() {
    const userId = Store.get('user')?.id || 'guest';
    const saved = localStorage.getItem(`wordquest_wordbook_${userId}`);
    myWordbook = saved ? JSON.parse(saved) : [];
  }

  // 保存我的词库到 localStorage
  function saveMyWordbook() {
    const userId = Store.get('user')?.id || 'guest';
    localStorage.setItem(`wordquest_wordbook_${userId}`, JSON.stringify(myWordbook));
  }

  // 渲染页面
  function render() {
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">WORDQUEST</span>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <!-- 标签页切换 -->
        <div class="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${currentTab === 'add' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            data-tab="add">
            ➕ 添加单词
          </button>
          <button class="tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${currentTab === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}"
            data-tab="select">
            📚 我的词库 (${myWordbook.length})
          </button>
        </div>
        
        <!-- 添加单词面板 -->
        <div id="add-panel" class="${currentTab === 'add' ? '' : 'hidden'}">
          <div class="card mb-4">
            <h3 class="font-bold text-gray-700 mb-2">输入新单词</h3>
            <div class="flex gap-2">
              <input type="text" id="word-input" class="input-field flex-1" 
                placeholder="输入英文单词" autocomplete="off">
              <button id="btn-add-word" class="btn-3d btn-blue px-4">添加</button>
            </div>
            <p class="text-xs text-gray-400 mt-2">按回车键快速添加</p>
          </div>
          
          <!-- 最近添加的单词 -->
          <div class="card">
            <h3 class="font-bold text-gray-700 mb-2">最近添加</h3>
            <div id="recent-words" class="space-y-2 max-h-[200px] overflow-y-auto">
              ${renderRecentWords()}
            </div>
          </div>
          
          <!-- 快速添加示例词 -->
          <div class="mt-4">
            <p class="text-gray-500 text-sm mb-2">💡 试试这些单词：</p>
            <div class="flex flex-wrap gap-2">
              ${['reputation', 'govern', 'enable', 'frustrate', 'division'].map(w => `
                <span class="quick-add-word text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded cursor-pointer hover:bg-blue-100">
                  ${w}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- 选择单词面板 -->
        <div id="select-panel" class="${currentTab === 'select' ? '' : 'hidden'}">
          ${myWordbook.length === 0 ? `
            <div class="text-center py-8 text-gray-400">
              <div class="text-4xl mb-2">📝</div>
              <p>词库为空</p>
              <p class="text-sm">请先添加一些单词</p>
            </div>
          ` : `
            <div class="card mb-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-bold text-gray-700">选择要学习的单词</h3>
                <span class="text-sm text-gray-500">${selectedWords.length}/10</span>
              </div>
              <p class="text-xs text-gray-400 mb-3">选择 3-10 个单词开始游戏</p>
              
              <div id="wordbook-list" class="space-y-2 max-h-[280px] overflow-y-auto">
                ${renderWordbookList()}
              </div>
            </div>
            
            <div class="flex gap-2">
              <button id="btn-select-all" class="flex-1 text-sm text-blue-500 py-2">全选</button>
              <button id="btn-clear-selection" class="flex-1 text-sm text-gray-500 py-2">清空选择</button>
            </div>
          `}
        </div>
      </div>
      
      <!-- 底部按钮 -->
      <div class="p-4 space-y-2">
        <button id="btn-start-game" class="btn-3d btn-green w-full" 
          ${selectedWords.length < 3 ? 'disabled' : ''}>
          开始游戏 (${selectedWords.length}/10)
        </button>
        <button id="btn-back" class="btn-3d btn-gray w-full">← 返回</button>
      </div>
    `;

    bindEvents();
  }

  // 渲染最近添加的单词
  function renderRecentWords() {
    const recent = myWordbook.slice(-5).reverse();
    if (recent.length === 0) {
      return '<p class="text-gray-400 text-sm text-center py-4">暂无单词</p>';
    }
    
    return recent.map(word => `
      <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
        <div>
          <span class="font-medium text-gray-800">${word.word}</span>
          <span class="text-gray-500 text-xs ml-2">${word.partOfSpeech || ''}</span>
        </div>
        <span class="text-gray-500 text-sm">${word.definition || ''}</span>
      </div>
    `).join('');
  }

  // 渲染词库列表
  function renderWordbookList() {
    return myWordbook.map((word, index) => `
      <div class="wordbook-item flex items-center gap-3 p-2 rounded cursor-pointer transition-all
        ${selectedWords.some(w => w.word === word.word) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'}"
        data-index="${index}">
        <div class="w-5 h-5 rounded border-2 flex items-center justify-center
          ${selectedWords.some(w => w.word === word.word) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}">
          ${selectedWords.some(w => w.word === word.word) ? '✓' : ''}
        </div>
        <div class="flex-1">
          <div class="font-medium text-gray-800">${word.word}</div>
          <div class="text-xs text-gray-500">${word.phonetic || ''} ${word.definition || ''}</div>
        </div>
        <button class="delete-word text-red-400 hover:text-red-600 text-lg" data-word="${word.word}">×</button>
      </div>
    `).join('');
  }

  // 添加单词
  async function addWord(wordStr) {
    wordStr = wordStr.trim().toLowerCase();
    
    if (!wordStr) {
      UI.showToast('请输入单词', 'error');
      return;
    }
    
    if (!/^[a-zA-Z]+$/.test(wordStr)) {
      UI.showToast('请输入有效的英文单词', 'error');
      return;
    }
    
    // 检查是否已存在
    if (myWordbook.some(w => w.word.toLowerCase() === wordStr)) {
      UI.showToast('该单词已在词库中', 'info');
      return;
    }
    
    try {
      // 查询释义
      const wordData = await API.lookupWord(wordStr);
      
      myWordbook.push(wordData);
      saveMyWordbook();
      
      // 清空输入框
      const input = document.getElementById('word-input');
      if (input) input.value = '';
      
      // 刷新显示
      render();
      
      UI.showToast(`已添加: ${wordStr}`, 'success');
    } catch (error) {
      UI.showToast('添加失败', 'error');
    }
  }

  // 删除单词
  function deleteWord(wordStr) {
    myWordbook = myWordbook.filter(w => w.word !== wordStr);
    selectedWords = selectedWords.filter(w => w.word !== wordStr);
    saveMyWordbook();
    render();
  }

  // 切换单词选择
  function toggleWordSelection(index) {
    const word = myWordbook[index];
    if (!word) return;
    
    const existingIndex = selectedWords.findIndex(w => w.word === word.word);
    
    if (existingIndex > -1) {
      selectedWords.splice(existingIndex, 1);
    } else if (selectedWords.length < 10) {
      selectedWords.push(word);
    } else {
      UI.showToast('最多选择10个单词', 'info');
      return;
    }
    
    render();
  }

  // 开始游戏
  function startGame() {
    if (selectedWords.length < 3) {
      UI.showToast('请至少选择3个单词', 'error');
      return;
    }
    
    // 扣除游戏次数
    const user = Store.get('user');
    if (user && user.tier !== 'vip' && !user.isGuest) {
      Store.set('user.gamesRemaining', Math.max(0, user.gamesRemaining - 1));
    }
    
    // 触发游戏开始
    EventBus.emit(Events.GAME_START, {
      wordPack: selectedWords
    });
  }

  // 绑定事件
  function bindEvents() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        render();
      });
    });

    // 添加单词
    document.getElementById('btn-add-word')?.addEventListener('click', () => {
      const input = document.getElementById('word-input');
      addWord(input.value);
    });
    
    // 回车添加
    document.getElementById('word-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addWord(e.target.value);
      }
    });
    
    // 快速添加
    document.querySelectorAll('.quick-add-word').forEach(el => {
      el.addEventListener('click', () => addWord(el.textContent));
    });
    
    // 词库项点击
    document.querySelectorAll('.wordbook-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-word')) {
          toggleWordSelection(parseInt(item.dataset.index));
        }
      });
    });
    
    // 删除单词
    document.querySelectorAll('.delete-word').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWord(btn.dataset.word);
      });
    });
    
    // 全选
    document.getElementById('btn-select-all')?.addEventListener('click', () => {
      selectedWords = myWordbook.slice(0, 10);
      render();
    });
    
    // 清空选择
    document.getElementById('btn-clear-selection')?.addEventListener('click', () => {
      selectedWords = [];
      render();
    });
    
    // 开始游戏
    document.getElementById('btn-start-game')?.addEventListener('click', startGame);
    
    // 返回
    document.getElementById('btn-back')?.addEventListener('click', () => Router.back());
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      loadMyWordbook();
      selectedWords = [];
      currentTab = myWordbook.length > 0 ? 'select' : 'add';
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'wordbook' });
    },

    unmount() {
      container = null;
    }
  };
})();
