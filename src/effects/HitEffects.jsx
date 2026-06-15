/**
 * 打击特效整合
 * 斩击线、闪白、击退效果
 */
import { useRef, useCallback, useState, useEffect } from "react";

// ========== 斩击线 ==========
function drawSlash(ctx, x, y, type, progress) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 1 - progress;
  ctx.lineWidth = 3 - progress * 2;
  ctx.lineCap = "round";

  const len = 80 + progress * 40;

  if (type === "claw") {
    // 三道平行爪痕
    for (let i = -1; i <= 1; i++) {
      const offset = i * 15;
      const gradient = ctx.createLinearGradient(-len / 2, offset, len / 2, offset);
      gradient.addColorStop(0, "rgba(255,255,255,0)");
      gradient.addColorStop(0.3, "rgba(255,255,255,0.9)");
      gradient.addColorStop(0.7, "rgba(255,200,200,0.8)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-len / 2, offset - 5);
      ctx.quadraticCurveTo(0, offset + (i * 3), len / 2, offset + 5);
      ctx.stroke();
    }
  } else if (type === "bite") {
    // 单条弧线
    const gradient = ctx.createLinearGradient(-len / 2, -20, len / 2, 20);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.4, "rgba(255,220,150,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4 - progress * 3;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 20);
    ctx.bezierCurveTo(-len / 4, -30, len / 4, -30, len / 2, 20);
    ctx.stroke();
  } else if (type === "roll") {
    // 圆形旋转
    const radius = 30 + progress * 20;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.6, "rgba(200,220,255,0.7)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 - progress * 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, progress * Math.PI * 2, (progress + 0.7) * Math.PI * 2);
    ctx.stroke();
  } else {
    // 默认斜线
    const gradient = ctx.createLinearGradient(-len / 2, -len / 2, len / 2, len / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-len / 2, -len / 3);
    ctx.lineTo(len / 2, len / 3);
    ctx.stroke();
  }

  ctx.restore();
}

// ========== Hooks ==========
export function useHitEffects() {
  const slashCanvasRef = useRef(null);
  const slashFrameRef = useRef(null);
  const [flashTargets, setFlashTargets] = useState({});
  const [knockbackTargets, setKnockbackTargets] = useState({});

  // 确保 canvas 尺寸
  useEffect(() => {
    const canvas = slashCanvasRef.current;
    if (canvas) {
      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
    }
  }, []);

  // 斩击线动画
  const triggerSlash = useCallback((x, y, type = "claw") => {
    const canvas = slashCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const startTime = performance.now();
    const duration = 200;

    if (slashFrameRef.current) cancelAnimationFrame(slashFrameRef.current);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSlash(ctx, x, y, type, progress);

      if (progress < 1) {
        slashFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        slashFrameRef.current = null;
      }
    };

    slashFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // 闪白效果 - 通过 CSS filter
  const flashTarget = useCallback((enemyIdx) => {
    setFlashTargets((prev) => ({ ...prev, [enemyIdx]: true }));
    setTimeout(() => {
      setFlashTargets((prev) => ({ ...prev, [enemyIdx]: false }));
    }, 50);
  }, []);

  // 击退效果
  const knockbackTarget = useCallback((enemyIdx, damage) => {
    const distance = Math.min(damage * 3, 30);
    setKnockbackTargets((prev) => ({ ...prev, [enemyIdx]: distance }));
    setTimeout(() => {
      setKnockbackTargets((prev) => ({ ...prev, [enemyIdx]: 0 }));
    }, 300);
  }, []);

  // 生成敌人的特效样式
  const getEnemyHitStyle = useCallback(
    (enemyIdx) => {
      const isFlashing = flashTargets[enemyIdx];
      const knockback = knockbackTargets[enemyIdx] || 0;

      return {
        filter: isFlashing ? "brightness(3) saturate(0)" : "none",
        transform: knockback
          ? `translateX(${knockback}px)`
          : "translateX(0)",
        transition: knockback
          ? "transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
          : "transform 0.15s ease-out, filter 0.05s ease",
      };
    },
    [flashTargets, knockbackTargets]
  );

  // 清理
  useEffect(() => {
    return () => {
      if (slashFrameRef.current) cancelAnimationFrame(slashFrameRef.current);
    };
  }, []);

  return {
    slashCanvasRef,
    triggerSlash,
    flashTarget,
    knockbackTarget,
    getEnemyHitStyle,
  };
}
