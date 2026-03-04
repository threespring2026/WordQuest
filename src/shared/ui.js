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
     * 显示单词释义弹窗（显示在单词上方），4 秒后自动消失
     * @param {Object} wordData - 单词数据
     * @param {number} x - X 坐标（鼠标位置）
     * @param {number} y - Y 坐标（鼠标位置）
     */
    showWordTooltip(wordData, x, y) {
      if (this._wordTooltipTimer) {
        clearTimeout(this._wordTooltipTimer);
        this._wordTooltipTimer = null;
      }
      let tooltip = document.getElementById('word-tooltip');
      if (!tooltip) {
        tooltip = this.createElement('div', {
          id: 'word-tooltip',
          className: 'word-tooltip hidden'
        });
        document.body.appendChild(tooltip);
      }

      tooltip.innerHTML = `
        <div class="word-title">${wordData.word}</div>
        <div class="word-phonetic">${wordData.phonetic || ''}</div>
        <div class="word-definition">${wordData.partOfSpeech || ''} ${wordData.definition}</div>
      `;

      // 先临时显示以获取高度
      tooltip.style.visibility = 'hidden';
      tooltip.classList.remove('hidden');
      const tooltipH = tooltip.offsetHeight || 72;
      tooltip.style.visibility = '';

      // 计算左侧位置，避免超出屏幕右边
      const left = Math.min(x, window.innerWidth - 220);

      // 显示在鼠标上方；若空间不足则显示在下方
      let top = y - tooltipH - 8;
      if (top < 5) top = y + 20;

      tooltip.style.left = left + 'px';
      tooltip.style.top  = top  + 'px';

      this._wordTooltipTimer = setTimeout(() => {
        this.hideWordTooltip();
        this._wordTooltipTimer = null;
      }, 4000);
    },

    /**
     * 隐藏单词释义弹窗
     */
    hideWordTooltip() {
      if (this._wordTooltipTimer) {
        clearTimeout(this._wordTooltipTimer);
        this._wordTooltipTimer = null;
      }
      const tooltip = document.getElementById('word-tooltip');
      if (tooltip) {
        tooltip.classList.add('hidden');
      }
    },

    /**
     * 绑定关键词事件
     * @param {HTMLElement} container - 容器元素
     * @param {Array} wordPack - 单词包
     */
    bindKeywordEvents(container, wordPack) {
      container.querySelectorAll('.keyword').forEach(el => {
        const word = el.dataset.word;
        const wordData = wordPack.find(w => w.word.toLowerCase() === word);
        
        if (wordData) {
          el.addEventListener('mouseenter', (e) => {
            this.showWordTooltip(wordData, e.clientX, e.clientY);
          });
          el.addEventListener('mouseleave', () => {
            this.hideWordTooltip();
          });
          el.addEventListener('click', (e) => {
            this.showWordTooltip(wordData, e.clientX, e.clientY);
          });
        }
      });
    }
  };
})();
