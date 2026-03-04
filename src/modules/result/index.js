/**
 * 模块五：评分结算
 * 中文界面，自动打卡功能
 */

const ResultModule = (function() {
  let container = null;
  let errorCount = 0;
  let answers = [];
  let wordPack = [];
  let totalRounds = 6;

  // 计算星级
  function calculateStars() {
    if (errorCount === 0) return 3;
    if (errorCount <= 2) return 2;
    return 1;
  }

  // 自动打卡
  async function autoCheckin() {
    const user = Store.get('user');
    if (!user || user.isGuest) return;
    
    const today = new Date().toISOString().split('T')[0];
    const checkinDays = user.checkinDays || [];
    
    // 如果今天还没打卡，自动打卡
    if (!checkinDays.includes(today)) {
      checkinDays.push(today);
      Store.set('user.checkinDays', checkinDays);
      
      // 保存到本地存储
      try {
        await API.checkin(user.id);
      } catch (e) {
        console.error('Auto checkin failed:', e);
      }
    }
  }

  // 渲染页面
  function render() {
    const stars = calculateStars();
    const user = Store.get('user');
    const duration = Store.get('session.startTime') 
      ? Math.floor((Date.now() - Store.get('session.startTime')) / 1000) 
      : 0;
    
    // 获取星级评语
    const starMessages = {
      3: { icon: '🏆', title: '完美通关！', desc: '零失误，太厉害了！' },
      2: { icon: '🎉', title: '表现不错！', desc: '继续努力，争取零失误！' },
      1: { icon: '👍', title: '已完成！', desc: '多练习几次会更好！' }
    };
    const starInfo = starMessages[stars];
    
    container.innerHTML = `
      <div class="banner">
        <span class="banner-text pixel-font">WORDQUEST</span>
      </div>
      
      <div class="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
        <div class="result-panel w-full max-w-sm text-center">
          <!-- 完成图标 -->
          <div class="text-6xl mb-2">${starInfo.icon}</div>
          <h2 class="text-xl font-bold text-gray-800 mb-1">${starInfo.title}</h2>
          <p class="text-gray-500 text-sm mb-4">${starInfo.desc}</p>
          
          <!-- 星级显示 -->
          <div id="stars-display" class="flex justify-center my-4">
            <span class="star" data-star="1">★</span>
            <span class="star" data-star="2">★</span>
            <span class="star" data-star="3">★</span>
          </div>
          
          <!-- 打卡提示 -->
          ${!user?.isGuest ? `
            <div class="bg-green-50 text-green-700 text-sm py-2 px-4 rounded-lg mb-4">
              ✅ 今日打卡已完成
            </div>
          ` : ''}
          
          <!-- 统计信息 -->
          <div class="grid grid-cols-3 gap-2 mb-4 text-center">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-2xl font-bold text-blue-600">${totalRounds}</div>
              <div class="text-xs text-gray-500">回合数</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-2xl font-bold text-red-500">${errorCount}</div>
              <div class="text-xs text-gray-500">错误次数</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-2xl font-bold text-green-600">${formatDuration(duration)}</div>
              <div class="text-xs text-gray-500">用时</div>
            </div>
          </div>
          
          <!-- 单词掌握情况 -->
          <div class="bg-blue-50 rounded-lg p-3 mb-4 text-left">
            <h3 class="font-bold text-gray-700 mb-2">📝 本次学习的单词</h3>
            <div class="flex flex-wrap gap-1">
              ${wordPack.map(w => `
                <span class="word-review-tag text-xs bg-white px-2 py-1 rounded cursor-pointer hover:bg-blue-100"
                      data-word="${w.word}">${w.word}</span>
              `).join('')}
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="space-y-2">
            <button id="btn-review" class="btn-3d btn-blue w-full">
              📖 复习单词
            </button>
            <button id="btn-replay" class="btn-3d btn-yellow w-full">
              🔄 再玩一次
            </button>
            <button id="btn-home" class="btn-3d btn-gray w-full">
              🏠 返回首页
            </button>
          </div>
        </div>
      </div>
      
      <!-- 单词复习弹窗 -->
      <div id="review-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-xl p-4 m-4 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <h3 class="font-bold text-lg mb-4 text-center">📖 单词复习</h3>
          <div id="review-words" class="space-y-3">
            ${renderWordReviewList()}
          </div>
          <button id="btn-close-review" class="btn-3d btn-green w-full mt-4">关闭</button>
        </div>
      </div>
    `;

    animateStars(stars);
    bindEvents();
    bindWordTooltips();
    saveResult();
    autoCheckin();  // 自动打卡
  }

  // 格式化时长
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  }

  // 渲染单词复习列表
  function renderWordReviewList() {
    return wordPack.map(word => `
      <div class="p-3 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-start">
          <span class="font-bold text-red-500">${word.word}</span>
          <span class="text-gray-500 text-sm">${word.partOfSpeech || ''}</span>
        </div>
        <div class="text-gray-500 text-xs mt-1">${word.phonetic || ''}</div>
        <div class="text-gray-700 text-sm mt-1">${word.definition}</div>
      </div>
    `).join('');
  }

  // 绑定单词悬停提示
  function bindWordTooltips() {
    document.querySelectorAll('.word-review-tag').forEach(el => {
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

  // 星级动画
  function animateStars(targetStars) {
    const starEls = document.querySelectorAll('#stars-display .star');
    
    starEls.forEach((star, index) => {
      setTimeout(() => {
        if (index < targetStars) {
          star.classList.add('active');
          star.style.transform = 'scale(1.3)';
          setTimeout(() => {
            star.style.transform = 'scale(1)';
          }, 200);
        }
      }, index * 400);
    });
  }

  // 保存游戏结果
  async function saveResult() {
    const user = Store.get('user');

    // 根据答题结果更新单词熟悉度
    if (typeof WordbookModule !== 'undefined') {
      wordPack.forEach(w => {
        const ans = answers.find(a => {
          const dialogue = Store.get('session.storyConfig')?.dialogues?.find(
            d => d.npcId === a.npcId && d.round === a.round
          );
          return dialogue?.options?.some(o => o.text.toLowerCase().includes(w.word.toLowerCase()));
        });
        const correct = ans ? ans.isCorrect && ans.attempts === 1 : false;
        WordbookModule.updateFamiliarity(w.word, correct);
      });
    }

    if (!user || user.isGuest) return;

    try {
      await API.saveGameResult({
        userId: user.id,
        stars: calculateStars(),
        errorCount,
        totalRounds,
        wordPack: wordPack.map(w => w.word),
        answers,
        duration: Date.now() - (Store.get('session.startTime') || Date.now())
      });
    } catch (error) {
      console.error('Failed to save game result:', error);
    }
  }

  // 显示复习弹窗
  function showReviewModal() {
    document.getElementById('review-modal').classList.remove('hidden');
  }

  // 关闭复习弹窗
  function closeReviewModal() {
    document.getElementById('review-modal').classList.add('hidden');
  }

  // 重新开始游戏
  function replay() {
    const currentWordPack = Store.get('session.wordPack');
    Store.resetSession();
    Store.set('session.wordPack', currentWordPack);
    Store.set('session.startTime', Date.now());
    
    Router.go('story');
  }

  // 返回主页
  function goHome() {
    Store.resetSession();
    Router.clearHistory();
    Router.go('auth');
  }

  // 绑定事件
  function bindEvents() {
    document.getElementById('btn-review')?.addEventListener('click', showReviewModal);
    document.getElementById('btn-close-review')?.addEventListener('click', closeReviewModal);
    document.getElementById('btn-replay')?.addEventListener('click', replay);
    document.getElementById('btn-home')?.addEventListener('click', goHome);
    
    document.getElementById('review-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'review-modal') {
        closeReviewModal();
      }
    });
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      errorCount = Store.get('session.errorCount') || 0;
      answers = Store.get('session.answers') || [];
      wordPack = Store.get('session.wordPack') || MOCK_CONFIG.wordPack;
      totalRounds = Store.get('session.storyConfig')?.dialogues?.length || 6;
      
      render();
      EventBus.emit(Events.SCENE_READY, { scene: 'result' });
    },

    unmount() {
      container = null;
    }
  };
})();
