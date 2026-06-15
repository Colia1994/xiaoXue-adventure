import { useDelayedHp, useArmorBounce } from '../hooks/usePlayerEffects';

export default function PlayerStatus({
  player,
  energy,
  maxEnergy = 3,
  attackBuff,
  deckCount,
  playerAnim,
  encounter = 0,
}) {
  const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
  const isLowHp = player.hp < player.maxHp * 0.3;
  const isEnergyDepleted = energy <= 0;
  const delayedPercent = useDelayedHp(player.hp, player.maxHp);
  const armorBounce = useArmorBounce(player.armor);

  // 获取玩家动画样式
  const getAnimStyle = () => {
    switch (playerAnim) {
      case 'attack':
        return { transform: 'translateX(10px) scale(1.03)', transition: 'transform 0.3s ease-out' };
      case 'defend':
        return { transform: 'scale(0.97)', filter: 'brightness(1.2)', transition: 'all 0.3s ease-out' };
      case 'heal':
        return { transform: 'translateY(-4px)', filter: 'brightness(1.15)', transition: 'all 0.3s ease-out' };
      case 'hit':
        return { transform: 'translateX(-6px)', filter: 'brightness(0.7)', transition: 'all 0.1s ease-out' };
      default:
        return { transition: 'all 0.3s ease-out' };
    }
  };

  return (
      <div style={{
        position: 'fixed',
        top: "clamp(8px, 2vw, 16px)",
        left: "clamp(8px, 2vw, 16px)",
        zIndex: 50,
        width: "clamp(140px, 22vw, 180px)",
        background: 'rgba(0,0,0,0.75)',
        borderRadius: 12,
        padding: "clamp(8px, 1.5vw, 12px)",
        display: 'flex',
        flexDirection: 'column',
        gap: "var(--gap-sm)",
        fontFamily: "'Segoe UI', 'PingFang SC', sans-serif",
        ...getAnimStyle(),
      }}>
        {/* === 头像 + 名称 + 等级 === */}
        <div style={{ display: 'flex', alignItems: 'center', gap: "clamp(4px, 1vw, 10px)" }}>
          <img
            src="/images/站立雪纳瑞.png"
            alt="小雪"
            style={{
              width: "clamp(28px, 5vw, 40px)",
              height: "clamp(28px, 5vw, 40px)",
              borderRadius: '50%',
              border: '2px solid #d4a017',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: "var(--font-md)", fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>小雪</div>
            <div style={{ fontSize: "var(--font-xs)", color: '#d4a017', lineHeight: 1.3 }}>Lv.{encounter + 1}</div>
          </div>
        </div>

        {/* === 血条 === */}
        <div style={{ position: 'relative' }}>
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
              top: 0,
              left: 0,
              height: '100%',
              width: `${delayedPercent}%`,
              background: '#7f1d1d',
              borderRadius: 2,
              transition: 'width 0.8s ease-out 0.3s',
            }} />
            {/* 当前 HP 填充 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${hpPercent}%`,
              background: 'linear-gradient(90deg, #dc2626, #ef4444)',
              borderRadius: 2,
              transition: 'width 0.5s ease',
            }} />
            {/* HP 数字居中 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: "clamp(7px, 1.2vw, 10px)",
              fontWeight: 700,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              lineHeight: 1,
              zIndex: 2,
            }}>
              {player.hp} / {player.maxHp}
            </div>
          </div>
        </div>

        {/* === Buff 图标区 === */}
        <div style={{ display: 'flex', gap: "var(--gap-sm)", alignItems: 'center', minHeight: "clamp(16px, 3vw, 24px)" }}>
          {attackBuff > 0 && (
            <div
              title={`攻击增益 +${attackBuff}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                animation: 'buffFadeIn 0.3s ease-out',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: "var(--font-md)" }}>⚔️</span>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: '#fca5a5' }}>+{attackBuff}</span>
            </div>
          )}
          {player.armor > 0 && (
            <div
              title={`护甲 ${player.armor}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                animation: armorBounce ? 'armorBounce 0.4s ease-out' : 'none',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: "var(--font-md)" }}>🛡️</span>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: '#93c5fd' }}>{player.armor}</span>
            </div>
          )}
        </div>

        {/* === 底部：能量宝珠 + 牌库 === */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* 牌库信息 */}
          <div style={{
            fontSize: "var(--font-xs)",
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: "var(--font-sm)" }}>🎴</span>
            <span>剩余 <b style={{ color: '#d1d5db' }}>{deckCount}</b> 张</span>
          </div>
        </div>
      </div>
  );
}
