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
      for (const step of route) {
        assert.equal(geometry.isWalkable(map, step.x, step.y), true, `${map.name}: route to ${slot} leaves the channel`);
      }
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
  }
});
