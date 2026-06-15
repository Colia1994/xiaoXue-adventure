/**
 * 伤害飘字组件（美化版）
 * 数字弹出时有弹性缩放，然后上浮淡出，带左右摇摆
 * 使用 CSS animation 实现全部动画，避免 JS 计时器
 */
import { useState, useCallback, useRef } from "react";

// 样式配置 — 每种类型独立配色、字号、描边
const TYPE_STYLES = {
  normal: {
    color: "#fff8dc",
    fontSize: "clamp(18px, 4vw, 26px)",
    fontWeight: 900,
    textShadow:
      "0 0 2px #000, 0 0 4px #000, 0 0 6px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 2px 4px rgba(255,50,50,0.5)",
    animation: "dmgFloatNormal 1s cubic-bezier(.25,.46,.45,.94) forwards",
  },
  crit: {
    color: "#ffd700",
    fontSize: "clamp(28px, 6vw, 44px)",
    fontWeight: 900,
    textShadow:
      "0 0 2px #000, 0 0 4px #000, 0 0 8px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,150,0,0.5)",
    animation: "dmgFloatCrit 1.2s cubic-bezier(.25,.46,.45,.94) forwards",
  },
  heal: {
    color: "#4ade80",
    fontSize: "clamp(20px, 4.5vw, 28px)",
    fontWeight: 900,
    textShadow:
      "0 0 2px #000, 0 0 4px #000, 0 0 6px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 12px rgba(74,222,128,0.6), 0 0 24px rgba(34,197,94,0.3)",
    animation: "dmgFloatHeal 1s cubic-bezier(.25,.46,.45,.94) forwards",
  },
  mutation: {
    color: "transparent",
    fontSize: "clamp(30px, 7vw, 48px)",
    fontWeight: 900,
    backgroundImage: "linear-gradient(135deg, #c084fc, #f472b6, #fbbf24, #34d399, #60a5fa, #c084fc)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "none",
    filter: "drop-shadow(0 0 6px #000) drop-shadow(0 0 12px rgba(192,132,252,0.8)) drop-shadow(0 0 24px rgba(244,114,182,0.6))",
    animation: "dmgFloatMutation 1.3s cubic-bezier(.25,.46,.45,.94) forwards",
  },
  buffed: {
    color: "#fbbf24",
    fontSize: "clamp(20px, 4.5vw, 30px)",
    fontWeight: 900,
    textShadow:
      "0 0 2px #000, 0 0 4px #000, 0 0 8px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 16px rgba(251,191,36,0.7), 0 0 32px rgba(239,68,68,0.4)",
    animation: "dmgFloatCrit 1.2s cubic-bezier(.25,.46,.45,.94) forwards",
  },
};

// 动画关键帧
const CSS_ANIMATIONS = `
  /* 普通伤害：弹性弹出 → 上浮摇摆 → 淡出 */
  @keyframes dmgFloatNormal {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
    12%  { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
    24%  { transform: translate(-50%, -50%) scale(0.95); }
    36%  { transform: translate(-50%, -50%) scale(1.05); }
    48%  { transform: translate(-50%, calc(-50% - 10px)) scale(1); }
    60%  { transform: translate(calc(-50% + 6px), calc(-50% - 25px)) scale(1); }
    72%  { transform: translate(calc(-50% - 5px), calc(-50% - 40px)) scale(1); opacity: 1; }
    84%  { transform: translate(calc(-50% + 4px), calc(-50% - 55px)) scale(0.95); opacity: 0.7; }
    100% { transform: translate(-50%, calc(-50% - 70px)) scale(0.9); opacity: 0; }
  }

  /* 暴击：更大弹性 + 更强摇摆 */
  @keyframes dmgFloatCrit {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
    10%  { opacity: 1; transform: translate(-50%, -50%) scale(1.6); }
    20%  { transform: translate(-50%, -50%) scale(0.9); }
    30%  { transform: translate(-50%, -50%) scale(1.15); }
    40%  { transform: translate(-50%, -50%) scale(1); }
    50%  { transform: translate(calc(-50% + 8px), calc(-50% - 15px)) scale(1); }
    60%  { transform: translate(calc(-50% - 7px), calc(-50% - 30px)) scale(1); }
    70%  { transform: translate(calc(-50% + 6px), calc(-50% - 45px)) scale(1); opacity: 1; }
    80%  { transform: translate(calc(-50% - 4px), calc(-50% - 58px)) scale(0.95); opacity: 0.8; }
    90%  { transform: translate(calc(-50% + 3px), calc(-50% - 68px)) scale(0.9); opacity: 0.4; }
    100% { transform: translate(-50%, calc(-50% - 80px)) scale(0.85); opacity: 0; }
  }

  /* 治疗：柔和弹出 + 上浮 */
  @keyframes dmgFloatHeal {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
    15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
    28%  { transform: translate(-50%, -50%) scale(0.95); }
    40%  { transform: translate(-50%, -50%) scale(1.05); }
    50%  { transform: translate(-50%, calc(-50% - 10px)) scale(1); }
    62%  { transform: translate(calc(-50% + 5px), calc(-50% - 25px)) scale(1); }
    74%  { transform: translate(calc(-50% - 4px), calc(-50% - 40px)) scale(1); opacity: 1; }
    86%  { transform: translate(calc(-50% + 3px), calc(-50% - 52px)) scale(0.95); opacity: 0.6; }
    100% { transform: translate(-50%, calc(-50% - 65px)) scale(0.9); opacity: 0; }
  }

  /* 组合技：彩虹渐变 + 大幅弹跳 + 摇摆 */
  @keyframes dmgFloatMutation {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.1) rotate(-5deg); }
    8%   { opacity: 1; transform: translate(-50%, -50%) scale(1.7) rotate(3deg); }
    16%  { transform: translate(-50%, -50%) scale(0.85) rotate(-2deg); }
    24%  { transform: translate(-50%, -50%) scale(1.2) rotate(1deg); }
    32%  { transform: translate(-50%, -50%) scale(0.98) rotate(0deg); }
    40%  { transform: translate(-50%, calc(-50% - 8px)) scale(1); }
    50%  { transform: translate(calc(-50% + 10px), calc(-50% - 20px)) scale(1.02); }
    60%  { transform: translate(calc(-50% - 8px), calc(-50% - 35px)) scale(1); opacity: 1; }
    72%  { transform: translate(calc(-50% + 7px), calc(-50% - 48px)) scale(0.98); opacity: 0.8; }
    84%  { transform: translate(calc(-50% - 5px), calc(-50% - 60px)) scale(0.93); opacity: 0.5; }
    100% { transform: translate(-50%, calc(-50% - 75px)) scale(0.85); opacity: 0; }
  }
`;

function DamageNumber({ num }) {
  const style = TYPE_STYLES[num.type] || TYPE_STYLES.normal;
  const prefix = num.type === "heal" ? "+" : "-";
  const isMutation = num.type === "mutation";

  // mutation 类型不能同时用 textShadow 和 filter:drop-shadow + backgroundClip:text
  // 所以 mutation 走独立样式
  const baseStyle = isMutation
    ? {
        ...style,
      }
    : {
        ...style,
      };

  return (
    <div
      style={{
        position: "fixed",
        left: num.x,
        top: num.y,
        ...baseStyle,
        pointerEvents: "none",
        zIndex: 10000,
        userSelect: "none",
        whiteSpace: "nowrap",
        willChange: "transform, opacity",
        lineHeight: 1,
        letterSpacing: "-0.02em",
        animation: baseStyle.animation,
      }}
    >
      {prefix}{num.value}
      {num.type === "crit" && (
        <span style={{ fontSize: "0.5em", marginLeft: 2, fontWeight: 900 }}>!</span>
      )}
      {isMutation && (
        <span style={{ fontSize: "0.5em", marginLeft: 4 }}>✦</span>
      )}
      {num.type === "buffed" && num.buffAmount > 0 && (
        <span style={{ fontSize: "0.55em", marginLeft: 4, fontWeight: 700, color: "#fbbf24" }}>(+{num.buffAmount} buff)</span>
      )}
    </div>
  );
}

export function DamageNumbers({ numbers }) {
  return (
    <>
      {numbers.map((num) => (
        <DamageNumber key={num.id} num={num} />
      ))}
      <style>{CSS_ANIMATIONS}</style>
    </>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDamageNumbers() {
  const [numbers, setNumbers] = useState([]);
  const idRef = useRef(0);

  const addDamage = useCallback((value, x, y, type = "normal", buffAmount = 0) => {
    const id = ++idRef.current;
    // 随机偏移避免重叠，X轴偏移加大
    const offsetX = (Math.random() - 0.5) * 50;
    const offsetY = (Math.random() - 0.5) * 20;
    setNumbers((prev) => [
      ...prev,
      { id, value, x: x + offsetX, y: y + offsetY, type, buffAmount, timestamp: Date.now() },
    ]);
    // 1.5秒后自动清除（与动画时长匹配）
    setTimeout(() => {
      setNumbers((prev) => prev.filter((n) => n.id !== id));
    }, 1500);
  }, []);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    setNumbers((prev) => prev.filter((n) => now - n.timestamp < 1500));
  }, []);

  return { numbers, addDamage, clearExpired };
}
