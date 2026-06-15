/**
 * SpineCanvas - PixiJS + Spine 动画画布组件
 * 
 * 负责：
 * 1. 创建 PixiJS Application 实例（透明背景，叠加在 DOM 上）
 * 2. 管理 Spine 动画资源加载
 * 3. 提供播放/停止/切换动画的 API
 * 4. 响应式适配容器大小
 * 5. 资源不存在时优雅降级（静默不渲染）
 */
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Application, Assets } from 'pixi.js';

// 动态导入 spine-pixi（避免资源不存在时阻塞渲染）
let SpineModule = null;
const loadSpineModule = async () => {
  if (!SpineModule) {
    try {
      SpineModule = await import('@esotericsoftware/spine-pixi');
    } catch (e) {
      console.warn('[SpineCanvas] Spine 模块加载失败，将使用降级模式:', e.message);
    }
  }
  return SpineModule;
};

const SpineCanvas = forwardRef(function SpineCanvas({
  width = 400,
  height = 400,
  spineData = null, // { skeleton: '/spine/xxx.json', atlas: '/spine/xxx.atlas' }
  animation = 'idle',
  loop = true,
  onComplete = null,
  visible = true,
  scale = 1,
  position = { x: 0.5, y: 0.8 }, // 相对于画布的比例位置
  style = {},
}, ref) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const spineRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 暴露控制 API 给父组件
  useImperativeHandle(ref, () => ({
    // 播放指定动画
    playAnimation: (name, shouldLoop = true) => {
      if (spineRef.current?.state) {
        const entry = spineRef.current.state.setAnimation(0, name, shouldLoop);
        return entry;
      }
      return null;
    },
    // 停止动画
    stopAnimation: () => {
      if (spineRef.current?.state) {
        spineRef.current.state.clearTracks();
      }
    },
    // 添加到队列
    addAnimation: (name, shouldLoop = false, delay = 0) => {
      if (spineRef.current?.state) {
        return spineRef.current.state.addAnimation(0, name, shouldLoop, delay);
      }
      return null;
    },
    // 获取可用动画列表
    getAnimations: () => {
      if (spineRef.current?.skeleton?.data?.animations) {
        return spineRef.current.skeleton.data.animations.map(a => a.name);
      }
      return [];
    },
    // 获取 spine 实例
    getSpine: () => spineRef.current,
    // 获取 PixiJS app 实例
    getApp: () => appRef.current,
  }), []);

  // 初始化 PixiJS Application
  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let app = null;
    let destroyed = false;

    const init = async () => {
      try {
        app = new Application();
        await app.init({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (destroyed) {
          app.destroy(true);
          return;
        }

        // 将 canvas 挂到 DOM
        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        // 加载 Spine 资源
        if (spineData?.skeleton && spineData?.atlas) {
          await loadSpineAssets(app, spineData);
        }
      } catch (err) {
        console.warn('[SpineCanvas] 初始化失败:', err.message);
        setLoadError(true);
      }
    };

    init();

    return () => {
      destroyed = true;
      if (spineRef.current) {
        spineRef.current.destroy();
        spineRef.current = null;
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setReady(false);
    };
  }, [visible, width, height, spineData?.skeleton, spineData?.atlas]);

  // 加载 Spine 资源
  const loadSpineAssets = useCallback(async (app, data) => {
    try {
      const spine = await loadSpineModule();
      if (!spine) {
        setLoadError(true);
        return;
      }

      // 检查资源文件是否存在
      const checkResp = await fetch(data.skeleton, { method: 'HEAD' });
      if (!checkResp.ok) {
        console.warn(`[SpineCanvas] Spine 资源不存在: ${data.skeleton}`);
        setLoadError(true);
        return;
      }

      // 注册 Spine 资源加载器
      Assets.add({ alias: 'spineData', src: data.skeleton });

      const spineAsset = await Assets.load('spineData');

      // 创建 Spine 实例
      const spineInstance = spine.Spine.from({
        skeleton: spineAsset,
        atlas: data.atlas,
      });

      spineInstance.scale.set(scale);
      spineInstance.x = width * position.x;
      spineInstance.y = height * position.y;

      app.stage.addChild(spineInstance);
      spineRef.current = spineInstance;

      // 播放默认动画
      if (animation && spineInstance.state) {
        spineInstance.state.setAnimation(0, animation, loop);

        if (onComplete) {
          spineInstance.state.addListener({
            complete: (entry) => {
              if (!entry.loop) {
                onComplete(entry.animation?.name);
              }
            },
          });
        }
      }

      setReady(true);
      setLoadError(false);
    } catch (err) {
      console.warn('[SpineCanvas] Spine 资源加载失败，降级处理:', err.message);
      setLoadError(true);
    }
  }, [animation, loop, onComplete, scale, position, width, height]);

  // 动画切换
  useEffect(() => {
    if (!ready || !spineRef.current?.state) return;
    try {
      spineRef.current.state.setAnimation(0, animation, loop);
    } catch (err) {
      console.warn(`[SpineCanvas] 动画 "${animation}" 不存在:`, err.message);
    }
  }, [animation, loop, ready]);

  // 如果资源加载失败或不可见，不渲染
  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9990,
        ...style,
      }}
      data-spine-ready={ready}
      data-spine-error={loadError}
    />
  );
});

export default SpineCanvas;
