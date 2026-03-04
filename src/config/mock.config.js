/**
 * WordQuest Mock 数据配置
 * DEMO 开发阶段使用，替代真实 AI 调用
 */

const MOCK_CONFIG = {
  // DEMO 固定单词包
  wordPack: [
    { word: "reputation", phonetic: "/ˌrepjuˈteɪʃn/", partOfSpeech: "n.", definition: "名声；声望" },
    { word: "royal", phonetic: "/ˈrɔɪəl/", partOfSpeech: "adj.", definition: "王室的；皇家的" },
    { word: "relieve", phonetic: "/rɪˈliːv/", partOfSpeech: "v.", definition: "减轻；解除" },
    { word: "plenty", phonetic: "/ˈplenti/", partOfSpeech: "n.", definition: "大量；充裕" },
    { word: "govern", phonetic: "/ˈɡʌvərn/", partOfSpeech: "v.", definition: "统治；管理" },
    { word: "frustrate", phonetic: "/ˈfrʌstreɪt/", partOfSpeech: "v.", definition: "使沮丧；阻挠" },
    { word: "enable", phonetic: "/ɪˈneɪbl/", partOfSpeech: "v.", definition: "使能够；允许" },
    { word: "division", phonetic: "/dɪˈvɪʒn/", partOfSpeech: "n.", definition: "分裂；部门" },
    { word: "disorder", phonetic: "/dɪsˈɔːrdər/", partOfSpeech: "n.", definition: "混乱；失调" },
    { word: "destruction", phonetic: "/dɪˈstrʌkʃn/", partOfSpeech: "n.", definition: "破坏；毁灭" }
  ],

  // Mock 故事简介
  synopsis: {
    background: "动乱的王国中，年轻使者背负王命，孤身穿越战火边境寻求和平。",
    mission: "将停战密信送达北方城主。"
  },

  // Mock 完整故事配置文档
  storyConfig: {
    mapId: 3,
    mood: "warm",
    npcs: [
      { npcId: "NPC_03", slot: 1 },
      { npcId: "NPC_01", slot: 2 },
      { npcId: "NPC_02", slot: 3 },
      { npcId: "NPC_04", slot: 4 }
    ],
    dialogues: [
      {
        round: 1,
        npcId: "NPC_03",
        npcLine: "The kingdom needs someone to **govern** with wisdom, not **division**.",
        npcLineCN: "王国需要一个有智慧的人来**治理**，而不是制造**分裂**。",
        options: [
          { id: "A", text: "I will rule with fear and **destroy** all who oppose me.", isCorrect: false, errorReply: "That's not **governing**, that's causing **destruction**." },
          { id: "B", text: "I will **govern** with justice and care for the people.", isCorrect: true, errorReply: null },
          { id: "C", text: "I don't care about this **disorder**.", isCorrect: false, errorReply: "Indifference will only bring more **disorder** to the land." }
        ],
        correctReply: "Well said. Your words carry **reputation** already. Go speak with Mr. Baxter near the east gate.",
        correctReplyCN: "说得好，你的话语已有**声望**。去东门找 Mr. Baxter 谈谈吧。"
      },
      {
        round: 2,
        npcId: "NPC_01",
        npcLine: "Ah, a messenger! The **royal** court sent you? There's **plenty** of trouble brewing.",
        npcLineCN: "啊，使者！**皇家**宫廷派你来的？麻烦可是**很多**啊。",
        options: [
          { id: "A", text: "Yes, the **royal** family wants peace and has **plenty** of resources to share.", isCorrect: true, errorReply: null },
          { id: "B", text: "I don't know anything about **royal** matters.", isCorrect: false, errorReply: "You carry the **royal** seal, don't pretend otherwise!" },
          { id: "C", text: "There's no **plenty** here, only **destruction**.", isCorrect: false, errorReply: "Don't be so negative. We need hope, not talk of **destruction**." }
        ],
        correctReply: "Good! A **reputation** for honesty serves you well. Emily the explorer knows the northern paths. Find her!",
        correctReplyCN: "好！诚实的**声望**对你大有帮助。探险家 Emily 熟悉北方的道路，去找她！"
      },
      {
        round: 3,
        npcId: "NPC_02",
        npcLine: "You seek the northern city? The path is dangerous. Will you let fear **frustrate** your mission?",
        npcLineCN: "你要去北方城市？路途危险。你会让恐惧**阻挠**你的使命吗？",
        options: [
          { id: "A", text: "Nothing will **frustrate** me. This mission will **enable** peace!", isCorrect: true, errorReply: null },
          { id: "B", text: "I'm already **frustrated**. Maybe I should give up.", isCorrect: false, errorReply: "Don't let doubt **frustrate** you! You're almost there." },
          { id: "C", text: "The **disorder** makes me want to turn back.", isCorrect: false, errorReply: "**Disorder** is everywhere, but you must push forward." }
        ],
        correctReply: "Brave words! Your courage will **relieve** the people's fears. The mystic Mira has wisdom to share.",
        correctReplyCN: "勇敢的话语！你的勇气会**减轻**人们的恐惧。神秘法师 Mira 有智慧要分享。"
      },
      {
        round: 4,
        npcId: "NPC_04",
        npcLine: "I sense your purpose. This letter can **enable** great change, or bring **destruction**.",
        npcLineCN: "我感知到了你的目的。这封信可以**促成**巨大的改变，也可能带来**毁灭**。",
        options: [
          { id: "A", text: "I choose **destruction** for our enemies!", isCorrect: false, errorReply: "**Destruction** begets more **destruction**. That is not the way." },
          { id: "B", text: "It will **enable** peace and **relieve** suffering.", isCorrect: true, errorReply: null },
          { id: "C", text: "I don't understand these **royal** matters.", isCorrect: false, errorReply: "You carry **royal** responsibility now. Understand it well." }
        ],
        correctReply: "Your heart is pure. The **division** between kingdoms may finally heal. Return to Sir Roland with my blessing.",
        correctReplyCN: "你的心地纯净。王国之间的**分裂**或许终将愈合。带着我的祝福回去找 Sir Roland。"
      },
      {
        round: 5,
        npcId: "NPC_03",
        npcLine: "You've returned! The mage's blessing will help **relieve** tensions. Are you ready to complete your quest?",
        npcLineCN: "你回来了！法师的祝福将有助于**缓解**紧张局势。你准备好完成任务了吗？",
        options: [
          { id: "A", text: "No, I feel **frustrated** and want to quit.", isCorrect: false, errorReply: "Don't be **frustrated** now! Victory is within reach." },
          { id: "B", text: "The **disorder** is too much for me to handle.", isCorrect: false, errorReply: "You've already brought order to **disorder**. Keep going!" },
          { id: "C", text: "Yes! My **reputation** depends on finishing this mission.", isCorrect: true, errorReply: null }
        ],
        correctReply: "Then go! **Govern** your fears and deliver the message. The **royal** court awaits your return.",
        correctReplyCN: "那就去吧！**控制**住你的恐惧，传递这个消息。**皇家**宫廷等待你的归来。"
      },
      {
        round: 6,
        npcId: "NPC_01",
        npcLine: "The northern lord received your letter! Peace is **enabled**. How do you feel?",
        npcLineCN: "北方城主收到了你的信！和平**达成**了。你感觉如何？",
        options: [
          { id: "A", text: "I feel **relieved**! No more **division** between our kingdoms.", isCorrect: true, errorReply: null },
          { id: "B", text: "I still feel **frustrated** despite the success.", isCorrect: false, errorReply: "Don't be **frustrated**! This is a moment of celebration!" },
          { id: "C", text: "This was just luck, not my **reputation**.", isCorrect: false, errorReply: "Your **reputation** earned this victory. Own it!" }
        ],
        correctReply: "Wonderful! You've proven that wisdom can **govern** over chaos. Your **reputation** as a peacemaker is born!",
        correctReplyCN: "太棒了！你证明了智慧可以**治理**混乱。你作为和平使者的**声望**由此诞生！"
      }
    ]
  }
};

// 导出配置（兼容浏览器和 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MOCK_CONFIG;
}
