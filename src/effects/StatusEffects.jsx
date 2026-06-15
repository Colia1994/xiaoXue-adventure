/**
 * 状态效果视觉系统
 * - useStatusEffects() hook：管理 Buff 获得动画
 * - BuffGainLayer：渲染 Buff 获得时的光圈+浮动文字
 * - StatusIndicators：主角区域持续状态图标
 * - EnemyStatusOverlay：敌人持续状态覆盖层（毒雾/冰霜/漩涡）
 */
import { useState, useCallback, useRef } from "react";

// ============================================================
// CSS 关键帧
// ============================================================
const STATUS_EFFECT_CSS = `
  /* Buff 光圈扩散 */
  @keyframes buffRing {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
  }

  /* 护甲光盾弹出 */
  @keyframes shieldPop {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    40% { transform: translate(-50%, -50%) scale(1.25); opacity: 0.85; }
    100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
  }

  /* 浮动文字上升 */
  @keyframes buffFloatUp {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    15% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
    30% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    70% { opacity: 1; }
    100% { transform: translate(-50%, calc(-50% - 60px)) scale(0.9); opacity: 0; }
  }

  /* 治疗心形粒子 */
  @keyframes healHeartFloat {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
    20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
    50% { opacity: 0.8; }
    100% { transform: translate(calc(-50% + var(--hx)), calc(-50% - 50px)) scale(0.7); opacity: 0; }
  }

  /* === 敌人状态覆盖层动画 === */

  /* 毒雾浮动 */
  @keyframes poisonFog {
    0%, 100% { opacity: 0.25; transform: translateY(0); }
    50% { opacity: 0.45; transform: translateY(-4px); }
  }

  /* 毒气泡上升 */
  @keyframes poisonBubble {
    0% { transform: translateY(0) scale(1); opacity: 0.7; }
    100% { transform: translateY(-35px) scale(0.4); opacity: 0; }
  }

  /* 冰霜闪烁 */
  @keyframes frostShimmer {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.5; }
  }

  /* 冰晶粒子飘动 */
  @keyframes iceCrystal {
    0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
    100% { transform: translateY(-20px) rotate(180deg); opacity: 0; }
  }

  /* 困惑漩涡旋转 */
  @keyframes confuseSpin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  /* 状态指示器弹入 */
  @keyframes indicatorPopIn {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  /* 状态指示器值变化弹跳 */
  @keyframes indicatorBounce {
    0% { transform: scale(1); }
    40% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
`;

// ============================================================
// 类型配置
// ============================================================
const BUFF_CONFIG = {
  attack: {
    ringColor: "rgba(239, 68, 68, 0.6)",
    ringBorder: "3px solid rgba(255, 180, 50, 0.8)",
    ringSize: "clamp(60px, 15vw, 90px)",
    ringAnim: "buffRing 0.6s ease-out forwards",
    textColor: "#fbbf24",
    textShadow: "0 0 8px rgba(251,191,36,0.7), 0 2px 4px rgba(0,0,0,0.8)",
    label: "攻击",
    icon: "⚔️",
  },
  armor: {
    ringColor: "rgba(59, 130, 246, 0.35)",
    ringBorder: "3px solid rgba(96, 165, 250, 0.7)",
    ringSize: "clamp(65px, 17vw, 100px)",
    ringAnim: "shieldPop 0.8s ease-out forwards",
    textColor: "#93c5fd",
    textShadow: "0 0 8px rgba(96,165,250,0.6), 0 2px 4px rgba(0,0,0,0.8)",
    label: "护甲",
    icon: "🛡️",
  },
  heal: {
    ringColor: "transparent",
    ringBorder: "none",
    ringSize: null,
    ringAnim: "none",
    textColor: "#4ade80",
    textShadow: "0 0 8px rgba(74,222,128,0.6), 0 2px 4px rgba(0,0,0,0.8)",
    label: "治疗",
    icon: "💚",
  },
  energy: {
    ringColor: "rgba(251, 191, 36, 0.3)",
    ringBorder: "3px solid rgba(251, 191, 36, 0.6)",
    ringSize: "clamp(45px, 12vw, 70px)",
    ringAnim: "buffRing 0.5s ease-out forwards",
    textColor: "#fbbf24",
    textShadow: "0 0 8px rgba(251,191,36,0.6), 0 2px 4px rgba(0,0,0,0.8)",
    label: "能量",
    icon: "⚡",
  },
};

// ============================================================
// Buff 获得动画 — 单个效果
// ============================================================
function BuffGainEffect({ effect }) {
  const cfg = BUFF_CONFIG[effect.type] || BUFF_CONFIG.attack;

  return (
    <div style={{ position: "fixed", left: effect.x, top: effect.y, pointerEvents: "none", zIndex: 9990 }}>
      {/* 光圈/光盾 */}
      {cfg.ringSize && (
        <div style={{
          position: "absolute",
          width: cfg.ringSize,
          height: cfg.ringSize,
          borderRadius: "50%",
          background: cfg.ringColor,
          border: cfg.ringBorder,
          animation: cfg.ringAnim,
          boxShadow: effect.type === "armor"
            ? "0 0 30px rgba(59,130,246,0.5), inset 0 0 15px rgba(96,165,250,0.3)"
            : effect.type === "attack"
              ? "0 0 25px rgba(239,68,68,0.5), inset 0 0 12px rgba(255,180,50,0.3)"
              : "0 0 20px rgba(251,191,36,0.4)",
        }} />
      )}

      {/* 治疗心形粒子 */}
      {effect.type === "heal" && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              position: "absolute",
              fontSize: 18 + Math.random() * 8,
              animation: `healHeartFloat ${0.7 + i * 0.1}s ease-out forwards`,
              animationDelay: `${i * 0.08}s`,
              opacity: 0,
              filter: "drop-shadow(0 0 4px rgba(74,222,128,0.6))",
              // 每个心形水平偏移不同
              // CSS custom property for horizontal drift
              "--hx": `${(i - 2) * 18}px`,
            }}>
              💚
            </div>
          ))}
        </>
      )}

      {/* 浮动文字 */}
      <div style={{
        position: "absolute",
        color: cfg.textColor,
        fontSize: "clamp(16px, 4vw, 22px)",
        fontWeight: 900,
        textShadow: cfg.textShadow,
        whiteSpace: "nowrap",
        animation: "buffFloatUp 1s ease-out forwards",
        letterSpacing: 1,
      }}>
        +{effect.value} {cfg.icon} {cfg.label}
      </div>
    </div>
  );
}

// ============================================================
// Buff 获得动画层
// ============================================================
export function BuffGainLayer({ effects }) {
  return (
    <>
      {effects.map((ef) => (
        <BuffGainEffect key={ef.id} effect={ef} />
      ))}
      <style>{STATUS_EFFECT_CSS}</style>
    </>
  );
}

// ============================================================
// useStatusEffects hook
// ============================================================
export function useStatusEffects() {
  const [buffEffects, setBuffEffects] = useState([]);
  const idRef = useRef(0);

  const triggerBuffGain = useCallback((type, value, position) => {
    const id = ++idRef.current;
    const effect = {
      id,
      type, // 'attack' | 'armor' | 'heal' | 'energy'
      value,
      x: position.x,
      y: position.y,
      timestamp: Date.now(),
    };
    setBuffEffects((prev) => [...prev, effect]);
    // 动画结束后清除
    setTimeout(() => {
      setBuffEffects((prev) => prev.filter((e) => e.id !== id));
    }, 1100);
  }, []);

  return { buffEffects, triggerBuffGain };
}

// ============================================================
// StatusIndicators — 主角区域持续状态图标
// ============================================================
export function StatusIndicators({ attackBuff, armor, poison, frozen }) {
  const indicators = [];

  if (attackBuff > 0) {
    indicators.push({
      key: "attackBuff",
      icon: "⚔️",
      value: attackBuff,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.2)",
      borderColor: "rgba(239, 68, 68, 0.5)",
      label: `攻击增益：下次攻击 +${attackBuff} 伤害`,
    });
  }

  if (armor > 0) {
    indicators.push({
      key: "armor",
      icon: "🛡️",
      value: armor,
      color: "#60a5fa",
      bgColor: "rgba(59, 130, 246, 0.2)",
      borderColor: "rgba(59, 130, 246, 0.5)",
      label: `护甲：抵挡 ${armor} 点伤害`,
    });
  }

  if (poison > 0) {
    indicators.push({
      key: "poison",
      icon: "🧪",
      value: poison,
      color: "#8bc34a",
      bgColor: "rgba(139, 195, 74, 0.2)",
      borderColor: "rgba(139, 195, 74, 0.5)",
      label: `中毒：每回合失去 ${poison} HP`,
    });
  }

  if (frozen > 0) {
    indicators.push({
      key: "frozen",
      icon: "❄️",
      value: frozen,
      color: "#4fc3f7",
      bgColor: "rgba(79, 195, 247, 0.2)",
      borderColor: "rgba(79, 195, 247, 0.5)",
      label: `冻结：无法行动 ${frozen} 回合`,
    });
  }

  if (indicators.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      gap: "var(--gap-sm)",
      justifyContent: "center",
      marginTop: "var(--gap-sm)",
    }}>
      {indicators.map((ind) => (
        <div
          key={ind.key}
          title={ind.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--gap-sm)",
            background: ind.bgColor,
            border: `1px solid ${ind.borderColor}`,
            borderRadius: 10,
            padding: "clamp(1px, 0.3vw, 2px) clamp(4px, 1vw, 8px)",
            fontSize: "var(--font-xs)",
            color: ind.color,
            fontWeight: 700,
            cursor: "default",
            animation: "indicatorPopIn 0.3s ease-out",
            textShadow: `0 0 6px ${ind.borderColor}`,
            boxShadow: `0 0 8px ${ind.bgColor}`,
          }}
        >
          <span style={{ fontSize: "var(--font-sm)" }}>{ind.icon}</span>
          <span>{ind.value}</span>
        </div>
      ))}
      <style>{STATUS_EFFECT_CSS}</style>
    </div>
  );
}

// ============================================================
// EnemyStatusOverlay — 敌人持续状态覆盖层
// ============================================================
function PoisonOverlay() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 5,
    }}>
      {/* 毒雾渐变 */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(76,175,80,0.15) 0%, rgba(139,195,74,0.25) 50%, rgba(76,175,80,0.1) 100%)",
        animation: "poisonFog 3s ease-in-out infinite",
        borderRadius: "inherit",
      }} />
      {/* 毒气泡 */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{
          position: "absolute",
          width: 6 + i * 2,
          height: 6 + i * 2,
          borderRadius: "50%",
          background: "rgba(139, 195, 74, 0.6)",
          left: `${20 + i * 18}%`,
          bottom: `${10 + i * 8}%`,
          animation: `poisonBubble ${2 + i * 0.5}s ease-out infinite`,
          animationDelay: `${i * 0.6}s`,
          boxShadow: "0 0 4px rgba(139,195,74,0.4)",
        }} />
      ))}
    </div>
  );
}

function FrozenOverlay() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 5,
    }}>
      {/* 冰霜渐变 */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(79,195,247,0.2) 0%, rgba(144,202,249,0.3) 40%, rgba(79,195,247,0.15) 100%)",
        animation: "frostShimmer 2.5s ease-in-out infinite",
        borderRadius: "inherit",
      }} />
      {/* 冰霜纹理 — 半透明条纹 */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 8px,
          rgba(200,230,255,0.08) 8px,
          rgba(200,230,255,0.08) 10px
        )`,
        borderRadius: "inherit",
      }} />
      {/* 冰晶粒子 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          position: "absolute",
          fontSize: 8 + (i % 3) * 3,
          left: `${15 + i * 16}%`,
          top: `${20 + (i % 3) * 20}%`,
          animation: `iceCrystal ${2.5 + i * 0.3}s ease-out infinite`,
          animationDelay: `${i * 0.4}s`,
          opacity: 0.7,
          filter: "drop-shadow(0 0 3px rgba(79,195,247,0.8))",
        }}>
          ❄
        </div>
      ))}
    </div>
  );
}

function ConfusedOverlay() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 5,
    }}>
      {/* 紫色漩涡 */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "80%",
        height: "80%",
        borderRadius: "50%",
        border: "3px dashed rgba(168, 85, 247, 0.5)",
        animation: "confuseSpin 3s linear infinite",
        boxShadow: "0 0 15px rgba(168,85,247,0.3), inset 0 0 10px rgba(168,85,247,0.15)",
      }} />
      {/* 困惑符号 */}
      <div style={{
        position: "absolute",
        top: 5,
        right: 5,
        fontSize: "var(--font-lg)",
        animation: "frostShimmer 1.5s ease-in-out infinite",
        filter: "drop-shadow(0 0 4px rgba(168,85,247,0.6))",
      }}>
        🌀
      </div>
    </div>
  );
}

export function EnemyStatusOverlay({ poison, frozen, confused }) {
  const hasAny = (poison > 0) || (frozen > 0) || confused;
  if (!hasAny) return null;

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      borderRadius: "8px",
      overflow: "hidden",
      pointerEvents: "none",
    }}>
      {poison > 0 && <PoisonOverlay />}
      {frozen > 0 && <FrozenOverlay />}
      {confused && <ConfusedOverlay />}
      <style>{STATUS_EFFECT_CSS}</style>
    </div>
  );
}
