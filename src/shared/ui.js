/**
 * UI - 共享 UI 工具函数
 */

const UI = (function() {
  const appContainer = document.getElementById('app');
  
  return {
    /**
     * 获取应用容器
     */
    getContainer() {
      return appContainer;
    },

    /**
     * 渲染模板到容器
     * @param {string} html - HTML 字符串
     * @param {HTMLElement} container - 目标容器
     */
    render(html, container = appContainer) {
      container.innerHTML = html;
    },

    /**
     * 创建元素
     * @param {string} tag - 标签名
     * @param {Object} attrs - 属性对象
     * @param {string|HTMLElement} content - 内容
     */
    createElement(tag, attrs = {}, content = '') {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
          el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          el.setAttribute(key, value);
        }
      });
      if (typeof content === 'string') {
        el.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        el.appendChild(content);
      }
      return el;
    },

    /**
     * 显示加载状态
     * @param {string} message - 加载提示
     */
    showLoading(message = 'Loading...') {
      let loader = document.getElementById('global-loader');
      if (!loader) {
        loader = this.createElement('div', {
          id: 'global-loader',
          className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        }, `
          <div class="bg-white rounded-xl p-6 flex flex-col items-center">
            <div class="loader mb-3"></div>
            <span class="text-gray-600 loader-message">${message}</span>
          </div>
        `);
        document.body.appendChild(loader);
      } else {
        loader.querySelector('.loader-message').textContent = message;
        loader.classList.remove('hidden');
      }
      Store.set('ui.loading', true);
    },

    /**
     * 隐藏加载状态
     */
    hideLoading() {
      const loader = document.getElementById('global-loader');
      if (loader) {
        loader.classList.add('hidden');
      }
      Store.set('ui.loading', false);
    },

    /**
     * 显示 Toast 提示
     * @param {string} message - 提示内容
     * @param {string} type - 类型：success | error | info
     * @param {number} duration - 显示时长（毫秒）
     */
    showToast(message, type = 'info', duration = 2000) {
      const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
      };
      
      const toast = this.createElement('div', {
        className: `fixed top-4 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300`,
        style: { opacity: '0', transform: 'translateX(-50%) translateY(-20px)' }
      }, message);
      
      document.body.appendChild(toast);
      
      // 动画显示
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });
      
      // 自动消失
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    /**
     * 显示确认对话框
     * @param {string} message - 提示内容
     * @param {Object} options - 配置项
     * @returns {Promise<boolean>}
     */
    confirm(message, options = {}) {
      return new Promise((resolve) => {
        const { title = '确认', confirmText = '确定', cancelText = '取消' } = options;
        
        const modal = this.createElement('div', {
          className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        }, `
          <div class="bg-white rounded-xl p-6 m-4 max-w-sm w-full">
            <h3 class="font-bold text-lg mb-2">${title}</h3>
            <p class="text-gray-600 mb-4">${message}</p>
            <div class="flex gap-3">
              <button class="btn-3d btn-gray flex-1 cancel-btn">${cancelText}</button>
              <button class="btn-3d btn-green flex-1 confirm-btn">${confirmText}</button>
            </div>
          </div>
        `);
        
        modal.querySelector('.confirm-btn').onclick = () => {
          modal.remove();
          resolve(true);
        };
        modal.querySelector('.cancel-btn').onclick = () => {
          modal.remove();
          resolve(false);
        };
        
        document.body.appendChild(modal);
      });
    },

    /**
     * 高亮文本中的关键词
     * @param {string} text - 原始文本
     * @param {Array} words - 单词列表
     * @returns {string} 处理后的 HTML
     */
    highlightKeywords(text, words) {
      let result = text;
      
      // 处理 **word** 格式
      result = result.replace(/\*\*(\w+)\*\*/g, (match, word) => {
        return `<span class="keyword" data-word="${word.toLowerCase()}">${word}</span>`;
      });
      
      return result;
    },

    /**
     * 显示单词释义弹窗（显示在单词上方），4 秒后自动消失（保留供兼容）
     */
    showWordTooltip(wordData, x, y) {
      if (this._wordTooltipTimer) {
        clearTimeout(this._wordTooltipTimer);
        this._wordTooltipTimer = null;
      }
      let tooltip = document.getElementById('word-tooltip');
      if (!tooltip) {
        tooltip = this.createElement('div', { id: 'word-tooltip', className: 'word-tooltip hidden' });
        document.body.appendChild(tooltip);
      }
      tooltip.innerHTML = `
        <div class="word-title">${wordData.word}</div>
        <div class="word-phonetic">${wordData.phonetic || ''}</div>
        <div class="word-definition">${wordData.partOfSpeech || ''} ${wordData.definition}</div>
      `;
      tooltip.style.visibility = 'hidden';
      tooltip.classList.remove('hidden');
      const tooltipH = tooltip.offsetHeight || 72;
      tooltip.style.visibility = '';
      const left = Math.min(x, window.innerWidth - 220);
      let top = y - tooltipH - 8;
      if (top < 5) top = y + 20;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      this._wordTooltipTimer = setTimeout(() => { this.hideWordTooltip(); this._wordTooltipTimer = null; }, 4000);
    },

    hideWordTooltip() {
      if (this._wordTooltipTimer) { clearTimeout(this._wordTooltipTimer); this._wordTooltipTimer = null; }
      const tooltip = document.getElementById('word-tooltip');
      if (tooltip) tooltip.classList.add('hidden');
    },

    /**
     * 点击单词：打开释义弹层（网络查词 + 缓存兜底），支持手机
     * 防抖：同一词 300ms 内重复点击只触发一次
     */
    async showWordDetailModal(word) {
      const key = (word || '').toLowerCase().trim();
      if (!key) return;
      if (this._wordDetailDebounce && this._wordDetailDebounce.key === key && Date.now() - this._wordDetailDebounce.at < 300) return;
      this._wordDetailDebounce = { key, at: Date.now() };

      let overlay = document.getElementById('word-detail-overlay');
      if (!overlay) {
        overlay = this.createElement('div', {
          id: 'word-detail-overlay',
          className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 hidden'
        });
        overlay.innerHTML = `
          <div id="word-detail-modal" class="word-detail-modal bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div class="flex items-center justify-between p-3 border-b">
              <span id="word-detail-title" class="font-bold text-lg text-red-600">...</span>
              <button type="button" id="word-detail-close" class="text-gray-500 hover:text-black text-2xl leading-none">&times;</button>
            </div>
            <div id="word-detail-body" class="p-3 overflow-y-auto flex-1 text-sm">
              <div class="loader mx-auto my-4"></div>
            </div>
          </div>
        `;
        overlay.querySelector('#word-detail-close').onclick = () => this.hideWordDetailModal();
        overlay.onclick = (e) => { if (e.target === overlay) this.hideWordDetailModal(); };
        document.body.appendChild(overlay);
      }

      overlay.classList.remove('hidden');
      document.getElementById('word-detail-title').textContent = key;
      document.getElementById('word-detail-body').innerHTML = '<div class="loader mx-auto my-4"></div>';

      let wordData;
      try {
        wordData = await API.lookupWord(key);
      } catch (_) {
        wordData = { word: key, phonetic: '', partOfSpeech: '', definition: '（暂无释义）', networkUnavailable: true };
      }

      if (wordData.networkUnavailable) {
        this.showToast('网络不可用', 'error');
      }
      const def = wordData.definition || '（暂无释义）';
      const defHtml = def.split(/\r?\n/).map(line => escapeHtml(line)).join('<br>');
      const sub = wordData.notFound ? '<p class="text-amber-600 mt-1">未找到释义</p>' : '';
      const tagLabel = (wordData.tag && typeof window.DictModule !== 'undefined' && window.DictModule.formatTag)
        ? window.DictModule.formatTag(wordData.tag)
        : (wordData.tag || '');
      const tagHtml = tagLabel ? `<div class="text-gray-500 text-xs mt-1">${escapeHtml(tagLabel)}</div>` : '';
      const exHtml = (wordData.examples && wordData.examples.length)
        ? '<div class="mt-2 text-gray-600"><div class="font-medium mb-1">例句</div><ul class="list-disc pl-4 space-y-0.5">' +
          wordData.examples.slice(0, 3).map(ex => `<li>${escapeHtml(ex)}</li>`).join('') + '</ul></div>'
        : '';
      document.getElementById('word-detail-body').innerHTML = `
        <div class="word-phonetic text-gray-600 mb-1">${escapeHtml(wordData.phonetic || '')}</div>
        <div class="word-definition">${escapeHtml(wordData.partOfSpeech ? wordData.partOfSpeech + ' ' : '')}${defHtml}</div>
        ${tagHtml}
        ${sub}
        ${exHtml}
      `;
    },

    hideWordDetailModal() {
      const overlay = document.getElementById('word-detail-overlay');
      if (overlay) overlay.classList.add('hidden');
    },

    /**
     * 绑定可点击单词（.word-hover, .keyword, .word-tag-display, .word-review-tag）→ 点击打开释义弹层
     */
    bindWordClick(container) {
      const sel = container || document;
      ['word-hover', 'keyword', 'word-tag-display', 'word-review-tag'].forEach(cls => {
        sel.querySelectorAll('.' + cls).forEach(el => {
          const word = el.dataset.word;
          if (!word) return;
          el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showWordDetailModal(word);
          });
        });
      });
    },

    bindKeywordEvents(container, wordPack) {
      this.bindWordClick(container || document);
    }
  };

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
})();
