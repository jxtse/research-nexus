import React from 'react';
import type { CanvasProps, ReasoningNode, Position } from '../../types/reasoning';

const clampZoom = (value: number) => Math.min(3, Math.max(0.25, value));

const NodeComponent: React.FC<{
  node: ReasoningNode;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onUpdate: (nodeId: string, updates: Partial<ReasoningNode>) => void;
  isLinkSource: boolean;
  isLinkTargetCandidate: boolean;
  onNodeClick: (nodeId: string) => void;
}> = ({ node, isSelected, onSelect, onUpdate, isLinkSource, isLinkTargetCandidate, onNodeClick }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(node.content);

  React.useEffect(() => {
    setEditContent(node.content);
  }, [node.content]);

  const handleDoubleClick = () => {
    onSelect(node.id);
    setIsEditing(true);
    setEditContent(node.content);
  };

  const handleSave = () => {
    onUpdate(node.id, { content: editContent });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(node.content);
    }
  };

  const getNodeStyle = () => {
    const baseStyle = 'absolute p-4 rounded-lg shadow-lg border-2 cursor-pointer transition-all duration-200 min-w-48 max-w-64 bg-white';
    const ringStyle = isLinkSource
      ? 'ring-4 ring-amber-500'
      : isSelected
        ? 'ring-4 ring-blue-400'
        : isLinkTargetCandidate
          ? 'ring-4 ring-emerald-400'
          : '';

    const typeStyles: Record<ReasoningNode['type'], string> = {
      question: 'border-purple-300 bg-purple-50/70',
      reasoning: 'border-blue-300 bg-blue-50/70',
      hypothesis: 'border-orange-300 bg-orange-50/70',
      branch: 'border-green-300 bg-green-50/70',
      conclusion: 'border-red-300 bg-red-50/70',
    };

    return `${baseStyle} ${typeStyles[node.type]} ${ringStyle}`;
  };

  return (
    <div
      className={getNodeStyle()}
      style={{ transform: 'translate(-50%, -50%)' }}
      onClick={(event) => {
        event.stopPropagation();
        onNodeClick(node.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        handleDoubleClick();
      }}
    >
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full h-24 p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <div className="text-sm font-medium">
          <div className="text-xs font-bold mb-2 capitalize flex items-center">
            {node.type}
            {node.metadata.aiGenerated && (
              <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">AI</span>
            )}
          </div>
          <div className="whitespace-pre-wrap">
            {node.content || 'Double-click to edit the content...'}
          </div>
        </div>
      )}
    </div>
  );
};

const ConnectionLine: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
}> = ({ from, to }) => (
  <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#6b7280"
      strokeWidth={2}
      strokeDasharray="5,5"
      className="opacity-60"
    />
  </svg>
);

export const ReasoningCanvas: React.FC<CanvasProps> = ({
  nodes,
  selectedNodeId,
  newNodeType,
  zoom,
  pan,
  linkingSourceId,
  onNodeSelect,
  onNodeUpdate,
  onNodeCreate,
  onPanChange,
  onZoomChange,
  onCompleteLink,
  onCancelLink,
}) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [dragState, setDragState] = React.useState<{
    nodeId: string;
    origin: Position;
    pointerStart: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const [localPositions, setLocalPositions] = React.useState<Record<string, Position>>({});

  const resolveNodePosition = React.useCallback(
    (node: ReasoningNode) => localPositions[node.id] ?? node.position,
    [localPositions]
  );

  const toWorldCoordinates = (clientX: number, clientY: number): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      if (linkingSourceId) {
        onCancelLink();
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (dragState) {
      const deltaX = (e.clientX - dragState.pointerStart.x) / zoom;
      const deltaY = (e.clientY - dragState.pointerStart.y) / zoom;
      const nextPosition = {
        x: dragState.origin.x + deltaX,
        y: dragState.origin.y + deltaY,
      };

      setLocalPositions((prev) => ({ ...prev, [dragState.nodeId]: nextPosition }));
      setDragState((prev) => (prev ? { ...prev, moved: true } : prev));
    }
  };

  const resetDragState = React.useCallback(
    (shouldPersist: boolean) => {
      if (!dragState) return;
      const finalPosition = localPositions[dragState.nodeId] ?? dragState.origin;

      if (shouldPersist && dragState.moved) {
        onNodeUpdate(dragState.nodeId, { position: finalPosition });
      }

      setLocalPositions((prev) => {
        if (!prev[dragState.nodeId]) return prev;
        const next = { ...prev };
        delete next[dragState.nodeId];
        return next;
      });

      setDragState(null);
    },
    [dragState, localPositions, onNodeUpdate]
  );

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    resetDragState(true);
  };

  // Touch/Pointer gesture handling: single-finger pan, two-finger pinch zoom
  const pointersRef = React.useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = React.useRef<
    | {
        initialDistance: number;
        initialZoom: number;
        centerClient: { x: number; y: number };
        centerWorld: { x: number; y: number };
      }
    | null
  >(null);

  const getTwoPointers = () => {
    const arr = Array.from(pointersRef.current.values());
    if (arr.length < 2) return null;
    return [arr[0], arr[1]] as const;
  };

  const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointers = getTwoPointers();
    if (!pointers) {
      // single-finger: start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // two-finger: start pinch
    const [p1, p2] = pointers;
    const centerClient = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const centerWorld = toWorldCoordinates(centerClient.x, centerClient.y);
    pinchRef.current = {
      initialDistance: distanceBetween(p1, p2),
      initialZoom: zoom,
      centerClient,
      centerWorld,
    };
    setIsPanning(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointers = getTwoPointers();
    if (pointers && pinchRef.current) {
      // pinch zoom in progress
      const [p1, p2] = pointers;
      const currentDistance = distanceBetween(p1, p2);
      const ratio = currentDistance / pinchRef.current.initialDistance;
      const nextZoom = clampZoom(pinchRef.current.initialZoom * ratio);

      // keep the world point under pinch center stable
      const cx = pinchRef.current.centerClient.x;
      const cy = pinchRef.current.centerClient.y;
      const worldX = pinchRef.current.centerWorld.x;
      const worldY = pinchRef.current.centerWorld.y;
      const nextPan = {
        x: cx - worldX * nextZoom,
        y: cy - worldY * nextZoom,
      };

      onZoomChange(nextZoom);
      onPanChange(nextPan);
      return;
    }

    if (isPanning) {
      onPanChange({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setIsPanning(false);
      resetDragState(true);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const nextZoom = clampZoom(zoom + delta);
      if (nextZoom === zoom) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      const nextPan = {
        x: mouseX - worldX * nextZoom,
        y: mouseY - worldY * nextZoom,
      };

      onZoomChange(nextZoom);
      onPanChange(nextPan);
      return;
    }

    onPanChange({
      x: pan.x - e.deltaX,
      y: pan.y - e.deltaY,
    });
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || e.target !== canvasRef.current) return;
    const position = toWorldCoordinates(e.clientX, e.clientY);
    onNodeCreate(newNodeType, position);
  };

  const getNodeDisplayPosition = (position: Position) => ({
    x: position.x * zoom + pan.x,
    y: position.y * zoom + pan.y,
  });

  const renderConnections = () => {
    return nodes.flatMap((node) => {
      return node.connections.map((targetId) => {
        const targetNode = nodes.find((n) => n.id === targetId);
        if (!targetNode) return null;

        const fromPos = getNodeDisplayPosition(resolveNodePosition(node));
        const toPos = getNodeDisplayPosition(resolveNodePosition(targetNode));

        return <ConnectionLine key={`${node.id}-${targetId}`} from={fromPos} to={toPos} />;
      });
    });
  };

  const handleNodeMouseDown = (event: React.MouseEvent<HTMLDivElement>, node: ReasoningNode) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('textarea, input, button')) {
      return;
    }

    event.stopPropagation();
    onNodeSelect(node.id);
    setDragState({
      nodeId: node.id,
      origin: resolveNodePosition(node),
      pointerStart: { x: event.clientX, y: event.clientY },
      moved: false,
    });
  };

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #6b7280 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div
        ref={canvasRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          resetDragState(false);
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {renderConnections()}

        {nodes.map((node) => {
          const worldPosition = resolveNodePosition(node);
          const displayPos = getNodeDisplayPosition(worldPosition);
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: displayPos.x,
                top: displayPos.y,
                transform: `translate(-50%, -50%) scale(${zoom})`,
                transformOrigin: 'center',
              }}
              onMouseDown={(event) => handleNodeMouseDown(event, node)}
            >
              <NodeComponent
                node={{ ...node, position: worldPosition }}
                isSelected={selectedNodeId === node.id}
                onSelect={onNodeSelect}
                onUpdate={onNodeUpdate}
                isLinkSource={linkingSourceId === node.id}
                isLinkTargetCandidate={Boolean(linkingSourceId && linkingSourceId !== node.id)}
                onNodeClick={handleNodeClick}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
        <button
          onClick={() => onZoomChange(clampZoom(zoom * 0.8))}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          -
        </button>
        <span className="text-sm font-medium min-w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => onZoomChange(clampZoom(zoom * 1.25))}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          +
        </button>
        <button
          onClick={() => {
            onZoomChange(1);
            onPanChange({ x: 0, y: 0 });
          }}
          className="px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
        >
          Reset
        </button>
      </div>

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm text-gray-600 space-y-1 max-w-xs">
        <div className="font-medium">Canvas tips</div>
        <div>- Double-click empty space to create a new {newNodeType} node.</div>
        <div>- Drag anywhere to pan, or drag a node to reposition it.</div>
        <div>- Use the mouse wheel or trackpad to move around, pinch/ctrl+wheel to zoom.</div>
        <div>- Select a node and press Delete to remove it.</div>
        <div>- Use “Connect node” in the side panel to link to another node.</div>
      </div>

      {linkingSourceId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded shadow max-w-md text-sm text-center">
          Click another node to connect, or click the source again / press Esc to cancel.
        </div>
      )}
    </div>
  );
};
