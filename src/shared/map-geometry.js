/** 地图上的站位、碰撞与寻路统一使用原图的 0～1 坐标。 */
const MapGeometry = (function() {
  const GRID_COLS = 48;
  const GRID_ROWS = 80;

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
    if (paths.length || areas.length) {
      const onPath = paths.some(path => isOnPath(x, y, path, heightOverWidth));
      const inArea = areas.some(area => pointInPolygon(x, y, area));
      if (!onPath && !inArea) return false;
    }
    return !(map.blockedPolygons || []).some(area => pointInPolygon(x, y, area));
  }

  function findPath(map, start, end, heightOverWidth = 1.6) {
    if (!isWalkable(map, end.x, end.y, heightOverWidth)) return [];
    const key = (x, y) => y * GRID_COLS + x;
    const cell = point => ({
      x: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(point.x * GRID_COLS))),
      y: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(point.y * GRID_ROWS)))
    });
    const center = (x, y) => ({ x: (x + 0.5) / GRID_COLS, y: (y + 0.5) / GRID_ROWS });
    const total = GRID_COLS * GRID_ROWS;
    const allowed = new Uint8Array(total);
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const p = center(x, y);
        allowed[key(x, y)] = isWalkable(map, p.x, p.y, heightOverWidth) ? 1 : 0;
      }
    }
    const startCell = cell(start), endCell = cell(end);
    const startKey = key(startCell.x, startCell.y);
    const endKey = key(endCell.x, endCell.y);
    if (!allowed[startKey] || !allowed[endKey]) return [];

    const previous = new Int32Array(total).fill(-1);
    const seen = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0, tail = 0;
    queue[tail++] = startKey;
    seen[startKey] = 1;
    while (head < tail && !seen[endKey]) {
      const current = queue[head++];
      const x = current % GRID_COLS, y = Math.floor(current / GRID_COLS);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        const next = key(nx, ny);
        if (!allowed[next] || seen[next]) continue;
        seen[next] = 1;
        previous[next] = current;
        queue[tail++] = next;
      }
    }
    if (!seen[endKey]) return [];

    const route = [];
    for (let at = endKey; at !== -1; at = previous[at]) {
      route.push(center(at % GRID_COLS, Math.floor(at / GRID_COLS)));
    }
    route.reverse();
    route[0] = start;
    route.push(end);
    return route;
  }

  return { imageFrame, toScreen, fromScreen, pointInPolygon, isWalkable, findPath };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MapGeometry;
