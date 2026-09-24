/** 地图上的站位、碰撞与寻路统一使用原图的 0～1 坐标。 */
const MapGeometry = (function() {
  const decodedMasks = new WeakMap();

  function maskBytes(mask) {
    if (decodedMasks.has(mask)) return decodedMasks.get(mask);
    const binary = typeof Buffer !== 'undefined'
      ? Buffer.from(mask.bits, 'base64')
      : Uint8Array.from(atob(mask.bits), character => character.charCodeAt(0));
    decodedMasks.set(mask, binary);
    return binary;
  }

  function maskCell(mask, col, row) {
    if (!mask || col < 0 || row < 0 || col >= mask.cols || row >= mask.rows) return false;
    const index = row * mask.cols + col;
    return !!(maskBytes(mask)[index >> 3] & (1 << (index & 7)));
  }

  function imageFrame(viewWidth, viewHeight, imageWidth, imageHeight) {
    if (!viewWidth || !viewHeight || !imageWidth || !imageHeight) return null;
    const scale = Math.min(viewWidth / imageWidth, viewHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    return { left: (viewWidth - width) / 2, top: (viewHeight - height) / 2, width, height };
  }

  function toScreen(frame, point) {
    return { x: frame.left + point.x * frame.width, y: frame.top + point.y * frame.height };
  }

  function fromScreen(frame, x, y) {
    const nx = (x - frame.left) / frame.width;
    const ny = (y - frame.top) / frame.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { x: nx, y: ny };
  }

  function pointInPolygon(x, y, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i];
      const b = polygon[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
        inside = !inside;
      }
    }
    return inside;
  }

  // 通道半径以图片宽度为单位，纵向距离按图片真实宽高比折算。
  function isOnPath(x, y, path, heightOverWidth) {
    const points = path.points || [];
    if (points.length === 0) return false;
    const radiusSq = path.radius * path.radius;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const ax = a.x, ay = a.y * heightOverWidth;
      const bx = b.x, by = b.y * heightOverWidth;
      const px = x, py = y * heightOverWidth;
      const dx = bx - ax, dy = by - ay;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq)) : 0;
      const distanceSq = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      if (distanceSq <= radiusSq) return true;
    }
    if (points.length === 1) {
      return (x - points[0].x) ** 2 + ((y - points[0].y) * heightOverWidth) ** 2 <= radiusSq;
    }
    return false;
  }

  function isWalkable(map, x, y, heightOverWidth = 1.6) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return false;
    const b = map.walkableBounds;
    if (b && (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY)) return false;
    const paths = map.walkablePaths || [];
    const areas = map.walkablePolygons || [];
    if (map.walkableMask || paths.length || areas.length) {
      const mask = map.walkableMask;
      const onMask = mask && maskCell(mask, Math.min(mask.cols - 1, Math.floor(x * mask.cols)), Math.min(mask.rows - 1, Math.floor(y * mask.rows)));
      const onPath = paths.some(path => isOnPath(x, y, path, heightOverWidth));
      const inArea = areas.some(area => pointInPolygon(x, y, area));
      // 白色菱形覆盖了路面颜色，角色站位附近仍应可达。
      const anchors = [map.playerStart, ...Object.values(map.npcSlots || {})].filter(Boolean);
      const nearMarker = !!mask && anchors.some(point =>
        (x - point.x) ** 2 + ((y - point.y) * heightOverWidth) ** 2 <= 0.035 ** 2
      );
      if (!onMask && !onPath && !inArea && !nearMarker) return false;
    }
    return !(map.blockedPolygons || []).some(area => pointInPolygon(x, y, area));
  }

  function findPath(map, start, end, heightOverWidth = 1.6) {
    if (!start || !end || !Number.isFinite(end.x) || !Number.isFinite(end.y)
        || end.x < 0 || end.x > 1 || end.y < 0 || end.y > 1) return [];
    const cols = map.walkableMask?.cols || 72;
    const rows = map.walkableMask?.rows || Math.round(cols * heightOverWidth);
    const key = (x, y) => y * cols + x;
    const cell = point => ({
      x: Math.max(0, Math.min(cols - 1, Math.floor(point.x * cols))),
      y: Math.max(0, Math.min(rows - 1, Math.floor(point.y * rows)))
    });
    const center = (x, y) => ({ x: (x + 0.5) / cols, y: (y + 0.5) / rows });
    const distance = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * heightOverWidth);
    const total = cols * rows;
    const allowed = new Uint8Array(total);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = center(x, y);
        allowed[key(x, y)] = isWalkable(map, p.x, p.y, heightOverWidth) ? 1 : 0;
      }
    }
    const startCell = cell(start);
    let startKey = key(startCell.x, startCell.y);
    if (!allowed[startKey]) {
      let bestDistance = Infinity;
      for (let index = 0; index < total; index++) {
        if (!allowed[index]) continue;
        const d = distance(start, center(index % cols, Math.floor(index / cols)));
        if (d < bestDistance) { bestDistance = d; startKey = index; }
      }
      if (bestDistance > 0.08) return [];
    }

    // 离障碍越远，路线代价越低；人物会走道路中部，而不是贴着水边和墙角。
    const clearance = new Uint8Array(total).fill(255);
    const clearanceQueue = new Int32Array(total);
    let head = 0, tail = 0;
    for (let index = 0; index < total; index++) {
      if (allowed[index]) continue;
      clearance[index] = 0;
      clearanceQueue[tail++] = index;
    }
    while (head < tail) {
      const current = clearanceQueue[head++];
      const x = current % cols, y = Math.floor(current / cols);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const next = key(nx, ny);
        if (clearance[next] <= clearance[current] + 1) continue;
        clearance[next] = clearance[current] + 1;
        clearanceQueue[tail++] = next;
      }
    }

    const originalEndCell = cell(end);
    const wantedKey = key(originalEndCell.x, originalEndCell.y);
    const targetIsWalkable = isWalkable(map, end.x, end.y, heightOverWidth);
    const wantedIsAllowed = !!allowed[wantedKey];
    const previous = new Int32Array(total).fill(-1);
    const closed = new Uint8Array(total);
    const costs = new Float32Array(total).fill(Infinity);
    const heap = [];
    const push = (index, priority) => {
      let position = heap.length;
      heap.push({ index, priority });
      while (position > 0) {
        const parent = (position - 1) >> 1;
        if (heap[parent].priority <= priority) break;
        heap[position] = heap[parent];
        position = parent;
      }
      heap[position] = { index, priority };
    };
    const pop = () => {
      const first = heap[0];
      const last = heap.pop();
      if (heap.length) {
        let position = 0;
        while (position * 2 + 1 < heap.length) {
          let child = position * 2 + 1;
          if (child + 1 < heap.length && heap[child + 1].priority < heap[child].priority) child++;
          if (last.priority <= heap[child].priority) break;
          heap[position] = heap[child];
          position = child;
        }
        heap[position] = last;
      }
      return first.index;
    };
    const heuristic = index => wantedIsAllowed
      ? Math.hypot(index % cols - originalEndCell.x, Math.floor(index / cols) - originalEndCell.y)
      : 0;
    costs[startKey] = 0;
    push(startKey, heuristic(startKey));
    while (heap.length) {
      const current = pop();
      if (closed[current]) continue;
      closed[current] = 1;
      if (wantedIsAllowed && current === wantedKey) break;
      const x = current % cols, y = Math.floor(current / cols);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const next = key(nx, ny);
        if (!allowed[next] || closed[next]) continue;
        if (dx && dy && (!allowed[key(x + dx, y)] || !allowed[key(x, y + dy)])) continue;
        const stepCost = (dx && dy ? Math.SQRT2 : 1) * (1 + 3 / (clearance[next] + 1));
        const candidateCost = costs[current] + stepCost;
        if (candidateCost >= costs[next]) continue;
        costs[next] = candidateCost;
        previous[next] = current;
        push(next, candidateCost + heuristic(next));
      }
    }

    // 点击在地面边缘时，选最近的可抵达落脚格；不把独立区域误当作已到达。
    let endKey = wantedIsAllowed && closed[wantedKey] ? wantedKey : -1;
    let bestDistance = endKey >= 0
      ? distance(end, center(endKey % cols, Math.floor(endKey / cols))) : Infinity;
    if (endKey < 0) {
      for (let index = 0; index < total; index++) {
        if (!closed[index]) continue;
        const d = distance(end, center(index % cols, Math.floor(index / cols)));
        if (d < bestDistance) { bestDistance = d; endKey = index; }
      }
    }
    if (endKey < 0 || bestDistance > (targetIsWalkable ? 0.025 : 0.09)) return [];

    const route = [];
    for (let at = endKey; at !== -1; at = previous[at]) {
      route.push(center(at % cols, Math.floor(at / cols)));
    }
    route.reverse();
    route[0] = start;
    const destination = targetIsWalkable && bestDistance < 0.025 ? end : route[route.length - 1];
    route.push(destination);
    return route;
  }

  return { imageFrame, toScreen, fromScreen, pointInPolygon, maskCell, isWalkable, findPath };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MapGeometry;
