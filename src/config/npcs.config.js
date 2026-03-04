/**
 * WordQuest NPC 角色配置
 * 包含实际图片路径
 */

const NPCS_CONFIG = {
  NPC_01: {
    id: "NPC_01",
    name: "Mr. Baxter",
    nameCN: "老商人",
    title: "Merchant",
    titleCN: "商人",
    personality: "睿智、精明",
    images: {
      idle: "assets/npcs/npc_01_idle.png",
      surprised: "assets/npcs/npc_01_surprised.png",
      head: "assets/npcs/npc_01_head.png"
    }
  },
  NPC_02: {
    id: "NPC_02",
    name: "Emily",
    nameCN: "少女探险家",
    title: "Explorer",
    titleCN: "探险家",
    personality: "活泼、好奇",
    images: {
      idle: "assets/npcs/npc_02_idle.png",
      surprised: "assets/npcs/npc_02_surprised.png",
      head: "assets/npcs/npc_02_head.png"
    }
  },
  NPC_03: {
    id: "NPC_03",
    name: "Sir Roland",
    nameCN: "王国骑士",
    title: "Knight",
    titleCN: "骑士",
    personality: "正直、严肃",
    images: {
      idle: "assets/npcs/npc_03_idle.png",
      surprised: "assets/npcs/npc_03_surprised.png",
      head: "assets/npcs/npc_03_head.png"
    }
  },
  NPC_04: {
    id: "NPC_04",
    name: "Mira",
    nameCN: "神秘法师",
    title: "Mystic",
    titleCN: "法师",
    personality: "深沉、话少",
    images: {
      idle: "assets/npcs/npc_04_idle.png",
      surprised: "assets/npcs/npc_04_surprised.png",
      head: "assets/npcs/npc_04_head.png"
    }
  },
  NPC_05: {
    id: "NPC_05",
    name: "Elder Hugo",
    nameCN: "村庄长老",
    title: "Elder",
    titleCN: "长老",
    personality: "慈祥、守旧",
    images: {
      idle: "assets/npcs/npc_05_idle.png",
      surprised: "assets/npcs/npc_05_surprised.png",
      head: "assets/npcs/npc_05_head.png"
    }
  },
  NPC_06: {
    id: "NPC_06",
    name: "Leo",
    nameCN: "调皮孩子",
    title: "Child",
    titleCN: "小孩",
    personality: "淘气、机灵",
    images: {
      idle: "assets/npcs/npc_06_idle.png",
      surprised: "assets/npcs/npc_06_surprised.png",
      head: "assets/npcs/npc_06_head.png"
    }
  }
};

// 玩家形象配置
const PLAYER_AVATARS = {
  boy: {
    id: "boy",
    name: "男孩",
    image: "assets/player/player_boy.png"
  },
  girl: {
    id: "girl",
    name: "女孩",
    image: "assets/player/player_girl.png"
  },
  guest: {
    id: "guest",
    name: "游客",
    image: null  // 游客使用默认图标
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NPCS_CONFIG, PLAYER_AVATARS };
}
