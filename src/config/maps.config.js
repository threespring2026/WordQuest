/**
 * WordQuest 地图配置
 * 所有坐标均以原图左上角为 (0, 0)、右下角为 (1, 1)。
 * npcSlots 对应图中的白色菱形站位标记。森林、海港和废墟的地面碰撞网格
 * 根据原图生成，另用多边形补上桥与草地通道、扣除大型场景障碍。
 */

// 旧编辑器的本地覆盖使用另一版本坐标；保留旧数据，但不让它覆盖新版地图。
const MAP_OVERRIDES_KEY = 'wordquest_map_editor_overrides_v3';
const COLLISION_MASKS = typeof module !== 'undefined' && module.exports
  ? require('./collision-masks.config.js')
  : MAP_COLLISION_MASKS;

const MAPS_CONFIG = {
  1: {
    id: 1,
    name: "森林",
    nameEn: "Forest",
    image: "assets/maps/map_01_forest.png",
    moods: ["warm", "sad"],
    walkableBounds: { minX: 0.03, maxX: 0.94, minY: 0.02, maxY: 0.98 },
    walkableMask: COLLISION_MASKS[1],
    npcSlots: {
      1: { x: 0.77, y: 0.14 },
      2: { x: 0.21, y: 0.58 },
      3: { x: 0.69, y: 0.71 },
      4: { x: 0.21, y: 0.88 }
    },
    playerStart: { x: 0.12, y: 0.97 }
  },

  2: {
    id: 2,
    name: "城镇广场",
    nameEn: "Town Square",
    image: "assets/maps/map_02_town.png",
    moods: ["funny", "happy"],
    walkableBounds: { minX: 0.04, maxX: 0.96, minY: 0.18, maxY: 0.94 },
    blockedPolygons: [
      [{ x: 0.23, y: 0.00 }, { x: 0.79, y: 0.00 }, { x: 0.81, y: 0.28 }, { x: 0.23, y: 0.28 }],
      [{ x: 0.00, y: 0.28 }, { x: 0.33, y: 0.34 }, { x: 0.33, y: 0.54 }, { x: 0.00, y: 0.57 }],
      [{ x: 0.75, y: 0.28 }, { x: 1.00, y: 0.28 }, { x: 1.00, y: 0.49 }, { x: 0.75, y: 0.49 }],
      [{ x: 0.39, y: 0.61 }, { x: 0.61, y: 0.61 }, { x: 0.65, y: 0.69 }, { x: 0.60, y: 0.77 }, { x: 0.39, y: 0.77 }, { x: 0.35, y: 0.69 }],
      [{ x: 0.62, y: 0.54 }, { x: 0.70, y: 0.54 }, { x: 0.70, y: 0.64 }, { x: 0.62, y: 0.64 }]
    ],
    npcSlots: {
      1: { x: 0.20, y: 0.25 },
      2: { x: 0.75, y: 0.51 },
      3: { x: 0.21, y: 0.58 },
      4: { x: 0.73, y: 0.85 }
    },
    playerStart: { x: 0.50, y: 0.88 }
  },

  3: {
    id: 3,
    name: "王宫大厅",
    nameEn: "Royal Hall",
    image: "assets/maps/map_03_palace.png",
    moods: ["warm", "happy"],
    walkableBounds: { minX: 0.04, maxX: 0.96, minY: 0.10, maxY: 0.95 },
    blockedPolygons: [
      [{ x: 0.33, y: 0.00 }, { x: 0.68, y: 0.00 }, { x: 0.68, y: 0.27 }, { x: 0.33, y: 0.27 }],
      [{ x: 0.00, y: 0.14 }, { x: 0.17, y: 0.14 }, { x: 0.17, y: 0.24 }, { x: 0.00, y: 0.24 }],
      [{ x: 0.83, y: 0.14 }, { x: 1.00, y: 0.14 }, { x: 1.00, y: 0.24 }, { x: 0.83, y: 0.24 }],
      [{ x: 0.00, y: 0.43 }, { x: 0.14, y: 0.43 }, { x: 0.14, y: 0.58 }, { x: 0.00, y: 0.58 }],
      [{ x: 0.86, y: 0.43 }, { x: 1.00, y: 0.43 }, { x: 1.00, y: 0.58 }, { x: 0.86, y: 0.58 }]
    ],
    npcSlots: {
      1: { x: 0.24, y: 0.13 },
      2: { x: 0.25, y: 0.27 },
      3: { x: 0.74, y: 0.51 },
      4: { x: 0.72, y: 0.85 }
    },
    playerStart: { x: 0.50, y: 0.88 }
  },

  4: {
    id: 4,
    name: "海港码头",
    nameEn: "Harbor Dock",
    image: "assets/maps/map_04_harbor.png",
    moods: ["funny", "sad"],
    walkableBounds: { minX: 0.04, maxX: 0.97, minY: 0.16, maxY: 0.91 },
    walkableMask: COLLISION_MASKS[4],
    blockedPolygons: [
      [{ x: 0.04, y: 0.39 }, { x: 0.23, y: 0.39 }, { x: 0.25, y: 0.50 }, { x: 0.04, y: 0.52 }],
      [{ x: 0.42, y: 0.17 }, { x: 0.63, y: 0.17 }, { x: 0.64, y: 0.28 }, { x: 0.42, y: 0.28 }],
      [{ x: 0.71, y: 0.29 }, { x: 0.94, y: 0.29 }, { x: 0.94, y: 0.45 }, { x: 0.71, y: 0.45 }],
      [{ x: 0.44, y: 0.37 }, { x: 0.59, y: 0.37 }, { x: 0.59, y: 0.46 }, { x: 0.44, y: 0.46 }],
      [{ x: 0.61, y: 0.40 }, { x: 0.76, y: 0.40 }, { x: 0.76, y: 0.53 }, { x: 0.61, y: 0.53 }],
      [{ x: 0.69, y: 0.55 }, { x: 0.98, y: 0.55 }, { x: 0.98, y: 0.70 }, { x: 0.69, y: 0.70 }]
    ],
    npcSlots: {
      1: { x: 0.35, y: 0.23 },
      2: { x: 0.27, y: 0.52 },
      3: { x: 0.54, y: 0.56 },
      4: { x: 0.76, y: 0.74 }
    },
    playerStart: { x: 0.87, y: 0.82 }
  },

  5: {
    id: 5,
    name: "废墟遗迹",
    nameEn: "Ruins",
    image: "assets/maps/map_05_ruins.png",
    moods: ["sad"],
    walkableBounds: { minX: 0.04, maxX: 0.94, minY: 0.21, maxY: 0.96 },
    walkableMask: COLLISION_MASKS[5],
    walkablePolygons: [
      [{ x: 0.39, y: 0.48 }, { x: 0.44, y: 0.42 }, { x: 0.48, y: 0.33 }, { x: 0.54, y: 0.29 }, { x: 0.58, y: 0.34 }, { x: 0.53, y: 0.40 }, { x: 0.49, y: 0.48 }, { x: 0.43, y: 0.53 }]
    ],
    npcSlots: {
      1: { x: 0.75, y: 0.36 },
      2: { x: 0.25, y: 0.57 },
      3: { x: 0.68, y: 0.74 },
      4: { x: 0.21, y: 0.90 }
    },
    playerStart: { x: 0.50, y: 0.81 }
  },

  6: {
    id: 6,
    name: "学院庭院",
    nameEn: "Academy Courtyard",
    image: "assets/maps/map_06_academy.png",
    moods: ["happy", "warm"],
    walkableBounds: { minX: 0.04, maxX: 0.96, minY: 0.28, maxY: 0.96 },
    blockedPolygons: [
      [{ x: 0.31, y: 0.36 }, { x: 0.64, y: 0.36 }, { x: 0.67, y: 0.45 }, { x: 0.64, y: 0.55 }, { x: 0.31, y: 0.55 }, { x: 0.28, y: 0.45 }],
      [{ x: 0.00, y: 0.63 }, { x: 0.40, y: 0.63 }, { x: 0.47, y: 0.74 }, { x: 0.00, y: 0.79 }],
      [{ x: 0.67, y: 0.61 }, { x: 1.00, y: 0.61 }, { x: 1.00, y: 1.00 }, { x: 0.69, y: 1.00 }],
      [{ x: 0.19, y: 0.29 }, { x: 0.29, y: 0.29 }, { x: 0.29, y: 0.39 }, { x: 0.19, y: 0.39 }],
      [{ x: 0.69, y: 0.29 }, { x: 0.79, y: 0.29 }, { x: 0.79, y: 0.39 }, { x: 0.69, y: 0.39 }]
    ],
    npcSlots: {
      1: { x: 0.11, y: 0.33 },
      2: { x: 0.89, y: 0.33 },
      3: { x: 0.28, y: 0.48 },
      4: { x: 0.51, y: 0.81 }
    },
    playerStart: { x: 0.50, y: 0.86 }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MAPS_CONFIG;
}
