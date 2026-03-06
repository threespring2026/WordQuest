/**
 * 管理页：API 配置与提示词
 * 入口：URL 带 #admin
 * API Key 线上由 Vercel 环境变量注入，不在此填写；仅本地可在此填写便于调试
 */

const ADMIN_STORAGE_KEY = 'wordquest_admin_config';

function getAdminConfig() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAdminConfig(obj) {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(obj));
}

function getDefaultConfig() {
  const base = {
    baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    temperature: 0.8,
    maxTokens: 4096,
    enabled: true,
    apiKey: ''
  };
  if (typeof DEFAULT_SYNOPSIS_SYSTEM !== 'undefined') base.synopsisSystem = DEFAULT_SYNOPSIS_SYSTEM;
  if (typeof DEFAULT_STORYCONFIG_SYSTEM !== 'undefined') base.storyConfigSystem = DEFAULT_STORYCONFIG_SYSTEM;
  if (typeof DEFAULT_PROMPT_TEMPLATES !== 'undefined') {
    base.synopsisUserTemplate = DEFAULT_PROMPT_TEMPLATES.synopsisUser;
    base.storyConfigUserTemplate = DEFAULT_PROMPT_TEMPLATES.storyConfigUser;
  }
  return base;
}

function getFormConfig() {
  const c = getAdminConfig();
  if (c) return c;
  const d = getDefaultConfig();
  if (typeof AI_CONFIG !== 'undefined') {
    d.baseUrl = AI_CONFIG.baseUrl;
    d.model = AI_CONFIG.model;
    d.temperature = AI_CONFIG.temperature;
    d.maxTokens = AI_CONFIG.maxTokens;
    d.enabled = AI_CONFIG.enabled;
  }
  if (typeof PROMPTS !== 'undefined') {
    d.synopsisSystem = PROMPTS.synopsis.system;
    d.storyConfigSystem = PROMPTS.storyConfig.system;
  }
  if (typeof DEFAULT_PROMPT_TEMPLATES !== 'undefined') {
    d.synopsisUserTemplate = DEFAULT_PROMPT_TEMPLATES.synopsisUser;
    d.storyConfigUserTemplate = DEFAULT_PROMPT_TEMPLATES.storyConfigUser;
  }
  return d;
}

const AdminModule = (function() {
  let container = null;
  const hasEnvKey = typeof window !== 'undefined' && window.WORDQUEST_API_KEY;

  function render() {
    const cfg = getFormConfig();
    container.innerHTML = `
      <div class="banner flex items-center justify-between px-2">
        <span class="banner-text pixel-font">管理后台</span>
        <button id="admin-back" class="text-white text-sm px-2 py-1 rounded">返回</button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 pb-6">
        <section class="mb-4">
          <h2 class="text-lg font-medium text-gray-800 mb-2">API 配置</h2>
          <div class="space-y-2 text-sm">
            <div>
              <label class="block text-gray-600 mb-0.5">API 地址 (baseUrl)</label>
              <input type="text" id="admin-baseUrl" class="w-full border rounded px-2 py-1.5" placeholder="https://api.siliconflow.cn/v1/chat/completions">
            </div>
            <div>
              <label class="block text-gray-600 mb-0.5">模型 (model)</label>
              <input type="text" id="admin-model" class="w-full border rounded px-2 py-1.5" placeholder="Qwen/Qwen2.5-72B-Instruct">
            </div>
            ${!hasEnvKey ? `
            <div>
              <label class="block text-gray-600 mb-0.5">API Key <span class="text-amber-600">（仅本地可用，线上请在 Vercel 环境变量中设置 WORDQUEST_API_KEY）</span></label>
              <input type="password" id="admin-apiKey" class="w-full border rounded px-2 py-1.5" placeholder="sk-xxx" autocomplete="off">
            </div>
            ` : `
            <p class="text-green-600 text-xs">API Key 已由环境变量配置，无需在此填写。</p>
            `}
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-gray-600 mb-0.5">temperature</label>
                <input type="number" id="admin-temperature" class="w-full border rounded px-2 py-1.5" min="0" max="2" step="0.1">
              </div>
              <div>
                <label class="block text-gray-600 mb-0.5">maxTokens</label>
                <input type="number" id="admin-maxTokens" class="w-full border rounded px-2 py-1.5" min="256" max="8192">
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="admin-enabled" class="rounded">
              <label for="admin-enabled" class="text-gray-700">启用 AI（不勾选则使用 Mock 数据）</label>
            </div>
          </div>
        </section>
        <section class="mb-4">
          <h2 class="text-lg font-medium text-gray-800 mb-2">梗概提示词 (synopsis)</h2>
          <div class="space-y-2 text-sm">
            <div>
              <label class="block text-gray-600 mb-0.5">system</label>
              <textarea id="admin-synopsisSystem" class="w-full border rounded px-2 py-1.5 font-mono text-xs" rows="6"></textarea>
            </div>
            <div>
              <label class="block text-gray-600 mb-0.5">user 模板（占位符 {{WORDS}}）</label>
              <textarea id="admin-synopsisUserTemplate" class="w-full border rounded px-2 py-1.5 font-mono text-xs" rows="4"></textarea>
            </div>
          </div>
        </section>
        <section class="mb-4">
          <h2 class="text-lg font-medium text-gray-800 mb-2">剧本提示词 (storyConfig)</h2>
          <div class="space-y-2 text-sm">
            <div>
              <label class="block text-gray-600 mb-0.5">system</label>
              <textarea id="admin-storyConfigSystem" class="w-full border rounded px-2 py-1.5 font-mono text-xs" rows="12"></textarea>
            </div>
            <div>
              <label class="block text-gray-600 mb-0.5">user 模板（占位符 {{SYNOPSIS_BACKGROUND}} {{SYNOPSIS_MISSION}} {{WORDS_LINES}}）</label>
              <textarea id="admin-storyConfigUserTemplate" class="w-full border rounded px-2 py-1.5 font-mono text-xs" rows="6"></textarea>
            </div>
          </div>
        </section>
        <div class="flex flex-wrap gap-2">
          <button id="admin-save" class="btn-3d btn-green">保存</button>
          <button id="admin-reset" class="btn-3d btn-gray">恢复默认</button>
        </div>
        <p id="admin-toast" class="mt-2 text-sm text-gray-500 hidden"></p>
      </div>
    `;
    fillForm(cfg);
    bindEvents();
  }

  function fillForm(cfg) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val != null ? String(val) : '';
    };
    set('admin-baseUrl', cfg.baseUrl);
    set('admin-model', cfg.model);
    set('admin-apiKey', cfg.apiKey || '');
    set('admin-temperature', cfg.temperature);
    set('admin-maxTokens', cfg.maxTokens);
    set('admin-enabled', cfg.enabled);
    set('admin-synopsisSystem', cfg.synopsisSystem);
    set('admin-synopsisUserTemplate', cfg.synopsisUserTemplate);
    set('admin-storyConfigSystem', cfg.storyConfigSystem);
    set('admin-storyConfigUserTemplate', cfg.storyConfigUserTemplate);
  }

  function getFormValues() {
    const get = (id) => {
      const el = document.getElementById(id);
      if (!el) return undefined;
      if (el.type === 'checkbox') return el.checked;
      return el.value;
    };
    const o = {
      baseUrl: get('admin-baseUrl'),
      model: get('admin-model'),
      temperature: parseFloat(get('admin-temperature')) || 0.8,
      maxTokens: parseInt(get('admin-maxTokens'), 10) || 4096,
      enabled: get('admin-enabled'),
      synopsisSystem: get('admin-synopsisSystem'),
      synopsisUserTemplate: get('admin-synopsisUserTemplate'),
      storyConfigSystem: get('admin-storyConfigSystem'),
      storyConfigUserTemplate: get('admin-storyConfigUserTemplate')
    };
    if (!hasEnvKey) o.apiKey = get('admin-apiKey') || '';
    return o;
  }

  function showToast(msg, isError) {
    const el = document.getElementById('admin-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    el.className = 'mt-2 text-sm ' + (isError ? 'text-red-600' : 'text-green-600');
    setTimeout(() => el.classList.add('hidden'), 3000);
  }

  function bindEvents() {
    document.getElementById('admin-back')?.addEventListener('click', () => {
      if (typeof Router !== 'undefined') Router.go('wordbook');
      else location.hash = '';
    });
    document.getElementById('admin-save')?.addEventListener('click', () => {
      const o = getFormValues();
      setAdminConfig(o);
      showToast('已保存，刷新游戏页后生效。');
    });
    document.getElementById('admin-reset')?.addEventListener('click', () => {
      const d = getDefaultConfig();
      fillForm(d);
      setAdminConfig(d);
      showToast('已恢复默认并保存。');
    });
  }

  return {
    name: 'admin',
    mount(el) {
      container = el;
      render();
    },
    unmount() {
      container = null;
    }
  };
})();
