/**
 * 粒子系统
 * Canvas 2D 绘制，支持多种粒子类型
 */
import { useRef, useCallback, useEffect } from "react";


// 粒子类型配置
const PARTICLE_CONFIGS = {
  hit: {
    color: () => `hsl(${Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
    size: () => 2 + Math.random() * 4,
    speed: () => 3 + Math.random() * 5,
    life: () => 0.4 + Math.random() * 0.4,
    gravity: 0.3,
    shape: "square",
  },
  freeze: {
    color: () => `hsl(${190 + Math.random() * 20}, 80%, ${60 + Math.random() * 30}%)`,
    size: () => 3 + Math.random() * 5,
    speed: () => 0.5 + Math.random() * 1.5,
    life: () => 0.8 + Math.random() * 0.6,
    gravity: -0.05,
    shape: "diamond",
  },
  heal: {
    color: () => `hsl(${120 + Math.random() * 30}, 80%, ${50 + Math.random() * 30}%)`,
    size: () => 2 + Math.random() * 3,
    speed: () => 1 + Math.random() * 2,
    life: () => 0.6 + Math.random() * 0.5,
    gravity: -0.15,
    shape: "circle",
  },
  poison: {
    color: () => `hsl(${270 + Math.random() * 30}, 70%, ${40 + Math.random() * 30}%)`,
    size: () => 3 + Math.random() * 4,
    speed: () => 0.8 + Math.random() * 1.5,
    life: () => 0.8 + Math.random() * 0.8,
    gravity: -0.08,
    shape: "circle",
  },
  mutation: {
    color: () => `hsl(${40 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`,
    size: () => 3 + Math.random() * 5,
    speed: () => 4 + Math.random() * 4,
    life: () => 0.6 + Math.random() * 0.6,
    gravity: 0.1,
    shape: "star",
  },
};

function createParticle(x, y, type) {
  const config = PARTICLE_CONFIGS[type] || PARTICLE_CONFIGS.hit;
  const angle = Math.random() * Math.PI * 2;
  const speed = config.speed();

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: config.life(),
    maxLife: config.life(),
    color: config.color(),
    size: config.size(),
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    gravity: config.gravity,
    shape: config.shape,
  };
}

function drawParticle(ctx, p, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  switch (p.shape) {
    case "square":
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      break;
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.6, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case "star": {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? p.size : p.size * 0.4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      // 发光效果
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      break;
    }
    default: // circle
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

export function ParticleSystem({ canvasRef }) {
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useParticles() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const frameRef = useRef(null);
  const isRunningRef = useRef(false);
  const renderLoopRef = useRef(null);

  // 主渲染循环
  const renderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      frameRef.current = requestAnimationFrame(renderLoopRef.current);
      return;
    }

    // 确保 canvas 尺寸匹配窗口
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dt = 1 / 60; // 固定时间步长
    const alive = [];

    for (const p of particlesRef.current) {
      p.life -= dt;
      if (p.life <= 0) continue;

      // 物理更新
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.size *= 0.995; // 缓慢缩小

      // 绘制
      const alpha = Math.min(1, p.life / (p.maxLife * 0.3));
      drawParticle(ctx, p, alpha);
      alive.push(p);
    }

    particlesRef.current = alive;

    if (alive.length > 0) {
      frameRef.current = requestAnimationFrame(renderLoopRef.current);
    } else {
      isRunningRef.current = false;
    }
  }, []);

  // 保持 ref 同步
  useEffect(() => {
    renderLoopRef.current = renderLoop;
  }, [renderLoop]);

  // 发射粒子
  const emit = useCallback(
    (x, y, type = "hit", count = 10) => {
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(x, y, type));
      }
      // 如果渲染循环没有在运行，启动它
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        frameRef.current = requestAnimationFrame(renderLoopRef.current);
      }
    },
    []
  );

  // 清理
  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { canvasRef, emit };
}
