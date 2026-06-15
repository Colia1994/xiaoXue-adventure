# Gene/Mutation System Archive

This document preserves the complete gene/mutation system extracted from the game.
The system was removed because the logic wasn't self-consistent enough yet.
When ready to reintegrate, use this as the reference.

---

## Overview

Cards carry **genes** (e.g. `sharp`, `tough`, `fast`). When a card is played, its genes
"infect" adjacent cards in hand (spreading left and right). A card that accumulates two
specific genes triggers a **mutation** (combo skill) with enhanced effects.

---

## GENES Object (8 genes)

```js
export const GENES = {
  sharp:   { emoji: "🦷", name: "利齿", color: "#ffb199", desc: "+2伤害" },
  tough:   { emoji: "🛡️", name: "硬毛", color: "#b8c5cc", desc: "+3护甲" },
  fast:    { emoji: "💨", name: "疾跑", color: "#a5e4fb", desc: "先攻+冻结敌人1回合" },
  smell:   { emoji: "👃", name: "嗅探", color: "#c5e1a5", desc: "标记弱点，下回合伤害翻倍" },
  cute:    { emoji: "🥺", name: "卖萌", color: "#f48fb1", desc: "回复伤害50%生命" },
  loud:    { emoji: "📢", name: "吠叫", color: "#ffeaa7", desc: "弹射到随机敌人" },
  snack:   { emoji: "🦴", name: "零食", color: "#d7ccc8", desc: "回合结束额外抽1张" },
  loyal:   { emoji: "❤️", name: "忠诚", color: "#fca5a5", desc: "效果翻倍" },
};
```

### Gene Effects in calcCardEffect

```js
card.genes.forEach(g => {
  if (g === "sharp") dmg += 2 * mult;
  if (g === "tough") armor += 3 * mult;
  if (g === "fast") effects.push("freeze");
  if (g === "smell") effects.push("mark");
  if (g === "cute") effects.push("leech");
  if (g === "loud") effects.push("thunder");
  if (g === "snack") effects.push("draw");
});
```

The `loyal` gene doubles all effects via a multiplier:
```js
const hasLoyal = card.genes.includes("loyal");
const mult = hasLoyal ? 2 : 1;
```

---

## MUTATIONS Object (10 combos)

```js
export const MUTATIONS = {
  "sharp+tough":  { emoji: "🐕", name: "铁齿铜牙", desc: "10伤害+5护甲", description: "利齿与硬毛的完美组合，攻守兼备！造成10点伤害并获得5点护甲。", effect: "attack_def", value: 10 },
  "sharp+fast":   { emoji: "⚡", name: "闪电爪", desc: "15伤害冻结", description: "疾跑加持利齿，闪电般的爪击让敌人动弹不得！造成15点伤害并冻结敌人。", effect: "mega_freeze", value: 15 },
  "smell+sharp":  { emoji: "🎯", name: "致命一击", desc: "20无视护甲伤害", description: "嗅探弱点后精准打击，无视一切护甲的致命一击！造成20点穿甲伤害。", effect: "pierce", value: 20 },
  "cute+loyal":   { emoji: "💖", name: "治愈之吻", desc: "回复15HP", description: "卖萌的力量加上忠诚的加持，温暖治愈之吻！回复15点生命值。", effect: "mega_heal", value: 15 },
  "loud+loyal":   { emoji: "🔊", name: "狮吼功", desc: "全体8伤害", description: "吠叫的威力因忠诚加倍，震撼全场的狮吼功！对所有敌人造成8点伤害。", effect: "aoe", value: 8 },
  "snack+smell":  { emoji: "🍖", name: "寻味追踪", desc: "抽3张牌", description: "嗅探配合零食补给，循着美味找到更多策略！额外抽取3张牌。", effect: "draw", value: 3 },
  "fast+smell":   { emoji: "👻", name: "幽灵犬", desc: "闪避下回合攻击", description: "疾跑如风加上敏锐嗅觉，化身幽灵犬闪避一切！下回合完全闪避敌人攻击。", effect: "dodge", value: 1 },
  "tough+loyal":  { emoji: "🏰", name: "铜墙铁壁", desc: "+15护甲", description: "硬毛与忠诚铸就的钢铁防线，铜墙铁壁不可破！获得15点护甲。", effect: "mega_shield", value: 15 },
  "sharp+loud":   { emoji: "🌪️", name: "狂吠乱咬", desc: "随机攻击3次", description: "利齿加吠叫的疯狂组合，狂吠乱咬无人能挡！随机攻击3次，每次6点伤害。", effect: "random", value: 6 },
  "cute+snack":   { emoji: "🍼", name: "大餐时间", desc: "回10HP抽2张", description: "卖萌换来零食大餐，吃饱喝足继续战斗！回复10点生命值并抽取2张牌。", effect: "heal_draw", value: 10 },
};
```

---

## getMutationKey Function

```js
export function getMutationKey(a, b) {
  const sorted = [a, b].sort();
  return sorted.join("+");
}
```

---

## doInfection — Gene Spreading Logic (from App.jsx)

Called at the end of each player turn. Spreads genes from each card to its
left and right neighbors in hand. Cards can hold up to 3 genes max.
After spreading, checks if any card now has a valid mutation combo.

```js
const doInfection = useCallback(() => {
  setTurnPhase("infecting");
  setSelectedCard(null);
  setShowInfection(true);

  setHand(prev => {
    const next = prev.map(c => ({
      ...c,
      genes: [...c.genes],
      justInfected: false,
      mutated: c.mutated || false
    }));
    const infected = new Set();
    const pairs = [];
    let hasChange = false;

    for (let i = 0; i < next.length; i++) {
      const card = next[i];
      if (card.genes.length === 0) continue;

      // Spread left
      if (i > 0) {
        const left = next[i - 1];
        for (const gene of card.genes) {
          if (!left.genes.includes(gene) && left.genes.length < 3) {
            left.genes = [...left.genes, gene];
            left.justInfected = true;
            infected.add(left.id);
            pairs.push({ fromIdx: i, toIdx: i - 1, gene, fromId: card.id, toId: left.id });
            hasChange = true;
          }
        }
      }

      // Spread right
      if (i < next.length - 1) {
        const right = next[i + 1];
        for (const gene of card.genes) {
          if (!right.genes.includes(gene) && right.genes.length < 3) {
            right.genes = [...right.genes, gene];
            right.justInfected = true;
            infected.add(right.id);
            pairs.push({ fromIdx: i, toIdx: i + 1, gene, fromId: card.id, toId: right.id });
            hasChange = true;
          }
        }
      }
    }

    setInfectionPairs(pairs);

    // Check for new mutations
    next.forEach(c => {
      for (let a = 0; a < c.genes.length; a++) {
        for (let b = a + 1; b < c.genes.length; b++) {
          const mKey = getMutationKey(c.genes[a], c.genes[b]);
          if (MUTATIONS[mKey]) {
            c.mutated = true;
          }
        }
      }
    });

    if (hasChange) {
      addLog(`🧬 技能传染！${infected.size} 张卡牌学会了新技能`);
      playSound('infect');
    }

    // Mark first-time discoveries
    const newDiscoveryIds = new Set();
    next.forEach(c => {
      if (c.mutated && !prev.find(p => p.id === c.id)?.mutated) {
        playSound('mutate');
        for (let a = 0; a < c.genes.length; a++) {
          for (let b = a + 1; b < c.genes.length; b++) {
            const mKey = getMutationKey(c.genes[a], c.genes[b]);
            const m = MUTATIONS[mKey];
            if (m && !discoveredMutations.includes(m.name)) {
              newDiscoveryIds.add(c.id);
              setDiscoveredMutations(d => {
                if (d.includes(m.name)) return d;
                return [...d, m.name];
              });
            }
          }
        }
      }
    });
    if (newDiscoveryIds.size > 0) {
      setNewDiscoveryMarks(newDiscoveryIds);
    }

    setAnimatingCards(infected);
    return next;
  });

  setTimeout(() => {
    setShowInfection(false);
    setAnimatingCards(new Set());
    setInfectionPairs([]);
    setNewDiscoveryMarks(new Set());
    setTurnPhase("enemy");
  }, 1000);
}, [addLog, playSound, discoveredMutations, setDiscoveredMutations]);
```

---

## checkMutationPotential — Mutation Preview (from App.jsx)

Checks if two cards could form a mutation if their genes were combined.
Used for showing preview indicators on adjacent cards.

```js
const checkMutationPotential = (cardA, cardB) => {
  if (!cardA?.genes?.length || !cardB?.genes?.length) return null;
  if (cardA.mutated || cardB.mutated) return null;
  for (const gA of cardA.genes) {
    for (const gB of cardB.genes) {
      const key = getMutationKey(gA, gB);
      if (MUTATIONS[key]) {
        return { mutation: MUTATIONS[key], geneA: gA, geneB: gB, direction: 'adjacent' };
      }
    }
  }
  return null;
};
```

---

## Mutation Effect Processing (from executeAttack / playCard in App.jsx)

When a mutated card is played, each mutation effect triggers special behavior:

```js
// Inside executeAttack or playCard:
eff.effects.forEach(fx => {
  if (fx.mutation) {
    const m = fx.mutation;
    switch (m.effect) {
      case "attack_def":   // 铁齿铜牙: deal value dmg + gain value/2 armor
      case "mega_freeze":  // 闪电爪: deal value dmg + freeze target
      case "pierce":       // 致命一击: deal value dmg ignoring armor
      case "mega_heal":    // 治愈之吻: heal value HP
      case "aoe":          // 狮吼功: deal value dmg to ALL enemies
      case "draw":         // 寻味追踪: draw value cards
      case "dodge":        // 幽灵犬: set dodge flag for next enemy turn
      case "mega_shield":  // 铜墙铁壁: gain value armor
      case "random":       // 狂吠乱咬: 3 random hits of value dmg each
      case "heal_draw":    // 大餐时间: heal value HP + draw 2 cards
    }
  }
});
```

---

## Related State Variables (from App.jsx)

```js
const [discoveredMutations, setDiscoveredMutations] = useState([]);  // mutation names found this run
const [animatingCards, setAnimatingCards] = useState(new Set());      // card IDs currently showing infection animation
const [showInfection, setShowInfection] = useState(false);           // whether infection overlay is visible
const [infectionPairs, setInfectionPairs] = useState([]);             // {fromIdx, toIdx, gene} pairs for SVG arrows
const [newDiscoveryMarks, setNewDiscoveryMarks] = useState(new Set()); // card IDs with "🆕 新发现！" badge
```

---

## Related UI Components

- `ComboDisplay` / `useCombo` from `src/effects/ComboSystem.jsx` — combo counter and mutation cut-in animation
- Infection SVG overlay — animated arrows showing gene spread between cards
- Card.jsx gene icon row, mutation badges, golden electric arcs for mutation preview
- CSS animations: `mutatedBorderRotate`, `infectionGeneFloat`, `.mutated-card`

---

## Card Gene Assignment (from generateDeck / generateRewardCards)

```js
// In generateDeck: ~34% of cards get a random gene
const hasGene = needGene || Math.random() < 0.3;
deck.push({
  ...card,
  genes: hasGene ? [randomGene()] : [],
  mutated: false,
});

// randomGene picks from GENES keys
function randomGene() {
  const keys = Object.keys(GENES);
  return keys[Math.floor(Math.random() * keys.length)];
}
```

---

## Reintegration Notes

To bring this system back:
1. Restore GENES, MUTATIONS, getMutationKey to constants.js
2. Re-add gene assignment in generateDeck/generateRewardCards
3. Re-add gene bonus loop and mutation check in calcCardEffect
4. Re-add doInfection call at end of player turn
5. Re-add gene/mutation UI in Card.jsx (icons, badges, tooltips, electric arcs)
6. Re-add checkMutationPotential for preview indicators
7. Re-add ComboDisplay component
8. Re-add infection SVG overlay
9. Restore related state variables in App.jsx

Key design issues to resolve before reintegration:
- Gene spreading is uncontrollable — cards accumulate genes passively
- Mutation combos are overpowered relative to base card effects
- No player agency in which genes spread where
- The "infection" metaphor may not fit thematically with dog characters
