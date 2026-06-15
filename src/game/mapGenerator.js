// 地图生成器 — 杀戮尖塔式分支路线
// 每个 Act 生成若干行节点，节点之间有路径连接

export const NODE_TYPES = {
  battle:  { icon: "⚔️", label: "战斗", color: "#ef4444" },
  elite:   { icon: "💀", label: "精英", color: "#a855f7" },
  boss:    { icon: "👹", label: "Boss", color: "#dc2626" },
  rest:    { icon: "🏕️", label: "休息", color: "#22c55e" },
  shop:    { icon: "🏪", label: "商店", color: "#eab308" },
  event:   { icon: "❓", label: "事件", color: "#3b82f6" },
};

const ACT_THEMES = [
  { name: "弄堂小巷", desc: "小雪偷偷溜出家门，穿梭在弄堂和小巷中……", bg: "#1a1a2e" },
  { name: "街道公园", desc: "小雪来到了热闹的街道，公园里危机四伏……", bg: "#1e293b" },
  { name: "城市中心", desc: "小雪闯入了城市中心，最终的考验即将来临……", bg: "#27172e" },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRow(rowIdx, totalRows, act) {
  const isFirst = rowIdx === 0;
  const isLast = rowIdx === totalRows - 1;
  const isSecondToLast = rowIdx === totalRows - 2;

  if (isLast) {
    const bossNames = ["坏猫咪", "城管大叔", "⚠️ 捕狗大队队长"];
    return [{
      type: "boss",
      label: bossNames[act] || "Boss",
    }];
  }

  const nodeCount = isFirst ? 3 : (2 + Math.floor(Math.random() * 2)); // 2-3 nodes

  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    let type;
    if (isFirst) {
      type = Math.random() < 0.7 ? "battle" : "event";
    } else if (isSecondToLast) {
      // boss 前一行：休息或商店
      type = Math.random() < 0.5 ? "rest" : "shop";
    } else if (rowIdx === 1) {
      type = pickRandom(["battle", "battle", "event"]);
    } else {
      const pool = ["battle", "battle", "battle", "event", "rest", "shop"];
      if (rowIdx >= 3) pool.push("elite");
      if (act >= 1 && rowIdx >= 2) pool.push("elite");
      type = pickRandom(pool);
    }
    nodes.push({ type });
  }
  return nodes;
}

function generatePaths(rows) {
  const paths = [];
  for (let r = 0; r < rows.length - 1; r++) {
    const currentRow = rows[r];
    const nextRow = rows[r + 1];

    // 确保每个当前节点至少连一个下一行节点
    // 确保每个下一行节点至少被一个当前节点连
    const usedNext = new Set();

    currentRow.forEach((_, ci) => {
      // 计算"自然对齐"的下一行节点
      const ratio = currentRow.length === 1 ? 0.5 : ci / (currentRow.length - 1);
      const naturalIdx = Math.round(ratio * (nextRow.length - 1));

      // 连接自然对齐的节点
      paths.push({ from: [r, ci], to: [r + 1, naturalIdx] });
      usedNext.add(naturalIdx);

      // 30% 概率额外连一条相邻路径
      if (Math.random() < 0.3) {
        const offset = Math.random() < 0.5 ? -1 : 1;
        const extra = naturalIdx + offset;
        if (extra >= 0 && extra < nextRow.length) {
          paths.push({ from: [r, ci], to: [r + 1, extra] });
          usedNext.add(extra);
        }
      }
    });

    // 确保每个下一行节点都被连接
    nextRow.forEach((_, ni) => {
      if (!usedNext.has(ni)) {
        const closestCurrent = currentRow.reduce((best, _, ci) => {
          const ratio = currentRow.length === 1 ? 0.5 : ci / (currentRow.length - 1);
          const dist = Math.abs(ratio - (nextRow.length === 1 ? 0.5 : ni / (nextRow.length - 1)));
          return dist < best.dist ? { idx: ci, dist } : best;
        }, { idx: 0, dist: Infinity });
        paths.push({ from: [r, closestCurrent.idx], to: [r + 1, ni] });
      }
    });
  }

  // 去重
  const seen = new Set();
  return paths.filter(p => {
    const key = `${p.from[0]},${p.from[1]}-${p.to[0]},${p.to[1]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 根据 act 分配敌人索引
function getEnemyPoolForAct(act) {
  // act 0: 前2个模板, act 1: 2-4, act 2: 4-5+boss
  switch (act) {
    case 0: return [0, 1, 2];
    case 1: return [1, 2, 3];
    case 2: return [3, 4];
    default: return [0, 1];
  }
}

function getBossForAct(act) {
  switch (act) {
    case 0: return 1;  // 凶恶泰迪
    case 1: return 3;  // 城管大叔
    case 2: return 5;  // 捕狗大队队长 (final boss)
    default: return 5;
  }
}

export function generateMap(act = 0) {
  const totalRows = act === 2 ? 8 : 7;
  const rows = [];

  for (let r = 0; r < totalRows; r++) {
    const rowNodes = generateRow(r, totalRows, act);
    rows.push(rowNodes.map((node, col) => ({
      id: `${act}-${r}-${col}`,
      row: r,
      col,
      type: node.type,
      label: node.label,
      visited: false,
      enemyIdx: node.type === "battle" || node.type === "elite"
        ? pickRandom(getEnemyPoolForAct(act))
        : node.type === "boss"
          ? getBossForAct(act)
          : null,
    })));
  }

  const paths = generatePaths(rows);

  return {
    act,
    theme: ACT_THEMES[act] || ACT_THEMES[0],
    rows,
    paths,
    totalRows,
  };
}

export function getReachableNodes(map, currentNodeId) {
  if (!currentNodeId) {
    // 游戏刚开始：第0行所有节点可选
    return map.rows[0].map(n => n.id);
  }

  return map.paths
    .filter(p => {
      const fromNode = map.rows[p.from[0]][p.from[1]];
      return fromNode && fromNode.id === currentNodeId;
    })
    .map(p => map.rows[p.to[0]][p.to[1]].id);
}

export function getNodeById(map, nodeId) {
  for (const row of map.rows) {
    for (const node of row) {
      if (node.id === nodeId) return node;
    }
  }
  return null;
}
