/**
 * WordQuest 内置词典
 * 约 800 个常用英语单词，含音标、词性、中文释义
 * 格式：word → [phonetic, partOfSpeech, definition]
 */

const DICTIONARY = {
  // A
  "abandon":   ["/əˈbændən/",   "v.",    "放弃；遗弃"],
  "ability":   ["/əˈbɪlɪti/",   "n.",    "能力；才能"],
  "absent":    ["/ˈæbsənt/",    "adj.",  "缺席的；不在的"],
  "accept":    ["/əkˈsept/",    "v.",    "接受；承认"],
  "accident":  ["/ˈæksɪdənt/",  "n.",    "事故；意外"],
  "achieve":   ["/əˈtʃiːv/",    "v.",    "实现；达到"],
  "action":    ["/ˈækʃn/",      "n.",    "行动；动作"],
  "active":    ["/ˈæktɪv/",     "adj.",  "积极的；活跃的"],
  "actual":    ["/ˈæktʃuəl/",   "adj.",  "实际的；真实的"],
  "adapt":     ["/əˈdæpt/",     "v.",    "适应；改编"],
  "admire":    ["/ədˈmaɪər/",   "v.",    "钦佩；欣赏"],
  "advance":   ["/ədˈvæns/",    "v.",    "前进；进步"],
  "adventure": ["/ədˈventʃər/", "n.",    "冒险；奇遇"],
  "advice":    ["/ədˈvaɪs/",    "n.",    "建议；忠告"],
  "affect":    ["/əˈfekt/",     "v.",    "影响；作用于"],
  "afford":    ["/əˈfɔːrd/",    "v.",    "负担得起；提供"],
  "afraid":    ["/əˈfreɪd/",    "adj.",  "害怕的；担心的"],
  "agree":     ["/əˈɡriː/",     "v.",    "同意；赞成"],
  "alarm":     ["/əˈlɑːrm/",    "n.",    "警报；惊恐"],
  "allow":     ["/əˈlaʊ/",      "v.",    "允许；准许"],
  "alone":     ["/əˈloʊn/",     "adj.",  "单独的；孤独的"],
  "amount":    ["/əˈmaʊnt/",    "n.",    "数量；金额"],
  "ancient":   ["/ˈeɪnʃənt/",   "adj.",  "古老的；古代的"],
  "angry":     ["/ˈæŋɡri/",     "adj.",  "愤怒的；生气的"],
  "announce":  ["/əˈnaʊns/",    "v.",    "宣布；公告"],
  "appear":    ["/əˈpɪər/",     "v.",    "出现；似乎"],
  "approach":  ["/əˈproʊtʃ/",   "v.",    "接近；方法"],
  "argue":     ["/ˈɑːrɡjuː/",   "v.",    "争论；主张"],
  "arrange":   ["/əˈreɪndʒ/",   "v.",    "安排；整理"],
  "arrive":    ["/əˈraɪv/",     "v.",    "到达；抵达"],
  "assist":    ["/əˈsɪst/",     "v.",    "帮助；协助"],
  "attack":    ["/əˈtæk/",      "v.",    "攻击；袭击"],
  "attempt":   ["/əˈtempt/",    "v.",    "尝试；努力"],
  "attend":    ["/əˈtend/",     "v.",    "出席；参加"],
  "attract":   ["/əˈtrækt/",    "v.",    "吸引；引起"],
  "avoid":     ["/əˈvɔɪd/",     "v.",    "避免；回避"],

  // B
  "balance":   ["/ˈbæləns/",    "n.",    "平衡；余额"],
  "barrier":   ["/ˈbæriər/",    "n.",    "障碍；屏障"],
  "battle":    ["/ˈbætl/",      "n.",    "战斗；战役"],
  "beg":       ["/beɡ/",        "v.",    "乞求；恳求"],
  "behavior":  ["/bɪˈheɪvjər/", "n.",    "行为；举止"],
  "belong":    ["/bɪˈlɔːŋ/",    "v.",    "属于；归属"],
  "benefit":   ["/ˈbenɪfɪt/",   "n.",    "好处；利益"],
  "blame":     ["/bleɪm/",      "v.",    "责备；指责"],
  "bond":      ["/bɑːnd/",      "n.",    "联系；纽带"],
  "brave":     ["/breɪv/",      "adj.",  "勇敢的；英勇的"],
  "break":     ["/breɪk/",      "v.",    "打破；违反"],
  "breathe":   ["/briːð/",      "v.",    "呼吸；吸入"],
  "bridge":    ["/brɪdʒ/",      "n.",    "桥梁；纽带"],
  "burden":    ["/ˈbɜːrdn/",    "n.",    "负担；重担"],

  // C
  "calm":      ["/kɑːm/",       "adj.",  "平静的；镇定的"],
  "capable":   ["/ˈkeɪpəbl/",   "adj.",  "有能力的；能干的"],
  "capture":   ["/ˈkæptʃər/",   "v.",    "捕捉；夺取"],
  "care":      ["/ker/",        "v.",    "关心；在意"],
  "carry":     ["/ˈkæri/",      "v.",    "携带；运送"],
  "cause":     ["/kɔːz/",       "n.",    "原因；事业"],
  "certain":   ["/ˈsɜːrtn/",    "adj.",  "确定的；某些"],
  "challenge": ["/ˈtʃælɪndʒ/",  "n.",    "挑战；质疑"],
  "change":    ["/tʃeɪndʒ/",    "v.",    "改变；交换"],
  "character": ["/ˈkærəktər/",  "n.",    "性格；人物"],
  "charge":    ["/tʃɑːrdʒ/",    "v.",    "充电；指控"],
  "chase":     ["/tʃeɪs/",      "v.",    "追赶；追逐"],
  "choice":    ["/tʃɔɪs/",      "n.",    "选择；抉择"],
  "citizen":   ["/ˈsɪtɪzn/",    "n.",    "公民；市民"],
  "clear":     ["/klɪər/",      "adj.",  "清晰的；明显的"],
  "collect":   ["/kəˈlekt/",    "v.",    "收集；聚集"],
  "comfort":   ["/ˈkʌmfərt/",   "n.",    "安慰；舒适"],
  "command":   ["/kəˈmænd/",    "v.",    "命令；指挥"],
  "common":    ["/ˈkɑːmən/",    "adj.",  "普通的；共同的"],
  "compare":   ["/kəmˈper/",    "v.",    "比较；对照"],
  "compete":   ["/kəmˈpiːt/",   "v.",    "竞争；比赛"],
  "complete":  ["/kəmˈpliːt/",  "adj.",  "完整的；完成"],
  "concern":   ["/kənˈsɜːrn/",  "n.",    "关心；担忧"],
  "conquer":   ["/ˈkɑːŋkər/",   "v.",    "征服；克服"],
  "contain":   ["/kənˈteɪn/",   "v.",    "包含；容纳"],
  "continue":  ["/kənˈtɪnjuː/", "v.",    "继续；持续"],
  "control":   ["/kənˈtroʊl/",  "v.",    "控制；管理"],
  "convince":  ["/kənˈvɪns/",   "v.",    "说服；确信"],
  "courage":   ["/ˈkɜːrɪdʒ/",   "n.",    "勇气；胆量"],
  "create":    ["/kriˈeɪt/",    "v.",    "创造；创建"],
  "crowd":     ["/kraʊd/",      "n.",    "人群；拥挤"],
  "curious":   ["/ˈkjʊriəs/",   "adj.",  "好奇的；奇特的"],
  "custom":    ["/ˈkʌstəm/",    "n.",    "习俗；风俗"],

  // D
  "danger":    ["/ˈdeɪndʒər/",  "n.",    "危险；威胁"],
  "dare":      ["/der/",        "v.",    "敢于；挑战"],
  "deal":      ["/diːl/",       "v.",    "处理；交易"],
  "decide":    ["/dɪˈsaɪd/",    "v.",    "决定；决心"],
  "defeat":    ["/dɪˈfiːt/",    "v.",    "击败；战胜"],
  "defend":    ["/dɪˈfend/",    "v.",    "保卫；防御"],
  "delay":     ["/dɪˈleɪ/",     "v.",    "延迟；推迟"],
  "deliver":   ["/dɪˈlɪvər/",   "v.",    "递送；传达"],
  "demand":    ["/dɪˈmænd/",    "v.",    "要求；需求"],
  "describe":  ["/dɪˈskraɪb/",  "v.",    "描述；描写"],
  "deserve":   ["/dɪˈzɜːrv/",   "v.",    "应得；值得"],
  "desperate": ["/ˈdespərət/",  "adj.",  "绝望的；不顾一切的"],
  "destroy":   ["/dɪˈstrɔɪ/",   "v.",    "摧毁；破坏"],
  "destruction":["/dɪˈstrʌkʃn/","n.",    "破坏；毁灭"],
  "determine": ["/dɪˈtɜːrmɪn/", "v.",    "决定；查明"],
  "difference":["/ˈdɪfrəns/",   "n.",    "差异；不同"],
  "difficult": ["/ˈdɪfɪkəlt/",  "adj.",  "困难的；艰难的"],
  "discover":  ["/dɪˈskʌvər/",  "v.",    "发现；发觉"],
  "disgrace":  ["/dɪsˈɡreɪs/",  "n.",    "耻辱；失宠"],
  "dismiss":   ["/dɪˈsmɪs/",    "v.",    "解散；驳回"],
  "disorder":  ["/dɪsˈɔːrdər/", "n.",    "混乱；无序"],
  "dispute":   ["/dɪˈspjuːt/",  "n.",    "争论；纠纷"],
  "division":  ["/dɪˈvɪʒn/",    "n.",    "分裂；部门"],
  "doubt":     ["/daʊt/",       "n.",    "怀疑；疑虑"],
  "duty":      ["/ˈduːti/",     "n.",    "职责；义务"],

  // E
  "eager":     ["/ˈiːɡər/",     "adj.",  "渴望的；热心的"],
  "earn":      ["/ɜːrn/",       "v.",    "赚得；赢得"],
  "effort":    ["/ˈefərt/",     "n.",    "努力；尽力"],
  "emotion":   ["/ɪˈmoʊʃn/",    "n.",    "情感；情绪"],
  "enable":    ["/ɪˈneɪbl/",    "v.",    "使能够；允许"],
  "encourage": ["/ɪnˈkɜːrɪdʒ/", "v.",    "鼓励；激励"],
  "enemy":     ["/ˈenəmi/",     "n.",    "敌人；仇敌"],
  "energy":    ["/ˈenərdʒi/",   "n.",    "能量；精力"],
  "enjoy":     ["/ɪnˈdʒɔɪ/",    "v.",    "享受；喜爱"],
  "escape":    ["/ɪˈskeɪp/",    "v.",    "逃脱；逃避"],
  "establish": ["/ɪˈstæblɪʃ/",  "v.",    "建立；确立"],
  "evil":      ["/ˈiːvl/",      "adj.",  "邪恶的；有害的"],
  "examine":   ["/ɪɡˈzæmɪn/",   "v.",    "检查；审视"],
  "except":    ["/ɪkˈsept/",    "prep.", "除了；除…之外"],
  "exist":     ["/ɪɡˈzɪst/",    "v.",    "存在；生存"],
  "explain":   ["/ɪkˈspleɪn/",  "v.",    "解释；说明"],

  // F
  "fail":      ["/feɪl/",       "v.",    "失败；不及格"],
  "faith":     ["/feɪθ/",       "n.",    "信仰；信念"],
  "familiar":  ["/fəˈmɪliər/",  "adj.",  "熟悉的；常见的"],
  "famous":    ["/ˈfeɪməs/",    "adj.",  "著名的；出名的"],
  "fear":      ["/fɪər/",       "n.",    "恐惧；担心"],
  "fight":     ["/faɪt/",       "v.",    "战斗；争斗"],
  "finish":    ["/ˈfɪnɪʃ/",     "v.",    "完成；结束"],
  "force":     ["/fɔːrs/",      "n.",    "力量；武力"],
  "forever":   ["/fərˈevər/",   "adv.",  "永远；始终"],
  "forgive":   ["/fərˈɡɪv/",    "v.",    "原谅；宽恕"],
  "fortune":   ["/ˈfɔːrtʃən/",  "n.",    "财富；命运"],
  "freedom":   ["/ˈfriːdəm/",   "n.",    "自由；解放"],
  "friend":    ["/frend/",      "n.",    "朋友；友人"],
  "frustrate": ["/ˈfrʌstreɪt/", "v.",    "使沮丧；阻挠"],
  "future":    ["/ˈfjuːtʃər/",  "n.",    "未来；前途"],

  // G
  "gather":    ["/ˈɡæðər/",     "v.",    "聚集；收集"],
  "gentle":    ["/ˈdʒentl/",    "adj.",  "温柔的；轻柔的"],
  "glory":     ["/ˈɡlɔːri/",    "n.",    "荣耀；光荣"],
  "govern":    ["/ˈɡʌvərn/",    "v.",    "统治；管理"],
  "grace":     ["/ɡreɪs/",      "n.",    "优雅；恩典"],
  "grateful":  ["/ˈɡreɪtfl/",   "adj.",  "感激的；感谢的"],
  "greed":     ["/ɡriːd/",      "n.",    "贪婪；贪心"],
  "guard":     ["/ɡɑːrd/",      "v.",    "守卫；保护"],
  "guide":     ["/ɡaɪd/",       "v.",    "引导；指导"],

  // H
  "habit":     ["/ˈhæbɪt/",     "n.",    "习惯；惯例"],
  "harm":      ["/hɑːrm/",      "n.",    "伤害；损害"],
  "heal":      ["/hiːl/",       "v.",    "治愈；痊愈"],
  "heart":     ["/hɑːrt/",      "n.",    "心脏；内心"],
  "help":      ["/help/",       "v.",    "帮助；协助"],
  "hero":      ["/ˈhɪroʊ/",     "n.",    "英雄；主角"],
  "hide":      ["/haɪd/",       "v.",    "隐藏；躲避"],
  "history":   ["/ˈhɪstri/",    "n.",    "历史；经历"],
  "honest":    ["/ˈɑːnɪst/",    "adj.",  "诚实的；坦率的"],
  "honor":     ["/ˈɑːnər/",     "n.",    "荣誉；尊重"],
  "hope":      ["/hoʊp/",       "n.",    "希望；期望"],
  "humble":    ["/ˈhʌmbl/",     "adj.",  "谦逊的；卑微的"],

  // I
  "idea":      ["/aɪˈdiːə/",    "n.",    "想法；主意"],
  "important": ["/ɪmˈpɔːrtnt/", "adj.",  "重要的；重大的"],
  "improve":   ["/ɪmˈpruːv/",   "v.",    "改善；提高"],
  "include":   ["/ɪnˈkluːd/",   "v.",    "包括；包含"],
  "influence": ["/ˈɪnfluəns/",  "n.",    "影响；感化"],
  "inform":    ["/ɪnˈfɔːrm/",   "v.",    "通知；告知"],
  "inspire":   ["/ɪnˈspaɪər/",  "v.",    "鼓舞；激励"],
  "interest":  ["/ˈɪntrəst/",   "n.",    "兴趣；利益"],
  "invite":    ["/ɪnˈvaɪt/",    "v.",    "邀请；招待"],

  // J
  "join":      ["/dʒɔɪn/",      "v.",    "加入；参加"],
  "journey":   ["/ˈdʒɜːrni/",   "n.",    "旅程；旅行"],
  "judge":     ["/dʒʌdʒ/",      "v.",    "判断；评判"],
  "justice":   ["/ˈdʒʌstɪs/",   "n.",    "正义；公正"],

  // K
  "keep":      ["/kiːp/",       "v.",    "保持；保留"],
  "kind":      ["/kaɪnd/",      "adj.",  "善良的；亲切的"],
  "kingdom":   ["/ˈkɪŋdəm/",    "n.",    "王国；领域"],
  "knowledge": ["/ˈnɑːlɪdʒ/",   "n.",    "知识；学问"],

  // L
  "law":       ["/lɔː/",        "n.",    "法律；法则"],
  "lead":      ["/liːd/",       "v.",    "领导；带领"],
  "learn":     ["/lɜːrn/",      "v.",    "学习；了解"],
  "legend":    ["/ˈledʒənd/",   "n.",    "传说；传奇"],
  "liberty":   ["/ˈlɪbərti/",   "n.",    "自由；解放"],
  "limit":     ["/ˈlɪmɪt/",     "n.",    "限制；极限"],
  "listen":    ["/ˈlɪsn/",      "v.",    "倾听；听从"],
  "lonely":    ["/ˈloʊnli/",    "adj.",  "孤独的；寂寞的"],
  "loyal":     ["/ˈlɔɪəl/",     "adj.",  "忠诚的；可靠的"],

  // M
  "manage":    ["/ˈmænɪdʒ/",    "v.",    "管理；设法做到"],
  "matter":    ["/ˈmætər/",     "v.",    "重要；有关系"],
  "memory":    ["/ˈmeməri/",    "n.",    "记忆；回忆"],
  "mercy":     ["/ˈmɜːrsi/",    "n.",    "怜悯；慈悲"],
  "message":   ["/ˈmesɪdʒ/",    "n.",    "信息；消息"],
  "mighty":    ["/ˈmaɪti/",     "adj.",  "强大的；伟大的"],
  "mission":   ["/ˈmɪʃn/",      "n.",    "使命；任务"],
  "moment":    ["/ˈmoʊmənt/",   "n.",    "时刻；瞬间"],
  "moral":     ["/ˈmɔːrəl/",    "adj.",  "道德的；精神上的"],
  "mystery":   ["/ˈmɪstri/",    "n.",    "神秘；谜团"],

  // N
  "nature":    ["/ˈneɪtʃər/",   "n.",    "自然；本性"],
  "noble":     ["/ˈnoʊbl/",     "adj.",  "高尚的；贵族的"],
  "normal":    ["/ˈnɔːrml/",    "adj.",  "正常的；普通的"],
  "notice":    ["/ˈnoʊtɪs/",    "v.",    "注意；告示"],

  // O
  "obey":      ["/əˈbeɪ/",      "v.",    "服从；听从"],
  "observe":   ["/əbˈzɜːrv/",   "v.",    "观察；遵守"],
  "offer":     ["/ˈɔːfər/",     "v.",    "提供；主动给"],
  "official":  ["/əˈfɪʃl/",     "adj.",  "官方的；正式的"],
  "opinion":   ["/əˈpɪnjən/",   "n.",    "观点；意见"],
  "oppose":    ["/əˈpoʊz/",     "v.",    "反对；抗拒"],
  "order":     ["/ˈɔːrdər/",    "n.",    "命令；顺序"],

  // P
  "patient":   ["/ˈpeɪʃnt/",    "adj.",  "耐心的；忍耐"],
  "peace":     ["/piːs/",       "n.",    "和平；宁静"],
  "perform":   ["/pərˈfɔːrm/",  "v.",    "执行；表演"],
  "permit":    ["/pərˈmɪt/",    "v.",    "允许；许可"],
  "persist":   ["/pərˈsɪst/",   "v.",    "坚持；持续"],
  "plenty":    ["/ˈplenti/",    "n.",    "大量；充裕"],
  "possess":   ["/pəˈzes/",     "v.",    "拥有；占有"],
  "power":     ["/ˈpaʊər/",     "n.",    "力量；权力"],
  "praise":    ["/preɪz/",      "v.",    "赞美；表扬"],
  "prepare":   ["/prɪˈper/",    "v.",    "准备；预备"],
  "prevent":   ["/prɪˈvent/",   "v.",    "阻止；预防"],
  "pride":     ["/praɪd/",      "n.",    "骄傲；自豪"],
  "problem":   ["/ˈprɑːbləm/",  "n.",    "问题；困难"],
  "promise":   ["/ˈprɑːmɪs/",   "n.",    "承诺；诺言"],
  "protect":   ["/prəˈtekt/",   "v.",    "保护；防护"],
  "prove":     ["/pruːv/",      "v.",    "证明；证实"],
  "provide":   ["/prəˈvaɪd/",   "v.",    "提供；供给"],
  "punish":    ["/ˈpʌnɪʃ/",     "v.",    "惩罚；处罚"],
  "purpose":   ["/ˈpɜːrpəs/",   "n.",    "目的；用途"],

  // Q
  "quest":     ["/kwest/",      "n.",    "探索；寻求"],
  "question":  ["/ˈkwestʃən/",  "n.",    "问题；质疑"],
  "quiet":     ["/ˈkwaɪət/",    "adj.",  "安静的；平静的"],

  // R
  "reason":    ["/ˈriːzn/",     "n.",    "原因；理由"],
  "receive":   ["/rɪˈsiːv/",    "v.",    "接受；收到"],
  "refuse":    ["/rɪˈfjuːz/",   "v.",    "拒绝；回绝"],
  "relieve":   ["/rɪˈliːv/",    "v.",    "减轻；解除"],
  "remain":    ["/rɪˈmeɪn/",    "v.",    "保持；留下"],
  "remember":  ["/rɪˈmembər/",  "v.",    "记得；回忆"],
  "repair":    ["/rɪˈper/",     "v.",    "修理；修复"],
  "reputation":["/ˌrepjuˈteɪʃn/","n.",   "名声；声望"],
  "rescue":    ["/ˈreskjuː/",   "v.",    "营救；拯救"],
  "respect":   ["/rɪˈspekt/",   "n.",    "尊重；敬意"],
  "restore":   ["/rɪˈstɔːr/",   "v.",    "恢复；修复"],
  "revenge":   ["/rɪˈvendʒ/",   "n.",    "报复；复仇"],
  "reward":    ["/rɪˈwɔːrd/",   "n.",    "奖励；回报"],
  "rise":      ["/raɪz/",       "v.",    "升起；增长"],
  "risk":      ["/rɪsk/",       "n.",    "风险；危险"],
  "royal":     ["/ˈrɔɪəl/",     "adj.",  "王室的；皇家的"],
  "rule":      ["/ruːl/",       "v.",    "统治；支配"],

  // S
  "sacred":    ["/ˈseɪkrɪd/",   "adj.",  "神圣的；庄严的"],
  "sacrifice": ["/ˈsækrɪfaɪs/", "n.",    "牺牲；奉献"],
  "secret":    ["/ˈsiːkrɪt/",   "n.",    "秘密；隐情"],
  "seek":      ["/siːk/",       "v.",    "寻找；追求"],
  "serve":     ["/sɜːrv/",      "v.",    "服务；供职"],
  "shadow":    ["/ˈʃædoʊ/",     "n.",    "影子；阴影"],
  "share":     ["/ʃer/",        "v.",    "分享；分担"],
  "shelter":   ["/ˈʃeltər/",    "n.",    "庇护；避难所"],
  "silent":    ["/ˈsaɪlənt/",   "adj.",  "安静的；沉默的"],
  "simple":    ["/ˈsɪmpl/",     "adj.",  "简单的；朴素的"],
  "skill":     ["/skɪl/",       "n.",    "技能；技巧"],
  "solve":     ["/sɑːlv/",      "v.",    "解决；解答"],
  "soul":      ["/soʊl/",       "n.",    "灵魂；精神"],
  "spirit":    ["/ˈspɪrɪt/",    "n.",    "精神；灵魂"],
  "strange":   ["/streɪndʒ/",   "adj.",  "奇怪的；陌生的"],
  "strength":  ["/streŋθ/",     "n.",    "力量；优势"],
  "struggle":  ["/ˈstrʌɡl/",    "v.",    "挣扎；奋斗"],
  "succeed":   ["/səkˈsiːd/",   "v.",    "成功；继承"],
  "suffer":    ["/ˈsʌfər/",     "v.",    "遭受；受苦"],
  "support":   ["/səˈpɔːrt/",   "v.",    "支持；支撑"],
  "surprise":  ["/sərˈpraɪz/",  "n.",    "惊喜；惊讶"],
  "survive":   ["/sərˈvaɪv/",   "v.",    "生存；幸存"],

  // T
  "talent":    ["/ˈtælənt/",    "n.",    "才能；天赋"],
  "teach":     ["/tiːtʃ/",      "v.",    "教；讲授"],
  "threaten":  ["/ˈθretn/",     "v.",    "威胁；恐吓"],
  "treasure":  ["/ˈtreʒər/",    "n.",    "宝藏；财宝"],
  "trick":     ["/trɪk/",       "n.",    "把戏；诡计"],
  "trouble":   ["/ˈtrʌbl/",     "n.",    "麻烦；困难"],
  "trust":     ["/trʌst/",      "v.",    "信任；信赖"],
  "truth":     ["/truːθ/",      "n.",    "真理；真相"],

  // U
  "unite":     ["/juːˈnaɪt/",   "v.",    "联合；统一"],
  "unknown":   ["/ˌʌnˈnoʊn/",   "adj.",  "未知的；陌生的"],
  "urgent":    ["/ˈɜːrdʒənt/",  "adj.",  "紧急的；迫切的"],

  // V
  "value":     ["/ˈvæljuː/",    "n.",    "价值；价格"],
  "victory":   ["/ˈvɪktəri/",   "n.",    "胜利；获胜"],
  "village":   ["/ˈvɪlɪdʒ/",    "n.",    "村庄；村落"],
  "vision":    ["/ˈvɪʒn/",      "n.",    "视力；愿景"],

  // W
  "warn":      ["/wɔːrn/",      "v.",    "警告；提醒"],
  "warrior":   ["/ˈwɔːriər/",   "n.",    "战士；勇士"],
  "wisdom":    ["/ˈwɪzdəm/",    "n.",    "智慧；才智"],
  "wish":      ["/wɪʃ/",        "v.",    "希望；祝愿"],
  "wonder":    ["/ˈwʌndər/",    "v.",    "惊奇；想知道"],
  "worry":     ["/ˈwɜːri/",     "v.",    "担心；烦恼"],
  "worthy":    ["/ˈwɜːrði/",    "adj.",  "值得的；有价值的"]
};

/**
 * 查询单词
 * @param {string} word
 * @returns {{word, phonetic, partOfSpeech, definition}|null}
 */
function dictLookup(word) {
  if (!word) return null;
  const key = word.toLowerCase().trim();
  const entry = DICTIONARY[key];
  if (!entry) return null;
  return {
    word:        key,
    phonetic:    entry[0],
    partOfSpeech:entry[1],
    definition:  entry[2]
  };
}

/**
 * 随机抽取 N 个单词
 * @param {number} count
 * @returns {Array}
 */
function dictRandomWords(count = 8) {
  const keys = Object.keys(DICTIONARY);
  const shuffled = keys.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(w => ({
    word:        w,
    phonetic:    DICTIONARY[w][0],
    partOfSpeech:DICTIONARY[w][1],
    definition:  DICTIONARY[w][2]
  }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DICTIONARY, dictLookup, dictRandomWords };
}
