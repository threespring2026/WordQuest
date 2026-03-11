/**
 * 服务端 AI 调用（硅基流动），与前端 PROMPTS 一致
 */

const { getJob, setJob } = require('./jobStore');

const BASE_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY || process.env.SILICONFLOW_API_KEY || 'sk-iombwgutxbgihmxzihkrmtjvandkmwtgehbmnthdkrsbhetm';
const MODEL = 'Qwen/Qwen2.5-72B-Instruct';

const PROMPTS = {
  synopsis: {
    system: `你是一个英语学习游戏的故事编剧。你需要根据给定的英语单词，创作一个简短有趣的冒险故事简介。
要求：
1. 故事背景（background）必须简要，不超过 30 个字
2. 玩家任务（mission）必须简要，不超过 20 个字
3. 用中文回复
4. 严格按照 JSON 格式返回：{"background": "故事背景", "mission": "玩家任务"}`,
    user: (words) => `请根据以下英语单词创作一个冒险故事简介。背景不超过30字，任务不超过20字。
单词列表：${words.map(w => (typeof w === 'string' ? w : w.word)).join(', ')}

注意：返回纯 JSON，不要包含 markdown 代码块标记。`
  },
  storyConfig: {
    system: `你是一个英语学习游戏的剧本设计师。你需要根据故事简介和单词列表，设计完整的对话剧本。

游戏规则：
- 玩家需要与 4 个 NPC 对话，共 6 轮对话
- 每轮对话中，NPC 说一句包含关键词的台词（用 **word** 标记关键词）
- 玩家从 3 个选项中选择正确回答；三个选项的先后顺序必须随机，正确选项不要总放在 B
- 正确答案应该合理运用目标单词

可用的 NPC（必须从中选择 4 个）：
- NPC_01: Mr. Baxter（商人，睿智）
- NPC_02: Emily（探险家，活泼）
- NPC_03: Sir Roland（骑士，正直）
- NPC_04: Mira（法师，神秘）
- NPC_05: Elder Hugo（长老，慈祥）
- NPC_06: Leo（孩子，淘气）

可用的地图（选择 1 个）：
- 1: 森林
- 2: 城镇广场
- 3: 王宫大厅
- 4: 海港码头
- 5: 废墟遗迹
- 6: 学院庭院

氛围（选择 1 个）：warm / happy / sad / funny

返回格式（纯 JSON，不要 markdown 代码块）：
{
  "mapId": 1,
  "mood": "warm",
  "npcs": [
    {"npcId": "NPC_01", "slot": 1},
    {"npcId": "NPC_02", "slot": 2},
    {"npcId": "NPC_03", "slot": 3},
    {"npcId": "NPC_04", "slot": 4}
  ],
  "dialogues": [
    {
      "round": 1,
      "npcId": "NPC_03",
      "npcLine": "英文台词，用 **word** 标记关键词",
      "npcLineCN": "中文翻译，用 **词** 标记",
      "options": [
        {"id": "A", "text": "选项A英文", "isCorrect": false, "errorReply": "错误时NPC的回复"},
        {"id": "B", "text": "选项B英文", "isCorrect": true, "errorReply": null},
        {"id": "C", "text": "选项C英文", "isCorrect": false, "errorReply": "错误时NPC的回复"}
      ],
      "correctReply": "正确时NPC的英文回复",
      "correctReplyCN": "正确时NPC的中文回复"
    }
  ]
}`,
    user: (words, synopsis) => `故事简介：
背景：${synopsis.background}
任务：${synopsis.mission}

必须使用的单词（每个单词至少在对话中出现 1 次，用 **word** 格式标记）：
${words.map(w => {
      const word = typeof w === 'string' ? w : w.word;
      const def = typeof w === 'object' && w.definition ? w.definition : '';
      return `- ${word}（${def}）`;
    }).join('\n')}

请设计 6 轮对话，确保每个单词都被使用。返回纯 JSON。`
  }
};

function getDifficultyPrefix(difficulty) {
  const m = {
    elementary: '【词汇难度：中国小学英语单词量水平。故事与台词用词请控制在此范围内，尽量简单常用。】\n\n',
    intermediate: '【词汇难度：大学英语六级（CET-6）单词水平。故事与台词用词可在此范围内。】\n\n',
    advanced: '【词汇难度：雅思（IELTS）单词水平。故事与台词用词可偏学术、丰富。】\n\n'
  };
  return m[difficulty] || m.intermediate;
}

async function callAI(systemPrompt, userPrompt) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + AI_API_KEY
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4096
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || 'AI 服务错误');
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回内容为空');
  return content;
}

/** 由 status 接口在将任务设为 running 后调用，仅负责执行 AI 并写回结果 */
async function runStoryJob(jobId, { wordPack = [], difficulty = 'intermediate' }) {
  try {
    const prefix = getDifficultyPrefix(difficulty);
    const synopsisUser = prefix + PROMPTS.synopsis.user(wordPack);
    const synopsisRes = await callAI(PROMPTS.synopsis.system, synopsisUser);
    const cleanSynopsis = synopsisRes.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const synopsis = JSON.parse(cleanSynopsis);

    const configUser = prefix + PROMPTS.storyConfig.user(wordPack, synopsis);
    const configRes = await callAI(PROMPTS.storyConfig.system, configUser);
    const cleanConfig = configRes.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const storyConfig = JSON.parse(cleanConfig);
    if (!storyConfig.mapId || !storyConfig.npcs || !storyConfig.dialogues) {
      throw new Error('AI 返回的数据结构不完整');
    }
    await setJob(jobId, { status: 'ready', synopsis, storyConfig });
  } catch (e) {
    await setJob(jobId, { status: 'error', error: e.message || '生成失败' });
  }
}

module.exports = { runStoryJob };
