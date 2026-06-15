// ============================================================
// 「小雪闯上海」—— 角色与卡牌定义 (STS风格)
// ============================================================

// --- 卡牌类型 ---
// attack: 攻击牌 (红)
// skill:  技能牌 (绿) — 防御/抽牌/减益/工具
// power:  能力牌 (蓝) — 永久被动，战斗内持续生效

// --- 稀有度 ---
// common:   普通 — 基础卡, 奖励频繁
// uncommon: 罕见 — 中等强度
// rare:     稀有 — 强力卡牌

// ============================================================
// 小雪 (雪纳瑞) — 攻击型，类似铁甲战士 (Ironclad)
// ============================================================
const XIAOXUE_CARDS = [
  // --- 攻击牌 ---
  { id: "xs_strike", name: "爪击", type: "attack", rarity: "common", cost: 1, power: 6, upgradedPower: 9,
    image: "/images/爪击透明_1774026786.png", desc: "造成6点伤害", upgradedDesc: "造成9点伤害", count: 4 },
  { id: "xs_bite", name: "扑咬", type: "attack", rarity: "common", cost: 1, power: 4, upgradedPower: 6,
    image: "/images/攻击.png", desc: "造成4伤害，抽1张牌", upgradedDesc: "造成6伤害，抽1张牌", count: 3,
    effects: ["draw1"] },
  { id: "xs_roll", name: "死亡翻滚", type: "attack", rarity: "uncommon", cost: 2, power: 12, upgradedPower: 16,
    image: "/images/翻滚攻击.png", desc: "造成12点伤害", upgradedDesc: "造成16点伤害", count: 2 },
  { id: "xs_poop", name: "甩便便", type: "attack", rarity: "uncommon", cost: 1, power: 5, upgradedPower: 7,
    image: "/images/站立雪纳瑞.png", desc: "💩造成5伤害+中毒2", upgradedDesc: "💩造成7伤害+中毒3", count: 2,
    effects: ["poison2"] },
  { id: "xs_bone_smash", name: "叼骨头猛击", type: "attack", rarity: "rare", cost: 2, power: 16, upgradedPower: 20,
    image: "/images/站立雪纳瑞.png", desc: "🦴对HP最低的敌人造成16伤害", upgradedDesc: "🦴对HP最低的敌人造成20伤害", count: 1,
    effects: ["target_lowest"] },
  { id: "xs_sprint", name: "闪电冲刺", type: "attack", rarity: "uncommon", cost: 1, power: 7, upgradedPower: 10,
    image: "/images/站立雪纳瑞.png", desc: "⚡造成7伤害", upgradedDesc: "⚡造成10伤害", count: 2 },
  { id: "xs_kick_dirt", name: "后腿蹬土", type: "attack", rarity: "common", cost: 0, power: 3, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "🐾造成3伤害，敌人弱化1", upgradedDesc: "🐾造成5伤害，敌人弱化1", count: 2,
    effects: ["weaken1"] },

  // --- 技能牌 ---
  { id: "xs_defend", name: "抱头", type: "skill", rarity: "common", cost: 1, power: 5, upgradedPower: 8,
    image: "/images/抱头透明_1774026821.png", desc: "获得5护甲", upgradedDesc: "获得8护甲", count: 3 },
  { id: "xs_crawl", name: "匍匐", type: "skill", rarity: "common", cost: 1, power: 8, upgradedPower: 11,
    image: "/images/匍匐透明_1774026857.png", desc: "获得8护甲", upgradedDesc: "获得11护甲", count: 2 },
  { id: "xs_sofa", name: "躲沙发底下", type: "skill", rarity: "uncommon", cost: 2, power: 14, upgradedPower: 18,
    image: "/images/躲沙发透明_1774026891.png", desc: "获得14护甲", upgradedDesc: "获得18护甲", count: 1 },
  { id: "xs_bark", name: "汪汪大叫", type: "skill", rarity: "uncommon", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "敌人弱化2回合", upgradedDesc: "敌人弱化3回合", count: 2,
    effects: ["weaken2"] },
  { id: "xs_charm", name: "撒娇", type: "skill", rarity: "uncommon", cost: 1, power: 5, upgradedPower: 8,
    image: "/images/站立雪纳瑞.png", desc: "回复5HP，抽1张牌", upgradedDesc: "回复8HP，抽1张牌", count: 1,
    effects: ["heal", "draw1"] },
  { id: "xs_food", name: "狗粮", type: "skill", rarity: "common", cost: 1, power: 6, upgradedPower: 9,
    image: "/images/吃东西.png", desc: "回复6HP", upgradedDesc: "回复9HP", count: 2,
    effects: ["heal"] },
  { id: "xs_play_dead", name: "装死", type: "skill", rarity: "rare", cost: 2, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "🐕本回合无敌", upgradedDesc: "🐕本回合无敌，抽1张", count: 1,
    effects: ["invincible"] },
  { id: "xs_raincoat", name: "穿雨衣", type: "skill", rarity: "common", cost: 1, power: 4, upgradedPower: 6,
    image: "/images/站立雪纳瑞.png", desc: "🦺获得4护甲", upgradedDesc: "🦺获得6护甲", count: 2 },

  // --- 能力牌 ---
  { id: "xs_chewtoy", name: "磨牙棒", type: "power", rarity: "uncommon", cost: 1, power: 2, upgradedPower: 3,
    image: "/images/磨牙棒透明_1774026976.png", desc: "每回合攻击+2", upgradedDesc: "每回合攻击+3", count: 1,
    effects: ["atk_per_turn"] },
  { id: "xs_sniff", name: "嗅探", type: "power", rarity: "uncommon", cost: 1, power: 3, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "每回合开始对随机敌人造成3伤害", upgradedDesc: "每回合开始对随机敌人造成5伤害", count: 1,
    effects: ["dmg_per_turn"] },
  { id: "xs_territory", name: "标记领地", type: "power", rarity: "rare", cost: 2, power: 2, upgradedPower: 3,
    image: "/images/站立雪纳瑞.png", desc: "每打出攻击牌，额外造成2伤害", upgradedDesc: "每打出攻击牌，额外造成3伤害", count: 1,
    effects: ["bonus_atk"] },
];

// ============================================================
// 豆豆 (柯基) — 敏捷型，类似静默猎人 (The Silent)
// ============================================================
const DOUDOU_CARDS = [
  // --- 攻击牌 ---
  { id: "dd_kick", name: "短腿踢", type: "attack", rarity: "common", cost: 1, power: 4, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "造成4x2伤害", upgradedDesc: "造成5x2伤害", count: 4,
    effects: ["multi2"] },
  { id: "dd_dash_bite", name: "冲刺咬", type: "attack", rarity: "common", cost: 1, power: 5, upgradedPower: 7,
    image: "/images/站立雪纳瑞.png", desc: "造成5伤害，抽1张", upgradedDesc: "造成7伤害，抽1张", count: 3,
    effects: ["draw1"] },
  { id: "dd_poison_fang", name: "中毒牙", type: "attack", rarity: "uncommon", cost: 1, power: 3, upgradedPower: 4,
    image: "/images/站立雪纳瑞.png", desc: "造成3伤害+中毒3", upgradedDesc: "造成4伤害+中毒4", count: 2,
    effects: ["poison3"] },
  { id: "dd_flurry", name: "连续挠", type: "attack", rarity: "uncommon", cost: 2, power: 3, upgradedPower: 4,
    image: "/images/站立雪纳瑞.png", desc: "造成3x4伤害", upgradedDesc: "造成4x4伤害", count: 2,
    effects: ["multi4"] },
  { id: "dd_backstab", name: "偷袭", type: "attack", rarity: "rare", cost: 0, power: 10, upgradedPower: 14,
    image: "/images/站立雪纳瑞.png", desc: "造成10伤害(仅首回合可用)", upgradedDesc: "造成14伤害(仅首回合可用)", count: 1,
    effects: ["innate", "exhaust"] },
  { id: "dd_tail_whip", name: "摇尾甩打", type: "attack", rarity: "common", cost: 1, power: 5, upgradedPower: 8,
    image: "/images/站立雪纳瑞.png", desc: "造成5伤害", upgradedDesc: "造成8伤害", count: 2 },

  // --- 技能牌 ---
  { id: "dd_belly", name: "翻肚皮", type: "skill", rarity: "common", cost: 1, power: 6, upgradedPower: 9,
    image: "/images/站立雪纳瑞.png", desc: "获得6护甲", upgradedDesc: "获得9护甲", count: 3 },
  { id: "dd_wiggle", name: "屁股扭扭", type: "skill", rarity: "uncommon", cost: 0, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "抽2张牌", upgradedDesc: "抽3张牌", count: 2,
    effects: ["draw2"] },
  { id: "dd_dodge", name: "闪避", type: "skill", rarity: "common", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "下回合闪避首次攻击", upgradedDesc: "下回合闪避首次攻击+抽1张", count: 2,
    effects: ["dodge_next"] },
  { id: "dd_steal_bone", name: "偷骨头", type: "skill", rarity: "rare", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "复制手中1张攻击牌", upgradedDesc: "复制手中1张攻击牌(0费)", count: 1,
    effects: ["copy_attack"] },
  { id: "dd_nap", name: "打盹", type: "skill", rarity: "common", cost: 1, power: 4, upgradedPower: 6,
    image: "/images/站立雪纳瑞.png", desc: "回复4HP", upgradedDesc: "回复6HP", count: 2,
    effects: ["heal"] },
  { id: "dd_confuse", name: "迷惑步伐", type: "skill", rarity: "uncommon", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "敌人弱化1+易伤1", upgradedDesc: "敌人弱化2+易伤2", count: 2,
    effects: ["weaken1", "vulnerable1"] },

  // --- 能力牌 ---
  { id: "dd_speed_power", name: "速度力量", type: "power", rarity: "uncommon", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "每打出3张牌获得+1力量", upgradedDesc: "每打出2张牌获得+1力量", count: 1,
    effects: ["cards_to_str"] },
  { id: "dd_agility", name: "灵活身姿", type: "power", rarity: "uncommon", cost: 1, power: 2, upgradedPower: 3,
    image: "/images/站立雪纳瑞.png", desc: "每回合开始抽1张额外牌", upgradedDesc: "每回合开始抽2张额外牌", count: 1,
    effects: ["draw_per_turn"] },
  { id: "dd_poison_mastery", name: "毒牙精通", type: "power", rarity: "rare", cost: 2, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "每次施加中毒时翻倍", upgradedDesc: "每次施加中毒时翻倍+1", count: 1,
    effects: ["poison_double"] },
];

// ============================================================
// 大毛 (萨摩耶) — 防御型，类似机器人 (The Defect)
// ============================================================
const DAMAO_CARDS = [
  // --- 攻击牌 ---
  { id: "dm_hug_atk", name: "熊抱", type: "attack", rarity: "common", cost: 1, power: 5, upgradedPower: 8,
    image: "/images/站立雪纳瑞.png", desc: "造成5伤害", upgradedDesc: "造成8伤害", count: 4 },
  { id: "dm_fur_blast", name: "甩毛", type: "attack", rarity: "uncommon", cost: 1, power: 3, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "对全体敌人造成3伤害", upgradedDesc: "对全体敌人造成5伤害", count: 2,
    effects: ["aoe"] },
  { id: "dm_slam", name: "撞击", type: "attack", rarity: "uncommon", cost: 2, power: 10, upgradedPower: 14,
    image: "/images/站立雪纳瑞.png", desc: "造成10伤害+获得5护甲", upgradedDesc: "造成14伤害+获得7护甲", count: 2,
    effects: ["gain_armor5"] },
  { id: "dm_headbutt", name: "铁头功", type: "attack", rarity: "common", cost: 1, power: 6, upgradedPower: 9,
    image: "/images/站立雪纳瑞.png", desc: "造成6伤害", upgradedDesc: "造成9伤害", count: 3 },
  { id: "dm_avalanche", name: "雪崩压顶", type: "attack", rarity: "rare", cost: 3, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "造成等于当前护甲值的伤害", upgradedDesc: "造成等于当前护甲值的伤害，保留护甲", count: 1,
    effects: ["armor_to_dmg"] },

  // --- 技能牌 ---
  { id: "dm_white_shield", name: "白毛护盾", type: "skill", rarity: "common", cost: 1, power: 8, upgradedPower: 11,
    image: "/images/站立雪纳瑞.png", desc: "获得8护甲", upgradedDesc: "获得11护甲", count: 3 },
  { id: "dm_sit", name: "坐下", type: "skill", rarity: "common", cost: 0, power: 4, upgradedPower: 6,
    image: "/images/站立雪纳瑞.png", desc: "获得4护甲", upgradedDesc: "获得6护甲", count: 3 },
  { id: "dm_lick", name: "舔舔", type: "skill", rarity: "common", cost: 1, power: 5, upgradedPower: 8,
    image: "/images/站立雪纳瑞.png", desc: "回复5HP", upgradedDesc: "回复8HP", count: 2,
    effects: ["heal"] },
  { id: "dm_howl", name: "嚎叫", type: "skill", rarity: "uncommon", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "全体敌人弱化2", upgradedDesc: "全体敌人弱化3", count: 2,
    effects: ["aoe_weaken2"] },
  { id: "dm_snowball", name: "滚雪球", type: "skill", rarity: "uncommon", cost: 1, power: 6, upgradedPower: 8,
    image: "/images/站立雪纳瑞.png", desc: "获得6护甲，下回合再获得6", upgradedDesc: "获得8护甲，下回合再获得8", count: 1,
    effects: ["armor_next_turn"] },
  { id: "dm_play", name: "撒欢", type: "skill", rarity: "uncommon", cost: 1, power: 0, upgradedPower: 0,
    image: "/images/站立雪纳瑞.png", desc: "抽2张牌+获得3护甲", upgradedDesc: "抽2张牌+获得5护甲", count: 2,
    effects: ["draw2", "gain_armor3"] },
  { id: "dm_nap", name: "打个盹", type: "skill", rarity: "rare", cost: 2, power: 12, upgradedPower: 16,
    image: "/images/站立雪纳瑞.png", desc: "回复12HP", upgradedDesc: "回复16HP", count: 1,
    effects: ["heal"] },

  // --- 能力牌 ---
  { id: "dm_fluffy_armor", name: "蓬松护甲", type: "power", rarity: "uncommon", cost: 2, power: 5, upgradedPower: 7,
    image: "/images/站立雪纳瑞.png", desc: "每回合开始获得5护甲", upgradedDesc: "每回合开始获得7护甲", count: 1,
    effects: ["armor_per_turn"] },
  { id: "dm_bone_pile", name: "骨头堆", type: "power", rarity: "rare", cost: 3, power: 3, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "每获得护甲时对随机敌人造成3伤害", upgradedDesc: "每获得护甲时对随机敌人造成5伤害", count: 1,
    effects: ["armor_retaliate"] },
  { id: "dm_warmth", name: "温暖毛毛", type: "power", rarity: "uncommon", cost: 1, power: 3, upgradedPower: 5,
    image: "/images/站立雪纳瑞.png", desc: "每回合结束回复3HP", upgradedDesc: "每回合结束回复5HP", count: 1,
    effects: ["heal_per_turn"] },
];

// ============================================================
// 角色定义
// ============================================================
export const CHARACTERS = {
  xiaoxue: {
    id: "xiaoxue",
    name: "小雪",
    breed: "雪纳瑞",
    image: "/images/站立雪纳瑞.png",
    hp: 45,
    maxHp: 45,
    description: "勇敢倔强的小雪纳瑞，擅长正面硬刚！",
    color: "#D2691E",
    startingRelic: {
      name: "磨牙的骨头",
      desc: "前3回合攻击+2",
      icon: "🦴",
    },
    cardPool: XIAOXUE_CARDS,
    starterDeck: ["xs_strike", "xs_strike", "xs_strike", "xs_strike", "xs_bite", "xs_defend", "xs_defend", "xs_defend", "xs_crawl", "xs_food"],
  },
  doudou: {
    id: "doudou",
    name: "豆豆",
    breed: "柯基",
    image: "/images/站立雪纳瑞.png",
    hp: 35,
    maxHp: 35,
    description: "机灵矮脚小柯基，连击和毒术专家！",
    color: "#FF8C00",
    startingRelic: {
      name: "短短的腿",
      desc: "第1回合额外抽2张牌",
      icon: "🦵",
    },
    cardPool: DOUDOU_CARDS,
    starterDeck: ["dd_kick", "dd_kick", "dd_kick", "dd_kick", "dd_dash_bite", "dd_belly", "dd_belly", "dd_belly", "dd_dodge", "dd_nap"],
  },
  damao: {
    id: "damao",
    name: "大毛",
    breed: "萨摩耶",
    image: "/images/站立雪纳瑞.png",
    hp: 50,
    maxHp: 50,
    description: "毛茸茸的大萨摩耶，铜墙铁壁的守护者！",
    color: "#4FC3F7",
    startingRelic: {
      name: "厚厚的毛",
      desc: "每回合开始获得3护甲",
      icon: "🧥",
    },
    cardPool: DAMAO_CARDS,
    starterDeck: ["dm_hug_atk", "dm_hug_atk", "dm_hug_atk", "dm_hug_atk", "dm_headbutt", "dm_white_shield", "dm_white_shield", "dm_white_shield", "dm_sit", "dm_lick"],
  },
};

// 从角色卡池生成起始牌组
let _cardIdCounter = 0;
export function generateCharacterDeck(characterId) {
  const char = CHARACTERS[characterId];
  if (!char) return [];
  const deck = [];
  const cardMap = {};
  char.cardPool.forEach(c => { cardMap[c.id] = c; });

  char.starterDeck.forEach(cardId => {
    const template = cardMap[cardId];
    if (!template) return;
    deck.push({
      id: ++_cardIdCounter,
      templateId: template.id,
      name: template.name,
      baseType: template.type === "attack" ? "attack"
              : (template.effects || []).includes("heal") ? "heal"
              : template.type === "skill" ? "defend"
              : "buff",
      cardType: template.type,
      rarity: template.rarity,
      power: template.power,
      cost: template.cost,
      image: template.image,
      desc: template.desc || "",
      upgraded: false,
      upgradedPower: template.upgradedPower,
      upgradedDesc: template.upgradedDesc || "",
      effects: template.effects || [],
      genes: [],
      mutated: false,
    });
  });

  return deck.sort(() => Math.random() - 0.5);
}

// 从角色卡池生成奖励卡牌
let _rewardIdCounter = 9000;
export function generateCharacterRewards(characterId, count = 3) {
  const char = CHARACTERS[characterId];
  if (!char) return [];
  const pool = [...char.cardPool];
  const picks = [];
  while (picks.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const template = pool.splice(idx, 1)[0];
    picks.push({
      id: ++_rewardIdCounter,
      templateId: template.id,
      name: template.name,
      baseType: template.type === "attack" ? "attack"
              : (template.effects || []).includes("heal") ? "heal"
              : template.type === "skill" ? "defend"
              : "buff",
      cardType: template.type,
      rarity: template.rarity,
      power: template.power + (template.rarity === "rare" && Math.random() < 0.2 ? 1 : 0),
      cost: template.cost,
      image: template.image,
      desc: template.desc || "",
      upgraded: false,
      upgradedPower: template.upgradedPower,
      upgradedDesc: template.upgradedDesc || "",
      effects: template.effects || [],
      genes: [],
      mutated: false,
    });
  }
  return picks;
}
