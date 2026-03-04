/**
 * WordQuest 地图配置
 * NPC 站位坐标已根据各背景图中的白色菱形框精确测量
 * walkableBounds 覆盖整张地图可行走区域
 * playerStart 为地图最下方中间位置
 */

const MAPS_CONFIG = {
  1: {
    id: 1,
    name: "森林",
    nameEn: "Forest",
    image: "assets/maps/map_01_forest.png",
    moods: ["warm", "sad"],
    // 森林：沙土路贯穿全图，可行走范围覆盖路面
    walkableBounds: {
      minX: 0.05, maxX: 0.90,
      minY: 0.05, maxY: 0.90
    },
    // NPC 站位点精确对应图中白色菱形框中心
    npcSlots: {
      1: { x: 0.67, y: 0.12 },  // 右上路面框
      2: { x: 0.09, y: 0.48 },  // 左中路面框
      3: { x: 0.13, y: 0.59 },  // 左下路口框
      4: { x: 0.35, y: 0.63 }   // 下方中央路口框
    },
    playerStart: { x: 0.50, y: 0.86 }
  },

  2: {
    id: 2,
    name: "城镇广场",
    nameEn: "Town Square",
    image: "assets/maps/map_02_town.png",
    moods: ["funny", "happy"],
    // 城镇：地砖区域，广场开阔
    walkableBounds: {
      minX: 0.05, maxX: 0.90,
      minY: 0.38, maxY: 0.92
    },
    // 对应图中白色框位置
    npcSlots: {
      1: { x: 0.14, y: 0.44 },  // 香蕉铺旁框
      2: { x: 0.67, y: 0.43 },  // 帽子店旁框
      3: { x: 0.54, y: 0.62 },  // 广场中央石碑旁框
      4: { x: 0.63, y: 0.78 }   // 长椅旁框
    },
    playerStart: { x: 0.50, y: 0.88 }
  },

  3: {
    id: 3,
    name: "王宫大厅",
    nameEn: "Royal Hall",
    image: "assets/maps/map_03_palace.png",
    moods: ["warm", "happy"],
    // 宫殿：大厅地板，地毯两侧均可行走
    walkableBounds: {
      minX: 0.05, maxX: 0.92,
      minY: 0.10, maxY: 0.92
    },
    // 对应宫殿地板上的白色框
    npcSlots: {
      1: { x: 0.14, y: 0.16 },  // 左上柱子旁框
      2: { x: 0.59, y: 0.16 },  // 右上箱子旁框
      3: { x: 0.13, y: 0.38 },  // 左中框
      4: { x: 0.57, y: 0.47 }   // 右中框
    },
    playerStart: { x: 0.50, y: 0.88 }
  },

  4: {
    id: 4,
    name: "海港码头",
    nameEn: "Harbor Dock",
    image: "assets/maps/map_04_harbor.png",
    moods: ["funny", "sad"],
    // 码头：木板路和地砖区域
    walkableBounds: {
      minX: 0.08, maxX: 0.88,
      minY: 0.20, maxY: 0.88
    },
    // 对应码头上的白色框
    npcSlots: {
      1: { x: 0.22, y: 0.27 },  // 上层码头框
      2: { x: 0.55, y: 0.47 },  // 中央广场框
      3: { x: 0.60, y: 0.58 },  // 锚雕像旁框
      4: { x: 0.65, y: 0.72 }   // 下层码头框
    },
    playerStart: { x: 0.50, y: 0.85 }
  },

  5: {
    id: 5,
    name: "废墟遗迹",
    nameEn: "Ruins",
    image: "assets/maps/map_05_ruins.png",
    moods: ["sad"],
    // 废墟：沙土路蜿蜒，可行走区域较宽
    walkableBounds: {
      minX: 0.05, maxX: 0.88,
      minY: 0.22, maxY: 0.90
    },
    // 对应废墟路面上的白色框
    npcSlots: {
      1: { x: 0.67, y: 0.29 },  // 右上废墟框
      2: { x: 0.11, y: 0.47 },  // 左中框
      3: { x: 0.18, y: 0.64 },  // 左下框
      4: { x: 0.52, y: 0.76 }   // 下中框
    },
    playerStart: { x: 0.50, y: 0.86 }
  },

  6: {
    id: 6,
    name: "学院庭院",
    nameEn: "Academy Courtyard",
    image: "assets/maps/map_06_academy.png",
    moods: ["happy", "warm"],
    // 学院：石板路，庭院中央喷泉区域
    walkableBounds: {
      minX: 0.05, maxX: 0.88,
      minY: 0.22, maxY: 0.90
    },
    // 对应庭院地面上的白色框
    npcSlots: {
      1: { x: 0.11, y: 0.29 },  // 左侧雕像旁框
      2: { x: 0.64, y: 0.29 },  // 右侧雕像旁框
      3: { x: 0.19, y: 0.41 },  // 喷泉左框
      4: { x: 0.30, y: 0.73 }   // 花圃旁框
    },
    playerStart: { x: 0.50, y: 0.86 }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MAPS_CONFIG;
}
