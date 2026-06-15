import Tooltip from './Tooltip';
import { BOSS_SKILLS, INTENT_ICONS, ATTACK_INTENTS } from '../game/constants';

export default function Enemy({
  enemy: e,
  index: i,
  animState,
  isTargetingMode,
  selectedAttackTarget,
  executeAttack,
  selectedCard,
  dragOverEnemy,
  isDragAttackMode,
}) {
  const bossSkills = BOSS_SKILLS[e.name];
  const isSelectedTarget = selectedAttackTarget === i;
  const isDragTarget = isDragAttackMode && dragOverEnemy === i;

  const intentData = e.nextIntent;
  const intentIconKey = intentData?.iconKey || (intentData?.type === 'skill' ? 'attack' : 'attack');
  const intentConfig = INTENT_ICONS[intentIconKey] || INTENT_ICONS.attack;
  const isAttackIntent = intentData && ATTACK_INTENTS.has(intentIconKey);
  const intentDamage = intentData?.damage || 0;
  const isChargeIntent = intentIconKey === 'charge';

  const bossSkillList = Array.isArray(bossSkills) ? bossSkills : (bossSkills ? [bossSkills] : []);

  const enemyTooltip = (
    <div>
      <div style={{ fontWeight: 700, fontSize: "var(--font-md)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><img src={e.image} alt="" style={{ width: "clamp(18px, 3vw, 24px)", height: "clamp(18px, 3vw, 24px)" }} /> {e.name}</div>
      <div style={{ color: "#ef4444" }}>🐾 攻击力: {e.atk}</div>
      <div style={{ color: "#22c55e" }}>❤ 生命值: {e.hp}/{e.maxHp}</div>
      {(e.armor || 0) > 0 && <div style={{ color: "#78909c" }}>🛡 护甲: {e.armor}</div>}
      {e.poison > 0 && <div style={{ color: "#8bc34a" }}>🧪 中毒: {e.poison}层</div>}
      {e.frozen > 0 && <div style={{ color: "#4fc3f7" }}>❄ 冻结: {e.frozen}回合</div>}
      {bossSkillList.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ color: "#fbbf24", fontSize: "var(--font-xs)", marginBottom: 4 }}>⚡ Boss技能</div>
          {bossSkillList.map((sk, idx) => (
            <div key={idx} style={{ marginBottom: 3 }}>
              <span style={{ color: "#fff", fontSize: "var(--font-sm)" }}>{sk.emoji} {sk.name}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 6, color: "#fbbf24", fontSize: "var(--font-xs)" }}>
        {e.frozen > 0 ? "❄️ 这回合动不了" :
         intentData?.type === 'skill' && intentData?.skill ?
           `${intentData.skill.emoji} 准备使用${intentData.skill.name}！` :
         isChargeIntent ? "⚡ 正在蓄力..." :
         "⚔️ 准备普通攻击"}
      </div>
    </div>
  );

  const enemyContent = (
    <div
      key={i}
      onClick={() => {
        if (isTargetingMode && e.hp > 0) {
          executeAttack(selectedCard, i);
        }
      }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4,
        cursor: (isTargetingMode || isDragAttackMode) && e.hp > 0 ? "crosshair" : "default",
        opacity: (isTargetingMode || isDragAttackMode) && e.hp <= 0 ? 0.5 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {/* === 敌人图片容器 (relative, 包含intent和target overlay) === */}
      <div style={{
        position: "relative",
        transform: isDragTarget ? "scale(1.15)" : isSelectedTarget ? "scale(1.1)" : "scale(1)",
        transition: "all 0.2s ease",
        outline: isDragTarget ? "3px solid #ef4444" : "none",
        outlineOffset: "8px",
        borderRadius: "8px",
      }}>
        {/* 意图预示图标 (absolute on image top) */}
        {intentData && e.hp > 0 && e.frozen <= 0 && (
          <div
            className="enemy-intent"
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%) translateY(-100%)',
              display: 'flex',
              gap: 4,
              zIndex: 30,
              animation: 'intentFloat 2s ease-in-out infinite',
            }}
          >
            <div style={{
              background: intentConfig.color + '33',
              border: `2px solid ${intentConfig.color}`,
              borderRadius: 8,
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              animation: isChargeIntent ? 'intentPulse 1s ease-in-out infinite' : 'none',
              transition: 'opacity 0.4s ease',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: "var(--intent-icon-size)" }}>{intentConfig.icon}</span>
              {isAttackIntent && intentDamage > 0 && (
                <span style={{
                  color: intentDamage > 10 ? '#ef4444' : intentDamage > 5 ? '#fbbf24' : '#fff',
                  fontWeight: 'bold',
                  fontSize: "var(--intent-dmg-font)",
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}>{intentDamage}</span>
              )}
              {isChargeIntent && intentData?.chargeTurnsLeft != null && (
                <span style={{
                  color: '#eab308',
                  fontWeight: 'bold',
                  fontSize: "clamp(10px, 1.8vw, 13px)",
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}>{intentData.chargeTurnsLeft}</span>
              )}
              {intentData?.type === 'skill' && !isAttackIntent && !isChargeIntent && intentData?.skill && (
                <span style={{
                  color: intentConfig.color,
                  fontWeight: 'bold',
                  fontSize: "var(--font-xs)",
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}>{intentData.skill.name}</span>
              )}
            </div>
          </div>
        )}

        {/* 目标选择/拖拽攻击指示器 (覆盖在图片中央) */}
        {isTargetingMode && e.hp > 0 && !isDragAttackMode && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(20px, 4vw, 32px)", animation: "pulse 0.8s ease-in-out infinite",
            color: isSelectedTarget ? "#fbbf24" : "#ef4444",
            fontWeight: 700, textShadow: "0 0 10px currentColor",
            zIndex: 100,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}>
            {isSelectedTarget ? "✦ 目标" : "✧ 点击"}
          </div>
        )}
        {isDragTarget && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(18px, 3vw, 28px)",
            color: "#ef4444",
            fontWeight: 900, textShadow: "0 0 15px #ef4444, 0 0 30px rgba(239,68,68,0.5)",
            zIndex: 100,
            pointerEvents: "none",
            animation: "pulse 0.5s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}>
            🐾 攻击！
          </div>
        )}
        {isDragTarget && (
          <div style={{
            position: "absolute", inset: -15,
            borderRadius: "50%",
            border: "3px solid rgba(239, 68, 68, 0.6)",
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.2)",
            animation: "pulse 0.8s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: -1,
          }} />
        )}

        {/* 攻击动画特效 */}
        {animState === 'attack' && (
          <div style={{
            position: "absolute",
            left: -40,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(22px, 5vw, 36px)",
            animation: "enemyAttackSwipe 0.4s ease-out",
            pointerEvents: "none",
            zIndex: 100,
          }}>
            ⚔️
          </div>
        )}

        {/* 敌人图片 */}
        <div
          style={{
            maxWidth: "clamp(20vh, 30vh, 35vh)",
            maxHeight: "clamp(20vh, 30vh, 35vh)",
            aspectRatio: "1/1",
            position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            ...(animState === 'attack' ? {
              animation: 'enemyAttackLunge 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
            } : animState === 'hit' ? {
              animation: 'enemyHitRecoil 0.4s ease-out forwards',
            } : {
              transform: "scale(1)",
              animation: `floatEnemy${i} 3s ease-in-out infinite`,
              transition: "all 0.2s ease-out",
            }),
            filter: animState === 'hit' ? "brightness(0.7) sepia(0.3)" : "none",
          }}
        >
          <img src={e.image} alt={e.name} style={{
            width: "100%", height: "100%",
            filter: e.frozen > 0 ? "hue-rotate(180deg) brightness(1.2)" : "none",
            animation: e.hp < e.maxHp * 0.3 && animState !== 'attack' ? "shake 0.5s ease-in-out infinite" : "none",
            objectFit: "contain",
          }} />
          {animState === 'hit' && (
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)",
              animation: "enemyHitFlash 0.35s ease-out forwards",
              pointerEvents: "none",
              borderRadius: 8,
            }} />
          )}
        </div>
      </div>

      {/* === 名字 + 状态栏 (flex items below image, no absolute) === */}
      <div className="enemy-name" style={{
        fontSize: "var(--font-lg)",
        fontWeight: 800,
        color: "#fff",
        textShadow: "0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)",
        letterSpacing: 1,
        whiteSpace: "nowrap",
        textAlign: "center",
      }}>
        {e.name}
      </div>

      {/* 血条 + 攻击力 + 状态 (horizontal row below name) */}
      <div className="enemy-stats" style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--gap-sm)",
      }}>
        {/* 血条 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.8)",
          padding: "clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 10px)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}>
          <span style={{ fontSize: "var(--font-xs)", color: "#ef4444" }}>❤️</span>
          <div style={{ width: "var(--enemy-hp-width)", height: 5, background: "rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.max(0, (e.hp / e.maxHp) * 100)}%`,
              background: e.hp < e.maxHp * 0.3 ? "#ef4444" : "#22c55e",
              borderRadius: 3, transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: "clamp(7px, 1.2vw, 9px)", color: "#fff", fontWeight: 700, minWidth: "clamp(20px, 4vw, 30px)", textAlign: "right" }}>
            {e.hp}/{e.maxHp}
          </span>
        </div>

        {/* 攻击力 */}
        <div style={{
          width: "var(--enemy-atk-orb)", height: "var(--enemy-atk-orb)", borderRadius: "50%",
          background: e.frozen > 0 ? "#4fc3f7" : "linear-gradient(135deg, #ef4444, #dc2626)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "clamp(12px, 2.2vw, 16px)", fontWeight: 800, color: "#fff",
          boxShadow: "0 3px 10px rgba(0,0,0,0.4)",
          border: "2px solid rgba(255,255,255,0.4)",
          flexShrink: 0,
        }}>
          {e.atk}
        </div>

        {/* 状态图标 */}
        {(e.armor > 0 || e.poison > 0 || e.frozen > 0) && (
          <div style={{
            display: "flex", gap: 4, alignItems: "center",
            background: "rgba(0,0,0,0.7)", padding: "3px 6px", borderRadius: 8,
          }}>
            {e.armor > 0 && <span style={{ fontSize: "clamp(7px, 1.2vw, 9px)", color: "#94a3b8" }}>🛡{e.armor}</span>}
            {e.poison > 0 && <span style={{ fontSize: "clamp(7px, 1.2vw, 9px)", color: "#8bc34a" }}>🧪{e.poison}</span>}
            {e.frozen > 0 && <span style={{ fontSize: "clamp(7px, 1.2vw, 9px)", color: "#4fc3f7" }}>❄{e.frozen}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return <Tooltip content={enemyTooltip} enemyIdx={i}>{enemyContent}</Tooltip>;
}
