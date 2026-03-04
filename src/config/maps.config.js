/**
 * WordQuest 地图配置
 * 包含实际图片路径、可行走区域边界、NPC站位点
 */

const MAPS_CONFIG = {
  1: {
    id: 1,
    name: "森林",
    nameEn: "Forest",
    image: "assets/maps/map_01_forest.png",
    moods: ["warm", "sad"],
    // 可行走区域边界 (相对于地图尺寸的百分比)
    walkableBounds: {
      minX: 0.05,   // 左边界 5%
      maxX: 0.95,   // 右边界 95%
      minY: 0.15,   // 上边界 15%
      maxY: 0.55    // 下边界 55%（下半部分不可到达）
    },
    // NPC 站位点（4个固定位置）
    npcSlots: {
      1: { x: 0.15, y: 0.20 },  // 左上
      2: { x: 0.75, y: 0.22 },  // 右上
      3: { x: 0.20, y: 0.40 },  // 左中
      4: { x: 0.70, y: 0.42 }   // 右中
    },
    // 玩家起始位置
    playerStart: { x: 0.45, y: 0.50 }
  },
  2: {
    id: 2,
    name: "城镇广场",
    nameEn: "Town Square",
    image: "assets/maps/map_02_town.png",
    moods: ["funny", "happy"],
    walkableBounds: {
      minX: 0.08,
      maxX: 0.92,
      minY: 0.12,
      maxY: 0.55
    },
    npcSlots: {
      1: { x: 0.12, y: 0.18 },
      2: { x: 0.78, y: 0.20 },
      3: { x: 0.18, y: 0.38 },
      4: { x: 0.72, y: 0.40 }
    },
    playerStart: { x: 0.45, y: 0.50 }
  },
  3: {
    id: 3,
    name: "王宫大厅",
    nameEn: "Royal Hall",
    image: "assets/maps/map_03_palace.png",
    moods: ["warm", "happy"],
    walkableBounds: {
      minX: 0.10,
      maxX: 0.90,
      minY: 0.20,   // 上方王座区域不可到达
      maxY: 0.55
    },
    npcSlots: {
      1: { x: 0.20, y: 0.25 },  // 左侧柱子旁
      2: { x: 0.70, y: 0.25 },  // 右侧柱子旁
      3: { x: 0.25, y: 0.42 },  // 左下
      4: { x: 0.65, y: 0.42 }   // 右下
    },
    playerStart: { x: 0.45, y: 0.50 }
  },
  4: {
    id: 4,
    name: "海港码头",
    nameEn: "Harbor Dock",
    image: "assets/maps/map_04_harbor.png",
    moods: ["funny", "sad"],
    walkableBounds: {
      minX: 0.08,
      maxX: 0.92,
      minY: 0.15,
      maxY: 0.55
    },
    npcSlots: {
      1: { x: 0.15, y: 0.20 },
      2: { x: 0.75, y: 0.22 },
      3: { x: 0.20, y: 0.40 },
      4: { x: 0.70, y: 0.42 }
    },
    playerStart: { x: 0.45, y: 0.50 }
  },
  5: {
    id: 5,
    name: "废墟遗迹",
    nameEn: "Ruins",
    image: "assets/maps/map_05_ruins.png",
    moods: ["sad"],
    walkableBounds: {
      minX: 0.08,
      maxX: 0.92,
      minY: 0.15,
      maxY: 0.55
    },
    npcSlots: {
      1: { x: 0.18, y: 0.20 },
      2: { x: 0.72, y: 0.22 },
      3: { x: 0.22, y: 0.40 },
      4: { x: 0.68, y: 0.42 }
    },
    playerStart: { x: 0.45, y: 0.50 }
  },
  6: {
    id: 6,
    name: "学院庭院",
    nameEn: "Academy Courtyard",
    image: "assets/maps/map_06_academy.png",
    moods: ["happy", "warm"],
    walkableBounds: {
      minX: 0.08,
      maxX: 0.92,
      minY: 0.15,
      maxY: 0.55
    },
    npcSlots: {
      1: { x: 0.15, y: 0.20 },
      2: { x: 0.75, y: 0.22 },
      3: { x: 0.20, y: 0.40 },
      4: { x: 0.70, y: 0.42 }
    },
    playerStart: { x: 0.45, y: 0.50 }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MAPS_CONFIG;
}
