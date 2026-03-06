/**
 * AI API 配置
 * API Key 由 ai.env.js 注入（Vercel 环境变量 WORDQUEST_API_KEY）
 * 其余配置可在管理页 #admin 中覆盖，存于 localStorage
 */

const AI_CONFIG = {
  baseUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  apiKey: '', // 由 ai.env.js 的 window.WORDQUEST_API_KEY 或管理页不提供
  model: 'Qwen/Qwen2.5-72B-Instruct',
  temperature: 0.8,
  maxTokens: 4096,
  enabled: true
};

/**
 * 调用 AI 生成内容
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @returns {Promise<string>} AI 响应内容
 */
async function callAI(systemPrompt, userPrompt) {
  if (!AI_CONFIG.enabled) {
    throw new Error('AI 功能已禁用');
  }
  if (!AI_CONFIG.apiKey || !AI_CONFIG.apiKey.trim()) {
    throw new Error('未配置 API Key：请在 Vercel 环境变量中设置 WORDQUEST_API_KEY，或本地在管理页 #admin 中填写并保存');
  }

  let response;
  try {
    response = await fetch(AI_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens
      })
    });
  } catch (networkError) {
    console.error('网络请求失败:', networkError);
    throw new Error('网络连接失败，请检查网络');
  }

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.error?.message || errorMsg;
    } catch {}
    console.error('AI API 错误:', response.status, errorMsg);
    throw new Error(`AI 服务错误: ${errorMsg}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('AI 返回内容为空');
  }
  
  return content;
}

/**
 * 生成故事简介的 Prompt
 */
const PROMPTS = {
  synopsis: {
    system: `你是一个英语学习游戏的故事编剧。你需要根据给定的英语单词，创作一个简短有趣的冒险故事简介。
要求：
1. 故事背景（background）必须简要，不超过 30 个字
2. 玩家任务（mission）必须简要，不超过 20 个字
3. 用中文回复
4. 严格按照 JSON 格式返回：{"background": "故事背景", "mission": "玩家任务"}`,
    
    user: (words) => `请根据以下英语单词创作一个冒险故事简介。背景不超过30字，任务不超过20字。
单词列表：${words.map(w => w.word).join(', ')}

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
${words.map(w => `- ${w.word}（${w.definition}）`).join('\n')}

请设计 6 轮对话，确保每个单词都被使用。返回纯 JSON。`
  }
};

/** 管理页「恢复默认」用 */
const DEFAULT_SYNOPSIS_SYSTEM = PROMPTS.synopsis.system;
const DEFAULT_STORYCONFIG_SYSTEM = PROMPTS.storyConfig.system;
const DEFAULT_PROMPT_TEMPLATES = {
  synopsisUser: `请根据以下英语单词创作一个冒险故事简介。背景不超过30字，任务不超过20字。
单词列表：{{WORDS}}

注意：返回纯 JSON，不要包含 markdown 代码块标记。`,
  storyConfigUser: `故事简介：
背景：{{SYNOPSIS_BACKGROUND}}
任务：{{SYNOPSIS_MISSION}}

必须使用的单词（每个单词至少在对话中出现 1 次，用 **word** 格式标记）：
{{WORDS_LINES}}

请设计 6 轮对话，确保每个单词都被使用。返回纯 JSON。`
};

function applyAdminOverlay() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem('wordquest_admin_config');
    if (!raw) return;
    const o = JSON.parse(raw);
    if (o.baseUrl !== undefined) AI_CONFIG.baseUrl = o.baseUrl;
    if (o.model !== undefined) AI_CONFIG.model = o.model;
    if (!AI_CONFIG.apiKey && o.apiKey) AI_CONFIG.apiKey = o.apiKey;
    if (o.temperature !== undefined) AI_CONFIG.temperature = Number(o.temperature);
    if (o.maxTokens !== undefined) AI_CONFIG.maxTokens = Number(o.maxTokens);
    if (o.enabled !== undefined) AI_CONFIG.enabled = !!o.enabled;
    if (o.synopsisSystem !== undefined) PROMPTS.synopsis.system = o.synopsisSystem;
    if (o.synopsisUserTemplate !== undefined) {
      PROMPTS.synopsis.user = function(words) {
        return o.synopsisUserTemplate.replace('{{WORDS}}', words.map(function(w) { return w.word; }).join(', '));
      };
    }
    if (o.storyConfigSystem !== undefined) PROMPTS.storyConfig.system = o.storyConfigSystem;
    if (o.storyConfigUserTemplate !== undefined) {
      PROMPTS.storyConfig.user = function(words, synopsis) {
        return o.storyConfigUserTemplate
          .replace('{{SYNOPSIS_BACKGROUND}}', synopsis.background || '')
          .replace('{{SYNOPSIS_MISSION}}', synopsis.mission || '')
          .replace('{{WORDS_LINES}}', words.map(function(w) { return '- ' + w.word + '（' + (w.definition || '') + '）'; }).join('\n'));
      };
    }
  } catch (e) { console.warn('applyAdminOverlay:', e); }
}

if (typeof window !== 'undefined' && window.WORDQUEST_API_KEY) {
  AI_CONFIG.apiKey = window.WORDQUEST_API_KEY;
}
applyAdminOverlay();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AI_CONFIG, callAI, PROMPTS, DEFAULT_PROMPT_TEMPLATES, DEFAULT_SYNOPSIS_SYSTEM, DEFAULT_STORYCONFIG_SYSTEM };
}
