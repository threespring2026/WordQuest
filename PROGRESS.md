# WordQuest 开发进度追踪

> 每完成一个模块，更新此文档的状态和测试结果。

---

## 开发状态总览

| 模块 | 状态 | 最后更新 | 备注 |
|------|------|---------|------|
| 核心框架 | 🟢 已完成 | 今日 | EventBus、Store、Router |
| 模块一：登录注册 | 🟢 已完成 | 今日 | localStorage 模拟 |
| 模块二：词书选择 | 🟢 已完成 | 今日 | 本地 JSON 词库 |
| 模块三：故事生成 | 🟢 已完成 | 今日 | Mock 数据替代 AI |
| 模块四：游戏主界面 | 🟢 已完成 | 今日 | 地图、NPC、对话 |
| 模块五：评分结算 | 🟢 已完成 | 今日 | 星级、复习 |

**状态说明：** 🔵待开发 🟡开发中 🟢已完成 🔴有问题

---

## 项目文件结构

```
WordQuest/
├── index.html                 # 主入口
├── src/
│   ├── core/                  # 核心框架
│   │   ├── app.js            # 应用入口
│   │   ├── eventbus.js       # 事件总线
│   │   ├── store.js          # 全局状态
│   │   └── router.js         # 路由管理
│   ├── config/               # 配置文件
│   │   ├── mock.config.js    # Mock 数据
│   │   ├── maps.config.js    # 地图配置
│   │   ├── npcs.config.js    # NPC 配置
│   │   └── words.config.js   # 本地词库
│   ├── modules/              # 功能模块
│   │   ├── auth/             # 模块一：登录注册
│   │   ├── wordbook/         # 模块二：词书选择
│   │   ├── story/            # 模块三：故事生成
│   │   ├── game/             # 模块四：游戏主界面
│   │   └── result/           # 模块五：评分结算
│   ├── shared/               # 共享组件
│   │   ├── ui.js             # UI 工具函数
│   │   └── api.js            # API 封装（本地模拟）
│   └── styles/               # 样式文件
│       └── main.css          # 主样式
├── data/                     # 本地数据（替代服务端）
│   └── wordbooks/            # 词书 JSON 文件
├── assets/                   # 游戏资源
└── api/                      # Serverless 函数（待部署）
```

---

## 开发日志

### 2024-XX-XX - 项目初始化

**完成内容：**
- [x] 创建项目基础结构
- [x] 编写配置文件（Mock、地图、NPC）
- [x] 完成 DEMO 原型测试

**测试结果：**
- 基本流程可跑通
- NPC 位置已修复

---

## 模块开发详情

### 核心框架

**职责：**
- `EventBus` - 模块间通信
- `Store` - 全局状态管理
- `Router` - 场景切换

**接口定义：**
```javascript
// EventBus
EventBus.on(event, callback)
EventBus.emit(event, data)
EventBus.off(event, callback)

// Store
Store.get(key)
Store.set(key, value)
Store.subscribe(key, callback)

// Router
Router.go(sceneName, params)
Router.back()
Router.getCurrentScene()
```

---

### 模块一：登录注册

**本地模拟方案：**
- 用户数据存储在 `localStorage`
- 跳过真实验证，直接本地存取

**数据结构：**
```javascript
{
  user: {
    id: "local_user_001",
    nickname: "Player_123",
    tier: "free",  // free | vip
    gamesRemaining: 3,
    checkinDays: []
  }
}
```

---

### 模块二：词书选择

**本地模拟方案：**
- 预置词书 JSON 文件在 `data/wordbooks/`
- 无需服务端查词，直接读取本地数据

---

### 模块三：故事生成

**本地模拟方案：**
- 使用 `mock.config.js` 中的预设故事
- AI 生成用 setTimeout 模拟延迟
- 环境变量 `USE_MOCK_AI=true`

---

### 模块四：游戏主界面

**已验证功能：**
- 地图 Canvas 绘制
- NPC 点击交互
- 对话气泡显示
- 选项选择逻辑

---

### 模块五：评分结算

**已验证功能：**
- 星级动画显示
- 错误统计
- 单词复习弹窗

---

## 本地开发命令

```bash
# 启动本地服务器
cd /Volumes/SC/work/AI/program/WordQuest
python3 -m http.server 8080

# 访问地址
http://localhost:8080
```

---

## 最新更新

### 资产整合与功能改进

**已完成：**
- [x] 界面改为中文（除游戏主体英文对话）
- [x] 词库重新设计：输入单词→我的词库→选择学习
- [x] 所有单词可悬停翻译
- [x] 地图边界限制（下半部分不可到达）
- [x] NPC 站位点配置
- [x] 完成游戏后自动打卡
- [x] 登录页形象选择（男孩/女孩）
- [x] 精简打卡区 UI
- [x] 替换实际地图图片（6张）
- [x] 替换实际 NPC 图片（idle/surprised/head）
- [x] 替换实际玩家图片
- [x] NPC/玩家名称显示在上方
- [x] NPC 对话使用头像图片
- [x] 对话中锁定玩家移动

---

## 资产文件清单

```
assets/
├── maps/
│   ├── map_01_forest.png
│   ├── map_02_town.png
│   ├── map_03_palace.png
│   ├── map_04_harbor.png
│   ├── map_05_ruins.png
│   └── map_06_academy.png
├── npcs/
│   ├── npc_01_idle.png / npc_01_surprised.png / npc_01_head.png
│   ├── npc_02_idle.png / npc_02_surprised.png / npc_02_head.png
│   ├── npc_03_idle.png / npc_03_surprised.png / npc_03_head.png
│   ├── npc_04_idle.png / npc_04_surprised.png / npc_04_head.png
│   ├── npc_05_idle.png / npc_05_surprised.png / npc_05_head.png
│   └── npc_06_idle.png / npc_06_surprised.png / npc_06_head.png
└── player/
    ├── player_boy.png
    └── player_girl.png
```

---

*最后更新：今日*
