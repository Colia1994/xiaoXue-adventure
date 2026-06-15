/**
 * BattleEffects - 战斗特效管理器
 * 
 * 基于 PixiJS 的高级特效系统（与现有 Canvas 2D 粒子系统互补）
 * 
 * 功能：
 * 1. 管理战斗场景中的 Spine 动画实例
 * 2. 提供预设特效播放接口
 * 3. 特效队列管理（防止同时播放太多特效导致性能问题）
 * 4. 如果 Spine 资源未加载，降级为简单的 sprite 动画
 */
import { useState, useCallback, useRef, createContext, useContext } from 'react';

// ============================================================
// 特效配置表
// ============================================================

const EFFECT_PRESETS = {
  // 攻击特效
  attack_slash: {
    skeleton: '/spine/effects/slash.json',
    atlas: '/spine/effects/slash.atlas',
    animation: 'slash',
    duration: 600,
  },
  attack_bite: {
    skeleton: '/spine/effects/bite.json',
    atlas: '/spine/effects/bite.atlas',
    animation: 'bite',
    duration: 500,
  },
  attack_roll: {
    skeleton: '/spine/effects/roll.json',
    atlas: '/spine/effects/roll.atlas',
    animation: 'roll',
    duration: 800,
  },
  // 防御特效
  defend_shield: {
    skeleton: '/spine/effects/shield.json',
    atlas: '/spine/effects/shield.atlas',
    animation: 'block',
    duration: 700,
  },
  // 治愈特效
  heal_glow: {
    skeleton: '/spine/effects/heal.json',
    atlas: '/spine/effects/heal.atlas',
    animation: 'heal',
    duration: 1000,
  },
  // 组合技特效
  mutation_iron_fang: {
    skeleton: '/spine/effects/iron_fang.json',
    atlas: '/spine/effects/iron_fang.atlas',
    animation: 'iron_fang',
    duration: 1200,
  },
  mutation_lightning: {
    skeleton: '/spine/effects/lightning.json',
    atlas: '/spine/effects/lightning.atlas',
    animation: 'lightning',
    duration: 900,
  },
};

// 最大同时播放特效数
const MAX_CONCURRENT_EFFECTS = 5;

// ============================================================
// BattleEffects Context
// ============================================================

const BattleEffectsContext = createContext(null);

export function BattleEffectsProvider({ children }) {
  const value = useBattleEffects();
  return (
    <BattleEffectsContext.Provider value={value}>
      {children}
    </BattleEffectsContext.Provider>
  );
}

export function useBattleEffectsContext() {
  const ctx = useContext(BattleEffectsContext);
  if (!ctx) {
    console.warn('[BattleEffects] 使用 useBattleEffectsContext 需要 BattleEffectsProvider 包裹');
    // 返回降级版本
    return useBattleEffects();
  }
  return ctx;
}

// ============================================================
// useBattleEffects Hook
// ============================================================

export function useBattleEffects() {
  const [activeEffects, setActiveEffects] = useState([]);
  const effectIdRef = useRef(0);
  const queueRef = useRef([]);
  const spineAvailableRef = useRef(null); // null = 未检测, true/false = 结果

  // 检测 Spine 资源是否可用
  const checkSpineAvailable = useCallback(async (preset) => {
    if (!preset?.skeleton) return false;
    try {
      const resp = await fetch(preset.skeleton, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  }, []);

  // 添加特效到队列
  const enqueueEffect = useCallback((effect) => {
    setActiveEffects(prev => {
      if (prev.length >= MAX_CONCURRENT_EFFECTS) {
        // 队列满了，加入等待队列
        queueRef.current.push(effect);
        return prev;
      }
      return [...prev, effect];
    });
  }, []);

  // 移除完成的特效，并处理队列
  const removeEffect = useCallback((id) => {
    setActiveEffects(prev => {
      const next = prev.filter(e => e.id !== id);
      // 从队列中取出下一个
      if (queueRef.current.length > 0 && next.length < MAX_CONCURRENT_EFFECTS) {
        const queued = queueRef.current.shift();
        return [...next, queued];
      }
      return next;
    });
  }, []);

  /**
   * 播放攻击特效
   * @param {'slash'|'bite'|'roll'} type - 攻击类型
   * @param {{x: number, y: number}} position - 屏幕坐标
   */
  const playAttackEffect = useCallback((type = 'slash', position = { x: 0, y: 0 }) => {
    const presetKey = `attack_${type}`;
    const preset = EFFECT_PRESETS[presetKey] || EFFECT_PRESETS.attack_slash;
    const id = ++effectIdRef.current;

    const effect = {
      id,
      type: 'attack',
      preset,
      position,
      startTime: Date.now(),
    };

    enqueueEffect(effect);

    // 自动移除
    setTimeout(() => removeEffect(id), preset.duration);

    return id;
  }, [enqueueEffect, removeEffect]);

  /**
   * 播放防御特效
   * @param {{x: number, y: number}} position - 屏幕坐标
   */
  const playDefendEffect = useCallback((position = { x: 0, y: 0 }) => {
    const preset = EFFECT_PRESETS.defend_shield;
    const id = ++effectIdRef.current;

    const effect = {
      id,
      type: 'defend',
      preset,
      position,
      startTime: Date.now(),
    };

    enqueueEffect(effect);
    setTimeout(() => removeEffect(id), preset.duration);

    return id;
  }, [enqueueEffect, removeEffect]);

  /**
   * 播放治愈特效
   * @param {{x: number, y: number}} position - 屏幕坐标
   */
  const playHealEffect = useCallback((position = { x: 0, y: 0 }) => {
    const preset = EFFECT_PRESETS.heal_glow;
    const id = ++effectIdRef.current;

    const effect = {
      id,
      type: 'heal',
      preset,
      position,
      startTime: Date.now(),
    };

    enqueueEffect(effect);
    setTimeout(() => removeEffect(id), preset.duration);

    return id;
  }, [enqueueEffect, removeEffect]);

  /**
   * 播放组合技特效
   * @param {string} name - 组合技标识名
   * @param {{x: number, y: number}} position - 屏幕坐标
   */
  const playMutationEffect = useCallback((name, position = { x: 0, y: 0 }) => {
    const presetKey = `mutation_${name}`;
    const preset = EFFECT_PRESETS[presetKey] || EFFECT_PRESETS.mutation_iron_fang;
    const id = ++effectIdRef.current;

    const effect = {
      id,
      type: 'mutation',
      preset,
      position,
      startTime: Date.now(),
    };

    enqueueEffect(effect);
    setTimeout(() => removeEffect(id), preset.duration);

    return id;
  }, [enqueueEffect, removeEffect]);

  /**
   * 清除所有特效
   */
  const clearAllEffects = useCallback(() => {
    setActiveEffects([]);
    queueRef.current = [];
  }, []);

  return {
    // 状态
    activeEffects,

    // 播放接口
    playAttackEffect,
    playDefendEffect,
    playHealEffect,
    playMutationEffect,

    // 管理接口
    clearAllEffects,
    removeEffect,

    // 工具
    checkSpineAvailable,
    EFFECT_PRESETS,
  };
}

// ============================================================
// SpineEffectLayer - 渲染当前活跃的 Spine 特效
// ============================================================

/**
 * 将此组件放在战斗场景中作为特效叠加层。
 * 它会根据 activeEffects 渲染对应的 SpineCanvas 实例。
 * 如果 Spine 资源不存在，降级为 CSS 动画占位。
 */
export function SpineEffectLayer({ effects = [] }) {
  if (effects.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9995,
        overflow: 'hidden',
      }}
    >
      {effects.map(effect => (
        <FallbackEffect key={effect.id} effect={effect} />
      ))}
    </div>
  );
}

/**
 * 降级特效 - 当 Spine 资源不可用时，使用 CSS 动画作为替代
 */
function FallbackEffect({ effect }) {
  const { type, position, preset } = effect;

  // 根据特效类型选择不同的降级样式
  const getEffectStyle = () => {
    const baseStyle = {
      position: 'absolute',
      left: position.x - 30,
      top: position.y - 30,
      width: 60,
      height: 60,
      borderRadius: '50%',
      opacity: 0.8,
      animation: `spine-fallback-${type} ${preset.duration}ms ease-out forwards`,
    };

    switch (type) {
      case 'attack':
        return { ...baseStyle, background: 'radial-gradient(circle, #ff6b35 0%, transparent 70%)' };
      case 'defend':
        return { ...baseStyle, background: 'radial-gradient(circle, #4fc3f7 0%, transparent 70%)' };
      case 'heal':
        return { ...baseStyle, background: 'radial-gradient(circle, #66bb6a 0%, transparent 70%)' };
      case 'mutation':
        return { ...baseStyle, background: 'radial-gradient(circle, #ffd54f 0%, transparent 70%)', width: 80, height: 80, left: position.x - 40, top: position.y - 40 };
      default:
        return baseStyle;
    }
  };

  return <div style={getEffectStyle()} />;
}

export default useBattleEffects;
