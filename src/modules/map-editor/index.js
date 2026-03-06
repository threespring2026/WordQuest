/**
 * 地图编辑模块：NPC 站位 + 可行走/障碍区域
 * 入口：打开页面时 URL 带 #map-editor
 */

const MAP_EDITOR_STORAGE_KEY = 'wordquest_map_editor_overrides';

function getOverrides() {
  try {
    return JSON.parse(localStorage.getItem(MAP_EDITOR_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setOverrides(overrides) {
  localStorage.setItem(MAP_EDITOR_STORAGE_KEY, JSON.stringify(overrides));
}

function getMapData(mapId) {
  const base = MAPS_CONFIG[mapId] || MAPS_CONFIG[1];
  const overrides = getOverrides()[String(mapId)] || {};
  return {
    ...base,
    npcSlots: overrides.npcSlots ? { ...base.npcSlots, ...overrides.npcSlots } : base.npcSlots,
    walkableBounds: overrides.walkableBounds || base.walkableBounds,
    blockedPolygons: overrides.blockedPolygons || []
  };
}

const MapEditorModule = (function() {
  let container = null;
  let currentMapId = 1;
  let mode = 'npc'; // 'npc' | 'walkable'
  let npcSlotIndex = 0; // 0-3, 下一个要点的槽位
  let walkableDrawing = false;
  let currentPolygon = [];
  let imageRect = null;

  function render() {
    const mapData = getMapData(currentMapId);
    const mapList = Object.values(MAPS_CONFIG);

    container.innerHTML = `
      <div class="banner flex items-center justify-between px-2">
        <span class="banner-text pixel-font">地图编辑</span>
        <button id="map-editor-back" class="text-white text-sm px-2 py-1 rounded">返回</button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <div class="mb-3">
          <label class="text-gray-600 text-sm block mb-1">选择地图</label>
          <select id="map-editor-select" class="w-full border rounded px-3 py-2">
            ${mapList.map(m => `
              <option value="${m.id}" ${m.id === currentMapId ? 'selected' : ''}>${m.name}</option>
            `).join('')}
          </select>
        </div>

        <div class="flex gap-2 mb-3">
          <button id="map-editor-mode-npc" class="flex-1 py-2 rounded font-medium ${mode === 'npc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}">NPC 站位</button>
          <button id="map-editor-mode-walkable" class="flex-1 py-2 rounded font-medium ${mode === 'walkable' ? 'bg-blue-500 text-white' : 'bg-gray-200'}">可行走区域</button>
        </div>

        <!-- 地图图片 + 叠层 -->
        <div id="map-editor-image-wrap" class="relative rounded overflow-hidden border-2 border-gray-300 bg-gray-100" style="min-height: 200px;">
          <img id="map-editor-img" src="${mapData.image}" alt="地图" class="w-full h-auto block">
          <div id="map-editor-overlay" class="absolute inset-0 pointer-events-none"></div>
          <div id="map-editor-markers" class="absolute inset-0 pointer-events-none"></div>
          <svg id="map-editor-svg" class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style="left:0;top:0"></svg>
        </div>

        <div id="map-editor-npc-panel" class="mt-3 ${mode !== 'npc' ? 'hidden' : ''}">
          <p class="text-sm text-gray-600 mb-2">按顺序点击地图上的 4 个点，依次设置 NPC 槽位 1～4。当前：槽位 <strong id="npc-slot-current">${npcSlotIndex + 1}</strong></p>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
            ${[1,2,3,4].map(s => {
              const slot = mapData.npcSlots[s];
              return `<div>槽位${s}: ${slot ? `x=${slot.x.toFixed(2)} y=${slot.y.toFixed(2)}` : '未设置'}</div>`;
            }).join('')}
          </div>
        </div>

        <div id="map-editor-walkable-panel" class="mt-3 ${mode !== 'walkable' ? 'hidden' : ''}">
          <p class="text-sm font-medium text-gray-700 mb-2">可行走矩形 (0～1)</p>
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div><label class="text-xs text-gray-500">minX</label><input type="number" id="wb-minX" min="0" max="1" step="0.01" class="w-full border rounded px-2 py-1 text-sm" value="${mapData.walkableBounds.minX}"></div>
            <div><label class="text-xs text-gray-500">maxX</label><input type="number" id="wb-maxX" min="0" max="1" step="0.01" class="w-full border rounded px-2 py-1 text-sm" value="${mapData.walkableBounds.maxX}"></div>
            <div><label class="text-xs text-gray-500">minY</label><input type="number" id="wb-minY" min="0" max="1" step="0.01" class="w-full border rounded px-2 py-1 text-sm" value="${mapData.walkableBounds.minY}"></div>
            <div><label class="text-xs text-gray-500">maxY</label><input type="number" id="wb-maxY" min="0" max="1" step="0.01" class="w-full border rounded px-2 py-1 text-sm" value="${mapData.walkableBounds.maxY}"></div>
          </div>
          <p class="text-sm text-gray-600 mb-2">障碍区（河流、房顶等不可行走区域）</p>
          <div class="flex gap-2 mb-2">
            <button id="map-editor-add-blocked" class="px-3 py-1.5 bg-amber-500 text-white rounded text-sm">添加障碍区</button>
            <span id="map-editor-draw-hint" class="text-sm text-gray-500 hidden">点击地图添加顶点，至少 3 个点后点「闭合」</span>
            <button id="map-editor-close-polygon" class="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hidden">闭合</button>
          </div>
          <div id="map-editor-blocked-list" class="text-sm text-gray-600 space-y-1"></div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button id="map-editor-save" class="btn-3d btn-green">保存到本地</button>
          <button id="map-editor-export" class="btn-3d btn-gray">导出为 config</button>
          <button id="map-editor-reset" class="btn-3d btn-gray">重置为默认</button>
        </div>
        <div id="map-editor-export-area" class="mt-2 hidden">
          <textarea id="map-editor-export-text" class="w-full h-32 border rounded p-2 text-xs font-mono" readonly></textarea>
          <button id="map-editor-copy" class="mt-1 text-sm text-blue-600">复制到剪贴板</button>
        </div>
      </div>
      <div class="app-footer text-center text-gray-400 text-xs py-2">「TriSpring互娱」版权所有</div>
    `;

    bindEvents();
    refreshMarkers();
    refreshWalkablePreview();
    refreshBlockedList();
  }

  function bindEvents() {
    document.getElementById('map-editor-back')?.addEventListener('click', () => Router.go('wordbook'));
    document.getElementById('map-editor-select')?.addEventListener('change', (e) => {
      currentMapId = Number(e.target.value);
      npcSlotIndex = 0;
      walkableDrawing = false;
      currentPolygon = [];
      render();
    });
    document.getElementById('map-editor-mode-npc')?.addEventListener('click', () => { mode = 'npc'; render(); });
    document.getElementById('map-editor-mode-walkable')?.addEventListener('click', () => { mode = 'walkable'; render(); });

    document.getElementById('map-editor-save')?.addEventListener('click', saveCurrent);
    document.getElementById('map-editor-export')?.addEventListener('click', showExport);
    document.getElementById('map-editor-reset')?.addEventListener('click', resetCurrent);
    document.getElementById('map-editor-add-blocked')?.addEventListener('click', startDrawingBlocked);
    document.getElementById('map-editor-close-polygon')?.addEventListener('click', closePolygon);
    document.getElementById('map-editor-copy')?.addEventListener('click', copyExport);

    // walkableBounds 输入变化时更新预览
    ['wb-minX', 'wb-maxX', 'wb-minY', 'wb-maxY'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', refreshWalkablePreview);
    });

    const img = document.getElementById('map-editor-img');
    const wrap = document.getElementById('map-editor-image-wrap');
    if (img && wrap) {
      img.onload = () => { imageRect = wrap.getBoundingClientRect(); };
      wrap.addEventListener('click', onMapImageClick);
    }
    if (wrap) imageRect = wrap.getBoundingClientRect();
  }

  function getClickRatio(e) {
    const wrap = document.getElementById('map-editor-image-wrap');
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    const img = document.getElementById('map-editor-img');
    if (!img) return null;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }

  function onMapImageClick(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
    const ratio = getClickRatio(e);
    if (!ratio) return;

    if (mode === 'npc') {
      const mapData = getMapData(currentMapId);
      const slots = { ...mapData.npcSlots };
      slots[npcSlotIndex + 1] = { x: Number(ratio.x.toFixed(2)), y: Number(ratio.y.toFixed(2)) };
      const overrides = getOverrides();
      overrides[currentMapId] = { ...overrides[currentMapId], npcSlots: slots };
      setOverrides(overrides);
      npcSlotIndex = (npcSlotIndex + 1) % 4;
      refreshMarkers();
      const el = document.getElementById('npc-slot-current');
      if (el) el.textContent = npcSlotIndex + 1;
      const panel = document.getElementById('map-editor-npc-panel');
      if (panel) {
        const grid = panel.querySelector('.grid');
        if (grid) {
          const mapData2 = getMapData(currentMapId);
          grid.innerHTML = [1,2,3,4].map(s => {
            const slot = mapData2.npcSlots[s];
            return `<div>槽位${s}: ${slot ? `x=${slot.x.toFixed(2)} y=${slot.y.toFixed(2)}` : '未设置'}</div>`;
          }).join('');
        }
      }
      return;
    }

    if (mode === 'walkable' && walkableDrawing) {
      currentPolygon.push({ x: Number(ratio.x.toFixed(2)), y: Number(ratio.y.toFixed(2)) });
      refreshDrawingPolygon();
      const hint = document.getElementById('map-editor-draw-hint');
      const closeBtn = document.getElementById('map-editor-close-polygon');
      if (currentPolygon.length >= 3) {
        if (closeBtn) closeBtn.classList.remove('hidden');
      }
    }
  }

  function refreshMarkers() {
    const mapData = getMapData(currentMapId);
    const wrap = document.getElementById('map-editor-markers');
    if (!wrap) return;
    wrap.innerHTML = '';
    const rect = wrap.getBoundingClientRect();
    for (let s = 1; s <= 4; s++) {
      const slot = mapData.npcSlots[s];
      if (!slot) continue;
      const left = (slot.x * 100) + '%';
      const top = (slot.y * 100) + '%';
      const dot = document.createElement('div');
      dot.className = 'absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold';
      dot.style.left = left;
      dot.style.top = top;
      dot.textContent = s;
      wrap.appendChild(dot);
    }
  }

  function refreshWalkablePreview() {
    const mapData = getMapData(currentMapId);
    const minX = Number(document.getElementById('wb-minX')?.value) ?? mapData.walkableBounds.minX;
    const maxX = Number(document.getElementById('wb-maxX')?.value) ?? mapData.walkableBounds.maxX;
    const minY = Number(document.getElementById('wb-minY')?.value) ?? mapData.walkableBounds.minY;
    const maxY = Number(document.getElementById('wb-maxY')?.value) ?? mapData.walkableBounds.maxY;
    const overrides = getOverrides();
    overrides[currentMapId] = { ...overrides[currentMapId], walkableBounds: { minX, maxX, minY, maxY } };
    setOverrides(overrides);

    const svg = document.getElementById('map-editor-svg');
    if (!svg) return;
    // viewBox 0 0 100 100，比例 0-1 对应 0-100
    const x1 = minX * 100, y1 = minY * 100, w = (maxX - minX) * 100, h = (maxY - minY) * 100;
    let html = `<rect x="${x1}" y="${y1}" width="${w}" height="${h}" fill="rgba(0,200,0,0.15)" stroke="green" stroke-width="1"/>`;
    const mapData2 = getMapData(currentMapId);
    (mapData2.blockedPolygons || []).forEach((poly) => {
      if (poly.length < 3) return;
      const pts = poly.map(p => `${p.x * 100} ${p.y * 100}`).join(' ');
      html += `<polygon points="${pts}" fill="rgba(200,0,0,0.3)" stroke="red" stroke-width="1"/>`;
    });
    svg.innerHTML = html;
  }

  function refreshDrawingPolygon() {
    const svg = document.getElementById('map-editor-svg');
    if (!svg) return;
    refreshWalkablePreview();
    if (currentPolygon.length >= 2) {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('points', currentPolygon.map(p => `${p.x * 100} ${p.y * 100}`).join(' '));
      poly.setAttribute('fill', 'rgba(255,165,0,0.3)');
      poly.setAttribute('stroke', 'orange');
      poly.setAttribute('stroke-width', '1');
      svg.appendChild(poly);
    }
  }

  function refreshBlockedList() {
    const mapData = getMapData(currentMapId);
    const list = document.getElementById('map-editor-blocked-list');
    if (!list) return;
    const polys = mapData.blockedPolygons || [];
    list.innerHTML = polys.length === 0
      ? '<span class="text-gray-400">暂无障碍区</span>'
      : polys.map((p, i) => `<div class="flex items-center gap-2"><span>障碍 ${i + 1}（${p.length} 个顶点）</span><button class="map-editor-del-blocked text-red-500 text-xs" data-i="${i}">删除</button></div>`).join('');
    list.querySelectorAll('.map-editor-del-blocked').forEach(btn => {
      btn.addEventListener('click', () => {
        const overrides = getOverrides();
        const arr = [...(overrides[currentMapId]?.blockedPolygons || getMapData(currentMapId).blockedPolygons || [])];
        arr.splice(Number(btn.dataset.i), 1);
        overrides[currentMapId] = { ...overrides[currentMapId], blockedPolygons: arr };
        setOverrides(overrides);
        render();
      });
    });
  }

  function startDrawingBlocked() {
    walkableDrawing = true;
    currentPolygon = [];
    document.getElementById('map-editor-draw-hint')?.classList.remove('hidden');
    document.getElementById('map-editor-close-polygon')?.classList.add('hidden');
  }

  function closePolygon() {
    if (currentPolygon.length < 3) {
      UI.showToast('至少需要 3 个顶点', 'error');
      return;
    }
    const overrides = getOverrides();
    const arr = [...(overrides[currentMapId]?.blockedPolygons || [])];
    arr.push(currentPolygon);
    overrides[currentMapId] = { ...overrides[currentMapId], blockedPolygons: arr };
    setOverrides(overrides);
    walkableDrawing = false;
    currentPolygon = [];
    document.getElementById('map-editor-draw-hint')?.classList.add('hidden');
    document.getElementById('map-editor-close-polygon')?.classList.add('hidden');
    render();
  }

  function saveCurrent() {
    if (mode === 'walkable') {
      const minX = Number(document.getElementById('wb-minX')?.value);
      const maxX = Number(document.getElementById('wb-maxX')?.value);
      const minY = Number(document.getElementById('wb-minY')?.value);
      const maxY = Number(document.getElementById('wb-maxY')?.value);
      if ([minX, maxX, minY, maxY].some(n => isNaN(n))) {
        UI.showToast('请填写正确的可行走矩形', 'error');
        return;
      }
      const overrides = getOverrides();
      overrides[currentMapId] = { ...overrides[currentMapId], walkableBounds: { minX, maxX, minY, maxY } };
      setOverrides(overrides);
    }
    UI.showToast('已保存，游戏将使用此配置', 'success');
  }

  function resetCurrent() {
    const overrides = getOverrides();
    delete overrides[currentMapId];
    setOverrides(overrides);
    npcSlotIndex = 0;
    walkableDrawing = false;
    currentPolygon = [];
    UI.showToast('已重置为默认', 'success');
    render();
  }

  function showExport() {
    const mapData = getMapData(currentMapId);
    const base = MAPS_CONFIG[currentMapId] || MAPS_CONFIG[1];
    let text = `// 地图 ${currentMapId} - ${base.name}\n`;
    text += `npcSlots: {\n`;
    [1,2,3,4].forEach(s => {
      const slot = mapData.npcSlots[s];
      if (slot) text += `  ${s}: { x: ${slot.x}, y: ${slot.y} },\n`;
    });
    text += `},\nwalkableBounds: { minX: ${mapData.walkableBounds.minX}, maxX: ${mapData.walkableBounds.maxX}, minY: ${mapData.walkableBounds.minY}, maxY: ${mapData.walkableBounds.maxY} }`;
    if (mapData.blockedPolygons && mapData.blockedPolygons.length > 0) {
      text += `,\nblockedPolygons: ${JSON.stringify(mapData.blockedPolygons)}`;
    }
    text += '\n';
    document.getElementById('map-editor-export-text').value = text;
    document.getElementById('map-editor-export-area').classList.remove('hidden');
  }

  function copyExport() {
    const ta = document.getElementById('map-editor-export-text');
    if (ta) {
      ta.select();
      document.execCommand('copy');
      UI.showToast('已复制到剪贴板', 'success');
    }
  }

  return {
    mount(params = {}) {
      container = UI.getContainer();
      currentMapId = params.mapId || 1;
      mode = 'npc';
      npcSlotIndex = 0;
      walkableDrawing = false;
      currentPolygon = [];
      render();
    },
    unmount() {
      container = null;
    }
  };
})();
