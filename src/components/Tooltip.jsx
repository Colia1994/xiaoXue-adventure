import { useState, useRef, useEffect, useCallback } from 'react';

export default function Tooltip({ content, children, cardIdx, enemyIdx }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef(null);

  const isEnemy = enemyIdx !== undefined;

  const isTouchDevice = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const updatePosition = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      let x = rect.left + rect.width / 2;
      let y = rect.top;
      if (y < viewH * 0.25) {
        y = rect.bottom;
      }
      setPos({ x, y });
    }
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Mouse: hover tooltip
  useEffect(() => {
    const element = ref.current;
    if (!element || isTouchDevice) return;

    let timer = null;

    const handleMouseEnter = () => {
      updatePosition();
      timer = setTimeout(() => setShow(true), 200);
    };

    const handleMouseLeave = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      setShow(false);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timer) clearTimeout(timer);
    };
  }, [isTouchDevice, updatePosition]);

  // Touch: long-press tooltip (500ms hold, dismiss on tap anywhere)
  useEffect(() => {
    const element = ref.current;
    if (!element || !isTouchDevice) return;

    const LONG_PRESS_MS = 500;
    const MOVE_TOLERANCE = 10;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      clearLongPress();
      longPressTimerRef.current = setTimeout(() => {
        updatePosition();
        setShow(true);
      }, LONG_PRESS_MS);
    };

    const handleTouchMove = (e) => {
      if (!longPressTimerRef.current) return;
      const touch = e.touches[0];
      if (!touch || !touchStartPosRef.current) return;
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      if (Math.abs(dx) > MOVE_TOLERANCE || Math.abs(dy) > MOVE_TOLERANCE) {
        clearLongPress();
      }
    };

    const handleTouchEnd = () => {
      clearLongPress();
    };

    const handleDismiss = (e) => {
      if (element.contains(e.target)) return;
      setShow(false);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchstart', handleDismiss, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', handleDismiss);
      clearLongPress();
    };
  }, [isTouchDevice, updatePosition, clearLongPress]);

  return (
    <div
      ref={ref}
      data-card-idx={cardIdx}
      data-enemy-idx={enemyIdx}
      style={{ position: "relative" }}
    >
      {children}
      {show && (() => {
        const rect = ref.current?.getBoundingClientRect();
        const vw = window.innerWidth;
        const showBelow = rect && rect.top < window.innerHeight * 0.25;
        const tooltipMaxW = Math.min(140, vw * 0.2, 110);
        const pad = 8;
        const clampedLeft = Math.max(tooltipMaxW / 2 + pad, Math.min(pos.x, vw - tooltipMaxW / 2 - pad));
        return (
          <div className={isEnemy ? "enemy-tooltip" : "card-tooltip"}
            style={{
              position: "fixed",
              left: clampedLeft,
              top: pos.y,
              transform: showBelow ? "translate(-50%, 8px)" : "translate(-50%, -100%)",
              padding: "clamp(4px, 1vw, 6px) clamp(6px, 1.5vw, 8px)",
              background: "rgba(0,0,0,0.95)",
              borderRadius: 6,
              fontSize: "clamp(8px, 1.2vw, 9px)",
              color: "#fff",
              zIndex: 99999,
              boxShadow: "0 4px 16px rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              pointerEvents: "none",
              maxWidth: "clamp(110px, 20vw, 140px)",
              whiteSpace: "normal",
              lineHeight: 1.3,
            }}>
            {content}
          </div>
        );
      })()}
    </div>
  );
}
