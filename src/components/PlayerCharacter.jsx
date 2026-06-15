import { StatusIndicators } from '../effects/StatusEffects';
import { useDelayedHp, useArmorBounce } from '../hooks/usePlayerEffects';

export default function PlayerCharacter({
  player,
  energy,
  maxEnergy = 3,
  attackBuff,
  playerAnim,
  act = 0,
  relics = [],
  characterName = "小雪",
  characterImage = "/images/站立雪纳瑞.png",
}) {
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const isLowHp = player.hp < player.maxHp * 0.3;
  const isEnergyDepleted = energy <= 0;
  const delayedPercent = useDelayedHp(player.hp, player.maxHp);
  const armorBounce = useArmorBounce(player.armor);

  const getAnimFilter = () => {
    switch (playerAnim) {
      case 'defend':
        return 'brightness(1.2) hue-rotate(200deg)';
      case 'heal':
        return 'brightness(1.15) saturate(1.5) hue-rotate(80deg)';
      case 'hit':
        return 'brightness(0.7) sepia(0.3)';
      default:
        return 'none';
    }
  };

  const isAnimating = playerAnim === 'attack' || playerAnim === 'hit' || playerAnim === 'defend' || playerAnim === 'heal';

  const getAnimStyle = () => {
    if (playerAnim === 'attack') {
      return {
        animation: 'playerAttackLunge 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
      };
    }
    if (playerAnim === 'hit') {
      return {
        animation: 'playerHitRecoil 0.4s ease-out forwards',
      };
    }
    const staticTransforms = {
      defend: 'scale(0.9)',
      heal: 'translateY(-10px)',
    };
    return {
      transform: staticTransforms[playerAnim] || 'scale(1)',
      animation: isAnimating ? 'none' : 'playerFloat 3s ease-in-out infinite',
      transition: 'all 0.3s ease-out',
    };
  };

  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: "var(--gap-sm)",
        position: 'relative',
        padding: "clamp(6px, 1.5vw, 10px)",
      }}>
        {/* Buff 图标区（主角上方） */}
        <div style={{
          display: 'flex',
          gap: "var(--gap-sm)",
          alignItems: 'center',
          minHeight: "clamp(16px, 3vw, 24)",
          justifyContent: 'center',
        }}>
          {attackBuff > 0 && (
            <div
              title={`攻击增益 +${attackBuff}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                animation: 'buffFadeIn 0.3s ease-out',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: "var(--font-sm)" }}>⚔️</span>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: '#fca5a5' }}>+{attackBuff}</span>
            </div>
          )}
        </div>

        {/* 防御时蓝色光盾 */}
        {playerAnim === 'defend' && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '45%',
            width: "clamp(80px, 15vw, 120px)",
            height: "clamp(80px, 15vw, 120px)",
            borderRadius: '50%',
            border: '3px solid rgba(96,165,250,0.8)',
            background: 'rgba(59,130,246,0.15)',
            animation: 'defendShieldFlash 0.5s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}

        {/* 主角立绘区域 */}
        <div style={{
          width: 'var(--player-size)',
          height: 'var(--player-size)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          filter: getAnimFilter(),
          ...getAnimStyle(),
        }}>
          <img
            src={characterImage}
            alt={characterName}
            draggable="false"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scaleX(-1)',
              filter: isLowHp && !isAnimating ? 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' : 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* 名称标签 */}
          <div style={{
            position: 'absolute',
            top: "clamp(-18px, -3vw, -24px)",
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(14px, 2vw, 18px)',
            fontWeight: 800,
            color: '#DEB887',
            textShadow: '0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)',
            letterSpacing: 1,
            zIndex: 20,
            whiteSpace: 'nowrap',
          }}>
            {characterName} Lv.{act + 1}
          </div>
        </div>

        {/* HP 条 */}
        <div style={{
          width: 'var(--hp-bar-width)',
          position: 'relative',
        }}>
          <div style={{
            width: '100%',
            height: "var(--hp-bar-height)",
            background: '#1a1a2e',
            borderRadius: 3,
            border: '2px solid #000',
            overflow: 'hidden',
            position: 'relative',
            ...(isLowHp ? { animation: 'hpPulse 1.2s ease-in-out infinite' } : {}),
          }}>
            {/* 延迟减少条（暗红色） */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              height: '100%',
              width: `${delayedPercent}%`,
              background: '#7f1d1d',
              borderRadius: 2,
              transition: 'width 0.8s ease-out 0.3s',
            }} />
            {/* 当前 HP 填充 */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              height: '100%',
              width: `${hpPercent}%`,
              background: isLowHp
                ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                : 'linear-gradient(90deg, #22c55e, #4ade80)',
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }} />
            {/* HP 数字居中 */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: "clamp(7px, 1.2vw, 9px)",
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              lineHeight: 1,
              zIndex: 2,
            }}>
              {player.hp}/{player.maxHp}
            </div>
          </div>
        </div>

        {/* 护甲 + 状态图标 */}
        <div style={{
          display: 'flex',
          gap: "var(--gap-sm)",
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: "clamp(14px, 2.5vw, 20px)",
        }}>
          {player.armor > 0 && (
            <div
              title={`护甲 ${player.armor}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                animation: armorBounce ? 'armorBounce 0.4s ease-out' : 'none',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: "var(--font-sm)" }}>🛡️</span>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: '#93c5fd' }}>{player.armor}</span>
            </div>
          )}
          <StatusIndicators />
        </div>

        {/* 能量宝珠 */}
        <div
          title={`能量 ${energy}/${maxEnergy}`}
          style={{
            width: "var(--energy-orb-size)",
            height: "var(--energy-orb-size)",
            borderRadius: '50%',
            background: isEnergyDepleted
              ? 'radial-gradient(circle at 40% 35%, #4b5563, #1f2937)'
              : 'radial-gradient(circle at 40% 35%, #60a5fa, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: "var(--energy-orb-font)",
            fontWeight: 800,
            color: isEnergyDepleted ? '#6b7280' : '#fff',
            border: isEnergyDepleted
              ? '2px solid #374151'
              : '2px solid #93c5fd',
            textShadow: isEnergyDepleted ? 'none' : '0 0 8px rgba(59,130,246,0.6)',
            boxShadow: isEnergyDepleted
              ? '0 2px 6px rgba(0,0,0,0.3)'
              : '0 0 10px #3b82f6',
            animation: isEnergyDepleted ? 'none' : 'energyGlow 2s ease-in-out infinite',
            cursor: 'default',
            transition: 'all 0.3s ease',
            flexShrink: 0,
          }}
        >
          {energy}
        </div>


        {relics.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 'var(--hp-bar-width)',
          }}>
            {relics.map(r => (
              <div key={r.id} title={`${r.name}: ${r.desc}`} style={{
                fontSize: "clamp(14px, 3vw, 20px)",
                width: "clamp(22px, 5vw, 30px)",
                height: "clamp(22px, 5vw, 30px)",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
                border: r.rarity === 'rare' ? '1px solid #fbbf24' : r.rarity === 'uncommon' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                cursor: 'default',
              }}>
                {r.icon}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}