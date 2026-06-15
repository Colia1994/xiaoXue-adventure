/**
 * 屏幕震动系统
 * 通过对根容器添加随机 transform offset 实现震感，逐帧衰减
 */
import { useState, useCallback, useRef } from "react";

export function useScreenShake() {
  const [shakeStyle, setShakeStyle] = useState({});
  const frameRef = useRef(null);
  const startTimeRef = useRef(0);
  const intensityRef = useRef(0);
  const durationRef = useRef(0);

  const triggerShake = useCallback((intensity = 2, duration = 300) => {
    // intensity: 1=轻, 2=中, 3=重
    const baseOffset = [4, 8, 14][Math.min(intensity, 3) - 1] || 8;
    intensityRef.current = baseOffset;
    durationRef.current = duration;
    startTimeRef.current = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);
      // 衰减系数：从1衰减到0
      const decay = 1 - progress;

      if (progress >= 1) {
        setShakeStyle({});
        frameRef.current = null;
        return;
      }

      const maxOffset = intensityRef.current * decay;
      const x = (Math.random() - 0.5) * 2 * maxOffset;
      const y = (Math.random() - 0.5) * 2 * maxOffset;
      const rotate = (Math.random() - 0.5) * decay * (intensityRef.current * 0.3);

      setShakeStyle({
        transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)`,
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  return { shakeStyle, triggerShake };
}
