export const RELICS = {
  // --- Starting relics ---
  bone_chew: {
    id: "bone_chew", name: "磨牙的骨头", icon: "🦴",
    desc: "前3回合攻击+2", rarity: "starter",
    trigger: "turn_start",
    effect: { type: "atk_buff", value: 2, condition: "round <= 3" },
  },
  short_legs: {
    id: "short_legs", name: "短短的腿", icon: "🦵",
    desc: "第1回合额外抽2张牌", rarity: "starter",
    trigger: "turn_start",
    effect: { type: "draw", value: 2, condition: "round === 1" },
  },
  thick_fur: {
    id: "thick_fur", name: "厚厚的毛", icon: "🧥",
    desc: "每回合开始获得3护甲", rarity: "starter",
    trigger: "turn_start",
    effect: { type: "gain_armor", value: 3 },
  },

  // --- Common relics ---
  old_collar: {
    id: "old_collar", name: "旧项圈", icon: "📿",
    desc: "每场战斗开始获得5护甲", rarity: "common",
    trigger: "battle_start",
    effect: { type: "gain_armor", value: 5 },
  },
  lucky_bone: {
    id: "lucky_bone", name: "幸运骨头", icon: "🦴",
    desc: "每回合开始有25%几率抽1张牌", rarity: "common",
    trigger: "turn_start",
    effect: { type: "draw", value: 1, chance: 0.25 },
  },
  dog_tag: {
    id: "dog_tag", name: "狗牌", icon: "🏷️",
    desc: "战斗胜利后回复5HP", rarity: "common",
    trigger: "battle_end",
    effect: { type: "heal", value: 5 },
  },
  torn_bandana: {
    id: "torn_bandana", name: "破旧头巾", icon: "🎀",
    desc: "最大HP+10", rarity: "common",
    trigger: "on_acquire",
    effect: { type: "max_hp_up", value: 10 },
  },
  snack_bag: {
    id: "snack_bag", name: "零食袋", icon: "🍖",
    desc: "每3回合回复3HP", rarity: "common",
    trigger: "turn_start",
    effect: { type: "heal", value: 3, condition: "round % 3 === 0" },
  },

  // --- Uncommon relics ---
  sharp_fang: {
    id: "sharp_fang", name: "锋利犬牙", icon: "🦷",
    desc: "攻击牌伤害+1", rarity: "uncommon",
    trigger: "passive",
    effect: { type: "atk_bonus", value: 1 },
  },
  thick_paw: {
    id: "thick_paw", name: "厚实的爪垫", icon: "🐾",
    desc: "防御牌护甲+2", rarity: "uncommon",
    trigger: "passive",
    effect: { type: "def_bonus", value: 2 },
  },
  warm_scarf: {
    id: "warm_scarf", name: "温暖围巾", icon: "🧣",
    desc: "回复效果+3", rarity: "uncommon",
    trigger: "passive",
    effect: { type: "heal_bonus", value: 3 },
  },
  lucky_paw: {
    id: "lucky_paw", name: "幸运爪印", icon: "🐾",
    desc: "每场战斗第1回合能量+1", rarity: "uncommon",
    trigger: "battle_start",
    effect: { type: "energy", value: 1 },
  },
  rusty_chain: {
    id: "rusty_chain", name: "生锈铁链", icon: "⛓️",
    desc: "每回合首次出牌后抽1张", rarity: "uncommon",
    trigger: "first_card_played",
    effect: { type: "draw", value: 1 },
  },

  // --- Rare relics ---
  golden_collar: {
    id: "golden_collar", name: "金色项圈", icon: "👑",
    desc: "每回合能量+1", rarity: "rare",
    trigger: "passive",
    effect: { type: "max_energy", value: 1 },
  },
  phoenix_feather: {
    id: "phoenix_feather", name: "不死鸟羽毛", icon: "🪶",
    desc: "HP降至0时回复到25%HP（仅一次）", rarity: "rare",
    trigger: "on_death",
    effect: { type: "revive", percent: 0.25 },
  },
};

export const CHAR_STARTING_RELICS = {
  xiaoxue: "bone_chew",
  doudou: "short_legs",
  damao: "thick_fur",
};

export const RELIC_POOL = {
  common: Object.values(RELICS).filter(r => r.rarity === "common"),
  uncommon: Object.values(RELICS).filter(r => r.rarity === "uncommon"),
  rare: Object.values(RELICS).filter(r => r.rarity === "rare"),
};

export function getRandomRelic(ownedRelicIds = []) {
  const roll = Math.random();
  const pool = roll < 0.6 ? RELIC_POOL.common
             : roll < 0.9 ? RELIC_POOL.uncommon
             : RELIC_POOL.rare;
  const available = pool.filter(r => !ownedRelicIds.includes(r.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export function getRelicPassiveBonus(relics, bonusType) {
  let total = 0;
  for (const r of relics) {
    if (r.trigger === "passive" && r.effect.type === bonusType) {
      total += r.effect.value;
    }
  }
  return total;
}
