/**
 * Dict - 基于 ECDICT 的本地 JSON 分片词库
 * 零成本、极速单词查询，纯前端实现
 * 分片路径：/assets/dicts/shards_{a-z}.json, shards_other.json
 */

const DictModule = (function() {
  /** 已 fetch 过的分片数据缓存，key 为文件名（如 shards_a），value 为整片 JSON 对象或 null（404/解析失败） */
  const _cache = new Map();

  const SLICE_FAILED = Symbol('slice_failed');

  /** 词库 base URL：相对当前页面，兼容根路径、子路径、file 协议 */
  function getDictBase() {
    try {
      const base = document.baseURI || window.location.href;
      return new URL('assets/dicts/', base).href.replace(/\/?$/, '/');
    } catch (_) {
      return '/assets/dicts/';
    }
  }

  /**
   * 根据单词首字母定位分片文件名
   * 非 a-z 统一使用 shards_other.json
   */
  function getSliceKey(word) {
    const first = (word || '').toLowerCase().trim().charAt(0);
    if (first >= 'a' && first <= 'z') return `shards_${first}`;
    return 'shards_other';
  }

  /**
   * 加载并缓存单个分片
   * @param {string} sliceKey - 如 shards_a
   * @returns {Promise<Object|null>} 分片对象或 null
   */
  const FETCH_TIMEOUT_MS = 15000;

  function loadSlice(sliceKey) {
    if (_cache.has(sliceKey)) {
      const v = _cache.get(sliceKey);
      return Promise.resolve(v === SLICE_FAILED ? null : v);
    }
    const url = getDictBase() + sliceKey + '.json';
    const opts = { method: 'GET' };
    if (typeof Request !== 'undefined' && Request.prototype.hasOwnProperty?.('priority')) {
      opts.priority = 'high';
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (controller) opts.signal = controller.signal;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      : null;

    return fetch(url, opts)
      .then(res => {
        if (timeoutId) clearTimeout(timeoutId);
        if (!res.ok) {
          _cache.set(sliceKey, SLICE_FAILED);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (timeoutId) clearTimeout(timeoutId);
        if (data && typeof data === 'object') {
          _cache.set(sliceKey, data);
          return data;
        }
        _cache.set(sliceKey, SLICE_FAILED);
        return null;
      })
      .catch(err => {
        if (timeoutId) clearTimeout(timeoutId);
        _cache.set(sliceKey, SLICE_FAILED);
        return null;
      });
  }

  /**
   * 查询单词
   * @param {string} word - 单词（会转为小写查询）
   * @returns {Promise<{word:string, phonetic:string, definition:string, tag:string, notFound:boolean}|null>}
   *   查到返回 { word, phonetic, definition, tag, notFound: false }；未找到返回 { word, notFound: true }；出错返回 null
   */
  function lookup(word) {
    const key = (word || '').toLowerCase().trim();
    if (!key) return Promise.resolve(null);

    const sliceKey = getSliceKey(key);
    return loadSlice(sliceKey).then(data => {
      if (!data) return { word: key, notFound: true };
      const entry = data[key];
      if (!entry || typeof entry !== 'object') return { word: key, notFound: true };
      return {
        word: key,
        phonetic: entry.p != null ? String(entry.p) : '',
        definition: entry.t != null ? String(entry.t) : '',
        tag: entry.tg != null ? String(entry.tg).trim() : '',
        notFound: false
      };
    });
  }

  /** 考试类别标签缩写 → 中文展示 */
  const TAG_LABELS = {
    zk: '中考',
    gk: '高考',
    cet4: '四级',
    cet6: '六级',
    ielts: '雅思',
    toefl: '托福',
    ky: '考研',
    gre: 'GRE',
    toeic: '托业'
  };

  /**
   * 将 tg 字符串解析为可展示的考试类别标签文本
   * @param {string} tg - 如 "gk cet4"
   * @returns {string} 如 "高考 四级"
   */
  function formatTag(tg) {
    if (!tg || typeof tg !== 'string') return '';
    return tg
      .toLowerCase()
      .split(/\s+/)
      .map(s => TAG_LABELS[s] || s)
      .filter(Boolean)
      .join(' ');
  }

  return {
    lookup,
    formatTag,
    get cacheSize() { return _cache.size; }
  };
})();

if (typeof window !== 'undefined') {
  window.DictModule = DictModule;
}
