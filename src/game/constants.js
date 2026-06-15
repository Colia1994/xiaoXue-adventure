// ============================================================
// 「小雪闯上海」—— 游戏常量定义
// ============================================================


// --- 意图图标映射 ---
export const INTENT_ICONS = {
  attack:          { icon: "⚔️", color: "#ef4444", label: "攻击" },
  attack_heavy:    { icon: "💀", color: "#dc2626", label: "重击" },
  attack_ultimate: { icon: "🎯", color: "#7c2d12", label: "终极" },
  defend:          { icon: "🛡️", color: "#3b82f6", label: "防御" },
  buff:            { icon: "⬆️", color: "#f59e0b", label: "增强" },
  debuff:          { icon: "⬇️", color: "#8b5cf6", label: "削弱" },
  heal:            { icon: "💚", color: "#22c55e", label: "回复" },
  charge:          { icon: "⚡", color: "#eab308", label: "蓄力" },
  summon:          { icon: "📢", color: "#a855f7", label: "召唤" },
  stun:            { icon: "🕸️", color: "#6366f1", label: "控制" },
};

// 攻击类意图集合（用于判断是否显示伤害数字）
export const ATTACK_INTENTS = new Set(['attack', 'attack_heavy', 'attack_ultimate']);

// --- Boss技能（每个Boss拥有多种技能，回合时随机/循环选择）---
export const BOSS_SKILLS = {
  "坏猫咪": [
    { name: "猫爪三连", type: "multi", emoji: "🐾", dmg: 3, hits: 3, intentIcon: "attack" },
    { name: "舔毛回血", type: "heal", emoji: "👅", healAmt: 5, intentIcon: "heal" },
  ],
  "凶恶泰迪": [
    { name: "狂吠震慑", type: "weaken", emoji: "🗣️", weakenAmt: 2, intentIcon: "debuff" },
    { name: "铁头功", type: "heavy", emoji: "💀", dmgMult: 2, intentIcon: "attack_heavy" },
    { name: "护毛术", type: "buff", emoji: "🛡️", armorAmt: 5, intentIcon: "buff" },
  ],
  "流浪大橘": [
    { name: "肥猫压顶", type: "heavy", emoji: "🐈", dmg: 6, intentIcon: "attack_heavy" },
    { name: "懒猫打盹", type: "heal", emoji: "😴", healAmt: 4, intentIcon: "heal" },
    { name: "猫拳连打", type: "multi", emoji: "🐾", dmg: 2, hits: 3, intentIcon: "attack" },
  ],
  "城管大叔": [
    { name: "网兜抓捕", type: "stun", emoji: "🕸️", stunTurns: 1, intentIcon: "stun" },
    { name: "罚款单", type: "weaken", emoji: "📋", weakenAmt: 2, intentIcon: "debuff" },
    { name: "铁壁防御", type: "buff", emoji: "🛡️", armorAmt: 6, intentIcon: "buff" },
  ],
  "恶霸犬": [
    { name: "撕咬", type: "bleed", emoji: "😠", dmg: 2, bleedAmt: 2, intentIcon: "attack" },
    { name: "凶狠冲撞", type: "heavy", emoji: "💥", dmgMult: 2, intentIcon: "attack_heavy" },
    { name: "威吓低吼", type: "weaken", emoji: "😤", weakenAmt: 1, intentIcon: "debuff" },
  ],
  "小混混": [
    { name: "扔石头", type: "ranged", emoji: "🪨", dmg: 3, intentIcon: "attack" },
    { name: "撒石灰", type: "debuff", emoji: "💨", weakenAmt: 1, intentIcon: "debuff" },
    { name: "偷鸡摸狗", type: "heal", emoji: "🍗", healAmt: 3, intentIcon: "heal" },
  ],
  "⚠️ 捕狗大队队长": [
    { name: "终极抓捕", type: "ultimate", emoji: "🎯", dmg: 10, stun: true, intentIcon: "attack_ultimate" },
    { name: "蓄力", type: "charge", emoji: "⚡", chargeTurns: 2, intentIcon: "charge" },
    { name: "召唤援军", type: "summon", emoji: "📢", intentIcon: "summon" },
    { name: "网兜抓捕", type: "stun", emoji: "🕸️", stunTurns: 1, intentIcon: "stun" },
  ],
};

// --- 最终Boss技能循环模式 ---
export const BOSS_PATTERNS = {
  "⚠️ 捕狗大队队长": ['attack', 'charge', 'charge', 'ultimate'],
};

// --- 随机事件 ---
export const RANDOM_EVENTS = [
  {
    id: "street_snack",
    title: "🦴 路边零食",
    desc: "小雪在垃圾桶旁发现了一些食物残渣，闻起来还不错……",
    choices: [
      { label: "吃掉！回复10HP", effect: { type: "heal", value: 10 } },
      { label: "不吃，继续走", effect: { type: "none" } },
    ],
  },
  {
    id: "stray_friend",
    title: "🐕 流浪狗伙伴",
    desc: "一只友善的流浪狗向小雪摇了摇尾巴，似乎想帮忙。",
    choices: [
      { label: "一起走！下场战斗攻击+3", effect: { type: "buff_attack", value: 3 } },
      { label: "让它带路，获得10护甲", effect: { type: "gain_armor", value: 10 } },
    ],
  },
  {
    id: "find_food",
    title: "💰 捡到狗粮",
    desc: "地上有一袋没开封的狗粮！小雪兴奋地摇着尾巴。",
    choices: [
      { label: "大吃一顿！回复15HP", effect: { type: "heal", value: 15 } },
      { label: "带走备用，获得一张随机牌", effect: { type: "gain_card" } },
    ],
  },
  {
    id: "rainy_day",
    title: "🌧️ 下雨了",
    desc: "突然下起了雨，小雪躲在屋檐下，毛都湿了……",
    choices: [
      { label: "淋雨冲刺！失去5HP但获得一张牌", effect: { type: "trade_hp_card", hpCost: 5 } },
      { label: "等雨停，休息一下回复8HP", effect: { type: "heal", value: 8 } },
    ],
  },
  {
    id: "street_vendor",
    title: "🏪 路边小卖部",
    desc: "好心的老奶奶看到小雪，拿出了一些好东西。",
    choices: [
      { label: "花8HP换一张强力牌", effect: { type: "trade_hp_card", hpCost: 8, strong: true } },
      { label: "撒个娇，回复5HP", effect: { type: "heal", value: 5 } },
      { label: "不了谢谢", effect: { type: "none" } },
    ],
  },
  {
    id: "cat_territory",
    title: "🐱 猫咪地盘",
    desc: "这条巷子是野猫的地盘，几只猫警惕地看着小雪……",
    choices: [
      { label: "低头快走（安全通过）", effect: { type: "none" } },
      { label: "汪汪叫！赶走猫但消耗5HP", effect: { type: "trade_hp_buff", hpCost: 5, attackBuff: 2 } },
    ],
  },
  {
    id: "park_fountain",
    title: "⛲ 公园喷泉",
    desc: "小雪发现了一个公园喷泉，清凉的水看起来很舒服。",
    choices: [
      { label: "痛饮泉水！回复全部HP", effect: { type: "full_heal" } },
      { label: "在喷泉边玩耍，最大HP+5", effect: { type: "max_hp_up", value: 5 } },
    ],
  },
  {
    id: "mysterious_box",
    title: "📦 神秘纸箱",
    desc: "路边有一个破纸箱，里面好像有什么东西在闪光……",
    choices: [
      { label: "翻找一下！获得一件遗物", effect: { type: "gain_relic" } },
      { label: "太可疑了，走开", effect: { type: "none" } },
    ],
  },
  {
    id: "kind_uncle",
    title: "👴 好心的大爷",
    desc: "一位大爷看到小雪，从口袋里掏出了一个宝贝。",
    choices: [
      { label: "接受礼物！获得一件遗物", effect: { type: "gain_relic" } },
      { label: "摇摇尾巴，回复10HP", effect: { type: "heal", value: 10 } },
    ],
  },
];

// --- 上海街头的坏人和坏狗狗 ---
export const ENEMY_TEMPLATES = [
  [{ name: "坏猫咪", image: "/images/坏猫咪透明v2_1774027860.png", hp: 15, maxHp: 15, atk: 3, armor: 0, skill: "猫爪三连" }],
  [{ name: "凶恶泰迪", image: "/images/凶恶泰迪透明_1774027032.png", hp: 20, maxHp: 20, atk: 4, armor: 2, skill: "狂吠震慑" }],
  [
    { name: "流浪大橘", image: "/images/流浪大橘透明_1774027086.png", hp: 12, maxHp: 12, atk: 3, armor: 0, skill: "肥猫压顶" },
    { name: "流浪大橘", image: "/images/流浪大橘透明_1774027086.png", hp: 12, maxHp: 12, atk: 3, armor: 0, skill: "肥猫压顶" },
  ],
  [{ name: "城管大叔", image: "/images/城管大叔透明_1774027124.png", hp: 28, maxHp: 28, atk: 5, armor: 3, skill: "网兜抓捕" }],
  [
    { name: "恶霸犬", image: "/images/恶霸犬透明_1774027160.png", hp: 18, maxHp: 18, atk: 5, armor: 0, skill: "撕咬" },
    { name: "小混混", image: "/images/小混混透明_1774027203.png", hp: 10, maxHp: 10, atk: 2, armor: 0, skill: "扔石头" },
  ],
  [{ name: "⚠️ 捕狗大队队长", image: "/images/捕狗队长透明_1774027248.png", hp: 45, maxHp: 45, atk: 7, armor: 4, skill: "终极抓捕" }],
];

// --- 敌人3D样式 ---
export const ENEMY_STYLES = {
  "坏猫咪": {
    bg: "radial-gradient(circle at 30% 30%, #ffa502, #ff6348, #ff4757)",
    shadow: "0 20px 40px rgba(255, 165, 2, 0.4)",
    transform: "perspective(500px) rotateY(-5deg) rotateX(5deg)",
    float: true,
  },
  "凶恶泰迪": {
    bg: "linear-gradient(135deg, #8e44ad, #9b59b6, #e74c3c)",
    shadow: "0 20px 40px rgba(142, 68, 173, 0.5)",
    transform: "perspective(500px) rotateY(5deg)",
    float: true,
  },
  "流浪大橘": {
    bg: "radial-gradient(circle at 50% 20%, #ff9f43, #f39c12, #e67e22)",
    shadow: "0 25px 50px rgba(243, 156, 18, 0.5)",
    transform: "perspective(500px) rotateY(-3deg) rotateX(8deg)",
    float: true,
  },
  "城管大叔": {
    bg: "linear-gradient(135deg, #2c3e50, #34495e, #7f8c8d)",
    shadow: "0 20px 40px rgba(52, 73, 94, 0.6)",
    transform: "perspective(500px) rotateY(8deg)",
    float: false,
  },
  "恶霸犬": {
    bg: "radial-gradient(circle at 40% 40%, #636e72, #2d3436, #000000)",
    shadow: "0 30px 60px rgba(0,0,0,0.5)",
    transform: "perspective(500px) scale(1.1)",
    float: true,
  },
  "小混混": {
    bg: "linear-gradient(135deg, #e17055, #d63031)",
    shadow: "0 15px 30px rgba(225, 112, 85, 0.4)",
    transform: "perspective(500px) rotateY(-5deg) rotateZ(5deg)",
    float: false,
  },
  "⚠️ 捕狗大队队长": {
    bg: "radial-gradient(circle at 50% 30%, #ff0000, #8b0000, #2c0000)",
    shadow: "0 0 60px rgba(255, 0, 0, 0.6), 0 30px 60px rgba(139, 0, 0, 0.5)",
    transform: "perspective(500px) scale(1.2)",
    float: true,
  },
};
