import { useRef, useEffect } from 'react';
import { NODE_TYPES } from '../game/mapGenerator';

export default function GameMap({
  map,
  currentNodeId,
  reachableNodeIds,
  visitedNodeIds,
  onSelectNode,
  player,
}) {
  const scrollRef = useRef(null);

  // 自动滚动到当前位置附近
  useEffect(() => {
    if (!scrollRef.current || !currentNodeId) return;
    const el = scrollRef.current.querySelector(`[data-node-id="${currentNodeId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentNodeId]);

  // 初次加载时滚动到底部（起点在底部）
  useEffect(() => {
    if (scrollRef.current && !currentNodeId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [map]);

  if (!map) return null;

  const { rows, paths, theme } = map;
  const totalRows = rows.length;
  const maxCols = Math.max(...rows.map(r => r.length));

  const NODE_SIZE = 48;
  const ROW_GAP = 80;
  const COL_GAP = 90;
  const PADDING_X = 40;
  const PADDING_Y = 50;
  const mapWidth = maxCols * COL_GAP + PADDING_X * 2;
  const mapHeight = totalRows * ROW_GAP + PADDING_Y * 2;

  const getNodePos = (row, col, rowLength) => {
    const totalWidth = (rowLength - 1) * COL_GAP;
    const startX = (mapWidth - totalWidth) / 2;
    const x = startX + col * COL_GAP;
    const y = PADDING_Y + (totalRows - 1 - row) * ROW_GAP; // 底部是第0行
    return { x, y };
  };

  const isReachable = (nodeId) => reachableNodeIds.includes(nodeId);
  const isVisited = (nodeId) => visitedNodeIds.includes(nodeId);
  const isCurrent = (nodeId) => nodeId === currentNodeId;

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(180deg, ${theme.bg}, #0a0a1a)`,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#e5e7eb',
    }}>
      {/* 顶部标题 */}
      <div style={{
        padding: 'clamp(12px, 3vw, 20px)',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <h2 style={{
          fontSize: 'clamp(18px, 4vw, 24px)',
          fontWeight: 800,
          color: '#DEB887',
          margin: 0,
          textShadow: '0 0 20px rgba(222,184,135,0.3)',
        }}>
          {theme.name}
        </h2>
        <p style={{
          fontSize: 'clamp(10px, 2vw, 13px)',
          color: '#9ca3af',
          margin: '4px 0 0',
        }}>
          {theme.desc}
        </p>
      </div>

      {/* 地图滚动区域 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
      >
        <div style={{
          width: mapWidth,
          height: mapHeight,
          margin: '0 auto',
          position: 'relative',
        }}>
          {/* SVG路径层 */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          >
            {paths.map((path, idx) => {
              const fromRow = rows[path.from[0]];
              const toRow = rows[path.to[0]];
              if (!fromRow || !toRow) return null;
              const fromPos = getNodePos(path.from[0], path.from[1], fromRow.length);
              const toPos = getNodePos(path.to[0], path.to[1], toRow.length);

              const fromNode = fromRow[path.from[1]];
              const toNode = toRow[path.to[1]];
              const isOnPath = isVisited(fromNode.id) && (isVisited(toNode.id) || isCurrent(toNode.id));
              const isReachablePath = isCurrent(fromNode.id) && isReachable(toNode.id);

              // 贝塞尔曲线让路径更自然
              const midY = (fromPos.y + toPos.y) / 2;

              return (
                <path
                  key={idx}
                  d={`M ${fromPos.x} ${fromPos.y} C ${fromPos.x} ${midY}, ${toPos.x} ${midY}, ${toPos.x} ${toPos.y}`}
                  stroke={isOnPath ? '#DEB887' : isReachablePath ? 'rgba(222,184,135,0.6)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isOnPath ? 3 : isReachablePath ? 2.5 : 1.5}
                  fill="none"
                  strokeDasharray={isReachablePath ? '6 4' : 'none'}
                  style={{
                    filter: isOnPath ? 'drop-shadow(0 0 4px rgba(222,184,135,0.4))' : 'none',
                  }}
                />
              );
            })}
          </svg>

          {/* 节点层 */}
          {rows.map((row, rowIdx) =>
            row.map((node) => {
              const pos = getNodePos(rowIdx, node.col, row.length);
              const nodeType = NODE_TYPES[node.type];
              const reachable = isReachable(node.id);
              const visited = isVisited(node.id);
              const current = isCurrent(node.id);

              return (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  onClick={() => reachable && onSelectNode(node)}
                  style={{
                    position: 'absolute',
                    left: pos.x - NODE_SIZE / 2,
                    top: pos.y - NODE_SIZE / 2,
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: node.type === 'boss' ? 8 : '50%',
                    background: current
                      ? 'radial-gradient(circle, #DEB887, #8B4513)'
                      : visited
                        ? 'rgba(255,255,255,0.08)'
                        : reachable
                          ? `radial-gradient(circle at 40% 35%, ${nodeType.color}cc, ${nodeType.color}88)`
                          : 'rgba(255,255,255,0.05)',
                    border: current
                      ? '3px solid #DEB887'
                      : reachable
                        ? `2px solid ${nodeType.color}`
                        : visited
                          ? '2px solid rgba(255,255,255,0.15)'
                          : '1.5px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: node.type === 'boss' ? 24 : 20,
                    cursor: reachable ? 'pointer' : 'default',
                    transition: 'all 0.3s ease',
                    boxShadow: current
                      ? '0 0 20px rgba(222,184,135,0.5)'
                      : reachable
                        ? `0 0 12px ${nodeType.color}44`
                        : 'none',
                    animation: reachable && !visited
                      ? 'mapNodePulse 1.5s ease-in-out infinite'
                      : current
                        ? 'mapNodeGlow 2s ease-in-out infinite'
                        : 'none',
                    opacity: visited && !current ? 0.5 : 1,
                    zIndex: 10,
                    filter: visited && !current ? 'grayscale(0.5)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (reachable) e.currentTarget.style.transform = 'scale(1.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {current ? '🐕' : nodeType.icon}
                </div>
              );
            })
          )}

          {/* 节点标签 */}
          {rows.map((row, rowIdx) =>
            row.map((node) => {
              const pos = getNodePos(rowIdx, node.col, row.length);
              const nodeType = NODE_TYPES[node.type];
              const reachable = isReachable(node.id);
              const current = isCurrent(node.id);

              return (
                <div
                  key={`label-${node.id}`}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y + NODE_SIZE / 2 + 4,
                    transform: 'translateX(-50%)',
                    fontSize: 10,
                    color: current ? '#DEB887' : reachable ? nodeType.color : '#6b7280',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {node.type === 'boss' ? (node.label || nodeType.label) : nodeType.label}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        padding: 'clamp(8px, 2vw, 14px) clamp(12px, 3vw, 20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 'clamp(11px, 2vw, 14px)' }}>
          <span>❤️ {player.hp}/{player.maxHp}</span>
          {player.armor > 0 && <span>🛡️ {player.armor}</span>}
        </div>
        <div style={{ fontSize: 'clamp(10px, 1.8vw, 12px)', color: '#6b7280' }}>
          选择下一个目的地
        </div>
      </div>
    </div>
  );
}
