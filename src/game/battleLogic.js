import { getRelicPassiveBonus } from './relics';

// --- 计算卡牌实际效果 ---
export function calcCardEffect(card, buff, relics) {
  let dmg = 0, armor = 0, heal = 0, effects = [];
  const base = card.power || 0;
  const buffBonus = buff || 0;
  const cardEffects = card.effects || [];
  const rl = relics || [];

  if (card.baseType === "attack") dmg = base + buffBonus + getRelicPassiveBonus(rl, "atk_bonus");
  if (card.baseType === "defend") armor = base + getRelicPassiveBonus(rl, "def_bonus");
  if (card.baseType === "heal") heal = base + getRelicPassiveBonus(rl, "heal_bonus");
  if (card.baseType === "buff") effects.push({ type: "buff", value: base });

  // Handle effects array from character cards
  cardEffects.forEach(ef => {
    if (ef === "heal" && card.baseType !== "heal") heal = base;
    if (ef === "draw1") effects.push("draw");
    if (ef === "draw2") effects.push("draw2");
    if (ef === "poison2") effects.push({ type: "poison", value: 2 });
    if (ef === "poison3") effects.push({ type: "poison", value: 3 });
    if (ef === "weaken1") effects.push("weaken");
    if (ef === "weaken2") effects.push("weaken");
    if (ef === "aoe_weaken2") effects.push("aoe_weaken");
    if (ef === "aoe") effects.push("aoe_damage");
    if (ef === "multi2") effects.push({ type: "multi", hits: 2 });
    if (ef === "multi4") effects.push({ type: "multi", hits: 4 });
    if (ef === "target_lowest") effects.push("target_lowest");
    if (ef === "invincible") effects.push("invincible");
    if (ef === "innate") effects.push("innate");
    if (ef === "exhaust") effects.push("exhaust");
    if (ef === "dodge_next") effects.push("dodge_next");
    if (ef === "copy_attack") effects.push("copy_attack");
    if (ef === "vulnerable1") effects.push("vulnerable");
    if (ef === "gain_armor5") { armor = card.upgraded ? 7 : 5; }
    if (ef === "gain_armor3") { armor = card.upgraded ? 5 : 3; }
    if (ef === "armor_to_dmg") effects.push("armor_to_dmg");
    if (ef === "armor_next_turn") effects.push("armor_next_turn");
    if (ef === "atk_per_turn") effects.push({ type: "power_buff", value: base });
    if (ef === "dmg_per_turn") effects.push({ type: "dmg_per_turn", value: base });
    if (ef === "bonus_atk") effects.push({ type: "bonus_atk", value: base });
    if (ef === "armor_per_turn") effects.push({ type: "armor_per_turn", value: base });
    if (ef === "armor_retaliate") effects.push({ type: "armor_retaliate", value: base });
    if (ef === "heal_per_turn") effects.push({ type: "heal_per_turn", value: base });
    if (ef === "draw_per_turn") effects.push({ type: "draw_per_turn", value: 1 });
    if (ef === "cards_to_str") effects.push("cards_to_str");
    if (ef === "poison_double") effects.push("poison_double");
  });

  // Legacy skill name handling (old cards)
  if (card.baseType === "skill" && cardEffects.length === 0) {
    switch (card.name) {
      case "汪汪大叫": effects.push("weaken"); break;
      case "摇尾巴": effects.push("confuse"); break;
      case "嗅探": effects.push("expose"); break;
      case "撒娇": heal = 5; effects.push("draw"); break;
      case "标记领地": effects.push("aoe_mark"); break;
      case "拉屎": effects.push("freeze_all"); break;
      case "摇屁股": heal = 3; break;
      case "甩水": effects.push("aoe_damage"); break;
    }
  }

  return { dmg, armor, heal, effects };
}
