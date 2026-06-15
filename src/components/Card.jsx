import Tooltip from './Tooltip';
import { calcCardEffect } from '../game/battleLogic';

const TYPE_COLORS = {
  attack: "#ef4444",
  defend: "#3b82f6",
  heal: "#22c55e",
  buff: "#f59e0b",
  skill: "#a855f7",
};

const TYPE_LABELS = {
  attack: "攻击",
  defend: "防御",
  heal: "治疗",
  buff: "能力",
  skill: "技能",
};

const TYPE_ICONS = {
  attack: "⚔️",
  defend: "🛡",
  heal: "💚",
  buff: "✨",
  skill: "🎯",
};

const TYPE_GRADIENTS = {
  attack: "linear-gradient(160deg, #4a1a1a 0%, #2d0e0e 40%, #1a0808 100%)",
  defend: "linear-gradient(160deg, #1a2d4a 0%, #0e1a2d 40%, #081020 100%)",
  heal:   "linear-gradient(160deg, #1a3d1a 0%, #0e2d0e 40%, #082008 100%)",
  buff:   "linear-gradient(160deg, #3d3a1a 0%, #2d2a0e 40%, #201e08 100%)",
  skill:  "linear-gradient(160deg, #2d1a4a 0%, #1a0e2d 40%, #100820 100%)",
};

const RARITY_COLORS = {
  common: "#9ca3af",
  uncommon: "#60a5fa",
  rare: "#fbbf24",
};

const RARITY_LABELS = {
  common: "普通",
  uncommon: "稀有",
  rare: "传说",
};

export default function Card({
  card,
  idx,
  clickable = false,
  selectedCard,
  draggingIdx,
  dragAttackCard,
  attackBuff,
  turnPhase,
  mouseDownIdxRef,
  mouseDownPosRef,
  hasDraggedRef,
  isTouchRef,
  setSelectedCard,
  onPlayNonAttack,
  energy = 99,
  drawAnim,
  drawDelay = 0,
  onDrawAnimEnd,
}) {
  const cardCost = card.cost ?? 1;
  const cantAfford = energy < cardCost;
  const isSelected = selectedCard === idx;

  const eff = calcCardEffect(card, attackBuff);
  const baseType = card.baseType || "attack";
  const rarity = card.rarity || "common";
  const typeColor = TYPE_COLORS[baseType] || TYPE_COLORS.attack;
  const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  const mainValue = baseType === "attack" ? eff.dmg :
                    baseType === "defend" ? eff.armor :
                    baseType === "heal" ? eff.heal : card.power;

  const tooltipContent = (
    <div style={{ maxWidth: "clamp(180px, 30vw, 240px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: "var(--font-lg)" }}>{TYPE_ICONS[baseType]}</span>
        <span style={{ fontWeight: 700, fontSize: "var(--font-md)", color: "#fff" }}>{card.name}</span>
        {card.upgraded && <span style={{ color: "#4ade80", fontSize: "var(--font-xs)" }}>+</span>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: "var(--font-xs)" }}>
        <span style={{ color: typeColor }}>{TYPE_LABELS[baseType]}</span>
        <span style={{ color: rarityColor }}>{RARITY_LABELS[rarity]}</span>
        <span style={{ color: "#6b7280" }}>费用:{cardCost}</span>
      </div>
      {mainValue > 0 && (
        <div style={{ color: typeColor, fontWeight: 600, marginBottom: 4, fontSize: "var(--font-sm)" }}>
          {baseType === "attack" ? `⚔ ${eff.dmg} 伤害` :
           baseType === "defend" ? `🛡 ${eff.armor} 护甲` :
           baseType === "heal" ? `💚 ${eff.heal} 回复` :
           `✨ ${card.power}`}
        </div>
      )}
      {card.desc && (
        <div style={{ fontSize: "var(--font-xs)", color: "#d4d4d4", lineHeight: 1.4 }}>
          {card.upgraded ? (card.upgradedDesc || card.desc) : card.desc}
        </div>
      )}
    </div>
  );

  const isDragging = draggingIdx === idx;

  const handleMouseDown = (e) => {
    if (!clickable || turnPhase !== "player" || cantAfford) return;
    if (e.button !== 0) return;
    isTouchRef.current = false;
    mouseDownIdxRef.current = idx;
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
  };

  const handleTouchStart = (e) => {
    if (!clickable || turnPhase !== "player" || cantAfford) return;
    const touch = e.touches[0];
    if (!touch) return;
    isTouchRef.current = true;
    mouseDownIdxRef.current = idx;
    mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY };
    hasDraggedRef.current = false;
  };

  const handleClick = (e) => {
    if (!clickable || turnPhase !== "player" || cantAfford) return;
    if (hasDraggedRef.current) return;
    const isNonAttack = baseType === "defend" || baseType === "heal" || baseType === "buff" || baseType === "skill";
    if (isNonAttack && onPlayNonAttack) {
      onPlayNonAttack();
      return;
    }
    setSelectedCard(isSelected ? null : idx);
  };

  const cardContent = (
    <div
      key={card.id}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`game-card ${isSelected ? 'selected' : ''} type-${baseType}${drawAnim ? ' card-draw-anim' : ''}`}
      onAnimationEnd={drawAnim ? onDrawAnimEnd : undefined}
      style={{
        '--draw-delay': `${drawDelay}ms`,
        width: "var(--card-width)",
        minHeight: "var(--card-height)",
        borderRadius: 12,
        border: isSelected
          ? "3px solid #fbbf24"
          : card.upgraded
            ? `2px solid #4ade80`
            : `2px solid ${rarityColor}44`,
        background: TYPE_GRADIENTS[baseType] || TYPE_GRADIENTS.attack,
        padding: 0,
        cursor: isDragging ? "grabbing" : cantAfford ? "not-allowed" : clickable ? "grab" : "default",
        transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        transform: isDragging ? "scale(0.8)" : isSelected ? "translateY(clamp(-12px, -3vw, -20px)) scale(1.15)" : "scale(1)",
        opacity: isDragging ? 0 : cantAfford ? 0.5 : 1,
        filter: cantAfford ? "grayscale(0.6)" : "none",
        boxShadow: isDragging
          ? "none"
          : isSelected
            ? `0 4px 20px ${typeColor}66`
            : card.upgraded
              ? "0 2px 12px rgba(74,222,128,0.3)"
              : "0 2px 8px rgba(0,0,0,0.4)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: isDragging ? -1 : isSelected ? 100 : 1,
        willChange: isDragging ? "transform, opacity" : "auto",
        userSelect: "none",
        pointerEvents: isDragging ? "none" : "auto",
      }}
    >
      {/* Type banner strip at top */}
      <div style={{
        height: "clamp(14px, 3.5vw, 18px)",
        background: `linear-gradient(90deg, ${typeColor}dd, ${typeColor}88)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        fontSize: "clamp(7px, 1.6vw, 9px)",
        fontWeight: 800,
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        pointerEvents: "none",
        letterSpacing: 0.5,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "clamp(8px, 2vw, 11px)" }}>{TYPE_ICONS[baseType]}</span>
        {TYPE_LABELS[baseType]}
      </div>

      {/* Cost orb — top-left */}
      <div style={{
        position: "absolute",
        top: -2,
        left: -2,
        width: "clamp(20px, 5vw, 26px)",
        height: "clamp(20px, 5vw, 26px)",
        borderRadius: "50%",
        background: cantAfford
          ? "radial-gradient(circle at 40% 35%, #4b5563, #1f2937)"
          : "radial-gradient(circle at 40% 35%, #60a5fa, #2563eb, #1d4ed8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "clamp(11px, 2.8vw, 15px)",
        fontWeight: 900,
        color: cantAfford ? "#6b7280" : "#fff",
        border: cantAfford ? "2px solid #374151" : "2px solid #93c5fd",
        boxShadow: cantAfford ? "none" : "0 0 8px rgba(59,130,246,0.5)",
        zIndex: 20,
        pointerEvents: "none",
        textShadow: cantAfford ? "none" : "0 1px 2px rgba(0,0,0,0.8)",
      }}>
        {cardCost}
      </div>

      {/* Card image area */}
      <div style={{
        flex: "1 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "clamp(2px, 0.5vw, 4px)",
        pointerEvents: "none",
        minHeight: 0,
      }}>
        <img src={card.image} alt={card.name} draggable="false" style={{
          width: "75%",
          height: "75%",
          objectFit: "contain",
          filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.5))",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
        }} />
      </div>

      {/* Value badge — top right */}
      {mainValue > 0 && (
        <div style={{
          position: "absolute",
          top: "clamp(16px, 4vw, 20px)",
          right: 4,
          width: "clamp(22px, 5.5vw, 28px)",
          height: "clamp(22px, 5.5vw, 28px)",
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, ${typeColor}, ${typeColor}cc)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(10px, 2.8vw, 14px)",
          fontWeight: 900,
          color: "#fff",
          boxShadow: `0 2px 8px ${typeColor}55`,
          border: "2px solid rgba(255,255,255,0.25)",
          zIndex: 10,
          pointerEvents: "none",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}>
          {mainValue}
        </div>
      )}

      {/* Bottom info panel */}
      <div style={{
        background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%)",
        padding: "clamp(4px, 1vw, 6px) clamp(4px, 1vw, 6px) clamp(3px, 0.8vw, 5px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
        pointerEvents: "none",
      }}>
        {/* Card name */}
        <div style={{
          color: card.upgraded ? "#4ade80" : "#fff",
          fontSize: "clamp(8px, 2vw, 11px)",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.15,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
          textShadow: card.upgraded ? "0 0 6px rgba(74,222,128,0.4)" : "0 1px 2px rgba(0,0,0,0.9)",
        }}>
          {card.name}{card.upgraded ? "+" : ""}
        </div>

        {/* Description */}
        {card.desc && (
          <div style={{
            color: "#c4c4c4",
            fontSize: "clamp(6px, 1.4vw, 8px)",
            textAlign: "center",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            maxWidth: "100%",
          }}>
            {card.upgraded ? (card.upgradedDesc || card.desc) : card.desc}
          </div>
        )}

        {/* Rarity indicator */}
        <div style={{
          display: "flex",
          gap: 2,
          marginTop: 1,
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: "clamp(3px, 0.8vw, 4px)",
              height: "clamp(3px, 0.8vw, 4px)",
              borderRadius: "50%",
              background: (rarity === "rare" && i <= 2) ||
                          (rarity === "uncommon" && i <= 1) ||
                          (rarity === "common" && i === 0)
                ? rarityColor
                : "rgba(255,255,255,0.15)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Upgraded glow overlay */}
      {card.upgraded && (
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          border: "1px solid rgba(74,222,128,0.3)",
          boxShadow: "inset 0 0 12px rgba(74,222,128,0.1)",
          pointerEvents: "none",
          zIndex: 15,
        }} />
      )}
    </div>
  );

  return clickable ? (
    <div key={card.id} data-card-idx={idx} style={{ position: "relative", zIndex: 100, flexShrink: 0 }}>
      <Tooltip cardIdx={idx} content={tooltipContent}>{cardContent}</Tooltip>
    </div>
  ) : (
    <div key={card.id} data-card-idx={idx} style={{ position: "relative", zIndex: 100, flexShrink: 0 }}>
      {cardContent}
    </div>
  );
}
