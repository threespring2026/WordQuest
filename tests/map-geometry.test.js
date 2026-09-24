const test = require('node:test');
const assert = require('node:assert/strict');
const maps = require('../src/config/maps.config.js');
const geometry = require('../src/shared/map-geometry.js');

test('all six maps can reach every NPC marker from the spawn point', () => {
  for (const map of Object.values(maps)) {
    assert.equal(geometry.isWalkable(map, map.playerStart.x, map.playerStart.y), true, `${map.name}: spawn`);
    for (const [slot, point] of Object.entries(map.npcSlots)) {
      assert.equal(geometry.isWalkable(map, point.x, point.y), true, `${map.name}: slot ${slot}`);
      const route = geometry.findPath(map, map.playerStart, point);
      assert.ok(route.length > 1, `${map.name}: slot ${slot} has no route`);
      const destination = route.at(-1);
      assert.ok(Math.hypot(destination.x - point.x, destination.y - point.y) < 0.01, `${map.name}: slot ${slot} stops short`);
      for (let index = 1; index < route.length; index++) {
        const from = route[index - 1], to = route[index];
        for (const part of [0.25, 0.5, 0.75, 1]) {
          const x = from.x + (to.x - from.x) * part;
          const y = from.y + (to.y - from.y) * part;
          assert.equal(geometry.isWalkable(map, x, y), true, `${map.name}: route to ${slot} cuts through an obstacle`);
        }
      }
    }
  }
});

test('visible roads and docks outside the old narrow guide lines remain reachable', () => {
  const floorSamples = {
    1: [[0.50, 0.20], [0.70, 0.30], [0.42, 0.50], [0.45, 0.75]],
    2: [[0.50, 0.38], [0.50, 0.52], [0.15, 0.78], [0.80, 0.70]],
    3: [[0.50, 0.50], [0.20, 0.40], [0.80, 0.65], [0.20, 0.80]],
    4: [[0.35, 0.30], [0.50, 0.30], [0.30, 0.52], [0.40, 0.65], [0.80, 0.80]],
    5: [[0.55, 0.30], [0.40, 0.50], [0.50, 0.81], [0.68, 0.74]],
    6: [[0.12, 0.45], [0.50, 0.60], [0.75, 0.44], [0.50, 0.81], [0.25, 0.55], [0.85, 0.40]]
  };
  for (const [mapId, samples] of Object.entries(floorSamples)) {
    const map = maps[mapId];
    for (const [x, y] of samples) {
      assert.equal(geometry.isWalkable(map, x, y), true, `${map.name}: visible floor ${x},${y}`);
      const path = geometry.findPath(map, map.playerStart, { x, y });
      assert.ok(path.length > 1, `${map.name}: visible floor ${x},${y} cannot be reached`);
      const last = path.at(-1);
      assert.ok(Math.hypot(last.x - x, last.y - y) < 0.01, `${map.name}: visible floor ${x},${y} stops short`);
    }
  }
});

test('visible image and click positions share one coordinate system', () => {
  for (const viewport of [[420, 591], [390, 780], [700, 500]]) {
    const frame = geometry.imageFrame(...viewport, 816, 1312);
    for (const point of [{ x: 0, y: 0 }, { x: 0.25, y: 0.7 }, { x: 1, y: 1 }]) {
      const screen = geometry.toScreen(frame, point);
      const back = geometry.fromScreen(frame, screen.x, screen.y);
      assert.ok(Math.abs(back.x - point.x) < 1e-10);
      assert.ok(Math.abs(back.y - point.y) < 1e-10);
    }
    assert.equal(geometry.fromScreen(frame, frame.left - 1, frame.top), null);
  }
});

test('water, buildings and major fixtures are outside the walkable channels', () => {
  const obstacles = [
    [1, 0.08, 0.32], // 森林河流
    [2, 0.50, 0.69], // 城镇喷泉
    [3, 0.50, 0.15], // 王宫王座
    [4, 0.08, 0.82], // 海港海面
    [5, 0.72, 0.64], // 废墟池塘
    [6, 0.50, 0.45]  // 学院喷泉
  ];
  for (const [mapId, x, y] of obstacles) {
    assert.equal(geometry.isWalkable(maps[mapId], x, y), false, `${maps[mapId].name}: obstacle`);
    assert.deepEqual(geometry.findPath(maps[mapId], maps[mapId].playerStart, { x, y }), [], `${maps[mapId].name}: should not enter obstacle`);
  }
});
