import { useState, useCallback, useEffect, useRef } from "react";
import { useScreenShake } from "./effects/ScreenShake";
import { DamageNumbers, useDamageNumbers } from "./effects/DamageNumbers";
import { ParticleSystem, useParticles } from "./effects/ParticleSystem";
import { useHitEffects } from "./effects/HitEffects";
import { useBattleEffects, SpineEffectLayer } from "./effects/BattleEffects.jsx";
import { useStatusEffects, BuffGainLayer, EnemyStatusOverlay } from "./effects/StatusEffects";
import SpineCanvas from "./components/SpineCanvas";
import Card from "./components/Card";
import Enemy from "./components/Enemy";
import PlayerCharacter from "./components/PlayerCharacter";
import { BOSS_SKILLS, INTENT_ICONS, ATTACK_INTENTS, BOSS_PATTERNS, ENEMY_TEMPLATES, ENEMY_STYLES, RANDOM_EVENTS } from "./game/constants";
import { CHARACTERS, generateCharacterDeck, generateCharacterRewards } from "./game/characters";
import { calcCardEffect } from "./game/battleLogic";
import { RELICS, CHAR_STARTING_RELICS, getRandomRelic, getRelicPassiveBonus } from "./game/relics";
import { useSoundSystem } from "./game/soundSystem";
import { generateMap, getReachableNodes } from "./game/mapGenerator";
import GameMap from "./components/GameMap";

// ============================================================
// 「小雪闯上海」—— 雪纳瑞卡牌肉鸽
// 主角小雪偷偷溜出门，闯荡上海，遇到坏人和坏狗狗
// ============================================================

// --- 主组件 ---
export default function XiaoXueGame() {
  const [phase, setPhase] = useState("title");
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const currentCharRef = useRef(null);
  useEffect(() => { currentCharRef.current = currentCharacter; }, [currentCharacter]);
  const [hand, setHand] = useState([]);
  const handRef = useRef(hand);
  useEffect(() => { handRef.current = hand; }, [hand]);

  // 手牌变化后清除残留的 inline transform，防止打出卡牌后位置错乱
  useEffect(() => {
    // 拖拽进行中不干预（拖拽逻辑自行管理 transform）
    if (dragModeRef.current !== null) return;
    const container = handContainerRef.current;
    if (!container) return;
    // 使用 requestAnimationFrame 确保 React DOM 更新已完成
    requestAnimationFrame(() => {
      const cards = container.querySelectorAll('[data-card-idx]');
      cards.forEach(cardEl => {
        // 清除拖拽残留的 inline transform/transition，让 flex 布局重新接管位置
        cardEl.style.transform = '';
        cardEl.style.transition = '';
      });
    });
  }, [hand]);

  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const discardPileRef = useRef([]);
  useEffect(() => { discardPileRef.current = discardPile; }, [discardPile]);
  const [flyingCards, setFlyingCards] = useState([]);
  const flyIdCounter = useRef(0);
  const [battleTransition, setBattleTransition] = useState(false);
  const [transitionEnemies, setTransitionEnemies] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [player, setPlayer] = useState({ hp: 40, maxHp: 40, armor: 0 });
  const playerStateRef = useRef(player);
  useEffect(() => { playerStateRef.current = player; }, [player]);
  const [playerPowers, setPlayerPowers] = useState([]);
  const playerPowersRef = useRef([]);
  useEffect(() => { playerPowersRef.current = playerPowers; }, [playerPowers]);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [maxEnergy] = useState(3);
  const [rewardCards, setRewardCards] = useState([]);
  const [rewardRelic, setRewardRelic] = useState(null);
  const [relics, setRelics] = useState([]);
  const relicsRef = useRef([]);
  useEffect(() => { relicsRef.current = relics; }, [relics]);
  const firstCardPlayedRef = useRef(false);
  const phoenixUsedRef = useRef(false);
  const [shopCards, setShopCards] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [gameMap, setGameMap] = useState(null);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState([]);
  const [currentAct, setCurrentAct] = useState(0);
  const [currentMapNode, setCurrentMapNode] = useState(null);
  const [turnPhase, setTurnPhase] = useState("player");
  const [showGuide, setShowGuide] = useState(false);
  const [attackBuff, setAttackBuff] = useState(0);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [playerAnim, setPlayerAnim] = useState(null);
  const [enemyAnim, setEnemyAnim] = useState({});
    const [logCollapsed, setLogCollapsed] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAttackTarget, setSelectedAttackTarget] = useState(null);
  const [hitStop, setHitStop] = useState(false);
  // --- 拖拽状态 ---
  const [dragOverEnemy, setDragOverEnemy] = useState(null); // 悬停的敌人index
  const [dragAttackCard, setDragAttackCard] = useState(null); // 正在拖拽且在敌人上的攻击卡牌index
  const dragModeRef = useRef(null); // null | 'drag'
  const dragGhostRef = useRef(null); // 拖拽幽灵卡牌元素
  const dragSourceIdxRef = useRef(null); // 拖拽源卡牌索引
  const dragTargetIdxRef = useRef(null); // 拖拽目标插入位置索引
  const dragCardWidthRef = useRef(0); // 卡牌宽度（用于计算位移）
  const dragGhostOffsetRef = useRef({ x: 55, y: 75 }); // 幽灵卡牌偏移（动态计算）
  const dragOverEnemyRef = useRef(null); // ref版dragOverEnemy（避免闭包问题）
  const dragMousePosRef = useRef({ x: 0, y: 0 }); // 实时鼠标位置（ref版）
  const dragCardCentersRef = useRef([]); // 拖拽开始时各卡牌的中心X位置（用于计算目标位置）
  const logRef = useRef(null);
  const enemyTurnLock = useRef(null);
  const handContainerRef = useRef(null);
  const drawPileRef = useRef(null);
  const discardPileElRef = useRef(null);
  const draggingIdxRef = useRef(null);
  const mouseDownIdxRef = useRef(null);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const isTouchRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const cardElementsRef = useRef({}); // 存储每个卡牌DOM元素的ref
  const enemyRefs = useRef([]);
  const playerRef = useRef(null);
  const executeAttackRef = useRef(null);
  const playCardRef = useRef(null);

  // --- 特效系统 hooks ---
  const { shakeStyle, triggerShake } = useScreenShake();
  const { numbers: damageNumbers, addDamage } = useDamageNumbers();
  const { canvasRef: particleCanvasRef, emit: emitParticles } = useParticles();
  const { slashCanvasRef, triggerSlash, flashTarget, knockbackTarget, getEnemyHitStyle } = useHitEffects();
  const spineEffects = useBattleEffects();
  const { buffEffects, triggerBuffGain } = useStatusEffects();

  // --- 音效系统 ---
  const { playSound, playBGM, stopBGM } = useSoundSystem();

  useEffect(() => {
    if (phase === 'title' || phase === 'win' || phase === 'charSelect') {
      playBGM('loading');
    } else if (phase === 'battle') {
      playBGM('battle');
    } else if (phase === 'map' || phase === 'rest' || phase === 'shop') {
      playBGM('loading');
    }
    return () => stopBGM();
  }, [phase]);

  // 同步 ref
  useEffect(() => { draggingIdxRef.current = draggingIdx; }, [draggingIdx]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // --- 拖拽插入 ---
  const insertCard = useCallback((fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx === null || toIdx === null) return;
    setHand(prev => {
      if (fromIdx >= prev.length || toIdx > prev.length) return prev;
      const card = prev[fromIdx];
      const withoutCard = prev.filter((_, i) => i !== fromIdx);
      const insertPos = toIdx > fromIdx ? toIdx - 1 : toIdx;
      const next = [...withoutCard.slice(0, insertPos), card, ...withoutCard.slice(insertPos)];
      return next;
    });
  }, []);

  // --- 判断卡牌是否为攻击牌 ---
  const isAttackCard = useCallback((cardIdx) => {
    const card = handRef.current[cardIdx];
    if (!card) return false;
    if (card.baseType !== "attack") return false;
    const eff = calcCardEffect(card, attackBuff, relicsRef.current);
    return eff.dmg > 0;
  }, [attackBuff]);

  // --- 统一拖拽处理（换位 + 攻击） ---
  // 根据鼠标X位置计算卡牌应插入的目标位置（使用拖拽开始时的初始位置）
  const calcDragTarget = useCallback((mouseX) => {
    const srcIdx = dragSourceIdxRef.current;
    const centers = dragCardCentersRef.current;
    if (!centers.length) return srcIdx;
    let target = srcIdx;
    for (let i = 0; i < centers.length; i++) {
      if (i === srcIdx) continue;
      if (mouseX > centers[i]) {
        target = Math.max(target, i);
      } else if (mouseX < centers[i]) {
        target = Math.min(target, i);
      }
    }
    return target;
  }, []);

  // 检测鼠标是否在敌人区域上
  const checkEnemyHover = useCallback((x, y) => {
    let hovered = null;
    enemyRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        hovered = idx;
      }
    });
    return hovered;
  }, []);

  // 更新非拖拽卡牌的位移（基于 source/target 差值）
  const applyCardOffsets = useCallback((sourceIdx, targetIdx) => {
    const container = handContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('[data-card-idx]');
    const cardW = dragCardWidthRef.current;
    const gap = 8; // 与CSS gap一致
    const shift = cardW + gap;

    cards.forEach(cardEl => {
      const idx = parseInt(cardEl.getAttribute('data-card-idx'));
      if (isNaN(idx)) return;
      if (idx === sourceIdx) {
        // 被拖拽的卡牌：不做额外处理（Card.jsx已通过isDragging状态处理隐藏）
        return;
      }
      // 计算该卡牌需要的位移
      let offset = 0;
      if (sourceIdx < targetIdx) {
        // 向右拖：sourceIdx+1 到 targetIdx 的卡牌向左移
        if (idx > sourceIdx && idx <= targetIdx) offset = -shift;
      } else if (sourceIdx > targetIdx) {
        // 向左拖：targetIdx 到 sourceIdx-1 的卡牌向右移
        if (idx >= targetIdx && idx < sourceIdx) offset = shift;
      }
      cardEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      cardEl.style.transform = offset !== 0 ? `translateX(${offset}px)` : 'translateX(0)';
    });
  }, []);

  // 清除所有卡牌位移
  const clearCardOffsets = useCallback(() => {
    const container = handContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('[data-card-idx]');
    cards.forEach(cardEl => {
      cardEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease';
      cardEl.style.transform = 'translateX(0)';
      cardEl.style.opacity = '1';
    });
  }, []);

  // 开始拖拽时的初始化
  const startDrag = useCallback((srcIdx, clientX, clientY) => {
    dragModeRef.current = 'drag';
    dragSourceIdxRef.current = srcIdx;
    dragTargetIdxRef.current = srcIdx;
    dragOverEnemyRef.current = null;
    setDraggingIdx(srcIdx);
    draggingIdxRef.current = srcIdx;
    setSelectedCard(null);
    hasDraggedRef.current = true;
    handContainerRef.current?.classList.add('dragging');

    // 记录卡牌宽度和初始中心位置（用于后续的目标位置计算）
    const container = handContainerRef.current;
    const cardEl = container?.querySelector(`[data-card-idx="${srcIdx}"]`);
    if (cardEl) {
      const rect = cardEl.getBoundingClientRect();
      dragCardWidthRef.current = rect.width;
    }
    // 存储所有卡牌的初始中心X位置
    if (container) {
      const cards = container.querySelectorAll('[data-card-idx]');
      const centers = [];
      cards.forEach(cardEl => {
        const idx = parseInt(cardEl.getAttribute('data-card-idx'));
        const rect = cardEl.getBoundingClientRect();
        centers[idx] = rect.left + rect.width / 2;
      });
      dragCardCentersRef.current = centers;
    }

    // 计算幽灵卡牌居中偏移
    if (dragGhostRef.current) {
      const ghostRect = dragGhostRef.current.getBoundingClientRect();
      dragGhostOffsetRef.current = {
        x: ghostRect.width > 0 ? ghostRect.width / 2 : 55,
        y: ghostRect.height > 0 ? ghostRect.height / 2 : 75,
      };
    }

    // 显示幽灵卡牌
    if (dragGhostRef.current) {
      const ghost = dragGhostRef.current;
      ghost.style.display = 'flex';
      const { x: offX, y: offY } = dragGhostOffsetRef.current;
      ghost.style.left = `${clientX - offX}px`;
      ghost.style.top = `${clientY - offY}px`;
      ghost.style.transition = 'none';
      ghost.style.transform = 'scale(1.05) translateY(-5px)';
      ghost.style.opacity = '0.95';
      ghost.style.border = '2px solid #fbbf24';
      ghost.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 0 3px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.5)';
    }

    // 更新卡牌偏移
    applyCardOffsets(srcIdx, srcIdx);
  }, [applyCardOffsets]);

  // 更新拖拽中的攻击状态
  const updateAttackHover = useCallback((srcIdx, hoveredEnemy) => {
    const isAttack = isAttackCard(srcIdx);
    if (isAttack && hoveredEnemy !== null) {
      // 进入敌人区域：显示攻击模式
      if (dragOverEnemyRef.current !== hoveredEnemy) {
        dragOverEnemyRef.current = hoveredEnemy;
        setDragOverEnemy(hoveredEnemy);
        setDragAttackCard(srcIdx);
        // 更新幽灵卡牌为攻击样式
        if (dragGhostRef.current) {
          const ghost = dragGhostRef.current;
          ghost.style.border = '3px solid #ef4444';
          ghost.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.6), 0 10px 30px rgba(0,0,0,0.5)';
          ghost.style.transform = 'scale(0.85) rotate(-5deg)';
          ghost.style.opacity = '0.85';
        }
      }
    } else {
      // 不在敌人区域：恢复普通拖拽样式
      if (dragOverEnemyRef.current !== null) {
        dragOverEnemyRef.current = null;
        setDragOverEnemy(null);
        setDragAttackCard(null);
        // 恢复幽灵卡牌为普通拖拽样式
        if (dragGhostRef.current) {
          const ghost = dragGhostRef.current;
          ghost.style.border = '2px solid #fbbf24';
          ghost.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 0 3px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.5)';
          ghost.style.transform = 'scale(1.05) translateY(-5px)';
          ghost.style.opacity = '0.95';
        }
      }
    }
  }, [isAttackCard]);

  // 结束拖拽（带回弹动画）
  const endDrag = useCallback((isAttack) => {
    const srcIdx = dragSourceIdxRef.current;
    const targetIdx = dragTargetIdxRef.current;
    const hoveredEnemy = dragOverEnemyRef.current;

    if (isAttack && hoveredEnemy !== null && isAttackCard(srcIdx)) {
      // 执行攻击
      executeAttackRef.current?.(srcIdx, hoveredEnemy);
    }

    // FLIP动画：记录拖拽中各卡牌的当前位置（First）
    const container = handContainerRef.current;
    const flipEntries = []; // [{el, firstLeft}]
    if (container && !isAttack && srcIdx !== targetIdx) {
      const cards = container.querySelectorAll('[data-card-idx]');
      cards.forEach(cardEl => {
        const rect = cardEl.getBoundingClientRect();
        flipEntries.push({ el: cardEl, firstLeft: rect.left, firstTop: rect.top });
      });
    }

    // 执行换位
    if (!isAttack && srcIdx !== targetIdx) {
      insertCard(srcIdx, targetIdx);
    }

    // 重置拖拽状态（触发React重新渲染）
    dragModeRef.current = null;
    dragSourceIdxRef.current = null;
    dragTargetIdxRef.current = null;
    dragOverEnemyRef.current = null;
    mouseDownIdxRef.current = null;
    mouseDownPosRef.current = { x: 0, y: 0 };
    setDraggingIdx(null);
    draggingIdxRef.current = null;
    setDragFrom(null);
    setDragOverEnemy(null);
    setDragAttackCard(null);
    handContainerRef.current?.classList.remove('dragging');
    hasDraggedRef.current = true;
    setTimeout(() => { hasDraggedRef.current = false; }, 50);

    // FLIP动画：React重新渲染后执行
    if (!isAttack && srcIdx !== targetIdx && flipEntries.length > 0) {
      requestAnimationFrame(() => {
        flipEntries.forEach(({ el, firstLeft, firstTop }) => {
          // 检查元素是否仍在DOM中
          if (!el.isConnected) return;
          const lastRect = el.getBoundingClientRect();
          const dx = firstLeft - lastRect.left;
          const dy = firstTop - lastRect.top;
          if (dx === 0 && dy === 0) return;
          // Invert: 将卡牌移回原位置
          el.style.transform = `translateX(${dx}px)`;
          el.style.transition = 'none';
          // Play: 下一帧动画到新位置
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
            el.style.transform = 'translateX(0)';
            // 动画完成后清除transition
            setTimeout(() => {
              el.style.transition = '';
              el.style.transform = '';
            }, 360);
          });
        });
      });
    }

    // 幽灵卡牌回弹动画
    if (dragGhostRef.current) {
      if (!isAttack) {
        const ghost = dragGhostRef.current;
        // 回弹到目标位置
        const targetCard = container?.querySelector(`[data-card-idx="${targetIdx}"]`);
        if (targetCard) {
          const rect = targetCard.getBoundingClientRect();
          ghost.style.transition = 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
          ghost.style.left = `${rect.left}px`;
          ghost.style.top = `${rect.top}px`;
          ghost.style.transform = 'scale(1) translateY(0)';
          ghost.style.opacity = '0';
        } else {
          ghost.style.transition = 'all 0.25s ease';
          ghost.style.opacity = '0';
        }
        setTimeout(() => {
          if (dragGhostRef.current) {
            dragGhostRef.current.style.display = 'none';
          }
        }, 350);
      } else {
        // 攻击模式：直接消失
        dragGhostRef.current.style.transition = 'all 0.2s ease';
        dragGhostRef.current.style.opacity = '0';
        setTimeout(() => {
          if (dragGhostRef.current) {
            dragGhostRef.current.style.display = 'none';
          }
        }, 200);
      }
    }
  }, [insertCard, isAttackCard]);

  // 统一拖拽处理函数（mouse 和 touch 共用）
  const handleDragMove = useCallback((clientX, clientY) => {
    const srcIdx = mouseDownIdxRef.current;
    if (srcIdx === null) return;

    const dx = clientX - mouseDownPosRef.current.x;
    const dy = clientY - mouseDownPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const DRAG_THRESHOLD = isTouchRef.current ? 15 : 8;

    if (dragModeRef.current === null && distance < DRAG_THRESHOLD) return;

    // 首次超过阈值：启动拖拽
    if (dragModeRef.current === null) {
      startDrag(srcIdx, clientX, clientY);
      return;
    }

    // 更新幽灵卡牌位置（直接操作DOM，不触发React渲染）
    if (dragGhostRef.current) {
      const { x: offX, y: offY } = dragGhostOffsetRef.current;
      dragGhostRef.current.style.left = `${clientX - offX}px`;
      dragGhostRef.current.style.top = `${clientY - offY}px`;
    }

    // 记录实时鼠标位置
    dragMousePosRef.current = { x: clientX, y: clientY };

    // 计算换位目标
    const newTarget = calcDragTarget(clientX);
    if (newTarget !== dragTargetIdxRef.current) {
      dragTargetIdxRef.current = newTarget;
      applyCardOffsets(dragSourceIdxRef.current, newTarget);
    }

    // 检测敌人碰撞（攻击牌）
    const hoveredEnemy = checkEnemyHover(clientX, clientY);
    updateAttackHover(srcIdx, hoveredEnemy);
  }, [startDrag, calcDragTarget, applyCardOffsets, checkEnemyHover, updateAttackHover]);

  // 容器级别的 mousemove 检测拖拽
  useEffect(() => {
    const handleMouseMove = (e) => {
      handleDragMove(e.clientX, e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleDragMove]);

  // 重置拖拽状态并隐藏幽灵卡牌
  const resetDragState = useCallback(() => {
    dragModeRef.current = null;
    dragSourceIdxRef.current = null;
    dragTargetIdxRef.current = null;
    dragOverEnemyRef.current = null;
    mouseDownIdxRef.current = null;
    mouseDownPosRef.current = { x: 0, y: 0 };
    setDraggingIdx(null);
    draggingIdxRef.current = null;
    setDragFrom(null);
    setDragOverEnemy(null);
    setDragAttackCard(null);
    handContainerRef.current?.classList.remove('dragging');
    if (dragGhostRef.current) {
      dragGhostRef.current.style.transition = 'all 0.2s ease';
      dragGhostRef.current.style.opacity = '0';
      setTimeout(() => {
        if (dragGhostRef.current) dragGhostRef.current.style.display = 'none';
      }, 200);
    }
    hasDraggedRef.current = true;
    setTimeout(() => { hasDraggedRef.current = false; }, 50);
  }, []);

  // 检测向上拖出卡牌区域以打出非攻击牌，返回 true 表示已处理
  const tryDragUpPlay = useCallback((srcIdx, isAttack) => {
    if (isAttack || srcIdx === null) return false;
    const container = handContainerRef.current;
    if (!container) return false;
    const containerRect = container.getBoundingClientRect();
    const dragUpThreshold = Math.max(30, window.innerHeight * 0.05);
    if (dragMousePosRef.current.y >= containerRect.top - dragUpThreshold) return false;
    const card = handRef.current[srcIdx];
    const isNonAttack = card && (card.baseType === "defend" || card.baseType === "heal" || card.baseType === "buff" || card.baseType === "skill");
    if (!isNonAttack) return false;
    playCardRef.current?.(srcIdx);
    resetDragState();
    return true;
  }, [resetDragState]);

  // 统一的拖拽释放处理（mouse 和 touch 共用）
  const handleDragEnd = useCallback(() => {
    if (dragModeRef.current === null) {
      mouseDownIdxRef.current = null;
      mouseDownPosRef.current = { x: 0, y: 0 };
      return;
    }
    const hoveredEnemy = dragOverEnemyRef.current;
    const srcIdx = dragSourceIdxRef.current;
    const isAttack = hoveredEnemy !== null && isAttackCard(srcIdx);
    if (!tryDragUpPlay(srcIdx, isAttack)) {
      endDrag(isAttack);
    }
  }, [endDrag, isAttackCard, tryDragUpPlay]);

  // 全局鼠标释放
  useEffect(() => {
    window.addEventListener('mouseup', handleDragEnd);
    return () => window.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragEnd]);

  // --- 触摸事件支持 ---
  useEffect(() => {
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (dragModeRef.current !== null) {
        e.preventDefault();
      }
      handleDragMove(touch.clientX, touch.clientY);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const addLog = useCallback((msg) => {
    setLog(prev => [...prev.slice(-30), msg]);
  }, []);

  // --- 意图计算辅助函数 ---
  // 根据敌人状态计算下一个意图对象
  // 返回: { type: 'attack'|'skill', iconKey: string, damage?: number, skill?: object, chargeTurnsLeft?: number }
  const calculateNextIntent = useCallback((enemy, currentRound) => {
    const skills = BOSS_SKILLS[enemy.name];
    const pattern = BOSS_PATTERNS[enemy.name];

    // 最终Boss：使用循环模式
    if (pattern) {
      const patternIdx = (currentRound - 1) % pattern.length;
      const action = pattern[patternIdx];

      if (action === 'attack') {
        return { type: 'attack', iconKey: 'attack', damage: enemy.atk };
      }
      if (action === 'charge') {
        // 计算蓄力剩余回合
        const turnsFromStart = (currentRound - 1) % pattern.length;
        const chargeTurnsLeft = pattern.length - turnsFromStart - 1;
        const chargeSkill = skills.find(s => s.type === 'charge');
        return {
          type: 'skill',
          iconKey: 'charge',
          skill: chargeSkill,
          chargeTurnsLeft: Math.max(1, chargeTurnsLeft),
        };
      }
      if (action === 'ultimate') {
        const ultSkill = skills.find(s => s.type === 'ultimate');
        return {
          type: 'skill',
          iconKey: 'attack_ultimate',
          damage: ultSkill?.dmg || 10,
          skill: ultSkill,
        };
      }
    }

    // 普通Boss：随机选择技能
    if (Array.isArray(skills) && skills.length > 0) {
      // 40%概率使用技能，60%普通攻击
      if (Math.random() < 0.4) {
        const selectedSkill = skills[Math.floor(Math.random() * skills.length)];
        const intentObj = {
          type: 'skill',
          iconKey: selectedSkill.intentIcon,
          skill: selectedSkill,
        };
        // 如果是攻击类技能，计算伤害
        if (ATTACK_INTENTS.has(selectedSkill.intentIcon)) {
          if (selectedSkill.type === 'multi') {
            intentObj.damage = selectedSkill.dmg * selectedSkill.hits;
          } else if (selectedSkill.type === 'heavy') {
            intentObj.damage = selectedSkill.dmg || enemy.atk * (selectedSkill.dmgMult || 2);
          } else if (selectedSkill.type === 'ranged') {
            intentObj.damage = selectedSkill.dmg;
          } else if (selectedSkill.type === 'bleed') {
            intentObj.damage = enemy.atk + (selectedSkill.dmg || 0);
          } else if (selectedSkill.type === 'ultimate') {
            intentObj.damage = selectedSkill.dmg;
          } else {
            intentObj.damage = enemy.atk;
          }
        }
        if (selectedSkill.type === 'heal') {
          intentObj.damage = 0;
        }
        return intentObj;
      }
    }

    // 默认：普通攻击
    return { type: 'attack', iconKey: 'attack', damage: enemy.atk };
  }, []);

  // --- 开始游戏 ---
  const selectCharacter = useCallback((charId) => {
    const char = CHARACTERS[charId];
    if (!char) return;
    setCurrentCharacter(char);
    const newDeck = generateCharacterDeck(charId);
    setHand([]);
    setDeck(newDeck);
    setDiscardPile([]);
    setPlayer({ hp: char.hp, maxHp: char.maxHp, armor: 0 });
    setRound(1);
    setEnergy(3);
    setAttackBuff(0);
    setPlayerPowers([]);
    const startRelicId = CHAR_STARTING_RELICS[charId];
    const startRelic = startRelicId ? RELICS[startRelicId] : null;
    setRelics(startRelic ? [startRelic] : []);
    phoenixUsedRef.current = false;
    setLog([`🐕 ${char.name}偷偷溜出了门，上海街头大冒险开始啦！`, ...(startRelic ? [`✨ 携带遗物：${startRelic.icon} ${startRelic.name}`] : [])]);
    setSelectedCard(null);
    setEnemies([]);
    const newMap = generateMap(0);
    setGameMap(newMap);
    setCurrentNodeId(null);
    setVisitedNodeIds([]);
    setCurrentAct(0);
    setCurrentMapNode(null);
    setPhase("map");
  }, []);

  const startGame = useCallback(() => {
    setPhase("charSelect");
  }, []);

  const returnToMap = useCallback(() => {
    if (currentMapNode && currentMapNode.type === "boss" && currentAct < 2) {
      const nextAct = currentAct + 1;
      const newMap = generateMap(nextAct);
      setGameMap(newMap);
      setCurrentNodeId(null);
      setVisitedNodeIds([]);
      setCurrentAct(nextAct);
      setCurrentMapNode(null);
      addLog(`🗺️ 进入第${nextAct + 1}章：${newMap.theme.name}！`);
    }
    setPhase("map");
  }, [currentMapNode, currentAct, addLog]);

  const handleMapNodeSelect = useCallback((node) => {
    setCurrentNodeId(node.id);
    setVisitedNodeIds(prev => [...prev, node.id]);
    setCurrentMapNode(node);

    switch (node.type) {
      case 'battle':
      case 'elite':
      case 'boss': {
        const templateIdx = node.enemyIdx != null ? node.enemyIdx : 0;
        const templateEnemies = ENEMY_TEMPLATES[Math.min(templateIdx, ENEMY_TEMPLATES.length - 1)];
        const newEnemies = templateEnemies.map(e => ({
          ...e, poison: 0, frozen: 0,
          nextIntent: calculateNextIntent(e, 1)
        }));

        setTransitionEnemies(newEnemies);
        setBattleTransition(true);
        setPhase("battle");

        setTimeout(() => {
          setEnemies(newEnemies);
          setRound(1);
          setDiscardPile([]);
          setSelectedCard(null);
          setTurnPhase("player");
          firstCardPlayedRef.current = false;
          {
            let bonusArmor = 0;
            let bonusEnergy = 0;
            let maxEnergyBonus = 0;
            let round1DrawBonus = 0;
            for (const r of relicsRef.current) {
              if (r.trigger === "battle_start") {
                if (r.effect.type === "gain_armor") bonusArmor += r.effect.value;
                if (r.effect.type === "energy") bonusEnergy += r.effect.value;
              }
              if (r.trigger === "passive" && r.effect.type === "max_energy") {
                maxEnergyBonus += r.effect.value;
              }
              if (r.trigger === "turn_start") {
                const cond = r.effect.condition;
                if (cond === "round <= 3" || cond === "round === 1" || !cond) {
                  if (r.effect.chance && Math.random() > r.effect.chance) continue;
                  if (r.effect.type === "atk_buff") {
                    setAttackBuff(prev => prev + r.effect.value);
                    addLog(`${r.icon} ${r.name}：攻击+${r.effect.value}`);
                  }
                  if (r.effect.type === "draw") round1DrawBonus += r.effect.value;
                  if (r.effect.type === "gain_armor") {
                    bonusArmor += r.effect.value;
                    addLog(`${r.icon} ${r.name}：获得${r.effect.value}护甲`);
                  }
                  if (r.effect.type === "heal") {
                    setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + r.effect.value) }));
                    addLog(`${r.icon} ${r.name}：回复${r.effect.value}HP`);
                  }
                }
              }
            }
            setEnergy(3 + maxEnergyBonus + bonusEnergy);
            setPlayer(p => ({ ...p, armor: bonusArmor }));
            const extraDraw = round1DrawBonus;
            setHand([]);
            setDeck(prevDeck => {
              let pool = prevDeck.length >= 5 ? prevDeck : [...prevDeck, ...generateCharacterDeck(currentCharRef.current?.id)];
              const totalDraw = 5 + extraDraw;
              const startHand = pool.slice(0, totalDraw);
              setTimeout(() => setHand(startHand), 50);
              return pool.slice(totalDraw);
            });
          }
          setBattleTransition(false);
        }, 1500);
        break;
      }
      case 'rest':
        setPhase("rest");
        break;
      case 'shop':
        setShopCards(generateCharacterRewards(currentCharRef.current?.id, 3));
        setPhase("shop");
        break;
      case 'event': {
        const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
        setCurrentEvent(evt);
        setPhase("event");
        break;
      }
      default:
        setPhase("map");
    }
  }, [calculateNextIntent, addLog]);

  const MAX_HAND = 10;

  // --- 抽牌 ---
  const drawCards = useCallback((count) => {
    setDeck(prevDeck => {
      setHand(prevHand => {
        const currentHandSize = prevHand.length;
        const spaceAvailable = MAX_HAND - currentHandSize;
        if (spaceAvailable <= 0) {
          addLog(`🚫 手牌已满(${MAX_HAND}张)，无法抽牌`);
          return prevHand;
        }

        const toDraw = Math.min(count, spaceAvailable, prevDeck.length);
        const drawn = prevDeck.slice(0, toDraw);

        if (drawn.length > 0) {
          addLog(`🎴 ${currentCharRef.current?.name || '小雪'}抽了 ${drawn.length} 张牌`);
        }

        const tagDraw = (cards, offset = 0) =>
          cards.map((c, i) => ({ ...c, _drawAnim: Date.now(), _drawDelay: (offset + i) * 80 }));

        if (drawn.length < count && drawn.length < spaceAvailable) {
          const extraNeeded = Math.min(count - drawn.length, spaceAvailable - drawn.length);
          const shuffled = [...discardPileRef.current].sort(() => Math.random() - 0.5);
          setDiscardPile([]);
          if (shuffled.length === 0) {
            return [...prevHand, ...tagDraw(drawn)];
          }
          const extra = shuffled.slice(0, extraNeeded);
          addLog(`🔄 牌库用完了，弃牌堆洗入牌库！`);
          setTimeout(() => setDeck(shuffled.slice(extraNeeded)), 0);
          return [...prevHand, ...tagDraw(drawn), ...tagDraw(extra, drawn.length)];
        }

        return [...prevHand, ...tagDraw(drawn)];
      });

      return prevDeck.slice(count);
    });
  }, [addLog]);

  const spawnFlyingCard = useCallback((card, fromEl) => {
    if (!fromEl || !discardPileElRef.current) return;
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = discardPileElRef.current.getBoundingClientRect();
    const id = ++flyIdCounter.current;
    setFlyingCards(prev => [...prev, {
      id, card,
      fromX: fromRect.left + fromRect.width / 2,
      fromY: fromRect.top + fromRect.height / 2,
      toX: toRect.left + toRect.width / 2,
      toY: toRect.top + toRect.height / 2,
    }]);
    setTimeout(() => {
      setFlyingCards(prev => prev.filter(f => f.id !== id));
    }, 400);
  }, []);

  // --- 基因传染 ---
  // --- 敌人行动 ---
  const doEnemyTurn = useCallback(() => {
    setEnemies(prev => {
      const next = prev.map(e => ({ ...e }));
      let totalDmg = 0;
      let skillEffects = [];

      next.forEach(e => {
        if (e.hp <= 0) return;
        if (e.poison > 0) {
          e.hp -= e.poison;
          addLog(`${e.name} 中毒掉了 ${e.poison} 血`);
          e.poison = Math.max(0, e.poison - 1);
        }
        if (e.frozen > 0) {
          e.frozen--;
          addLog(`${e.name} 被冻住了动不了！`);
          return;
        }
        if (e.confused) {
          e.confused = false;
          if (Math.random() < 0.5) {
            addLog(`${e.name} 被迷惑了，原地转圈！`);
            return;
          }
        }
        if (e.hp > 0) {
          let enemyDmg = 0;
          let isNonAttackAction = false; // 非攻击行动（回血/buff/蓄力等）
          const intent = e.nextIntent;
          
          if (intent?.type === 'skill' && intent?.skill) {
            const sk = intent.skill;
            switch (sk.type) {
              case 'multi':
                enemyDmg = sk.dmg * sk.hits;
                skillEffects.push(`${e.name} 使用${sk.name}，连续攻击${sk.hits}次！`);
                break;
              case 'heavy':
                enemyDmg = sk.dmg || e.atk * (sk.dmgMult || 2);
                skillEffects.push(`${e.name} 使用${sk.name}，造成重击！`);
                break;
              case 'bleed':
                enemyDmg = e.atk + (sk.dmg || 0);
                skillEffects.push(`${e.name} 使用${sk.name}，小雪流血了！`);
                e.poison = (e.poison || 0) + (sk.bleedAmt || 2);
                break;
              case 'ultimate':
                enemyDmg = sk.dmg || 10;
                skillEffects.push(`${e.name} 使用${sk.name}，致命一击！`);
                break;
              case 'ranged':
                enemyDmg = sk.dmg || e.atk;
                skillEffects.push(`${e.name} 使用${sk.name}，远程攻击！`);
                break;
              case 'heal':
                isNonAttackAction = true;
                e.hp = Math.min(e.maxHp, e.hp + (sk.healAmt || 5));
                skillEffects.push(`${e.name} 使用${sk.name}，回复了${sk.healAmt || 5}点生命！`);
                break;
              case 'weaken':
                isNonAttackAction = true;
                setAttackBuff(prev => Math.max(-5, prev - (sk.weakenAmt || 2)));
                skillEffects.push(`${e.name} 使用${sk.name}，小雪攻击力降低${sk.weakenAmt || 2}！`);
                break;
              case 'buff':
                isNonAttackAction = true;
                e.armor = (e.armor || 0) + (sk.armorAmt || 5);
                skillEffects.push(`${e.name} 使用${sk.name}，获得了${sk.armorAmt || 5}点护甲！`);
                break;
              case 'stun':
                // 眩晕技能也造成少量伤害
                enemyDmg = Math.floor(e.atk * 0.5);
                skillEffects.push(`${e.name} 使用${sk.name}，小雪被眩晕${sk.stunTurns || 1}回合！`);
                break;
              case 'charge':
                isNonAttackAction = true;
                skillEffects.push(`${e.name} 正在蓄力...`);
                break;
              case 'summon':
                isNonAttackAction = true;
                skillEffects.push(`${e.name} 使用${sk.name}，呼唤援军！`);
                break;
              default:
                enemyDmg = e.atk;
                skillEffects.push(`${e.name} 使用${sk.name}！`);
            }
          } else {
            // 普通攻击
            enemyDmg = e.atk;
            skillEffects.push(`${e.name} 发起普通攻击！`);
          }
          
          totalDmg += enemyDmg;
          // 计算下回合意图（使用当前轮次+1，因为轮次还没更新）
          e.nextIntent = calculateNextIntent(e, round + 1);
        }
        
        e.armor = 0;
      });
      
      skillEffects.forEach(msg => addLog(msg));

      if (totalDmg > 0) {
        const isInvincible = playerStateRef.current.invincible || false;
        const shouldDodge = playerStateRef.current.dodge || false;

        if (isInvincible) {
          addLog(`🐕 无敌！小雪完全免疫了本回合所有伤害！`);
        } else if (shouldDodge) {
          addLog(`👻 闪避！小雪躲开了敌人的攻击！`);
          setPlayer(p => ({ ...p, dodge: false }));
        } else {
        const firstAttacker = next.find(e => e.hp > 0 && e.frozen === 0);
        const bossSoundMap = {
          '坏猫咪': 'catClaw',
          '凶恶泰迪': 'bark',
          '流浪大橘': 'heavy',
          '城管大叔': 'net',
          '恶霸犬': 'biteBoss',
          '小混混': 'stone',
          '⚠️ 捕狗大队队长': 'ultimate',
        };
        playSound(bossSoundMap[firstAttacker?.name] || 'enemyAttack');
        next.forEach((e, idx) => {
          if (e.hp > 0 && e.frozen === 0) {
            setEnemyAnim(prev => ({ ...prev, [idx]: 'attack' }));
            setTimeout(() => {
              setEnemyAnim(prev => ({ ...prev, [idx]: null }));
            }, 400);
          }
        });

        setTimeout(() => {
          playSound('hit');
          setPlayerAnim('hit');
          setTimeout(() => setPlayerAnim(null), 400);
          triggerShake(1);
          const pEl = playerRef.current;
          const pRect = pEl ? pEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight * 0.7, width: 80, height: 80 };
          const pX = pRect.left + pRect.width / 2;
          const pY = pRect.top + pRect.height / 2;
          addDamage(totalDmg, pX, pY, 'normal');
          emitParticles(pX, pY, 'hit', 6);
        }, 200);

        setPlayer(p => {
          const absorbed = Math.min(p.armor, totalDmg);
          const realDmg = totalDmg - absorbed;
          addLog(`🩸 小雪受到 ${totalDmg} 点伤害${absorbed > 0 ? `（护甲挡住${absorbed}点）` : ""}，好疼！`);
          const newHp = p.hp - realDmg;
          if (newHp <= 0) {
            const phoenix = relicsRef.current.find(r => r.id === "phoenix_feather");
            if (phoenix && !phoenixUsedRef.current) {
              phoenixUsedRef.current = true;
              addLog(`🪶 不死鸟羽毛发动！小雪从濒死中复活！`);
              const reviveHp = Math.max(1, Math.floor(p.maxHp * phoenix.effect.percent));
              return { ...p, hp: reviveHp, armor: 0 };
            }
            setTimeout(() => setPhase("gameover"), 500);
          }
          return { ...p, hp: Math.max(0, newHp), armor: Math.max(0, p.armor - absorbed) };
        });
        } // end of else (non-dodge)
      }

      return next.filter(e => e.hp > 0);
    });

    setTimeout(() => {
      setRound(r => r + 1);
      const maxEnergyBonus = getRelicPassiveBonus(relicsRef.current, "max_energy");
      setEnergy(3 + maxEnergyBonus);
      setSelectedCard(null);
      setPlayer(p => ({ ...p, armor: 0 }));
      firstCardPlayedRef.current = false;

      // Apply per-turn power effects
      const powers = playerPowersRef.current;
      let bonusDraw = 0;
      powers.forEach(pw => {
        if (pw.type === "armor_per_turn") {
          setPlayer(p => ({ ...p, armor: p.armor + pw.value }));
          addLog(`🛡 蓬松护甲：回合开始获得${pw.value}护甲`);
        }
        if (pw.type === "heal_per_turn") {
          setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + pw.value) }));
          addLog(`💚 温暖毛毛：回复${pw.value}HP`);
        }
        if (pw.type === "draw_per_turn") {
          bonusDraw += pw.value;
        }
        if (pw.type === "power_buff") {
          setAttackBuff(prev => prev + pw.value);
          addLog(`⚔️ 磨牙棒：攻击力+${pw.value}`);
        }
        if (pw.type === "dmg_per_turn") {
          setEnemies(prev => {
            const alive = prev.filter(e => e.hp > 0);
            if (alive.length === 0) return prev;
            const target = alive[Math.floor(Math.random() * alive.length)];
            addLog(`💥 嗅探：对${target.name}造成${pw.value}伤害`);
            return prev.map(e => e.id === target.id ? { ...e, hp: e.hp - pw.value } : e);
          });
        }
      });

      // Apply turn_start relic effects
      const nextRound = round + 1;
      for (const r of relicsRef.current) {
        if (r.trigger !== "turn_start") continue;
        const cond = r.effect.condition;
        if (cond === "round <= 3" && nextRound > 3) continue;
        if (cond === "round === 1" && nextRound !== 1) continue;
        if (cond === "round % 3 === 0" && nextRound % 3 !== 0) continue;
        if (r.effect.chance && Math.random() > r.effect.chance) continue;

        if (r.effect.type === "atk_buff") {
          setAttackBuff(prev => prev + r.effect.value);
          addLog(`${r.icon} ${r.name}：攻击+${r.effect.value}`);
        }
        if (r.effect.type === "draw") bonusDraw += r.effect.value;
        if (r.effect.type === "gain_armor") {
          setPlayer(p => ({ ...p, armor: p.armor + r.effect.value }));
          addLog(`${r.icon} ${r.name}：获得${r.effect.value}护甲`);
        }
        if (r.effect.type === "heal") {
          setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + r.effect.value) }));
          addLog(`${r.icon} ${r.name}：回复${r.effect.value}HP`);
        }
      }

      drawCards(2 + bonusDraw);
      setTurnPhase("player");
    }, 800);
  }, [addLog, drawCards, triggerShake, addDamage, emitParticles, calculateNextIntent, round, setAttackBuff]);

  useEffect(() => {
    if (turnPhase === "enemy" && phase === "battle" && !enemyTurnLock.current) {
      enemyTurnLock.current = true;
      const timer = setTimeout(() => {
        doEnemyTurn();
        enemyTurnLock.current = false;
      }, 600);
      return () => { clearTimeout(timer); enemyTurnLock.current = false; };
    }
  }, [turnPhase, phase, doEnemyTurn]);

  // --- 检查敌人死亡 ---
  useEffect(() => {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (phase === "battle" && enemies.length > 0 && aliveEnemies.length === 0) {
      setTimeout(() => {
        for (const r of relicsRef.current) {
          if (r.trigger === "battle_end") {
            if (r.effect.type === "heal") {
              setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + r.effect.value) }));
              addLog(`${r.icon} ${r.name}：回复 ${r.effect.value} HP！`);
            }
          }
        }
        if (currentMapNode && currentMapNode.type === "boss" && currentAct >= 2) {
          setPhase("win");
        } else {
          addLog(`🎉 战斗胜利！选择一张卡牌作为奖励吧！`);
          setRewardCards(generateCharacterRewards(currentCharRef.current?.id, 3));
          const relicOffer = getRandomRelic(relicsRef.current.map(r => r.id));
          setRewardRelic(relicOffer);
          setPhase("reward");
        }
      }, 800);
    }
  }, [enemies, phase, currentMapNode, currentAct, addLog]);

  // --- 奖励选卡 / 跳过 ---

  const addRelic = useCallback((relic) => {
    if (relicsRef.current.find(r => r.id === relic.id)) return;
    setRelics(prev => [...prev, relic]);
    addLog(`✨ 获得遗物：${relic.icon} ${relic.name}！`);
    if (relic.trigger === "on_acquire") {
      if (relic.effect.type === "max_hp_up") {
        setPlayer(p => ({ ...p, maxHp: p.maxHp + relic.effect.value, hp: p.hp + relic.effect.value }));
      }
    }
  }, [addLog]);

  const handleEventChoice = useCallback((choice) => {
    const eff = choice.effect;
    switch (eff.type) {
      case "heal":
        setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + eff.value) }));
        addLog(`💚 回复了 ${eff.value} 点生命！`);
        break;
      case "full_heal":
        setPlayer(p => ({ ...p, hp: p.maxHp }));
        addLog(`💚 生命值完全恢复！`);
        break;
      case "max_hp_up":
        setPlayer(p => ({ ...p, maxHp: p.maxHp + eff.value, hp: p.hp + eff.value }));
        addLog(`💪 最大HP +${eff.value}！`);
        break;
      case "buff_attack":
        setAttackBuff(prev => prev + eff.value);
        addLog(`⚔️ 攻击力 +${eff.value}！`);
        break;
      case "gain_armor":
        setPlayer(p => ({ ...p, armor: p.armor + eff.value }));
        addLog(`🛡️ 获得 ${eff.value} 点护甲！`);
        break;
      case "gain_card": {
        const cards = generateCharacterRewards(currentCharRef.current?.id, 1);
        if (cards.length > 0) {
          setDeck(prev => [...prev, cards[0]]);
          addLog(`🎴 获得新卡牌：${cards[0].name}！`);
        }
        break;
      }
      case "trade_hp_card": {
        setPlayer(p => ({ ...p, hp: Math.max(1, p.hp - eff.hpCost) }));
        const cards = generateCharacterRewards(currentCharRef.current?.id, 1);
        if (cards.length > 0) {
          if (eff.strong) cards[0].power += 2;
          setDeck(prev => [...prev, cards[0]]);
          addLog(`💔 失去 ${eff.hpCost} HP，获得卡牌：${cards[0].name}！`);
        }
        break;
      }
      case "trade_hp_buff":
        setPlayer(p => ({ ...p, hp: Math.max(1, p.hp - eff.hpCost) }));
        setAttackBuff(prev => prev + eff.attackBuff);
        addLog(`💔 失去 ${eff.hpCost} HP，攻击力 +${eff.attackBuff}！`);
        break;
      case "gain_relic": {
        const relic = getRandomRelic(relicsRef.current.map(r => r.id));
        if (relic) {
          addRelic(relic);
        } else {
          addLog(`遗物已收集完毕，没有新遗物了`);
        }
        break;
      }
      default:
        addLog(`继续前进……`);
        break;
    }
    setCurrentEvent(null);
    returnToMap();
  }, [addLog, returnToMap, addRelic]);

  const selectRewardCard = useCallback((card) => {
    setDeck(prev => [...prev, card]);
    addLog(`🎁 获得新卡牌：${card.name}！`);
    setRewardCards([]);
    setRewardRelic(null);
    returnToMap();
  }, [addLog, returnToMap]);

  const selectRewardRelic = useCallback((relic) => {
    addRelic(relic);
    setRewardRelic(null);
  }, [addRelic]);

  const skipReward = useCallback(() => {
    addLog(`⏭️ 跳过奖励，继续前进！`);
    setRewardCards([]);
    setRewardRelic(null);
    returnToMap();
  }, [addLog, returnToMap]);

  // --- 打出卡牌 ---
  const executeAttack = useCallback((cardIdx, targetEnemyIdx) => {
    const card = hand[cardIdx];
    if (!card) {
      setSelectedCard(null);
      return;
    }
    const eff = calcCardEffect(card, attackBuff, relicsRef.current);
    // 防御性检查：cost为undefined时默认为1
    const cardCost = card.cost ?? 1;

    const soundMap = {
      '爪击': 'claw',
      '扑咬': 'bite',
      '翻滚攻击': 'roll',
    };
    playSound(soundMap[card.name] || 'attack');
    setPlayerAnim('attack');
    setTimeout(() => setPlayerAnim(null), 500);

    // --- 特效系统触发 ---
    const enemyEl = enemyRefs.current[targetEnemyIdx];
    const enemyRect = enemyEl ? enemyEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 3, width: 100, height: 100 };
    const enemyX = enemyRect.left + enemyRect.width / 2;
    const enemyY = enemyRect.top + enemyRect.height / 2;

    triggerShake(eff.dmg > 10 ? 3 : eff.dmg > 5 ? 2 : 1);
    const dmgType = attackBuff > 0 ? 'buffed' : 'normal';
    addDamage(eff.dmg, enemyX, enemyY, dmgType, attackBuff);
    emitParticles(enemyX, enemyY, 'hit', 10);
    const slashType = card.name === '爪击' ? 'claw' : card.name === '死亡翻滚' ? 'roll' : 'bite';
    triggerSlash(enemyX, enemyY, slashType);
    flashTarget(targetEnemyIdx);
    knockbackTarget(targetEnemyIdx, eff.dmg);
    setHitStop(true);
    setTimeout(() => setHitStop(false), 80);

    let logMsg = `▶ 小雪使用【${card.name}】`;

    setEnemies(prev => {
      const next = prev.map(e => ({ ...e }));
      const target = next[targetEnemyIdx];
      if (target && target.hp > 0) {
        const armored = target.armor || 0;
        const vulnMult = (target.vulnerable || 0) > 0 ? 1.5 : 1;
        const rawDmg = Math.floor(eff.dmg * vulnMult);
        const realDmg = Math.max(0, rawDmg - armored);
        target.hp -= realDmg;
        logMsg += ` → 对${target.name}造成${realDmg}点伤害${vulnMult > 1 ? '(易伤)' : ''}！`;

        setEnemyAnim(prev => ({ ...prev, [targetEnemyIdx]: 'hit' }));
        setTimeout(() => {
          setEnemyAnim(prev => ({ ...prev, [targetEnemyIdx]: null }));
        }, 300);

      }

      // Apply bonus_atk power
      const bonusAtk = playerPowersRef.current.find(pw => pw.type === "bonus_atk");
      if (bonusAtk && target && target.hp > 0) {
        target.hp -= bonusAtk.value;
        logMsg += ` 🦴额外${bonusAtk.value}伤害！`;
      }

      // Apply armor_retaliate power (triggers when player gains armor, but we check on attack for simplicity — actually this should trigger on armor gain, handled elsewhere)

      eff.effects.forEach(ef => {
        const efType = typeof ef === "object" ? ef.type : ef;
        if (efType === "draw") {
          drawCards(1);
          logMsg += " 🎴抽1张牌！";
        }
        if (ef === "draw2") {
          drawCards(2);
          logMsg += " 🎴抽2张牌！";
        }
        if (efType === "poison" && target && target.hp > 0) {
          const pv = ef.value || 2;
          target.poison = (target.poison || 0) + pv;
          const doublePower = playerPowersRef.current.find(pw => pw.type === "poison_double");
          if (doublePower) {
            target.poison = target.poison * 2;
            logMsg += ` 🧪中毒${pv}(翻倍→${target.poison})！`;
          } else {
            logMsg += ` 🧪中毒${pv}！`;
          }
        }
        if (efType === "multi" && target && target.hp > 0) {
          const extraHits = (ef.hits || 2) - 1;
          for (let h = 0; h < extraHits; h++) {
            const armored = target.armor || 0;
            const vMult = (target.vulnerable || 0) > 0 ? 1.5 : 1;
            const hitDmg = Math.max(0, Math.floor(eff.dmg * vMult) - armored);
            target.hp -= hitDmg;
            logMsg += ` ×${hitDmg}`;
          }
          logMsg += `(${ef.hits}连击)！`;
        }
        if (ef === "weaken" || ef === "aoe_weaken") {
          if (ef === "aoe_weaken") {
            next.forEach(e => { if (e.hp > 0) e.atk = Math.max(1, e.atk - 2); });
            logMsg += " 📢全体敌人攻击力-2！";
          } else if (target && target.hp > 0) {
            target.atk = Math.max(1, target.atk - 2);
            logMsg += " 📢敌人攻击力-2！";
          }
        }
        if (ef === "vulnerable" && target && target.hp > 0) {
          target.vulnerable = (target.vulnerable || 0) + 1;
          logMsg += " 💔易伤1回合！";
        }
        if (ef === "aoe_damage") {
          const aoeDmg = eff.dmg;
          next.forEach(e => { if (e.hp > 0 && e !== target) { e.hp -= aoeDmg; logMsg += ` 🌊${e.name}-${aoeDmg}`; } });
        }
        if (ef === "target_lowest") {
          // Already handled by targeting — this is informational
        }
        if (ef === "exhaust") {
          // Card is removed from the game (not added to discard)
          logMsg += " 🔥消耗！";
        }
      });

      return next;
    });

    if (attackBuff > 0) {
      setAttackBuff(0);
    }

    const playedCard = hand[cardIdx];
    const cardEl = handContainerRef.current?.children[cardIdx];
    if (cardEl) spawnFlyingCard(playedCard, cardEl);
    setHand(prev => prev.filter((_, i) => i !== cardIdx));
    const isExhaust = eff.effects.some(e => e === "exhaust");
    if (!isExhaust && playedCard) {
      setDiscardPile(prev => [...prev, playedCard]);
    }
    setEnergy(e => e - cardCost);
    setSelectedCard(null);
    setSelectedAttackTarget(null);
    addLog(logMsg);

    if (!firstCardPlayedRef.current) {
      firstCardPlayedRef.current = true;
      for (const r of relicsRef.current) {
        if (r.trigger === "first_card_played" && r.effect.type === "draw") {
          drawCards(r.effect.value);
          addLog(`${r.icon} ${r.name}：首次出牌抽${r.effect.value}张！`);
        }
      }
    }

    // cards_to_str power: count plays and grant +1 attack
    setPlayerPowers(prev => prev.map(pw => {
      if (pw.type !== "cards_to_str") return pw;
      const newCount = (pw.count || 0) + 1;
      if (newCount >= pw.threshold) {
        setAttackBuff(a => a + 1);
        addLog(`⚡ 速度力量：打出${pw.threshold}张牌，攻击+1！`);
        return { ...pw, count: 0 };
      }
      return { ...pw, count: newCount };
    }));
  }, [hand, attackBuff, addLog, drawCards, playSound, triggerShake, addDamage, emitParticles, triggerSlash, flashTarget, knockbackTarget, triggerBuffGain]);
      executeAttackRef.current = executeAttack;

  const playCard = useCallback((idx) => {
    if (turnPhase !== "player") return;

    const currentHand = handRef.current;
    const card = currentHand[idx];

    if (!card) {
      console.log('Card not found at index', idx, 'hand length:', currentHand.length);
      setSelectedCard(null); // 防御性清除：索引失效时重置选择状态
      return;
    }

    // 防御性检查：cost为undefined时默认为1
    const cardCost = card.cost ?? 1;
    if (energy < cardCost) return;

    const eff = calcCardEffect(card, attackBuff, relicsRef.current);

    // 攻击牌（需要选择目标的牌）：baseType为attack且有效果需要目标
    // 与isAttackCard保持一致：有dmg的攻击牌需要目标，变异攻击牌也需要目标
    if (isAttackCard(idx)) {
      setSelectedCard(idx);
      setSelectedAttackTarget(null);
      return;
    }
    // 非攻击牌（不需要目标）：直接打出生效
    // 包括：defend/heal/buff/skill，以及dmg=0且变异效果为aoe/mega_heal等的攻击牌

    const cardSoundMap = {
      '抱头': 'defend',
      '匍匐': 'defend',
      '躲沙发': 'defend',
      '吃狗粮': 'heal',
      '吃饼干': 'heal',
      '磨牙棒': 'heal',
      '蓄势': 'buff',
      '标记': 'buff',
    };
    const soundType = cardSoundMap[card.name] || (eff.armor > 0 ? 'defend' : eff.heal > 0 ? 'heal' : 'play');
    playSound(soundType);

    if (eff.armor > 0) {
      setPlayerAnim('defend');
      setTimeout(() => setPlayerAnim(null), 500);
      triggerShake(1);
    } else if (eff.heal > 0) {
      setPlayerAnim('heal');
      setTimeout(() => setPlayerAnim(null), 500);
      const pEl = playerRef.current;
      const pRect = pEl ? pEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight * 0.7, width: 80, height: 80 };
      emitParticles(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2, 'heal', 8);
    }

    let logMsg = `▶ 小雪使用【${card.name}】`;

    const pEl = playerRef.current;
    const pRect = pEl ? pEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight * 0.7, width: 80, height: 80 };
    const pPos = { x: pRect.left + pRect.width / 2, y: pRect.top + pRect.height / 2 };

    if (eff.armor > 0) {
      setPlayer(p => ({ ...p, armor: p.armor + eff.armor }));
      logMsg += ` 🛡护甲+${eff.armor}`;
      triggerBuffGain('armor', eff.armor, pPos);
      // Trigger armor_retaliate power
      const retPower = playerPowersRef.current.find(pw => pw.type === "armor_retaliate");
      if (retPower) {
        setEnemies(prev => {
          const alive = prev.filter(e => e.hp > 0);
          if (alive.length === 0) return prev;
          const t = alive[Math.floor(Math.random() * alive.length)];
          logMsg += ` 🦴骨头堆反击${t.name}-${retPower.value}！`;
          return prev.map(e => e.id === t.id ? { ...e, hp: e.hp - retPower.value } : e);
        });
      }
    }
    if (eff.heal > 0) {
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + eff.heal) }));
      logMsg += ` 💚回复${eff.heal}HP`;
      triggerBuffGain('heal', eff.heal, pPos);
    }

    eff.effects.forEach(ef => {
      const efType = typeof ef === "object" ? ef.type : ef;

      if (efType === "buff") {
        setAttackBuff(prev => prev + (ef.value || card.power));
        logMsg += ` ⚔️攻击+${ef.value || card.power}`;
        triggerBuffGain('attack', ef.value || card.power, pPos);
      }
      if (efType === "draw") {
        drawCards(1);
        logMsg += " 🎴抽1张牌！";
      }
      if (ef === "draw2") {
        drawCards(2);
        logMsg += " 🎴抽2张牌！";
      }
      if (ef === "weaken") {
        setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, atk: Math.max(1, e.atk - 2) } : e));
        logMsg += " 📢敌人攻击力-2！";
      }
      if (ef === "aoe_weaken") {
        setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, atk: Math.max(1, e.atk - 2) } : e));
        logMsg += " 📢全体敌人攻击力-2！";
      }
      if (ef === "vulnerable") {
        setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, vulnerable: (e.vulnerable || 0) + 1 } : e));
        logMsg += " 💔敌人易伤1回合！";
      }
      if (ef === "invincible") {
        setPlayer(p => ({ ...p, invincible: true }));
        logMsg += " 🐕本回合无敌！";
      }
      if (ef === "dodge_next") {
        setPlayer(p => ({ ...p, dodge: true }));
        logMsg += " 👻下回合闪避首次攻击！";
      }
      if (ef === "copy_attack") {
        const currentHand = handRef.current;
        const attackCards = currentHand.filter((c, i) => i !== idx && c.baseType === "attack");
        if (attackCards.length > 0) {
          const copied = { ...attackCards[Math.floor(Math.random() * attackCards.length)], id: Date.now() };
          if (card.upgraded) copied.cost = 0;
          setHand(prev => [...prev, copied]);
          logMsg += ` 📋复制了【${copied.name}】！`;
        } else {
          logMsg += " 📋没有可复制的攻击牌";
        }
      }
      if (ef === "armor_to_dmg") {
        const currentArmor = playerStateRef.current.armor;
        if (currentArmor > 0) {
          setEnemies(prev => {
            const alive = prev.filter(e => e.hp > 0);
            if (alive.length === 0) return prev;
            const t = alive[Math.floor(Math.random() * alive.length)];
            logMsg += ` ❄️雪崩！对${t.name}造成${currentArmor}伤害！`;
            return prev.map(e => e.id === t.id ? { ...e, hp: e.hp - currentArmor } : e);
          });
          if (!card.upgraded) {
            setPlayer(p => ({ ...p, armor: 0 }));
          }
        }
      }
      if (ef === "armor_next_turn") {
        const armorVal = card.power;
        setTimeout(() => {
          setPlayer(p => ({ ...p, armor: p.armor + armorVal }));
          addLog(`🛡 滚雪球：下回合额外获得${armorVal}护甲`);
        }, 1000);
      }
      if (ef === "aoe_damage") {
        const aoeDmg = card.power || 3;
        setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, hp: e.hp - aoeDmg } : e));
        logMsg += ` 🌊全体敌人-${aoeDmg}！`;
      }
      if (efType === "poison") {
        const pv = ef.value || 2;
        setEnemies(prev => prev.map(e => {
          if (e.hp <= 0) return e;
          let poisonAmt = pv;
          const doublePower = playerPowersRef.current.find(pw => pw.type === "poison_double");
          if (doublePower) poisonAmt *= 2;
          return { ...e, poison: (e.poison || 0) + poisonAmt };
        }));
        logMsg += ` 🧪中毒${ef.value}！`;
      }
      if (ef === "confuse") {
        if (Math.random() < 0.5) {
          setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, confused: true } : e));
          logMsg += " 🌀敌人被迷惑！";
        } else {
          logMsg += " 🌀但敌人没被迷惑";
        }
      }
      if (ef === "freeze_all") {
        setEnemies(prev => prev.map(e => e.hp > 0 ? { ...e, frozen: (e.frozen || 0) + 1 } : e));
        logMsg += " ❄️敌人被冻结1回合！";
      }
      if (ef === "exhaust") {
        logMsg += " 🔥消耗！";
      }

      // Power card effects — add permanent buffs
      if (efType === "power_buff") {
        setPlayerPowers(prev => [...prev, { type: "power_buff", value: ef.value }]);
        logMsg += ` ⚔️每回合攻击+${ef.value}`;
      }
      if (efType === "dmg_per_turn") {
        setPlayerPowers(prev => [...prev, { type: "dmg_per_turn", value: ef.value }]);
        logMsg += ` 💥每回合对随机敌人造成${ef.value}伤害`;
      }
      if (efType === "bonus_atk") {
        setPlayerPowers(prev => [...prev, { type: "bonus_atk", value: ef.value }]);
        logMsg += ` 🦴每次攻击额外+${ef.value}伤害`;
      }
      if (efType === "armor_per_turn") {
        setPlayerPowers(prev => [...prev, { type: "armor_per_turn", value: ef.value }]);
        logMsg += ` 🛡每回合获得${ef.value}护甲`;
      }
      if (efType === "armor_retaliate") {
        setPlayerPowers(prev => [...prev, { type: "armor_retaliate", value: ef.value }]);
        logMsg += ` 🦴获得护甲时反击${ef.value}伤害`;
      }
      if (efType === "heal_per_turn") {
        setPlayerPowers(prev => [...prev, { type: "heal_per_turn", value: ef.value }]);
        logMsg += ` 💚每回合回复${ef.value}HP`;
      }
      if (efType === "draw_per_turn") {
        setPlayerPowers(prev => [...prev, { type: "draw_per_turn", value: ef.value }]);
        logMsg += ` 🎴每回合额外抽${ef.value}张牌`;
      }
      if (ef === "cards_to_str") {
        setPlayerPowers(prev => [...prev, { type: "cards_to_str", threshold: card.upgraded ? 2 : 3, count: 0 }]);
        logMsg += ` ⚡每打出${card.upgraded ? 2 : 3}张牌获得+1力量`;
      }
      if (ef === "poison_double") {
        setPlayerPowers(prev => [...prev, { type: "poison_double" }]);
        logMsg += " 🧪中毒效果翻倍！";
      }
    });

    addLog(logMsg);
    const playedCard = hand[idx];
    const cardEl = handContainerRef.current?.children[idx];
    if (cardEl) spawnFlyingCard(playedCard, cardEl);
    setHand(prev => prev.filter((_, i) => i !== idx));
    const isExhaust = eff.effects.some(e => e === "exhaust");
    if (!isExhaust && playedCard) {
      setDiscardPile(prev => [...prev, playedCard]);
    }
    setEnergy(e => e - cardCost);
    setSelectedCard(null);

    if (!firstCardPlayedRef.current) {
      firstCardPlayedRef.current = true;
      for (const r of relicsRef.current) {
        if (r.trigger === "first_card_played" && r.effect.type === "draw") {
          drawCards(r.effect.value);
          addLog(`${r.icon} ${r.name}：首次出牌抽${r.effect.value}张！`);
        }
      }
    }

    // cards_to_str power: count plays and grant +1 attack
    setPlayerPowers(prev => prev.map(pw => {
      if (pw.type !== "cards_to_str") return pw;
      const newCount = (pw.count || 0) + 1;
      if (newCount >= pw.threshold) {
        setAttackBuff(a => a + 1);
        addLog(`⚡ 速度力量：打出${pw.threshold}张牌，攻击+1！`);
        return { ...pw, count: 0 };
      }
      return { ...pw, count: newCount };
    }));
  }, [energy, turnPhase, addLog, playSound, attackBuff, drawCards, enemies, triggerShake, emitParticles, triggerBuffGain, isAttackCard]);
  playCardRef.current = playCard;

  // --- 结束回合 ---
  const endTurn = useCallback(() => {
    if (turnPhase !== "player") return;
    addLog(`— 回合${round}结束 —`);
    const cardEls = handContainerRef.current?.querySelectorAll('[data-card-idx]');
    if (cardEls && cardEls.length > 0) {
      const handCopy = [...handRef.current];
      cardEls.forEach((el, i) => {
        setTimeout(() => {
          if (handCopy[i]) spawnFlyingCard(handCopy[i], el);
        }, i * 60);
      });
    }
    setHand(prev => {
      if (prev.length > 0) {
        setDiscardPile(dp => [...dp, ...prev]);
      }
      return [];
    });
    setPlayer(p => ({ ...p, invincible: false }));
    setEnemies(prev => prev.map(e => e.vulnerable > 0 ? { ...e, vulnerable: e.vulnerable - 1 } : e));
    setTurnPhase("enemy");
  }, [turnPhase, round, addLog, spawnFlyingCard]);

  // --- 渲染卡牌 ---
  const renderCard = (card, idx, clickable = false) => {
    return (
      <Card
        key={card.id}
        card={card}
        idx={idx}
        clickable={clickable}
        selectedCard={selectedCard}
        draggingIdx={draggingIdx}
        dragAttackCard={dragAttackCard}
        attackBuff={attackBuff}
        turnPhase={turnPhase}
        mouseDownIdxRef={mouseDownIdxRef}
        mouseDownPosRef={mouseDownPosRef}
        hasDraggedRef={hasDraggedRef}
        isTouchRef={isTouchRef}
        setSelectedCard={setSelectedCard}
        onPlayNonAttack={() => playCard(idx)}
        energy={energy}
        drawAnim={card._drawAnim}
        drawDelay={card._drawDelay}
        onDrawAnimEnd={() => {
          setHand(prev => prev.map((c, i) => i === idx ? { ...c, _drawAnim: undefined, _drawDelay: undefined } : c));
        }}
      />
    );
  };

  // --- 立体怪物渲染 ---
  const renderEnemy3D = (e, i) => {
    const isTargetingMode = selectedCard !== null && isAttackCard(selectedCard);
    return (
      <Enemy
        enemy={e}
        index={i}
        animState={enemyAnim[i]}
        isTargetingMode={isTargetingMode}
        selectedAttackTarget={selectedAttackTarget}
        executeAttack={executeAttack}
        selectedCard={selectedCard}
        dragOverEnemy={dragOverEnemy}
        isDragAttackMode={dragAttackCard !== null}
      />
    );
  };

  // --- 主角状态栏已拆分为 PlayerCharacter 组件 ---

  // --- 行动日志 ---
  const renderLog = () => (
    <div style={{
      position: "fixed", top: "clamp(55px, 10vw, 70px)", right: "clamp(8px, 2vw, 20px)", zIndex: 49,
      width: logCollapsed ? 40 : "clamp(160px, 40vw, 220px)",
      maxHeight: logCollapsed ? 40 : 200,
      background: "rgba(13,17,23,0.95)",
      borderRadius: logCollapsed ? 20 : 12,
      padding: logCollapsed ? 0 : 10,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      border: "1px solid rgba(255,255,255,0.1)",
      overflow: "hidden",
      backdropFilter: "blur(8px)",
      transition: "all 0.3s ease",
      cursor: logCollapsed ? "pointer" : "default",
    }}
    onClick={() => logCollapsed && setLogCollapsed(false)}
    >
      {logCollapsed ? (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--font-lg)",
        }}>
          📜
        </div>
      ) : (
        <>
          <div style={{
            fontSize: "var(--font-sm)", color: "#DEB887",
            marginBottom: 8, borderBottom: "1px solid #374151",
            paddingBottom: 4,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>📜 小雪的冒险日记</span>
            <span
              onClick={(e) => { e.stopPropagation(); setLogCollapsed(true); }}
              style={{ cursor: "pointer", fontSize: "var(--font-md)", color: "#9ca3af", padding: "4px" }}
            >
              −
            </span>
          </div>
          <div ref={logRef} style={{
            overflowY: "auto",
            maxHeight: 140,
            fontSize: "var(--font-sm)", color: "#9ca3af", lineHeight: 1.7,
          }}>
            {log.slice(-10).map((l, i) => (
              <div key={`log-${i}-${l.slice(0, 10)}`} style={{ marginBottom: 2 }}>{l}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // --- MAP SCREEN ---
  if (phase === "map" && gameMap) {
    return (
      <GameMap
        map={gameMap}
        currentNodeId={currentNodeId}
        reachableNodeIds={getReachableNodes(gameMap, currentNodeId)}
        visitedNodeIds={visitedNodeIds}
        onSelectNode={handleMapNodeSelect}
        player={player}
      />
    );
  }

  // --- REST SCREEN ---
  if (phase === "rest") {
    const healAmount = Math.floor(player.maxHp * 0.3);
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #1a2e1a 0%, #0d2e1a 50%, #1a2e1a 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
        gap: "clamp(16px, 4vw, 28px)", padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(48px, 12vw, 72px)", marginBottom: 12 }}>🏕️</div>
          <h2 style={{
            fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800,
            color: "#22c55e", margin: 0,
            textShadow: "0 0 20px rgba(34,197,94,0.4)",
          }}>休息点</h2>
          <p style={{
            color: "#9ca3af", fontSize: "clamp(12px, 2.5vw, 15px)", marginTop: 8, lineHeight: 1.7,
          }}>
            小雪找到了一个安全的角落，可以休息一下
          </p>
          <p style={{ color: "#6b7280", fontSize: "clamp(10px, 2vw, 13px)", marginTop: 4 }}>
            ❤️ {player.hp}/{player.maxHp}
          </p>
        </div>

        <div style={{
          display: "flex", flexDirection: "column", gap: "clamp(10px, 2.5vw, 16px)",
          width: "clamp(260px, 75vw, 400px)",
        }}>
          <button
            onClick={() => {
              setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + healAmount) }));
              addLog(`💚 休息回复了 ${healAmount} 点生命！`);
              returnToMap();
            }}
            style={{
              padding: "clamp(14px, 3vw, 20px)", fontSize: "clamp(14px, 3vw, 17px)", fontWeight: 700,
              background: "linear-gradient(135deg, #166534, #15803d)", color: "#fff",
              border: "2px solid #22c55e44", borderRadius: 14, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            😴 休息 — 回复 {healAmount} HP
          </button>

          <button
            onClick={() => {
              setDeck(prev => {
                if (prev.length === 0) {
                  addLog(`🚫 牌库没有可强化的牌！`);
                  return prev;
                }
                const idx = Math.floor(Math.random() * prev.length);
                const upgraded = [...prev];
                upgraded[idx] = { ...upgraded[idx], power: (upgraded[idx].power || 0) + 2 };
                addLog(`⬆️ ${upgraded[idx].name} 得到了强化！(力量+2)`);
                return upgraded;
              });
              returnToMap();
            }}
            style={{
              padding: "clamp(14px, 3vw, 20px)", fontSize: "clamp(14px, 3vw, 17px)", fontWeight: 700,
              background: "linear-gradient(135deg, #7c2d12, #9a3412)", color: "#fff",
              border: "2px solid #f9731644", borderRadius: 14, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            💪 锻炼 — 随机强化一张牌
          </button>
        </div>
      </div>
    );
  }

  // --- SHOP SCREEN ---
  if (phase === "shop") {
    const removeCost = 8;
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #2e2a1a 0%, #1a1a0d 50%, #2e2a1a 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
        gap: "clamp(16px, 4vw, 28px)", padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(48px, 12vw, 72px)", marginBottom: 12 }}>🏪</div>
          <h2 style={{
            fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800,
            color: "#eab308", margin: 0,
            textShadow: "0 0 20px rgba(234,179,8,0.4)",
          }}>路边小卖部</h2>
          <p style={{ color: "#9ca3af", fontSize: "clamp(11px, 2vw, 14px)", marginTop: 6 }}>
            用生命值交换物品（没有零花钱的小狗只能这样了……）
          </p>
          <p style={{ color: "#6b7280", fontSize: "clamp(10px, 2vw, 13px)", marginTop: 4 }}>
            ❤️ {player.hp}/{player.maxHp}
          </p>
        </div>

        <div style={{ fontSize: "clamp(13px, 2.5vw, 16px)", color: "#eab308", fontWeight: 700 }}>
          🛒 购买卡牌（花费 8 HP）
        </div>
        <div style={{
          display: "flex", gap: "clamp(8px, 2vw, 16px)",
          justifyContent: "center", flexWrap: "wrap",
          maxWidth: "clamp(300px, 85vw, 500px)",
        }}>
          {shopCards.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: "clamp(12px, 2.5vw, 15px)", padding: "20px 0" }}>
              已售罄
            </div>
          ) : shopCards.map((card) => {
            const eff = calcCardEffect(card, 0, relicsRef.current);
            const canBuy = player.hp > 8;
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (!canBuy) return;
                  setPlayer(p => ({ ...p, hp: p.hp - 8 }));
                  setDeck(prev => [...prev, { ...card }]);
                  setShopCards(prev => prev.filter(c => c.id !== card.id));
                  addLog(`🏪 花费 8 HP 购买了 ${card.name}！`);
                }}
                style={{
                  width: "clamp(90px, 20vw, 120px)",
                  minHeight: "clamp(110px, 26vw, 150px)",
                  borderRadius: 12,
                  border: canBuy ? "2px solid #eab30866" : "2px solid #374151",
                  background: canBuy
                    ? "linear-gradient(135deg, #2e2a1a, #1a1a0d)"
                    : "linear-gradient(135deg, #1a1a1a, #111)",
                  padding: "clamp(6px, 1.5vw, 10px)",
                  cursor: canBuy ? "pointer" : "not-allowed",
                  opacity: canBuy ? 1 : 0.5,
                  transition: "all 0.25s ease",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "clamp(3px, 0.8vw, 6px)", textAlign: "center",
                }}
                onMouseEnter={e => { if (canBuy) e.currentTarget.style.transform = "translateY(-8px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              >
                <img src={card.image} alt={card.name} draggable="false" style={{
                  width: "clamp(40px, 10vw, 56px)", height: "clamp(40px, 10vw, 56px)", objectFit: "contain",
                  pointerEvents: "none",
                }} />
                <div style={{ fontSize: "clamp(11px, 2.5vw, 14px)", fontWeight: 700, color: "#fff" }}>{card.name}</div>
                <div style={{ fontSize: "clamp(9px, 1.8vw, 11px)", color: "#eab308" }}>
                  {card.baseType === "attack" ? `⚔️ ${eff.dmg}伤害` :
                   card.baseType === "defend" ? `🛡 ${eff.armor}护甲` :
                   card.baseType === "heal" ? `💚 ${eff.heal}回血` :
                   `✨ ${card.desc}`}
                </div>
                <div style={{ fontSize: "clamp(9px, 1.8vw, 11px)", color: "#ef4444" }}>💔 8 HP</div>
              </div>
            );
          })}
        </div>

        <div style={{
          width: "clamp(260px, 75vw, 400px)",
          display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)",
        }}>
          <button
            onClick={() => {
              if (player.hp <= removeCost) { addLog(`🚫 HP不足，无法移除卡牌！`); return; }
              setDeck(prev => {
                if (prev.length <= 3) { addLog(`🚫 牌太少了，不能再移除！`); return prev; }
                const idx = Math.floor(Math.random() * prev.length);
                const removed = prev[idx];
                addLog(`🗑️ 花费 ${removeCost} HP 移除了 ${removed.name}！`);
                setPlayer(p => ({ ...p, hp: p.hp - removeCost }));
                return prev.filter((_, i) => i !== idx);
              });
            }}
            style={{
              padding: "clamp(12px, 2.5vw, 16px)", fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 600,
              background: "linear-gradient(135deg, #7f1d1d, #991b1b)", color: "#fca5a5",
              border: "2px solid #ef444444", borderRadius: 12, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            🗑️ 随机移除一张牌 — 花费 {removeCost} HP
          </button>

          <button
            onClick={() => returnToMap()}
            style={{
              padding: "clamp(10px, 2vw, 14px)", fontSize: "clamp(12px, 2.5vw, 15px)", fontWeight: 600,
              background: "transparent", color: "#6b7280",
              border: "1px solid #374151", borderRadius: 10, cursor: "pointer",
            }}
          >
            离开商店 →
          </button>
        </div>
      </div>
    );
  }

  // --- CHARACTER SELECT ---
  if (phase === "charSelect") {
    const chars = Object.values(CHARACTERS);
    return (
      <div style={{
        minHeight: "100dvh", background: "linear-gradient(135deg, #1a1a2e, #2d1b4e, #1a1a2e)",
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
        padding: "clamp(16px, 4vw, 32px)", gap: "clamp(12px, 3vw, 24px)",
      }}>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 900, color: "#DEB887", margin: 0, textShadow: "0 0 30px #DEB88744" }}>
          选择你的伙伴
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "clamp(11px, 2vw, 14px)", margin: 0 }}>每只狗狗都有独特的卡牌和战斗风格</p>

        <div style={{
          display: "flex", gap: "clamp(8px, 2vw, 16px)", flexWrap: "wrap", justifyContent: "center",
          maxWidth: 900, width: "100%",
        }}>
          {chars.map(char => {
            const sampleCards = char.cardPool.filter(c => c.rarity !== "common").slice(0, 3);
            if (sampleCards.length < 3) sampleCards.push(...char.cardPool.filter(c => c.rarity === "common").slice(0, 3 - sampleCards.length));
            return (
              <div key={char.id} style={{
                flex: "1 1 clamp(200px, 28vw, 260px)", maxWidth: 280,
                background: "rgba(255,255,255,0.05)", borderRadius: 16,
                border: `2px solid ${char.color}33`,
                padding: "clamp(12px, 3vw, 20px)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(6px, 1.5vw, 12px)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = char.color; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${char.color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${char.color}33`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              onClick={() => selectCharacter(char.id)}
              >
                <img src={char.image} alt={char.name} style={{
                  width: "clamp(60px, 16vw, 90px)", height: "clamp(60px, 16vw, 90px)",
                  objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 900, color: char.color }}>{char.name}</div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 13px)", color: "#9ca3af" }}>{char.breed}</div>
                </div>
                <div style={{ fontSize: "clamp(10px, 1.8vw, 12px)", color: "#d4d4d4", textAlign: "center", lineHeight: 1.4 }}>
                  {char.description}
                </div>
                <div style={{
                  display: "flex", gap: "clamp(6px, 1.5vw, 10px)", fontSize: "clamp(10px, 2vw, 13px)",
                  color: "#e5e7eb",
                }}>
                  <span>❤️ {char.hp}</span>
                  <span style={{ color: "#6b7280" }}>|</span>
                  <span>{char.startingRelic.icon} {char.startingRelic.name}</span>
                </div>
                <div style={{ fontSize: "clamp(9px, 1.6vw, 11px)", color: "#9ca3af", textAlign: "center" }}>
                  {char.startingRelic.desc}
                </div>

                {/* Sample cards */}
                <div style={{ display: "flex", gap: "clamp(3px, 0.8vw, 6px)", marginTop: 4 }}>
                  {sampleCards.map((c, i) => (
                    <div key={i} style={{
                      width: "clamp(50px, 12vw, 70px)", padding: "clamp(3px, 0.8vw, 6px)",
                      background: c.type === "attack" ? "rgba(239,68,68,0.15)" : c.type === "skill" ? "rgba(59,130,246,0.15)" : "rgba(168,85,247,0.15)",
                      borderRadius: 6, textAlign: "center",
                      border: `1px solid ${c.type === "attack" ? "#ef444444" : c.type === "skill" ? "#3b82f644" : "#a855f744"}`,
                    }}>
                      <div style={{ fontSize: "clamp(7px, 1.3vw, 9px)", color: "#fff", fontWeight: 700 }}>{c.name}</div>
                      <div style={{
                        fontSize: "clamp(6px, 1.1vw, 8px)",
                        color: c.type === "attack" ? "#ef4444" : c.type === "skill" ? "#3b82f6" : "#a855f7",
                      }}>
                        {c.type === "attack" ? "⚔️" : c.type === "skill" ? "🛡" : "✨"} {c.power > 0 ? c.power : ""}
                      </div>
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: 4, padding: "clamp(6px, 1.5vw, 10px) clamp(16px, 4vw, 32px)",
                  fontSize: "clamp(12px, 2.5vw, 15px)", fontWeight: 800,
                  background: `linear-gradient(135deg, ${char.color}, ${char.color}cc)`,
                  color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                  boxShadow: `0 4px 15px ${char.color}44`,
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                onClick={(e) => { e.stopPropagation(); selectCharacter(char.id); }}
                >
                  选择 {char.name}
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={() => setPhase("title")} style={{
          marginTop: 4, padding: "clamp(6px, 1.5vw, 10px) clamp(16px, 4vw, 28px)",
          fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 600,
          background: "transparent", color: "#6b7280", border: "1px solid #374151",
          borderRadius: 8, cursor: "pointer",
        }}>
          返回
        </button>
      </div>
    );
  }

  // --- TITLE SCREEN ---
  if (phase === "title") {
    return (
      <div style={{
        minHeight: "100dvh", background: "linear-gradient(135deg, #1a1a2e, #2d1b4e, #1a1a2e)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb", gap: "clamp(10px, 3vw, 20px)",
        padding: "clamp(16px, 4vw, 32px)",
      }}>
        <img src="/images/站立雪纳瑞.png" alt="小雪" style={{ width: "clamp(80px, 20vw, 120px)", height: "clamp(80px, 20vw, 120px)", objectFit: "contain" }} />
        <h1 style={{ fontSize: "clamp(28px, 7vw, 42px)", fontWeight: 900, color: "#DEB887", margin: 0, textShadow: "0 0 40px #DEB88744" }}>
          小雪闯上海
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "clamp(12px, 2.5vw, 15px)", maxWidth: "clamp(280px, 80vw, 400px)", textAlign: "center", lineHeight: 1.7 }}>
          雪纳瑞小雪趁主人不注意，偷偷溜出了门。<br />
          上海街头危机四伏，坏猫咪、恶霸犬、城管大叔……<br />
          小雪能平安回家吗？
        </p>
        <div style={{
          display: "flex", gap: "clamp(6px, 1.5vw, 12px)", fontSize: "clamp(10px, 1.8vw, 12px)", color: "#6b7280",
          background: "#111827", padding: "clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)", borderRadius: 12,
          flexWrap: "wrap", justifyContent: "center",
        }}>
          <span>🐾 爪击扑咬翻滚</span>
          <span>🛡 抱头匍匐躲沙发</span>
          <span>🍖 狗粮饼干磨牙棒</span>
        </div>
        <button
          onClick={startGame}
          style={{
            marginTop: "clamp(8px, 2vw, 12px)", padding: "clamp(10px, 2vw, 14px) clamp(24px, 6vw, 48px)", fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 800,
            background: "linear-gradient(135deg, #D2691E, #8B4513)", color: "#fff",
            border: "none", borderRadius: 12, cursor: "pointer",
            boxShadow: "0 0 30px #D2691E44",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          onTouchStart={e => e.currentTarget.style.transform = "scale(0.95)"}
          onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
        >
          出发冒险！🦴
        </button>
      </div>
    );
  }

  // --- GAME OVER ---
  if (phase === "gameover") {
    return (
      <div style={{
        minHeight: "100dvh", background: "linear-gradient(135deg, #1a0a0a, #2e0a0a)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb", gap: "clamp(10px, 3vw, 20px)",
        padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{ fontSize: "clamp(40px, 10vw, 64px)" }}>😢</div>
        <h2 style={{ fontSize: "clamp(22px, 5vw, 32px)", color: "#ef4444", margin: 0 }}>小雪被抓住了……</h2>
        <p style={{ color: "#9ca3af", fontSize: "clamp(12px, 2vw, 15px)" }}>在第 {currentAct + 1} 章中败下阵来</p>
        <button onClick={startGame} style={{
          marginTop: "clamp(8px, 2vw, 12px)", padding: "clamp(8px, 2vw, 12px) clamp(20px, 5vw, 36px)", fontSize: "clamp(13px, 2.5vw, 16px)", fontWeight: 700,
          background: "#D2691E", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
          transition: "transform 0.15s ease",
        }}
        onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          再试一次 🐕
        </button>
      </div>
    );
  }

  // --- WIN ---
  if (phase === "win") {

    return (
      <div style={{
        minHeight: "100dvh", background: "linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #98FB98 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#333", gap: "clamp(10px, 3vw, 20px)",
        overflow: "hidden", position: "relative", padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{
          position: "absolute", top: "10%", left: "10%", fontSize: "clamp(28px, 8vw, 40px)",
          animation: "float 3s ease-in-out infinite", opacity: 0.8,
        }}>☁️</div>
        <div style={{
          position: "absolute", top: "15%", right: "15%", fontSize: "clamp(35px, 10vw, 50px)",
          animation: "float 4s ease-in-out infinite 0.5s", opacity: 0.7,
        }}>☁️</div>
        <div style={{
          position: "absolute", top: "8%", left: "50%", fontSize: "clamp(24px, 7vw, 35px)",
          animation: "float 3.5s ease-in-out infinite 1s", opacity: 0.6,
        }}>☁️</div>

        <div style={{
          position: "absolute", top: "5%", right: "10%", fontSize: "clamp(40px, 12vw, 60px)",
          animation: "spin 10s linear infinite",
        }}>☀️</div>

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
          background: "linear-gradient(to top, #228B22, #32CD32)",
        }} />

        <div style={{
          position: "absolute", bottom: "25%", right: "10%", fontSize: "clamp(60px, 18vw, 100px)",
          animation: "bounce 2s ease-in-out infinite",
        }}>🏠</div>

        <div style={{
          position: "absolute", bottom: "28%", left: "-100px",
          fontSize: "clamp(40px, 12vw, 60px)",
          animation: "runHome 4s ease-out forwards",
        }}>🐕</div>

        <div style={{
          position: "absolute", bottom: "25%", left: 0, right: 0,
          display: "flex", justifyContent: "space-around", opacity: 0.5,
        }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{
              fontSize: "var(--font-xl)",
              animation: `fadeIn 0.5s ease ${i * 0.5}s forwards`,
              opacity: 0,
            }}>🐾</span>
          ))}
        </div>

        <div style={{
          position: "relative", zIndex: 10,
          textAlign: "center", marginTop: -100,
        }}>
          <h2 style={{
            fontSize: "clamp(28px, 6vw, 42px)", color: "#228B22", margin: 0,
            textShadow: "2px 2px 4px rgba(255,255,255,0.8)",
            animation: "fadeInUp 1s ease 3s forwards",
            opacity: 0,
          }}>小雪平安回家啦！</h2>
          <p style={{
            color: "#555", fontSize: "clamp(13px, 2.5vw, 16px)", marginTop: "var(--gap-md)",
            animation: "fadeInUp 1s ease 3.5s forwards",
            opacity: 0,
          }}>打败了所有坏人，是条勇敢的小狗！</p>
        </div>

        <button onClick={startGame} style={{
          marginTop: "clamp(10px, 2vw, 20px)", padding: "clamp(10px, 2vw, 14px) clamp(20px, 5vw, 40px)", fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 700,
          background: "linear-gradient(135deg, #D2691E, #FF8C00)", color: "#fff",
          border: "none", borderRadius: 30, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(210,105,30,0.4)",
          animation: "fadeInUp 1s ease 4.5s forwards",
          opacity: 0, zIndex: 10,
          transition: "transform 0.15s ease",
        }}
        onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          再玩一次 🦴
        </button>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes runHome {
            0% { left: -100px; transform: scaleX(1); }
            100% { left: 75%; transform: scaleX(1); }
          }
          @keyframes fadeIn {
            to { opacity: 0.5; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // --- REWARD SCREEN ---
  if (phase === "reward") {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #1a1a2e 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
        gap: "clamp(16px, 4vw, 28px)", padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(32px, 8vw, 48px)", marginBottom: 8 }}>🎁</div>
          <h2 style={{
            fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800,
            color: "#fbbf24", margin: 0,
            textShadow: "0 0 20px rgba(251,191,36,0.4)",
          }}>战斗胜利！选择奖励</h2>
          <p style={{ color: "#9ca3af", fontSize: "clamp(11px, 2vw, 14px)", marginTop: 6 }}>
            选择一张卡牌加入你的牌库
          </p>
        </div>

        <div style={{
          display: "flex", gap: "clamp(12px, 3vw, 24px)",
          justifyContent: "center", flexWrap: "wrap",
          maxWidth: "clamp(300px, 85vw, 600px)",
        }}>
          {rewardCards.map((card) => {
            const eff = calcCardEffect(card, 0, relicsRef.current);
            const typeColors = { attack: "#ef4444", defend: "#3b82f6", heal: "#22c55e", buff: "#f59e0b", skill: "#a855f7" };
            return (
              <div
                key={card.id}
                onClick={() => selectRewardCard(card)}
                style={{
                  width: "clamp(100px, 22vw, 140px)",
                  minHeight: "clamp(140px, 32vw, 200px)",
                  borderRadius: 14,
                  border: "2px solid #374151",
                  background: card.baseType === "attack"
                    ? "linear-gradient(135deg, #3d1f1f, #2a1515)"
                    : card.baseType === "defend"
                      ? "linear-gradient(135deg, #1f2d3d, #151f2a)"
                      : card.baseType === "heal"
                        ? "linear-gradient(135deg, #1f3d1f, #152a15)"
                        : card.baseType === "buff"
                          ? "linear-gradient(135deg, #3d3d1f, #2a2a15)"
                          : "linear-gradient(135deg, #1a1a2e, #16213e)",
                  padding: "clamp(8px, 2vw, 12px)",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "clamp(4px, 1vw, 8px)",
                  position: "relative",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-12px) scale(1.08)";
                  e.currentTarget.style.boxShadow = `0 8px 32px ${typeColors[card.baseType]}66`;
                  e.currentTarget.style.borderColor = typeColors[card.baseType];
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
                  e.currentTarget.style.borderColor = "#374151";
                }}
                onTouchStart={e => {
                  e.currentTarget.style.transform = "scale(0.95)";
                }}
                onTouchEnd={e => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {/* 费用球 */}
                <div style={{
                  position: "absolute", top: -6, left: -6,
                  width: "clamp(20px, 5vw, 26px)", height: "clamp(20px, 5vw, 26px)",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, #60a5fa, #2563eb, #1d4ed8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "clamp(11px, 2.8vw, 14px)", fontWeight: 900, color: "#fff",
                  border: "2px solid #93c5fd",
                  boxShadow: "0 0 6px rgba(59,130,246,0.6)",
                  zIndex: 5,
                }}>
                  {card.cost}
                </div>

                {/* 卡牌图片 */}
                <div style={{
                  width: "clamp(50px, 12vw, 70px)", height: "clamp(50px, 12vw, 70px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img src={card.image} alt={card.name} draggable="false" style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                    pointerEvents: "none",
                  }} />
                </div>

                {/* 卡牌名称 */}
                <div style={{
                  fontSize: "clamp(11px, 2.5vw, 14px)", fontWeight: 700,
                  color: "#fff", textAlign: "center",
                }}>{card.name}</div>

                {/* 类型标签 + 数值 */}
                <div style={{
                  fontSize: "clamp(10px, 2vw, 12px)",
                  color: typeColors[card.baseType], fontWeight: 600,
                }}>
                  {card.baseType === "attack" ? `⚔️ ${eff.dmg} 伤害` :
                   card.baseType === "defend" ? `🛡 ${eff.armor} 护甲` :
                   card.baseType === "heal" ? `💚 ${eff.heal} 回血` :
                   card.baseType === "buff" ? `✨ ${card.desc}` :
                   `🎯 ${card.desc}`}
                </div>

              </div>
            );
          })}
        </div>

        {rewardRelic && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: "clamp(11px, 2vw, 14px)", marginBottom: 8 }}>
              获得遗物
            </p>
            <div
              onClick={() => selectRewardRelic(rewardRelic)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)",
                background: rewardRelic.rarity === "rare"
                  ? "linear-gradient(135deg, #3d2f0a, #2a1f05)"
                  : rewardRelic.rarity === "uncommon"
                    ? "linear-gradient(135deg, #0a2a3d, #051f2a)"
                    : "linear-gradient(135deg, #1a1a2e, #16213e)",
                border: rewardRelic.rarity === "rare"
                  ? "2px solid #fbbf24"
                  : rewardRelic.rarity === "uncommon"
                    ? "2px solid #60a5fa"
                    : "2px solid #374151",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: rewardRelic.rarity === "rare"
                  ? "0 0 20px rgba(251,191,36,0.3)"
                  : "0 4px 16px rgba(0,0,0,0.4)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span style={{ fontSize: "clamp(24px, 6vw, 36px)" }}>{rewardRelic.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{
                  fontSize: "clamp(12px, 2.5vw, 15px)", fontWeight: 700,
                  color: rewardRelic.rarity === "rare" ? "#fbbf24" : rewardRelic.rarity === "uncommon" ? "#60a5fa" : "#d1d5db",
                }}>{rewardRelic.name}</div>
                <div style={{
                  fontSize: "clamp(10px, 2vw, 12px)", color: "#9ca3af",
                }}>{rewardRelic.desc}</div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={skipReward}
          style={{
            padding: "clamp(8px, 2vw, 12px) clamp(20px, 5vw, 32px)",
            fontSize: "clamp(12px, 2.5vw, 15px)", fontWeight: 600,
            background: "transparent", color: "#6b7280",
            border: "1px solid #374151", borderRadius: 10, cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#e5e7eb";
            e.currentTarget.style.borderColor = "#6b7280";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.borderColor = "#374151";
          }}
        >
          跳过奖励 →
        </button>

        {/* 当前状态 */}
        <div style={{
          fontSize: "clamp(10px, 1.8vw, 12px)", color: "#4b5563",
          display: "flex", gap: 12,
        }}>
          <span>❤️ {player.hp}/{player.maxHp}</span>
          <span>🎴 牌库 {deck.length} 张</span>
          <span>📍 第 {currentAct + 1} 章</span>
        </div>
      </div>
    );
  }

  // --- EVENT SCREEN ---
  if (phase === "event" && currentEvent) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #1a1a2e 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
        gap: "clamp(16px, 4vw, 28px)", padding: "clamp(16px, 4vw, 32px)",
      }}>
        <div style={{ textAlign: "center", maxWidth: "clamp(300px, 80vw, 500px)" }}>
          <div style={{ fontSize: "clamp(40px, 10vw, 56px)", marginBottom: 12 }}>
            {currentEvent.title.split(" ")[0]}
          </div>
          <h2 style={{
            fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800,
            color: "#c084fc", margin: 0,
            textShadow: "0 0 20px rgba(192,132,252,0.4)",
          }}>{currentEvent.title}</h2>
          <p style={{
            color: "#d1d5db", fontSize: "clamp(12px, 2.5vw, 15px)",
            marginTop: 12, lineHeight: 1.7,
          }}>
            {currentEvent.desc}
          </p>
        </div>

        <div style={{
          display: "flex", flexDirection: "column",
          gap: "clamp(8px, 2vw, 14px)",
          width: "clamp(260px, 75vw, 420px)",
        }}>
          {currentEvent.choices.map((choice, ci) => (
            <button
              key={`evt-choice-${ci}`}
              onClick={() => handleEventChoice(choice)}
              style={{
                padding: "clamp(12px, 3vw, 18px) clamp(16px, 4vw, 24px)",
                fontSize: "clamp(13px, 2.5vw, 16px)", fontWeight: 600,
                background: "linear-gradient(135deg, #1e293b, #334155)",
                color: "#e5e7eb",
                border: "2px solid #475569", borderRadius: 12, cursor: "pointer",
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#c084fc";
                e.currentTarget.style.background = "linear-gradient(135deg, #2d1b4e, #1e293b)";
                e.currentTarget.style.transform = "translateX(6px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#475569";
                e.currentTarget.style.background = "linear-gradient(135deg, #1e293b, #334155)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
              onTouchStart={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
              onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={{
          fontSize: "clamp(10px, 1.8vw, 12px)", color: "#4b5563",
          display: "flex", gap: 12, marginTop: 8,
        }}>
          <span>❤️ {player.hp}/{player.maxHp}</span>
          <span>🛡️ {player.armor}</span>
          <span>📍 第 {currentAct + 1} 章</span>
        </div>
      </div>
    );
  }

  // --- BATTLE SCREEN ---
  return (
    <div style={{
      minHeight: "100dvh", background: "linear-gradient(180deg, #1a1a2e 0%, #0d1117 50%, #1a1a2e 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e5e7eb",
      display: "flex", flexDirection: "column", padding: "clamp(8px, 2vw, 16px)", gap: "clamp(6px, 1.5vw, 12px)",
      overflow: "visible",
      ...shakeStyle,
      animationPlayState: hitStop ? 'paused' : 'running',
    }}>
      {/* 战斗进入过渡动画 */}
      {battleTransition && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.95)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "clamp(12px, 3vw, 24px)",
          animation: "battleTransitionIn 1.5s ease-out forwards",
        }}>
          <div style={{
            display: "flex", gap: "clamp(12px, 3vw, 24px)", alignItems: "center", justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {transitionEnemies.map((e, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                animation: `battleEnemyReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.3 + i * 0.15}s both`,
              }}>
                <div style={{
                  width: "clamp(80px, 18vw, 140px)", height: "clamp(80px, 18vw, 140px)",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, rgba(239,68,68,0.3), rgba(0,0,0,0.8))",
                  border: "3px solid rgba(239,68,68,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 30px rgba(239,68,68,0.3)",
                  overflow: "hidden",
                }}>
                  <img src={e.image} alt={e.name} draggable="false" style={{
                    width: "85%", height: "85%", objectFit: "contain",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
                    pointerEvents: "none",
                  }} />
                </div>
                <div style={{
                  color: "#ef4444", fontSize: "clamp(14px, 3vw, 20px)", fontWeight: 800,
                  textShadow: "0 0 15px rgba(239,68,68,0.6), 0 2px 4px rgba(0,0,0,0.8)",
                  letterSpacing: 2,
                }}>{e.name}</div>
                <div style={{
                  color: "#9ca3af", fontSize: "var(--font-sm)",
                }}>HP {e.hp} / ATK {e.atk}</div>
              </div>
            ))}
          </div>
          <div style={{
            color: "#fbbf24", fontSize: "clamp(24px, 6vw, 42px)", fontWeight: 900,
            letterSpacing: 6, textShadow: "0 0 20px rgba(251,191,36,0.5), 0 4px 8px rgba(0,0,0,0.8)",
            animation: "battleTextFlash 0.8s ease-out 0.8s both",
          }}>
            BATTLE START
          </div>
        </div>
      )}

      {/* 关卡信息 */}
      <div style={{
        position: "absolute", top: "clamp(12px, 2vw, 20px)", left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(3px, 0.8vw, 6px)",
        zIndex: 40,
      }}>
        <div style={{
          fontSize: "var(--font-lg)", fontWeight: 800, color: "#DEB887",
          letterSpacing: 3, textShadow: "0 0 2px #000, 0 0 4px #000, 0 2px 6px rgba(0,0,0,0.6), 0 0 20px rgba(222,184,135,0.3)",
        }}>
          {gameMap ? gameMap.theme.name : "上海街头"} · 第 {currentAct + 1} 章
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "clamp(6px, 1.5vw, 12px)",
          background: "rgba(0,0,0,0.35)", padding: "clamp(3px, 0.8vw, 5px) clamp(8px, 2vw, 18px)", borderRadius: 20,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: "var(--font-sm)", color: "#9ca3af", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>回合 {round}</span>
          <span style={{ fontSize: "var(--font-sm)", color: "#fbbf24", textShadow: "0 0 6px rgba(251,191,36,0.4)" }}>⚡ {energy}/{maxEnergy}</span>
        </div>
        <div style={{
          width: "clamp(120px, 25vw, 200px)", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
        }}>
          <div style={{
            width: `${((currentAct + 1) / 3) * 100}%`,
            height: "100%", background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
            borderRadius: 2, transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* 设置按钮 */}
      <div style={{ position: "absolute", top: "clamp(12px, 2vw, 20px)", right: "clamp(12px, 2vw, 20px)", zIndex: 50 }}>
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          style={{
            width: "clamp(32px, 5vw, 40px)", height: "clamp(32px, 5vw, 40px)", borderRadius: "50%",
            background: "linear-gradient(135deg, #374151, #1f2937)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: "clamp(14px, 2.5vw, 18px)",
            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.15s ease",
          }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.9)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          ⚙️
        </button>
        {settingsOpen && (
          <div style={{
            position: "absolute", top: 50, right: 0,
            background: "rgba(13,17,23,0.98)", borderRadius: 12,
            padding: 8, minWidth: "clamp(120px, 20vw, 140px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <button
              onClick={() => { setShowGuide(true); setSettingsOpen(false); }}
              style={{
                width: "100%", padding: "var(--gap-md) var(--gap-md)", fontSize: "var(--font-sm)",
                background: "transparent", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer",
                textAlign: "left", display: "flex", alignItems: "center", gap: "var(--gap-md)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onTouchStart={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onTouchEnd={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              📖 图鉴
            </button>
            <button
              onClick={() => { if (confirm("确定要退出游戏吗？")) window.location.reload(); }}
              style={{
                width: "100%", padding: "var(--gap-md) var(--gap-md)", fontSize: "var(--font-sm)",
                background: "transparent", color: "#ef4444",
                border: "none", borderRadius: 8, cursor: "pointer",
                textAlign: "left", display: "flex", alignItems: "center", gap: "var(--gap-md)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onTouchStart={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
              onTouchEnd={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              🚪 退出游戏
            </button>
          </div>
        )}
      </div>

      {/* 图鉴弹窗 */}
      {showGuide && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }} onClick={() => setShowGuide(false)}>
          <div style={{
            width: "clamp(280px, 85vw, 680px)", maxHeight: "85vh", background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            borderRadius: "clamp(12px, 2vw, 20px)", padding: "clamp(12px, 2.5vw, 24px)", overflow: "auto",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--gap-lg)" }}>
              <h2 style={{ color: "#DEB887", fontSize: "clamp(16px, 4vw, 22px)", margin: 0 }}>📖 小雪技能图鉴</h2>
              <button onClick={() => setShowGuide(false)} style={{
                fontSize: "var(--font-xl)", color: "#6b7280", background: "none", border: "none", cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
              onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.85)"; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >✕</button>
            </div>

            <div style={{ marginBottom: "var(--gap-lg)" }}>
              <h3 style={{ color: "#3b82f6", fontSize: "var(--font-lg)", marginBottom: "var(--gap-md)" }}>🃏 {currentCharacter?.name || "角色"}的卡牌</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(60px, 18vw, 100px), 1fr))", gap: "var(--gap-sm)" }}>
                {(currentCharacter?.cardPool || []).map((c, i) => {
                  const typeIcon = c.type === "attack" ? "⚔️" : c.type === "skill" ? "🛡️" : "✨";
                  const typeColor = c.type === "attack" ? "#ef4444" : c.type === "skill" ? "#3b82f6" : "#f59e0b";
                  const rarityLabel = c.rarity === "rare" ? "★★★" : c.rarity === "uncommon" ? "★★" : "★";
                  return (
                    <div key={`deck-${c.id}-${i}`} style={{
                      background: "rgba(255,255,255,0.05)", padding: "var(--gap-md)", borderRadius: 8, textAlign: "center",
                    }}>
                      <div style={{ fontSize: "clamp(14px, 3vw, 18px)", marginBottom: "var(--gap-sm)" }}>{typeIcon}</div>
                      <div style={{ color: "#fff", fontSize: "var(--font-xs)" }}>{c.name}</div>
                      <div style={{ color: typeColor, fontSize: "clamp(7px, 1.2vw, 9px)" }}>
                        {typeIcon}{c.power > 0 ? c.power : ""}
                        <span style={{ color: "#6b7280" }}> {rarityLabel}</span>
                      </div>
                      {c.desc && <div style={{ color: "#9ca3af", fontSize: "clamp(6px, 1vw, 7px)", marginTop: 2 }}>{c.desc}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "var(--gap-lg)" }}>
              <h3 style={{ color: "#ef4444", fontSize: "var(--font-lg)", marginBottom: "var(--gap-md)" }}>😈 街头坏蛋</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)" }}>
                {ENEMY_TEMPLATES.flat().filter((e, idx, arr) => arr.findIndex(t => t.name === e.name) === idx).map((e, i) => {
                  const skill = BOSS_SKILLS[e.name];
                  return (
                    <div key={`enemy-${e.name}-${i}`} style={{
                      background: "rgba(239, 68, 68, 0.1)", padding: "var(--gap-md)", borderRadius: 10,
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      display: "flex", alignItems: "center", gap: "var(--gap-md)",
                    }}>
                      <img src={e.image} alt={e.name} style={{
                        width: "clamp(32px, 8vw, 44px)", height: "clamp(32px, 8vw, 44px)", borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                        boxShadow: ENEMY_STYLES[e.name]?.shadow || "0 4px 12px rgba(0,0,0,0.3)",
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#fff", fontSize: "var(--font-sm)", fontWeight: 700 }}>{e.name}</div>
                        <div style={{ fontSize: "var(--font-xs)", color: "#ef4444" }}>⚔{e.atk} ❤{e.maxHp} {e.armor ? `🛡${e.armor}` : ""}</div>
                        {skill && (
                          <div style={{ fontSize: "clamp(7px, 1.2vw, 9px)", color: "#fbbf24", marginTop: "var(--gap-sm)" }}>
                            {Array.isArray(skill) ? skill.map(s => `${s.emoji}${s.name}`).join(' ') : `${skill.emoji} ${skill.name}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 style={{ color: "#8b5cf6", fontSize: "var(--font-lg)", marginBottom: "var(--gap-md)" }}>⚡ Boss技能一览</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-md)" }}>
                {Object.entries(BOSS_SKILLS).map(([name, skills], i) => (
                  <div key={`boss-${name}-${i}`} style={{
                    background: "rgba(139, 92, 246, 0.1)", padding: "var(--gap-md)", borderRadius: 10,
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                  }}>
                    <div style={{ color: "#a78bfa", fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: "var(--gap-sm)" }}>所属: {name}</div>
                    {Array.isArray(skills) ? skills.map((sk, si) => (
                      <div key={si} style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)", marginBottom: "var(--gap-sm)" }}>
                        <span style={{ fontSize: "var(--font-md)" }}>{sk.emoji}</span>
                        <span style={{ color: "#c4b5fd", fontSize: "var(--font-xs)" }}>{sk.name}</span>
                      </div>
                    )) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--gap-sm)", marginBottom: "var(--gap-sm)" }}>
                        <span style={{ fontSize: "clamp(14px, 3vw, 18px)" }}>{skills.emoji}</span>
                        <span style={{ color: "#a78bfa", fontSize: "var(--font-sm)", fontWeight: 700 }}>{skills.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === 战斗区域：左侧主角 + 右侧敌人 === */}
      <div className="battle-area" style={{
        position: "absolute", top: "5%", left: 0, right: 0,
        height: "var(--battle-height)",
        display: "flex",
        zIndex: 10,
        pointerEvents: "none",
      }}>
        {/* 左侧主角区域 */}
        <div ref={playerRef} className="player-area" style={{
          width: "var(--player-area-width)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          paddingTop: "clamp(10px, 2vw, 20px)",
        }}>
          <PlayerCharacter
            player={player}
            energy={energy}
            maxEnergy={3}
            attackBuff={attackBuff}
            playerAnim={playerAnim}
            act={currentAct}
            relics={relics}
            characterName={currentCharacter?.name || "小雪"}
            characterImage={currentCharacter?.image || "/images/站立雪纳瑞.png"}
          />
        </div>

        {/* 右侧敌人区域 */}
        <div className="enemy-area" style={{
          width: "var(--enemy-area-width)",
          display: "flex",
          gap: "clamp(2vw, 4vw, 4vw)",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "clamp(50px, 10vw, 80px)",
          paddingBottom: "clamp(40px, 8vw, 80px)",
          pointerEvents: "none",
        }}>
          {enemies.filter(e => e.hp > 0).map((e, i) => (
            <div key={`enemy-${e.id || i}-${i}`} ref={el => { enemyRefs.current[i] = el; }} data-enemy-idx={i} style={{ position: "relative", pointerEvents: "auto", ...getEnemyHitStyle(i) }}>
              {renderEnemy3D(e, i)}
              <EnemyStatusOverlay poison={e.poison} frozen={e.frozen} confused={e.confused} />
            </div>
          ))}
        </div>
      </div>


      {/* Hand area with draw/discard piles */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "visible", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
          {/* Draw pile */}
          <div
            ref={drawPileRef}
            title={`抽牌堆 (${deck.length}张)`}
            style={{
              width: "clamp(40px, 7vw, 56px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: "clamp(10px, 2vw, 20px)",
              flexShrink: 0,
              cursor: "default",
            }}
          >
            <div style={{
              width: "clamp(32px, 6vw, 48px)",
              height: "clamp(44px, 8vw, 64px)",
              borderRadius: 6,
              background: deck.length > 0
                ? "linear-gradient(135deg, #1e3a5f, #2563eb, #1e3a5f)"
                : "linear-gradient(135deg, #1a1a2e, #2a2a3e)",
              border: deck.length > 0 ? "2px solid #60a5fa" : "2px solid #374151",
              boxShadow: deck.length > 0
                ? "0 2px 8px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 2px 4px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.3s ease",
            }}>
              <span style={{ fontSize: "clamp(16px, 3vw, 22px)", opacity: deck.length > 0 ? 1 : 0.3 }}>🎴</span>
              {deck.length > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: -2, right: -2,
                  width: "100%", height: "100%",
                  borderRadius: 6,
                  border: "2px solid #3b82f6",
                  background: "linear-gradient(135deg, #1e3a5f, #1d4ed8)",
                  zIndex: -1,
                  transform: "translate(3px, 3px)",
                  opacity: 0.5,
                }} />
              )}
            </div>
            <span style={{
              fontSize: "clamp(9px, 1.5vw, 12px)",
              color: deck.length > 0 ? "#93c5fd" : "#6b7280",
              fontWeight: 700,
              marginTop: 4,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}>{deck.length}</span>
          </div>

          {/* Hand cards */}
          <div style={{ flex: 1, minWidth: 0, overflow: "visible" }}>
            <div
              ref={handContainerRef}
              className="hand-container"
            >
              {hand.map((card, i) => renderCard(card, i, true))}
            </div>
          </div>

          {/* Discard pile */}
          <div
            ref={discardPileElRef}
            title={`弃牌堆 (${discardPile.length}张)`}
            style={{
              width: "clamp(40px, 7vw, 56px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: "clamp(10px, 2vw, 20px)",
              flexShrink: 0,
              cursor: "default",
            }}
          >
            <div style={{
              width: "clamp(32px, 6vw, 48px)",
              height: "clamp(44px, 8vw, 64px)",
              borderRadius: 6,
              background: discardPile.length > 0
                ? "linear-gradient(135deg, #5f1e1e, #dc2626, #5f1e1e)"
                : "linear-gradient(135deg, #1a1a2e, #2a2a3e)",
              border: discardPile.length > 0 ? "2px solid #f87171" : "2px solid #374151",
              boxShadow: discardPile.length > 0
                ? "0 2px 8px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 2px 4px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "all 0.3s ease",
            }}>
              <span style={{ fontSize: "clamp(16px, 3vw, 22px)", opacity: discardPile.length > 0 ? 1 : 0.3 }}>♻️</span>
              {discardPile.length > 1 && (
                <div style={{
                  position: "absolute",
                  bottom: -2, left: -2,
                  width: "100%", height: "100%",
                  borderRadius: 6,
                  border: "2px solid #ef4444",
                  background: "linear-gradient(135deg, #5f1e1e, #b91c1c)",
                  zIndex: -1,
                  transform: "translate(-3px, 3px)",
                  opacity: 0.5,
                }} />
              )}
            </div>
            <span style={{
              fontSize: "clamp(9px, 1.5vw, 12px)",
              color: discardPile.length > 0 ? "#fca5a5" : "#6b7280",
              fontWeight: 700,
              marginTop: 4,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}>{discardPile.length}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: "clamp(6px, 1.5vw, 12px)", justifyContent: "center", padding: "clamp(4px, 1vw, 6px) 0" }}>
        {turnPhase === "player" && (
          <button onClick={endTurn} style={{
            padding: "clamp(8px, 1.5vw, 10px) clamp(16px, 4vw, 28px)", fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 700,
            background: "linear-gradient(135deg, #8bc34a, #689f38)", color: "#0a0a1a",
            border: "none", borderRadius: 10, cursor: "pointer",
            boxShadow: "0 0 20px #8bc34a44",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 0 30px #8bc34a66"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px #8bc34a44"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 0 30px #8bc34a66"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px #8bc34a44"; }}
          >
            🐕 结束回合
          </button>
        )}
        {turnPhase !== "player" && (
          <div style={{
            padding: "clamp(8px, 1.5vw, 10px) clamp(16px, 4vw, 28px)", fontSize: "clamp(12px, 2vw, 14px)",
            color: "#e5e7eb",
            background: "rgba(239, 68, 68, 0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 10,
            border: "1px solid rgba(239, 68, 68, 0.35)",
            fontWeight: 700,
            letterSpacing: 1,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            animation: "statusFadeIn 0.3s ease-out",
          }}>
            😈 敌人回合...
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes statusFadeIn { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInCard { 0% { opacity: 0; transform: translate(-50%, -100%) scale(0.9); } 100% { opacity: 1; transform: translate(-50%, -100%) scale(1); } }
        @keyframes fadeInEnemy { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); } 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes fadeInOut { 0% { opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes floatEnemy0 { 0%, 100% { transform: perspective(500px) rotateY(-8deg) rotateX(5deg) translateY(0); } 50% { transform: perspective(500px) rotateY(-8deg) rotateX(5deg) translateY(-12px); } }
        @keyframes floatEnemy1 { 0%, 100% { transform: perspective(500px) rotateY(5deg) rotateX(-3deg) translateY(0); } 50% { transform: perspective(500px) rotateY(5deg) rotateX(-3deg) translateY(-10px); } }
        @keyframes floatEnemy2 { 0%, 100% { transform: perspective(500px) rotateY(-3deg) rotateX(8deg) translateY(0); } 50% { transform: perspective(500px) rotateY(-3deg) rotateX(8deg) translateY(-14px); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        @property --border-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes sparkle { 0% { opacity: 0.3; transform: scaleY(0.6); } 50% { opacity: 1; transform: scaleY(1); } 100% { opacity: 0.3; transform: scaleY(0.6); } }
        @keyframes newDiscoveryBounce { 0% { transform: translateX(-50%) translateY(0); } 100% { transform: translateX(-50%) translateY(-4px); } }
        @keyframes mutatedBorderRotate { to { --border-angle: 360deg; } }
        @keyframes infectionGeneFloat { 0% { opacity: 0; transform: translateY(6px); } 30% { opacity: 1; transform: translateY(0); } 70% { opacity: 1; } 100% { opacity: 0; transform: translateY(-6px); } }
        .mutated-card { animation: mutatedBorderRotate 3s linear infinite; }
        @keyframes enemyAttackSwipe { 0% { transform: translateY(-50%) translateX(20px) scale(0.5); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-50%) translateX(-60px) scale(1.2); opacity: 0; } }
        @keyframes attackSwipe { 0% { transform: scale(0.5) rotate(-20deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1.5) rotate(20deg) translateX(50px); opacity: 0; } }
        @keyframes shieldPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1.2); opacity: 0; } }
        @keyframes healFloat { 0% { transform: translateX(-50%) translateY(0) scale(0.8); opacity: 1; } 100% { transform: translateX(-50%) translateY(-30px) scale(1.2); opacity: 0; } }
        @keyframes intentFloat { 0%, 100% { transform: translateX(-50%) translateY(-100%); } 50% { transform: translateX(-50%) translateY(calc(-100% - 5px)); } }
        @keyframes intentPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #374151; borderRadius: 4px; }
        * { box-sizing: border-box; margin: 0; }

        .game-card {
          transform-origin: center bottom;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes cardDrawIn {
          0% { transform: translateY(80px) translateX(-40px) scale(0.4) rotate(-10deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(0) translateX(0) scale(1) rotate(0deg); opacity: 1; }
        }
        .card-draw-anim {
          animation: cardDrawIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both !important;
          animation-delay: var(--draw-delay, 0ms) !important;
        }

        @keyframes cardFlyToDiscard {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--fly-dx)), calc(-50% + var(--fly-dy))) scale(0.3) rotate(20deg); opacity: 0; }
        }

        @keyframes battleTransitionIn {
          0% { opacity: 0; }
          20% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }

        @keyframes battleEnemyReveal {
          0% { transform: translateX(80px) scale(0.5); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes battleTextFlash {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .hand-container {
          display: flex;
          gap: var(--hand-gap);
          justify-content: center;
          align-items: flex-end;
          padding: 30px var(--hand-padding) var(--hand-bottom);
          overflow-x: auto;
          overflow-y: visible;
          perspective: 1000px;
          flex-wrap: nowrap;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hand-container::-webkit-scrollbar {
          display: none;
        }
        .hand-container .game-card {
          scroll-snap-align: center;
          flex-shrink: 0;
        }
        .hand-container.dragging {
          scroll-snap-type: none;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .hand-container {
            gap: 4px;
            padding: 20px 10px var(--hand-bottom);
          }
          .game-card {
            width: var(--card-width) !important;
            min-height: var(--card-height) !important;
          }
          .enemy-name {
            font-size: var(--font-md) !important;
          }
          .enemy-stats {
            gap: var(--gap-sm) !important;
          }
        }

        @media (max-width: 480px) {
          .hand-container {
            gap: 3px;
            padding: 20px 8px var(--hand-bottom);
          }
          .game-card {
            width: var(--card-width) !important;
            min-height: var(--card-height) !important;
          }
          .enemy-name {
            font-size: var(--font-sm) !important;
          }
          .enemy-stats {
            gap: 2px !important;
          }
        }

        /* 竖屏布局：敌人上方，主角下方，手牌最底 */
        @media (max-width: 480px) and (orientation: portrait) {
          .battle-area {
            flex-direction: column !important;
            height: auto !important;
            position: relative !important;
            top: auto !important;
          }
          .player-area {
            width: 100% !important;
            order: 2;
          }
          .enemy-area {
            width: 100% !important;
            order: 1;
            padding-top: 60px !important;
            padding-bottom: 10px !important;
            gap: 2vw !important;
          }
          .hand-container {
            gap: 2px;
            padding: 10px 6px var(--hand-bottom);
          }
        }
      `}</style>

      {renderLog()}


      {/* === 特效叠加层 === */}
      <BuffGainLayer effects={buffEffects} />
      <DamageNumbers numbers={damageNumbers} />
      <ParticleSystem canvasRef={particleCanvasRef} />
      <canvas ref={slashCanvasRef} style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        pointerEvents: "none", zIndex: 9998,
      }} />

      {/* === Spine 动画特效层 === */}
      <SpineEffectLayer effects={spineEffects?.activeEffects || []} />

      {/* === 拖拽幽灵卡牌（始终渲染，通过ref控制显隐） === */}
      {(() => {
        const ghostCard = draggingIdx !== null ? hand[draggingIdx] : null;
        const ghostTypeColors = { attack: "#ef4444", defend: "#3b82f6", heal: "#22c55e", buff: "#f59e0b", skill: "#a855f7" };
        const ghostBg = ghostCard ? {
          attack: "linear-gradient(160deg, #4a1a1a, #2d0e0e)",
          defend: "linear-gradient(160deg, #1a2d4a, #0e1a2d)",
          heal: "linear-gradient(160deg, #1a3d1a, #0e2d0e)",
          buff: "linear-gradient(160deg, #3d3a1a, #2d2a0e)",
          skill: "linear-gradient(160deg, #2d1a4a, #1a0e2d)",
        }[ghostCard.baseType] || "linear-gradient(135deg, #3d1f1f, #2a1515)" : "linear-gradient(135deg, #3d1f1f, #2a1515)";
        const ghostColor = ghostCard ? (ghostTypeColors[ghostCard.baseType] || "#fbbf24") : "#fbbf24";
        return (
          <div
            ref={dragGhostRef}
            style={{
              position: "fixed",
              display: "none",
              width: "var(--card-width)",
              height: "var(--card-height)",
              borderRadius: "var(--card-radius)",
              background: ghostBg,
              border: `2px solid ${ghostColor}`,
              boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 0 2px ${ghostColor}, 0 0 20px ${ghostColor}66`,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.95,
              pointerEvents: "none",
              zIndex: 10000,
              transform: "scale(1.05) translateY(-5px)",
              transition: "none",
              willChange: "left, top, transform",
            }}
          >
            {ghostCard && (
              <>
                <img src={ghostCard.image} alt="" draggable="false" style={{
                  width: "70%", height: "55%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
                  pointerEvents: "none",
                  userSelect: "none",
                }} />
                <div style={{
                  color: "#fff", fontSize: "var(--font-xs)", fontWeight: 700,
                  textAlign: "center", marginTop: 4,
                  textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                }}>{ghostCard.name}</div>
                <div style={{
                  color: ghostColor,
                  fontSize: "var(--font-xs)", fontWeight: 900, marginTop: 2,
                }}>
                  {ghostCard.baseType === "attack" ? `⚔️ ${calcCardEffect(ghostCard, attackBuff).dmg}` :
                   ghostCard.baseType === "defend" ? `🛡 ${calcCardEffect(ghostCard, attackBuff).armor}` :
                   ghostCard.baseType === "heal" ? `💚 ${calcCardEffect(ghostCard, attackBuff).heal}` :
                   ghostCard.baseType === "buff" ? `✨ +${ghostCard.power}` : `🎯`}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* === 攻击箭头指示器（攻击牌悬停在敌人上时显示） === */}
      {dragAttackCard !== null && dragOverEnemy !== null && draggingIdx !== null && (() => {
        const srcIdx = draggingIdx;
        const cardEl = handContainerRef.current?.querySelector(`[data-card-idx="${srcIdx}"]`);
        const originX = cardEl ? (() => {
          const rect = cardEl.getBoundingClientRect();
          return rect.left + rect.width / 2;
        })() : dragMousePosRef.current.x;
        const originY = cardEl ? (() => {
          const rect = cardEl.getBoundingClientRect();
          return rect.top + rect.height / 2;
        })() : dragMousePosRef.current.y;
        // 终点：敌人元素的中心
        const enemyEl = enemyRefs.current[dragOverEnemy];
        const endX = enemyEl ? (() => {
          const rect = enemyEl.getBoundingClientRect();
          return rect.left + rect.width / 2;
        })() : dragMousePosRef.current.x;
        const endY = enemyEl ? (() => {
          const rect = enemyEl.getBoundingClientRect();
          return rect.top + rect.height / 2;
        })() : dragMousePosRef.current.y;

        // 贝塞尔曲线控制点（向上凸起）
        const midX = (originX + endX) / 2;
        const midY = Math.min(originY, endY) - 80;
        const pathD = `M ${originX} ${originY} Q ${midX} ${midY} ${endX} ${endY}`;
        // 箭头方向
        const arrowAngle = Math.atan2(endY - midY, endX - midX);
        const arrowSize = 14;
        const ax1 = endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6);
        const ay1 = endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6);
        const ax2 = endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6);
        const ay2 = endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6);

        return (
          <svg style={{
            position: "fixed", top: 0, left: 0,
            width: "100vw", height: "100vh",
            pointerEvents: "none", zIndex: 9997,
          }}>
            <defs>
              <filter id="attack-glow">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={pathD} stroke="#ef4444" strokeWidth="3" fill="none" filter="url(#attack-glow)" opacity="0.9" />
            <path d={pathD} stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.5" />
            <polygon
              points={`${endX},${endY} ${ax1},${ay1} ${ax2},${ay2}`}
              fill="#ef4444"
              filter="url(#attack-glow)"
            />
          </svg>
        );
      })()}

      {/* === 拖拽提示文字 === */}
      {dragAttackCard !== null && dragOverEnemy !== null && draggingIdx !== null && (
        <div style={{
          position: "fixed",
          left: dragMousePosRef.current.x,
          top: dragMousePosRef.current.y + 55,
          transform: "translateX(-50%)",
          color: "#ef4444",
          fontSize: "var(--font-md)",
          fontWeight: 900,
          textShadow: "0 0 15px rgba(239,68,68,0.8), 0 2px 8px rgba(0,0,0,0.8)",
          pointerEvents: "none",
          zIndex: 10001,
          whiteSpace: "nowrap",
          animation: "pulse 0.5s ease-in-out infinite",
        }}>
          🐾 释放攻击！
        </div>
      )}
      {/* === 飞行卡牌动画（打出/弃牌时飞向弃牌堆） === */}
      {flyingCards.map(fc => (
        <div key={fc.id} style={{
          position: "fixed",
          left: fc.fromX,
          top: fc.fromY,
          width: 60,
          height: 84,
          borderRadius: 8,
          background: "linear-gradient(135deg, #2a1515, #1a0a0a)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          pointerEvents: "none",
          zIndex: 10002,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          transform: "translate(-50%, -50%)",
          animation: `cardFlyToDiscard 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
          "--fly-dx": `${fc.toX - fc.fromX}px`,
          "--fly-dy": `${fc.toY - fc.fromY}px`,
        }}>
          {fc.card?.image && (
            <img src={fc.card.image} alt="" draggable="false" style={{
              width: "70%", height: "60%", objectFit: "contain",
              pointerEvents: "none", userSelect: "none", opacity: 0.9,
            }} />
          )}
        </div>
      ))}

      {false && (
        <SpineCanvas
          width={window.innerWidth}
          height={window.innerHeight}
          spineData={{
            skeleton: '/spine/characters/xiaoxue.json',
            atlas: '/spine/characters/xiaoxue.atlas',
          }}
          animation="idle"
          loop={true}
          visible={true}
          style={{ zIndex: 9991 }}
        />
      )}
    </div>
  );
}
