import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { Grid } from './Grid';
import { Wire, WireRoutingStyle } from './Wire';
import {
  ComponentRenderer,
  RenderedPin,
  getDefaultPinsForType,
  getDefaultSizeForType,
} from '../components/ComponentRenderer';
import { Sidebar } from '../components/Sidebar';
import { HeaderBar } from '../components/HeaderBar';
import { Point, ComponentProps, Connection, Circuit } from '../types';
import { createComponentId } from '../components/BaseComponent';
import { SampleCircuit } from '../components/SampleCircuits';
import { evaluateCircuit } from '../engine/evaluator';
import {
  buildCustomCircuit,
  getCustomCircuitByType,
  customPinId,
  customTypeFor,
  expandCustomCircuits,
  registerCustomCircuit,
  listCustomCircuits,
  type CustomCircuitDef,
} from '../engine/customCircuit';
import { parsers, getParserForExtension, JsonParser, Parser } from '../parsers';
import { NATIVE_SCHEMA_VERSION } from '../parsers/types';
import { saveTextFile, openTextFile, showError, SaveFormat } from '../utils/fileIO';
import {
  ComponentContextMenu,
  ContextMenuSection,
} from '../components/ComponentContextMenu';
import {
  MIN_GATE_INPUTS,
  MAX_GATE_INPUTS,
  supportsCustomInputs,
} from '../components/componentGeometry';
import { getComponentIcon } from '../components/icons/GateIcons';
import { componentLibrary } from '../components/library';
import { Oscilloscope } from '../components/Oscilloscope';
import { TruthTablePanel } from '../components/TruthTable';
import { CustomCircuitPrompt } from '../components/CustomCircuitPrompt';
import {
  DEFAULT_NUMERIC_BITS,
  MAX_NUMERIC_BITS,
  MIN_NUMERIC_BITS,
} from '../components/componentGeometry';
import { NumberPrompt } from '../components/NumberPrompt';
import { deriveScopeChannels, wiresForComponents } from '../engine/oscilloscope';
import { generateTruthTable } from '../engine/truthTable';
import { useOscilloscope } from '../hooks/useOscilloscope';
import { useCanvasColors } from '../hooks/useCanvasColors';
import { TableIcon } from '../components/icons/AdwaitaIcons';

const GRID_SIZE = 20;

/**
 * Arrow keys and WASD pan the viewport.
 * Values are viewport deltas: pressing Right moves the view right, which makes
 * the circuit appear to travel left.
 */
const PAN_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [1, 0],
  ArrowRight: [-1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  a: [1, 0],
  d: [-1, 0],
  w: [0, 1],
  s: [0, -1],
  A: [1, 0],
  D: [-1, 0],
  W: [0, 1],
  S: [0, -1],
};

export interface PlacedComponent extends ComponentProps {
  pins?: RenderedPin[];
  state?: number;
}

// Crisp rendering on HiDPI displays (capped so large canvases stay fast)
Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

export const Canvas: React.FC = () => {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);

  // Canvas Mode: 'select' (marquee / multiple selection) vs 'pan' (hand drag mode)
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');

  // Viewport transformation
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 60, y: 40 });

  // Refs for tracking latest scale & position synchronously without re-binding effects
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const positionRef = useRef(position);
  positionRef.current = position;

  // Dynamic canvas container dimensions measured via ResizeObserver
  const [dimensions, setDimensions] = useState({
    width: Math.max(300, window.innerWidth - (window.innerWidth > 768 ? 288 : 0)),
    height: Math.max(300, window.innerHeight - 48),
  });

  // Pointer drag state for dragging components seamlessly from sidebar into canvas
  const [pointerDrag, setPointerDrag] = useState<{
    type: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Marquee selection box state (in world coordinates)
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);

  // Circuit Data
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Pure synchronous evaluation of the circuit
  const { pinStates, componentStates, wireStates } = useMemo(() => {
    const expanded = expandCustomCircuits(components, connections);
    return evaluateCircuit(expanded.components as PlacedComponent[], expanded.connections);
  }, [components, connections]);

  // Simulation running state & tick speed
  const [isRunning, setIsRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(2); // 2 Hz / 2x

  // Wire Drawing State
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [drawingSource, setDrawingSource] = useState<{
    compId: string;
    pinId: string;
    position: Point;
  } | null>(null);
  const [previewEndPoint, setPreviewEndPoint] = useState<Point | null>(null);

  // Multiple Selection: Array of selected component IDs
  const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [pinNotice, setPinNotice] = useState<{ pinId: string; text: string } | null>(null);
  const [formatNotice, setFormatNotice] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);


  // Brief note shown when a pin refuses or takes over a wire
  useEffect(() => {
    if (!pinNotice) return;
    const timer = window.setTimeout(() => setPinNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [pinNotice]);
  // Right-click context menu (component-scoped)
  const [contextMenu, setContextMenu] = useState<{
    compId: string;
    position: Point;
  } | null>(null);

  // Oscilloscope: records every wire unless the user picks channels explicitly
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [scopeResetKey, setScopeResetKey] = useState(0);
  const [scopeWireIds, setScopeWireIds] = useState<string[] | null>(null);
  const [isScopePicking, setIsScopePicking] = useState(false);
  const [scopeDraftWireIds, setScopeDraftWireIds] = useState<string[]>([]);

  // Custom circuits (built from a selection, listed in the sidebar)
  const [numericPrompt, setNumericPrompt] = useState<{ id: string; value: number } | null>(null);
  const [bitsPrompt, setBitsPrompt] = useState<{ type: string; pos?: Point } | null>(null);


  const [customCircuits, setCustomCircuits] = useState<CustomCircuitDef[]>([]);
  const [customCircuitPrompt, setCustomCircuitPrompt] = useState(false);
  const [customCircuitName, setCustomCircuitName] = useState('');

  // Truth table generator modal
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  // Empty means every part in the circuit, which is also the default
  const [truthTableTargets, setTruthTableTargets] = useState<string[]>([]);
  const [isTablePicking, setIsTablePicking] = useState(false);
  const [tableDraftTargets, setTableDraftTargets] = useState<string[]>([]);

  const truthTable = useMemo(() => {
    if (!isTruthTableOpen) return null;
    return generateTruthTable(components, connections, truthTableTargets);
  }, [isTruthTableOpen, truthTableTargets, components, connections]);

  const openCustomCircuitPrompt = () => {
    setCustomCircuitName(suggestedCustomName());
    setCustomCircuitPrompt(true);
  };

  const openTruthTable = () => {
    setTruthTableTargets([]);
    setIsTablePicking(false);
    setIsTruthTableOpen(true);
  };

  // Target picker: click parts on the canvas, Enter to keep them, Escape to back out
  const startTablePicking = () => {
    if (isTablePicking) {
      applyTablePicking();
    } else {
      setTableDraftTargets(truthTableTargets);
      setIsTablePicking(true);
    }
  };

  const showAllTableTargets = () => {
    setTruthTableTargets([]);
    setTableDraftTargets([]);
    setIsTablePicking(false);
  };

  const cancelTablePicking = () => {
    setIsTablePicking(false);
  };

  const applyTablePicking = () => {
    if (!isTablePicking) return;
    setTruthTableTargets(tableDraftTargets);
    setIsTablePicking(false);
  };

  const toggleTableTarget = (compId: string) => {
    setTableDraftTargets((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  };

  // Drag group tracking: records starting positions of selected components when dragging begins
  const dragGroupStartPositions = useRef<Map<string, Point>>(new Map());

  // Clipboard for copy/paste of components (in-memory, preserves relative layout)
  const clipboardRef = useRef<{ components: PlacedComponent[]; connections: Connection[] } | null>(
    null
  );

  // Held movement keys + rAF bookkeeping for smooth keyboard panning
  const heldPanKeys = useRef<Set<string>>(new Set());
  const shiftHeld = useRef(false);
  const panFrameRef = useRef<number | null>(null);
  const lastPanTime = useRef(0);

  // Scope channels: the explicit pick when set, otherwise every wire in the circuit
  const scopeChannels = useMemo(() => {
    if (!isScopeOpen) return [];
    const active = isScopePicking ? scopeDraftWireIds : scopeWireIds;
    return deriveScopeChannels(connections, components, active);
    // scopeResetKey forces a fresh trace when Clear is pressed
  }, [
    isScopeOpen,
    connections,
    components,
    isScopePicking,
    scopeDraftWireIds,
    scopeWireIds,
    scopeResetKey,
  ]);

  const canvasColors = useCanvasColors();

  const scopeFrame = useOscilloscope({
    channelIds: scopeChannels.map((c) => c.id),
    wireStates,
    isRunning,
    enabled: isScopeOpen,
    resetKey: scopeResetKey,
  });

  // Channel picker: enter/leave without disturbing the normal selection
  const startScopePicking = () => {
    if (isScopePicking) {
      applyScopePicking();
    } else {
      setScopeDraftWireIds(scopeChannels.map((c) => c.id));
      setIsScopePicking(true);
    }
  };

  const showAllScopeChannels = () => {
    setScopeWireIds(null);
    setScopeDraftWireIds([]);
    setIsScopePicking(false);
  };

  const cancelScopePicking = () => {
    setIsScopePicking(false);
  };

  const applyScopePicking = () => {
    if (!isScopePicking) return;
    setScopeWireIds(scopeDraftWireIds);
    setIsScopePicking(false);
  };

  const toggleScopeWire = (wireId: string) => {
    setScopeDraftWireIds((prev) =>
      prev.includes(wireId) ? prev.filter((id) => id !== wireId) : [...prev, wireId]
    );
  };

  const toggleScopeComponentWires = (compId: string) => {
    setScopeDraftWireIds((prev) => {
      const owned = wiresForComponents(connections, [compId]);
      const allOn = owned.length > 0 && owned.every((id) => prev.includes(id));
      if (allOn) return prev.filter((id) => !owned.includes(id));
      return Array.from(new Set([...prev, ...owned]));
    });
  };

  // User Settings
  const [routingStyle, setRoutingStyle] = useState<WireRoutingStyle>('bezier');
  const [gridStyle, setGridStyle] = useState<'dots' | 'lines'>('dots');

  // References
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Snap coordinate to grid
  const snapToGrid = useCallback((value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, []);

  // Container size, coalesced to one update per frame so resizing does not
  // re-render React and redraw Konva on every resize event
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    let last = { width: 0, height: 0 };

    const measure = () => {
      frame = 0;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;

      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width === last.width && height === last.height) return;

      last = { width, height };
      setDimensions({ width, height });
    };

    const schedule = () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [isSidebarOpen]);

  // Simulation Tick Loop (for Clocks)
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(50, Math.round(1000 / simulationSpeed));

    const interval = setInterval(() => {
      setComponents((prev) => {
        let hasClocks = false;
        const updated = prev.map((c) => {
          if (c.type.toLowerCase() === 'clock') {
            hasClocks = true;
            return { ...c, state: c.state === 1 ? 0 : 1 };
          }
          return c;
        });
        return hasClocks ? updated : prev;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isRunning, simulationSpeed]);

  // Add Component to Canvas
  const addComponent = useCallback(
    (type: string, pos?: Point, numBits?: number) => {
      const norm = type.toLowerCase();

      // Numeric parts need a bit width before they can be built
      if ((norm === 'numin' || norm === 'numout') && !numBits) {
        setBitsPrompt({ type, pos });
        return;
      }

      const id = createComponentId(type);
      const { width, height } = getDefaultSizeForType(type, undefined, numBits);
      const pins = getDefaultPinsForType(type, id, undefined, numBits);

      let targetX = 200;
      let targetY = 160;

      if (pos && !isNaN(pos.x) && !isNaN(pos.y)) {
        targetX = pos.x;
        targetY = pos.y;
      } else {
        // Place near viewport center
        targetX = (-positionRef.current.x + dimensions.width / 2 - width / 2) / scaleRef.current;
        targetY = (-positionRef.current.y + dimensions.height / 2 - height / 2) / scaleRef.current;
      }

      const newComp: PlacedComponent = {
        id,
        type,
        position: { x: snapToGrid(targetX), y: snapToGrid(targetY) },
        pins,
        numBits,
        state: type === 'constant1' ? 1 : 0,
      };

      if (norm.startsWith('custom:')) {
        const def = getCustomCircuitByType(type);
        if (def) {
          newComp.customDef = def;
          newComp.label = def.name;
        }
      }

      setComponents((prev) => [...prev, newComp]);
      setSelectedCompIds([id]);
      setSelectedConnId(null);
    },
    [dimensions.width, dimensions.height, snapToGrid]
  );

  // Global Pointer Events for Seamless Sidebar Drag-and-Drop
  useEffect(() => {
    if (!pointerDrag) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setPointerDrag((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Check if dropped inside canvas container
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const clientX = e.clientX - rect.left;
          const clientY = e.clientY - rect.top;
          const { width, height } = getDefaultSizeForType(pointerDrag.type);

          // Center the placed component on drop cursor in world coordinates
          const canvasX = (clientX - positionRef.current.x) / scaleRef.current - width / 2;
          const canvasY = (clientY - positionRef.current.y) / scaleRef.current - height / 2;

          addComponent(pointerDrag.type, { x: canvasX, y: canvasY });
        } else {
          // Released over the sidebar: only a tap (no real drag) places a
          // component in the viewport centre, so one press yields one part
          const dist = Math.hypot(
            e.clientX - pointerDrag.startX,
            e.clientY - pointerDrag.startY
          );
          if (dist < 6) addComponent(pointerDrag.type);
        }
      }

      setPointerDrag(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [pointerDrag, addComponent]);

  // Copy current selection (components + wires between them) to the clipboard
  const copySelection = () => {
    if (selectedCompIds.length === 0) return false;

    const ids = new Set(selectedCompIds);
    clipboardRef.current = {
      components: components.filter((c) => ids.has(c.id)),
      connections: connections.filter(
        (c) =>
          ids.has(c.sourceComponentId || '') && ids.has(c.targetComponentId || '')
      ),
    };
    return true;
  };

  // Paste the clipboard with fresh ids, keeping each component's relative offset
  const pasteClipboard = () => {
    const clip = clipboardRef.current;
    if (!clip || clip.components.length === 0) return;

    const offset = GRID_SIZE * 2;
    const idMap = new Map<string, string>();
    const pinMap = new Map<string, string>();

    const pastedComponents: PlacedComponent[] = clip.components.map((c) => {
      const newId = createComponentId(c.type);
      idMap.set(c.id, newId);

      const sourcePins = c.pins || getDefaultPinsForType(c.type, c.id, c.numInputs, c.numBits);
      const newPins = getDefaultPinsForType(c.type, newId, c.numInputs, c.numBits);
      sourcePins.forEach((pin, i) => {
        const replacement = newPins[i];
        if (replacement) pinMap.set(pin.id, replacement.id);
      });

      return {
        ...c,
        id: newId,
        pins: newPins,
        position: { x: c.position.x + offset, y: c.position.y + offset },
      };
    });

    const pastedConnections: Connection[] = clip.connections
      .map((conn, i) => ({
        ...conn,
        id: `wire_${idMap.get(conn.sourceComponentId || '') || 'a'}_${
          idMap.get(conn.targetComponentId || '') || 'b'
        }_${i}`,
        sourcePortId: pinMap.get(conn.sourcePortId) || conn.sourcePortId,
        targetPortId: pinMap.get(conn.targetPortId) || conn.targetPortId,
        sourceComponentId: idMap.get(conn.sourceComponentId || ''),
        targetComponentId: idMap.get(conn.targetComponentId || ''),
      }))
      .filter((c) => c.sourceComponentId && c.targetComponentId);

    setComponents((prev) => [...prev, ...pastedComponents]);
    setConnections((prev) => [...prev, ...pastedConnections]);
    setSelectedConnId(null);
    setSelectedCompIds(pastedComponents.map((c) => c.id));
  };

  // Cut = copy then delete the selection
  const cutSelection = () => {
    if (copySelection()) deleteSelectedComponents();
  };
  const liveRef = useRef<{
    components: PlacedComponent[];
    connections: Connection[];
    selectedCompIds: string[];
    selectedConnId: string | null;
    isDrawingWire: boolean;
    drawingSource: unknown;
    copySelection: () => boolean;
    cutSelection: () => void;
    pasteClipboard: () => void;
    deleteSelectedComponents: () => void;
    deleteConnection: (id: string) => void;
    isScopePicking: boolean;
    applyScopePicking: () => void;
    cancelScopePicking: () => void;
    isTablePicking: boolean;
    applyTablePicking: () => void;
    cancelTablePicking: () => void;
  } | null>(null);


  // Keyboard handlers are attached once and read current state through this
  // ref, so they never re-subscribe in the middle of a held-key gesture

  // Keyboard Shortcuts (Esc, Delete, Space, WASD/Arrows pan, Ctrl+C/X/V/D/A)
  useEffect(() => {
    const speedFor = (shift: boolean) => (shift ? 6000 : 2000);

    const step = (now: number) => {
      const dt = Math.min((now - lastPanTime.current) / 1000, 0.05);
      lastPanTime.current = now;

      let dx = 0;
      let dy = 0;
      heldPanKeys.current.forEach((key) => {
        const dir = PAN_KEYS[key];
        dx += dir[0];
        dy += dir[1];
      });

      if (dx !== 0 || dy !== 0) {
        const speed = speedFor(shiftHeld.current) * dt;
        setPosition((prev) => ({ x: prev.x + dx * speed, y: prev.y + dy * speed }));
      }

      panFrameRef.current = requestAnimationFrame(step);
    };

    const startPanLoop = () => {
      if (panFrameRef.current !== null) return;
      lastPanTime.current = performance.now();
      panFrameRef.current = requestAnimationFrame(step);
    };

    const stopPanLoop = () => {
      if (panFrameRef.current !== null) {
        cancelAnimationFrame(panFrameRef.current);
        panFrameRef.current = null;
      }
      heldPanKeys.current.clear();
    };

    const cancelPendingWire = () => {
      setIsDrawingWire(false);
      setDrawingSource(null);
      setPreviewEndPoint(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const live = liveRef.current as NonNullable<typeof liveRef.current>;

      if (e.key === 'Shift') {
        shiftHeld.current = e.shiftKey;
      } else if (PAN_KEYS[e.key]) {
        e.preventDefault();
        heldPanKeys.current.add(e.key);
        startPanLoop();
      } else if (e.key === 'Enter') {
        if (live.isScopePicking) {
          e.preventDefault();
          live.applyScopePicking();
        } else if (live.isTablePicking) {
          e.preventDefault();
          live.applyTablePicking();
        }
      } else if (e.key === 'Escape') {
        if (live.isScopePicking) {
          live.cancelScopePicking();
          return;
        }
        if (live.isTablePicking) {
          live.cancelTablePicking();
          return;
        }
        cancelPendingWire();
        setSelectedCompIds([]);
        setSelectedConnId(null);
        setMarqueeBox(null);
        setContextMenu(null);
        setIsTruthTableOpen(false);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (live.isDrawingWire || live.drawingSource) {
          // Discard the wire currently in hand
          e.preventDefault();
          cancelPendingWire();
        } else if (live.selectedCompIds.length > 0) {
          live.deleteSelectedComponents();
        } else if (live.selectedConnId) {
          live.deleteConnection(live.selectedConnId);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === 'v' || e.key === 'V') {
        setCanvasMode('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setCanvasMode('pan');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectedCompIds(live.components.map((c) => c.id));
      } else if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c') {
          e.preventDefault();
          live.copySelection();
        } else if (key === 'x') {
          e.preventDefault();
          live.cutSelection();
        } else if (key === 'v') {
          e.preventDefault();
          live.pasteClipboard();
        } else if (key === 'd') {
          e.preventDefault();
          if (live.copySelection()) live.pasteClipboard();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftHeld.current = e.shiftKey;
        return;
      }
      if (!PAN_KEYS[e.key]) return;

      heldPanKeys.current.delete(e.key);
      if (heldPanKeys.current.size === 0) stopPanLoop();
    };

    const handleBlur = () => {
      shiftHeld.current = false;
      stopPanLoop();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      stopPanLoop();
    };
  }, []);

  // Zooming with mouse wheel
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // About 7% per wheel notch
    const delta = e.evt.deltaY < 0 ? 1.07 : 1 / 1.07;
    const newScale = Math.max(0.2, Math.min(3.5, oldScale * delta));
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Stage Mouse Down: Start marquee selection in 'select' mode
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawingWire) return;
    if (isScopePicking) return;

    const isBackground = e.target === e.target.getStage() || e.target.name() === 'canvas-bg';
    if (isBackground && canvasMode === 'select') {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldPos = {
        x: (pointer.x - stage.x()) / scale,
        y: (pointer.y - stage.y()) / scale,
      };

      setMarqueeBox({
        startX: worldPos.x,
        startY: worldPos.y,
        currentX: worldPos.x,
        currentY: worldPos.y,
        isSelecting: true,
      });

      // Clear selection unless Shift is pressed
      if (!e.evt.shiftKey && !e.evt.ctrlKey && !e.evt.metaKey) {
        setSelectedCompIds([]);
        setSelectedConnId(null);
      }
    }
  };

  // Mouse move on canvas (update active wire preview OR marquee selection box)
  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const worldPos = {
      x: (pointer.x - stage.x()) / scale,
      y: (pointer.y - stage.y()) / scale,
    };

    // Update active wire drawing preview
    if (isDrawingWire && drawingSource) {
      setPreviewEndPoint(worldPos);
    }

    // Update Marquee Selection Box
    if (marqueeBox?.isSelecting) {
      setMarqueeBox((prev) =>
        prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : null
      );
    }

  };

  // Stage Mouse Up: Finalize marquee selection box
  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isScopePicking) return;
    if (marqueeBox?.isSelecting) {
      const left = Math.min(marqueeBox.startX, marqueeBox.currentX);
      const top = Math.min(marqueeBox.startY, marqueeBox.currentY);
      const width = Math.abs(marqueeBox.currentX - marqueeBox.startX);
      const height = Math.abs(marqueeBox.currentY - marqueeBox.startY);

      // Only perform marquee selection if dragged more than 4px
      if (width > 4 || height > 4) {
        const right = left + width;
        const bottom = top + height;

        const captured = components.filter((comp) => {
          const compW = comp.width || 104;
          const compH = comp.height || 72;
          const compRight = comp.position.x + compW;
          const compBottom = comp.position.y + compH;

          // Check if bounding box intersects
          return (
            comp.position.x < right &&
            compRight > left &&
            comp.position.y < bottom &&
            compBottom > top
          );
        });

        const capturedIds = captured.map((c) => c.id);
        if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
          // Union selection
          setSelectedCompIds((prev) => Array.from(new Set([...prev, ...capturedIds])));
        } else {
          setSelectedCompIds(capturedIds);
        }
      }

      setMarqueeBox(null);
    }
  };

  // Stage click: cancel wire drawing if clicking empty canvas space
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'canvas-bg') {
      if (isDrawingWire) {
        setIsDrawingWire(false);
        setDrawingSource(null);
        setPreviewEndPoint(null);
      }
    }
  };

  // Pin Click Handler: Wire drawing must ONLY start from output pins and terminate on input pins!
  const isPinTaken = useCallback(
    (pinId: string) => connections.some((c) => c.targetPortId === pinId),
    [connections]
  );

  const isPreviewBlocked = useMemo(
    () =>
      Boolean(
        isDrawingWire &&
          drawingSource &&
          hoveredPinId &&
          connections.some(
            (c) => c.targetPortId === hoveredPinId && c.sourcePortId !== drawingSource.pinId
          )
      ),
    [isDrawingWire, drawingSource, hoveredPinId, connections]
  );

  const handlePinClick = (compId: string, pinId: string, type: 'input' | 'output', e: any) => {
    e.cancelBubble = true;

    // CASE 1: Not currently drawing wire -> ONLY output pin can start drawing
    if (!isDrawingWire) {
      if (type === 'output') {
        const comp = components.find((c) => c.id === compId);
        if (comp) {
          const pin = comp.pins?.find((p) => p.id === pinId);
          if (pin) {
            const startPos = {
              x: comp.position.x + pin.offset.x,
              y: comp.position.y + pin.offset.y,
            };
            setDrawingSource({ compId, pinId, position: startPos });
            setPreviewEndPoint(startPos);
            setIsDrawingWire(true);
          }
        }
      }
      return;
    }

    // CASE 2: Currently drawing wire -> Connect to INPUT pin
    if (isDrawingWire && drawingSource) {
      if (type === 'input') {
        if (drawingSource.compId === compId && drawingSource.pinId === pinId) {
          return;
        }

        const duplicate = connections.some(
          (c) => c.sourcePortId === drawingSource.pinId && c.targetPortId === pinId
        );

        if (duplicate) {
          setPinNotice({ pinId, text: 'These two pins are already wired together' });
          setIsDrawingWire(false);
          setDrawingSource(null);
          setPreviewEndPoint(null);
          return;
        }

        // An input drives one wire, so a pin that already has one refuses it
        if (connections.some((c) => c.targetPortId === pinId)) {
          setPinNotice({ pinId, text: 'That input already has a wire' });
          return;
        }

        const newConnection: Connection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          sourceComponentId: drawingSource.compId,
          sourcePortId: drawingSource.pinId,
          targetComponentId: compId,
          targetPortId: pinId,
        };

        setConnections((prev) => [...prev, newConnection]);

        setIsDrawingWire(false);
        setDrawingSource(null);
        setPreviewEndPoint(null);
      } else {
        setIsDrawingWire(false);
        setDrawingSource(null);
        setPreviewEndPoint(null);
      }
    }
  };

  // Component Selection Handler: supports single select and multi-select (Shift/Ctrl/Cmd)
  const handleSelectComponent = (id: string, e: any) => {
    // Pickers own clicks while one is armed
    if (isScopePicking) {
      toggleScopeComponentWires(id);
      return;
    }
    if (isTablePicking) {
      toggleTableTarget(id);
      return;
    }

    const isMultiKey = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

    if (isMultiKey) {
      setSelectedCompIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      // If already part of multi-selection, keep selection intact so the whole group can be dragged
      if (!selectedCompIds.includes(id)) {
        setSelectedCompIds([id]);
      }
    }
    setSelectedConnId(null);
  };

  // Multi-Component Drag Start: capture starting positions of all selected components
  const handleComponentDragStart = (id: string) => {
    if (isScopePicking || isTablePicking) return;

    // If dragged component is not in the current selection, select it solely
    let currentSelection = selectedCompIds;
    if (!selectedCompIds.includes(id)) {
      currentSelection = [id];
      setSelectedCompIds([id]);
    }

    const startMap = new Map<string, Point>();
    components.forEach((c) => {
      if (currentSelection.includes(c.id)) {
        startMap.set(c.id, { ...c.position });
      }
    });
    dragGroupStartPositions.current = startMap;
  };

  // Live drag: commit positions on every move so wires track components in real time
  const handleComponentDragMove = (id: string, pos: Point) => {
    if (isNaN(pos.x) || isNaN(pos.y)) return;

    const startPos = dragGroupStartPositions.current.get(id);
    if (!startPos) {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, position: pos } : c))
      );
      return;
    }

    const dx = pos.x - startPos.x;
    const dy = pos.y - startPos.y;
    if (dx === 0 && dy === 0) return;

    setComponents((prev) =>
      prev.map((c) => {
        const compStart = dragGroupStartPositions.current.get(c.id);
        if (!compStart) return c;
        return {
          ...c,
          position: { x: compStart.x + dx, y: compStart.y + dy },
        };
      })
    );
  };

  // Multi-Component Drag End: snap the whole selection to the grid
  const handleComponentDragEnd = () => {
    const draggingIds = new Set(dragGroupStartPositions.current.keys());

    if (draggingIds.size > 0) {
      setComponents((prev) =>
        prev.map((c) =>
          draggingIds.has(c.id)
            ? {
                ...c,
                position: {
                  x: snapToGrid(c.position.x),
                  y: snapToGrid(c.position.y),
                },
              }
            : c
        )
      );
    }

    dragGroupStartPositions.current.clear();
  };

  // Interactive Component Click on Canvas (Toggle switches, Push buttons, Clock)
  const handleComponentAction = (compId: string) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id === compId) {
          const norm = c.type.toLowerCase();
          if (norm === 'toggle' || norm === 'clock') {
            return { ...c, state: c.state === 1 ? 0 : 1 };
          }
          if (norm === 'numin') {
            setNumericPrompt({ id: compId, value: c.state ?? 0 });
          }
          if (norm === 'pushbutton') {
            setTimeout(() => {
              setComponents((curr) =>
                curr.map((comp) => (comp.id === compId ? { ...comp, state: 0 } : comp))
              );
            }, 250);
            return { ...c, state: 1 };
          }
        }
        return c;
      })
    );
  };

  const currentInputCount = (comp: PlacedComponent) =>
    comp.numInputs ?? getDefaultPinsForType(comp.type, comp.id).filter((p) => p.type === 'input').length;

  // Add/remove an input on a variable-input gate, dropping wires on removed pins
  const changeInputCount = (compId: string, delta: number) => {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.id !== compId) return c;
        const next = Math.max(MIN_GATE_INPUTS, Math.min(MAX_GATE_INPUTS, currentInputCount(c) + delta));
        if (next === currentInputCount(c)) return c;

        const nextPins = getDefaultPinsForType(c.type, c.id, next);
        const keptPinIds = new Set(nextPins.map((p) => p.id));

        setConnections((conns) =>
          conns.filter(
            (conn) =>
              !(
                (conn.targetComponentId === compId && !keptPinIds.has(conn.targetPortId)) ||
                (conn.sourceComponentId === compId && !keptPinIds.has(conn.sourcePortId))
              )
          )
        );

        return { ...c, numInputs: next, pins: nextPins };
      })
    );
  };

  const deleteComponent = (compId: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== compId));
    setConnections((prev) =>
      prev.filter(
        (c) => c.sourceComponentId !== compId && c.targetComponentId !== compId
      )
    );
    setSelectedCompIds((prev) => prev.filter((id) => id !== compId));
  };

  // Delete all selected components
  const deleteSelectedComponents = () => {
    if (selectedCompIds.length === 0) return;
    const toDelete = new Set(selectedCompIds);

    setComponents((prev) => prev.filter((c) => !toDelete.has(c.id)));
    setConnections((prev) =>
      prev.filter((c) => !toDelete.has(c.sourceComponentId || '') && !toDelete.has(c.targetComponentId || ''))
    );
    setSelectedCompIds([]);
  };

  // Wrap the current selection into a reusable block
  const createCustomCircuit = (name: string) => {
    const selected = components.filter((c) => selectedCompIds.includes(c.id));
    if (selected.length === 0) return;

    const selectedIds = new Set(selected.map((c) => c.id));
    const inside = connections.filter(
      (conn) =>
        selectedIds.has(conn.sourceComponentId || '') ||
        selectedIds.has(conn.targetComponentId || '')
    );
    const outside = connections.filter(
      (conn) =>
        !selectedIds.has(conn.sourceComponentId || '') &&
        !selectedIds.has(conn.targetComponentId || '')
    );

    const { def } = buildCustomCircuit(name, selected, inside);
    registerCustomCircuit(def);

    const type = customTypeFor(def.slug);
    const compId = `custom_${def.slug}_${Date.now().toString(36)}`;
    const minX = Math.min(...selected.map((c) => c.position.x));
    const minY = Math.min(...selected.map((c) => c.position.y));

    const block: PlacedComponent = {
      id: compId,
      type,
      label: def.name,
      customDef: def,
      position: { x: snapToGrid(minX), y: snapToGrid(minY) },
      pins: getDefaultPinsForType(type, compId),
      state: 0,
    };

    // Wires that crossed the selection boundary now land on block terminals
    const remapped = inside
      .filter(
        (conn) =>
          !selectedIds.has(conn.sourceComponentId || '') ||
          !selectedIds.has(conn.targetComponentId || '')
      )
      .map((conn) => ({
        ...conn,
        sourcePortId: selectedIds.has(conn.sourceComponentId || '')
          ? customPinId(compId, conn.sourcePortId)
          : conn.sourcePortId,
        targetPortId: selectedIds.has(conn.targetComponentId || '')
          ? customPinId(compId, conn.targetPortId)
          : conn.targetPortId,
        sourceComponentId: selectedIds.has(conn.sourceComponentId || '')
          ? compId
          : conn.sourceComponentId,
        targetComponentId: selectedIds.has(conn.targetComponentId || '')
          ? compId
          : conn.targetComponentId,
      }));

    setComponents((prev) => [...prev.filter((c) => !selectedIds.has(c.id)), block]);
    setConnections([...outside, ...remapped]);
    setSelectedCompIds([compId]);
    setSelectedConnId(null);
    setCustomCircuitPrompt(false);
    setCustomCircuits(listCustomCircuits());
  };

  // Expand a custom block back into its individual parts
  const explodeCustomCircuit = (compId: string) => {
    const block = components.find((c) => c.id === compId);
    if (!block) return;

    const def =
      getCustomCircuitByType(block.type) ?? (block.customDef as CustomCircuitDef | undefined);
    if (!def) return;

    const prefix = `${block.id}~`;

    const innerComps: PlacedComponent[] = def.components.map((inner) => ({
      ...inner,
      id: `${prefix}${inner.id}`,
      state: inner.state ?? 0,
      position: {
        x: block.position.x + inner.position.x,
        y: block.position.y + inner.position.y,
      },
      pins: (inner.pins ?? []).map((pin) => ({ ...pin, id: `${prefix}${pin.id}` })),
    }));

    const innerPinId = (pinId: string) =>
      pinId.startsWith(`${block.id}__`) ? `${prefix}${pinId.split('__')[1]}` : pinId;

    const kept: Connection[] = [];
    const boundary: Connection[] = [];

    connections.forEach((conn) => {
      if (conn.sourceComponentId !== block.id && conn.targetComponentId !== block.id) {
        kept.push(conn);
        return;
      }
      boundary.push({
        ...conn,
        sourcePortId: innerPinId(conn.sourcePortId),
        targetPortId: innerPinId(conn.targetPortId),
        sourceComponentId: conn.sourceComponentId?.replace(block.id, prefix),
        targetComponentId: conn.targetComponentId?.replace(block.id, prefix),
      });
    });

    const innerConns: Connection[] = def.connections.map((conn) => ({
      ...conn,
      id: `${prefix}${conn.id}`,
      sourcePortId: `${prefix}${conn.sourcePortId}`,
      targetPortId: `${prefix}${conn.targetPortId}`,
      sourceComponentId: conn.sourceComponentId ? `${prefix}${conn.sourceComponentId}` : undefined,
      targetComponentId: conn.targetComponentId ? `${prefix}${conn.targetComponentId}` : undefined,
    }));

    setComponents((prev) => [...prev.filter((c) => c.id !== block.id), ...innerComps]);
    setConnections([...kept, ...boundary, ...innerConns]);
    setSelectedCompIds(innerComps.map((c) => c.id));
    setSelectedConnId(null);
  };

  const suggestedCustomName = () => {
    const selected = components.filter((c) => selectedCompIds.includes(c.id));
    const labels = selected.map((c) => c.label || c.type);
    return labels.length === 0 ? 'Custom circuit' : labels.slice(0, 2).join(' + ');
  };

  // Delete Connection
  const deleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setSelectedConnId(null);
  };

  // Refresh the live handler snapshot after every render
  liveRef.current = {
    components,
    connections,
    selectedCompIds,
    selectedConnId,
    isDrawingWire,
    drawingSource,
    copySelection,
    cutSelection,
    pasteClipboard,
    deleteSelectedComponents,
    deleteConnection,
    isScopePicking,
    applyScopePicking,
    cancelScopePicking,
    isTablePicking,
    applyTablePicking,
    cancelTablePicking,
  };


  // Calculate connection start and end points for wire rendering
  const getConnectionPoints = (conn: Connection): Point[] => {
    const sourceComp = components.find((c) => c.id === conn.sourceComponentId);
    const targetComp = components.find((c) => c.id === conn.targetComponentId);
    if (!sourceComp || !targetComp || !sourceComp.pins || !targetComp.pins) return [];

    const sourcePin = sourceComp.pins.find((p) => p.id === conn.sourcePortId);
    const targetPin = targetComp.pins.find((p) => p.id === conn.targetPortId);
    if (!sourcePin || !targetPin) return [];

    return [
      { x: sourceComp.position.x + sourcePin.offset.x, y: sourceComp.position.y + sourcePin.offset.y },
      { x: targetComp.position.x + targetPin.offset.x, y: targetComp.position.y + targetPin.offset.y },
    ];
  };

  // Files can carry several wires into one input; the editor keeps the first
  const oneWirePerInput = (list: Connection[]): Connection[] => {
    const seenTargets = new Set<string>();
    const seenPairs = new Set<string>();
    return list.filter((conn) => {
      const pair = `${conn.sourcePortId}->${conn.targetPortId}`;
      if (seenPairs.has(pair)) return false;
      if (conn.targetPortId && seenTargets.has(conn.targetPortId)) return false;
      seenPairs.add(pair);
      if (conn.targetPortId) seenTargets.add(conn.targetPortId);
      return true;
    });
  };

  // File Operations: Open
  const handleOpenCircuit = async (file: File) => {
    await loadCircuitContent(file.name, await file.text());
  };

  const loadCircuitContent = async (fileName: string, content: string) => {
    try {
      const ext = '.' + (fileName.split('.').pop() || '').toLowerCase();
      const parser: Parser = getParserForExtension(ext) || new JsonParser();
      const circuit: Circuit = parser.parse(content);

      // Custom blocks carry their definition with them, so re-registering here
      // makes them renderable again after a file is opened
      (circuit.metadata?.customCircuits || []).forEach((def) =>
        registerCustomCircuit(def as CustomCircuitDef)
      );
      (circuit.components || []).forEach((c) => {
        if (c.customDef) registerCustomCircuit(c.customDef as CustomCircuitDef);
      });

      const loadedComps: PlacedComponent[] = (circuit.components || []).map((c) => {
        const { width, height } = getDefaultSizeForType(c.type, c.numInputs, c.numBits);
        const pins = getDefaultPinsForType(c.type, c.id, c.numInputs, c.numBits);
        return {
          ...c,
          width: c.width || width,
          height: c.height || height,
          pins: c.pins || pins,
          state: c.state ?? 0,
        };
      });

      setComponents(loadedComps);
      setCustomCircuits(listCustomCircuits());
      setConnections(oneWirePerInput(circuit.connections || []));
      setSelectedCompIds([]);
      setSelectedConnId(null);
      setCurrentFilePath(fileName);
      if (parser.warnings?.length) setFormatNotice(parser.warnings.join(' '));
    } catch (err) {
      console.error('Failed to open circuit:', err);
      await showError(
        'Open Failed',
        `Could not parse "${fileName}". Please ensure it is a valid .json, .gcg, or .circ circuit.\n\n${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleOpenNative = async () => {
    try {
      const result = await openTextFile();
      if (!result) return;
      await loadCircuitContent(result.path, result.content);
    } catch (err) {
      console.error('Failed to open circuit:', err);
      await showError('Open Failed', err instanceof Error ? err.message : String(err));
    }
  };

  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const buildCircuit = useCallback(
    (): Circuit => ({
      id: `circuit_${Date.now()}`,
      name: 'My Circuit',
      components,
      connections,
      metadata: {
        version: NATIVE_SCHEMA_VERSION,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        customCircuits: listCustomCircuits(),
      },
    }),
    [components, connections]
  );

  const writeCircuit = async (format: SaveFormat) => {
    const parser =
      format === 'json'
        ? new JsonParser()
        : (parsers.find((p) => p.extensions.includes(`.${format}`)) as Parser);
    return parser.serialize(buildCircuit());
  };

  // GateSim has no seven-segment part, so .gcg writes them as 7-bit numeric
  // outputs. The file still reopens correctly here, but not in GateSim.
  const noteFormatLimits = (format: SaveFormat, saved: boolean) => {
    if (!saved) return;
    if (format === 'gcg' && components.some((c) => c.type === 'sevenseg')) {
      setFormatNotice(
        'Saved as .gcg. GateSim has no seven-segment part, so seven-segment displays were written as 7-bit numeric outputs. They reopen correctly here, but GateSim will show them as numbers.'
      );
    } else if (format === 'circ') {
      setFormatNotice(
        'Saved as .circ. Logisim files are written on a best-effort basis: gate shapes and pin spacing are approximations, so open it in Logisim to check the layout.'
      );
    }
  };

  const saveAs = async (format: SaveFormat) => {
    try {
      const serialized = await writeCircuit(format);
      const savedPath = await saveTextFile(serialized, format);
      if (savedPath) setCurrentFilePath(savedPath);
      noteFormatLimits(format, Boolean(savedPath));
    } catch (err) {
      console.error(`Failed to save .${format}:`, err);
      await showError('Save Failed', err instanceof Error ? err.message : String(err));
    }
  };

  // File Operations: Save
  const handleSaveCircuit = async () => {
    const format: SaveFormat =
      currentFilePath && ['.json', '.gcg', '.circ'].some((e) => currentFilePath.endsWith(e))
        ? (currentFilePath.split('.').pop() as SaveFormat)
        : 'json';

    if (!currentFilePath) {
      await saveAs(format);
      return;
    }

    try {
      const serialized = await writeCircuit(format);
      const savedPath = await saveTextFile(serialized, format);
      noteFormatLimits(format, Boolean(savedPath));
    } catch (err) {
      console.error('Failed to save circuit:', err);
      await showError('Save Failed', err instanceof Error ? err.message : String(err));
    }
  };

  const handleExport = async (format: 'json' | 'png' | 'circ' | 'gcg') => {
    if (format === 'json' || format === 'circ' || format === 'gcg') {
      await saveAs(format);
    } else if (format === 'png') {
      const stage = stageRef.current;
      if (!stage) return;
      try {
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        const path = await saveTextFile(dataUrl.split(',')[1] || '', 'png' as SaveFormat);
        if (path) setCurrentFilePath(path);
      } catch (err) {
        console.error('Failed to export PNG:', err);
        await showError('Export Failed', err instanceof Error ? err.message : String(err));
      }
    }
  };

  // Load Sample Circuit
  const handleLoadSample = (sample: SampleCircuit) => {
    const loadedComps: PlacedComponent[] = sample.components.map((c) => ({
      ...c,
      pins: c.pins || getDefaultPinsForType(c.type, c.id, c.numInputs, c.numBits),
      state: c.state ?? 0,
    }));

    setComponents(loadedComps);
    setConnections(oneWirePerInput(sample.connections));
    setSelectedCompIds([]);
    setSelectedConnId(null);
    setScale(1);
    setPosition({ x: 60, y: 40 });
  };

  // Reset / Clear Canvas
  const handleNewCircuit = () => {
    if (components.length > 0 && !confirm('Clear current canvas and start a new circuit?')) {
      return;
    }
    setComponents([]);
    setConnections([]);
    setSelectedCompIds([]);
    setSelectedConnId(null);
  };

  // Calculate Marquee Box dimensions in Konva
  const marqueeRect = useMemo(() => {
    if (!marqueeBox || !marqueeBox.isSelecting) return null;
    const x = Math.min(marqueeBox.startX, marqueeBox.currentX);
    const y = Math.min(marqueeBox.startY, marqueeBox.currentY);
    const width = Math.abs(marqueeBox.currentX - marqueeBox.startX);
    const height = Math.abs(marqueeBox.currentY - marqueeBox.startY);
    return { x, y, width, height };
  }, [marqueeBox]);

  const selectedComponentLabel = useMemo(() => {
    if (selectedCompIds.length !== 1) return null;
    const comp = components.find((c) => c.id === selectedCompIds[0]);
    if (!comp) return null;
    if (comp.label) return comp.label;
    return (
      componentLibrary.find((item) => item.type === comp.type)?.label ??
      comp.type.charAt(0).toUpperCase() + comp.type.slice(1)
    );
  }, [components, selectedCompIds]);

  // Stage draggable condition: in 'pan' mode and not drawing wire
  const isStageDraggable = canvasMode === 'pan' && !isDrawingWire;

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--bg-canvas)] overflow-hidden select-none">
      {/* 1. GNOME / Libadwaita HeaderBar */}
      <HeaderBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        scale={scale}
        onZoomIn={() => setScale((s) => Math.min(3.5, s * 1.08))}
        onZoomOut={() => setScale((s) => Math.max(0.2, s / 1.08))}
        onResetZoom={() => {
          setScale(1);
          setPosition({ x: 60, y: 40 });
        }}
        isRunning={isRunning}
        hasClock={components.some((c) => c.type.toLowerCase() === 'clock')}
        onToggleSimulation={() => setIsRunning((r) => !r)}
        onStepSimulation={() => {
          setComponents((prev) =>
            prev.map((c) =>
              c.type.toLowerCase() === 'clock' ? { ...c, state: c.state === 1 ? 0 : 1 } : c
            )
          );
        }}
        onResetSimulation={() => {
          setComponents((prev) =>
            prev.map((c) => ({
              ...c,
              state: c.type === 'constant1' ? 1 : 0,
            }))
          );
        }}
        simulationSpeed={simulationSpeed}
        onChangeSpeed={setSimulationSpeed}
        onOpen={handleOpenCircuit}
        onOpenNative={handleOpenNative}
        onSave={handleSaveCircuit}
        onExport={handleExport}
        onNewCircuit={handleNewCircuit}
        onLoadSample={handleLoadSample}
        routingStyle={routingStyle}
        onChangeRoutingStyle={setRoutingStyle}
        gridStyle={gridStyle}
        onChangeGridStyle={setGridStyle}
        canvasMode={canvasMode}
        onChangeCanvasMode={setCanvasMode}
        isScopeOpen={isScopeOpen}
        onToggleScope={() => setIsScopeOpen((prev) => !prev)}
      />

      {/* Main Workspace: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative min-w-0 min-h-0">
        {/* 2. Libadwaita Sidebar (Component Library) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onStartDrag={(type, clientX, clientY) => {
            // Immediate seamless drag initiation
            setPointerDrag({
              type,
              x: clientX,
              y: clientY,
              startX: clientX,
              startY: clientY,
            });
          }}
          customCircuits={customCircuits}
        />

        {/* 3. Konva Canvas Area */}
        <div
          ref={containerRef}
          className={`flex-1 h-full min-w-0 min-h-0 bg-[var(--bg-canvas)] relative overflow-hidden focus:outline-none ${
            canvasMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          tabIndex={0}
        >
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            onWheel={handleWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleStageMouseUp}
            onClick={handleStageClick}
            draggable={isStageDraggable}
            onDragEnd={(e) => {
              if (e.target === stageRef.current) {
                setPosition({ x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            <Layer perfectDrawEnabled={false} listening>
              {/* Sleek Dark Background surface */}
              <Rect
                name="canvas-bg"
                width={100000}
                height={100000}
                x={-50000}
                y={-50000}
                fill={canvasColors.canvas}
              />

              {/* Dynamic Viewport Grid (Dots or Lines) */}
              <Grid
                stageWidth={dimensions.width}
                stageHeight={dimensions.height}
                stageX={position.x}
                stageY={position.y}
                scale={scale}
                gridSize={GRID_SIZE}
                style={gridStyle}
              />

              {/* Placed Wires */}
              {connections.map((conn) => {
                const pts = getConnectionPoints(conn);
                const isSelected = selectedConnId === conn.id;
                const state = wireStates[conn.id] ?? 0;

                return (
                  <Wire
                    key={conn.id}
                    id={conn.id}
                    points={pts}
                    state={state}
                    isSelected={isSelected}
                    routingStyle={routingStyle}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      if (isScopePicking) {
                        toggleScopeWire(conn.id);
                        return;
                      }
                      setSelectedConnId(conn.id);
                      setSelectedCompIds([]);
                    }}
                  />
                );
              })}

              {/* Active Drawing Wire Preview */}
              {isDrawingWire && drawingSource && previewEndPoint && (
                <Wire
                  points={[drawingSource.position, previewEndPoint]}
                  state={pinStates[drawingSource.pinId] ?? 0}
                  isDrawing={true}
                  isBlocked={isPreviewBlocked}
                  routingStyle={routingStyle}
                />
              )}

              {/* Component Cards */}
              {components.map((comp) => {
                const isSelected = selectedCompIds.includes(comp.id);
                const effectiveState = componentStates[comp.id] ?? comp.state ?? 0;

                return (
                  <ComponentRenderer
                    key={comp.id}
                    id={comp.id}
                    type={comp.type}
                    label={comp.label}
                    position={comp.position}
                    numInputs={comp.numInputs}
                    numBits={comp.numBits}
                    pins={comp.pins}
                    state={effectiveState}
                    isSelected={isSelected}
                    isDrawingWire={isDrawingWire}
                    isDraggable={!isScopePicking && !isTablePicking}
                    pinStates={pinStates}
                    onPinClick={(pinId, type, e) => handlePinClick(comp.id, pinId, type, e)}
                    isPinTaken={isPinTaken}
                    onPinHover={(pinId, hovering) => setHoveredPinId(hovering ? pinId : null)}
                    onSelect={(id, e) => handleSelectComponent(id, e)}
                    onContextMenu={(id, pos) => {
                      if (!selectedCompIds.includes(id)) setSelectedCompIds([id]);
                      setSelectedConnId(null);
                      setContextMenu({ compId: id, position: pos });
                    }}
                    onDragStart={handleComponentDragStart}
                    onDragMove={handleComponentDragMove}
                    onDragEnd={handleComponentDragEnd}
                    onComponentAction={handleComponentAction}
                  />
                );
              })}

              {/* Marquee Selection Box (in Select Mode) */}
              {marqueeRect && marqueeRect.width > 2 && marqueeRect.height > 2 && (
                <Rect
                  x={marqueeRect.x}
                  y={marqueeRect.y}
                  width={marqueeRect.width}
                  height={marqueeRect.height}
                  fill={canvasColors.hl}
                  opacity={0.12}
                  stroke={canvasColors.hl}
                  strokeWidth={1.5}
                  dash={[5, 4]}
                  cornerRadius={2}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>

          {/* Canvas Floating Overlay: Active Wire Drawing Help Banner */}
          {isDrawingWire && (
            <div className="absolute bottom-3 left-3 bg-[var(--bg-surface)] border border-[var(--accent-soft)] text-[var(--text-strong)] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 sm:gap-3 text-xs z-30 pointer-events-none max-w-[60vw] truncate">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0" />
              <span className="truncate">
                Click an <strong>input pin</strong> to connect, or click empty space to cancel
              </span>
              <span className="bg-[var(--hover)] px-1.5 py-0.5 rounded text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                ESC
              </span>
            </div>
          )}

          {/* Bottom-right dock: truth table button + oscilloscope panel */}
          <div className="absolute bottom-3 right-3 z-30 flex flex-col-reverse items-end gap-2 pointer-events-none">
            <button
              onClick={openTruthTable}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text)] text-xs shadow-xl backdrop-blur-md hover:text-[var(--text-strong)] hover:bg-[var(--press)] transition-colors"
              title="Truth table for the selection, or the whole circuit"
            >
              <TableIcon size={13} />
              <span>Truth Table</span>
            </button>

            {isScopeOpen && (
              <div className="pointer-events-auto">
                <Oscilloscope
                  channels={scopeChannels}
                  frame={scopeFrame}
                  isRunning={isRunning}
                  isPicking={isScopePicking}
                  hasPinnedChannels={scopeWireIds !== null}
                  onClose={() => {
                    setIsScopePicking(false);
                    setIsScopeOpen(false);
                  }}
                  onClear={() => setScopeResetKey((k) => k + 1)}
                  onTogglePicking={startScopePicking}
                  onShowAll={showAllScopeChannels}
                />
              </div>
            )}
          </div>

          {/* Canvas Floating Overlay: Multiple Selected Items Information & Action */}
          {(selectedCompIds.length > 0 || selectedConnId) && !isDrawingWire && (
            <div className="absolute bottom-3 left-3 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-strong)] px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs z-30 max-w-[60vw]">
              <span className="text-[var(--text-muted)] font-medium truncate">
                {selectedCompIds.length > 1
                  ? `${selectedCompIds.length} components selected`
                  : selectedCompIds.length === 1
                  ? `Selected: ${selectedComponentLabel ?? 'Component'}`
                  : 'Selected Wire'}
              </span>
              <button
                onClick={() => {
                  if (selectedCompIds.length > 0) deleteSelectedComponents();
                  if (selectedConnId) deleteConnection(selectedConnId);
                }}
                className="bg-[var(--danger-soft)] hover:opacity-80 text-[var(--danger)] px-2 py-1 rounded-md text-xs font-medium transition-colors shrink-0"
              >
                Delete (Del)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right-click context menu for components */}
      {contextMenu &&
        (() => {
          const comp = components.find((c) => c.id === contextMenu.compId);
          if (!comp) return null;

          const canChangeInputs = supportsCustomInputs(comp.type);
          const count = currentInputCount(comp);

          const gateSection: ContextMenuSection[] = canChangeInputs
            ? [
                {
                  actions: [
                    {
                      id: 'add-input',
                      label: 'Add Input',
                      disabled: count >= MAX_GATE_INPUTS,
                      onSelect: () => changeInputCount(comp.id, 1),
                    },
                    {
                      id: 'remove-input',
                      label: 'Remove Input',
                      disabled: count <= MIN_GATE_INPUTS,
                      onSelect: () => changeInputCount(comp.id, -1),
                    },
                  ],
                },
              ]
            : [];

          const clipboardSections: ContextMenuSection[] = [
            {
              actions: [
                {
                  id: 'copy',
                  label: selectedCompIds.length > 1 ? `Copy ${selectedCompIds.length} Items` : 'Copy',
                  onSelect: () => {
                    copySelection();
                  },
                },
                {
                  id: 'cut',
                  label: 'Cut',
                  onSelect: () => {
                    cutSelection();
                  },
                },
                {
                  id: 'paste',
                  label: 'Paste',
                  disabled: !clipboardRef.current,
                  onSelect: () => {
                    pasteClipboard();
                  },
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate',
                  onSelect: () => {
                    if (copySelection()) pasteClipboard();
                  },
                },
              ],
            },
          ];

          const explodeSection: ContextMenuSection[] = comp.type.startsWith('custom:')
            ? [
                {
                  actions: [
                    {
                      id: 'explode',
                      label: 'Explode Into Parts',
                      onSelect: () => explodeCustomCircuit(comp.id),
                    },
                  ],
                },
              ]
            : [];

          const customSection: ContextMenuSection[] =
            selectedCompIds.length > 1
              ? [
                  {
                    actions: [
                      {
                        id: 'create-custom',
                        label: 'Create Custom Circuit',
                        onSelect: openCustomCircuitPrompt,
                      },
                    ],
                  },
                ]
              : [];

          const sections: ContextMenuSection[] = [
            ...gateSection,
            ...customSection,
            ...explodeSection,
            ...clipboardSections,
            {
              actions: [
                {
                  id: 'delete',
                  label: 'Delete Component',
                  danger: true,
                  onSelect: () => deleteComponent(comp.id),
                },
              ],
            },
          ];

          return (
            <ComponentContextMenu
              position={contextMenu.position}
              title={`${(comp.label || comp.type).toUpperCase()}${
                canChangeInputs ? ` · ${count} in` : ''
              }`}
              sections={sections}
              onClose={() => setContextMenu(null)}
            />
          );
        })()}

      {pinNotice && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] text-[var(--text)] shadow-xl">
          {pinNotice.text}
        </div>
      )}

      {formatNotice && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] max-w-md px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-amber-500/40 text-[11px] leading-relaxed text-[var(--text)] shadow-xl">
          <div className="flex items-start gap-2">
            <span className="flex-1">{formatNotice}</span>
            <button
              type="button"
              onClick={() => setFormatNotice(null)}
              className="shrink-0 px-1 text-[var(--text-faint)] hover:text-[var(--text-strong)]"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {bitsPrompt && (
        <NumberPrompt
          title={bitsPrompt.type.toLowerCase() === 'numin' ? 'Numeric input' : 'Numeric output'}
          description="How many connectors should it have?"
          min={MIN_NUMERIC_BITS}
          max={MAX_NUMERIC_BITS}
          initial={DEFAULT_NUMERIC_BITS}
          onCancel={() => setBitsPrompt(null)}
          onConfirm={(bits) => {
            const { type, pos } = bitsPrompt;
            setBitsPrompt(null);
            addComponent(type, pos, bits);
          }}
        />
      )}

      {numericPrompt && (
        <NumberPrompt
          title="Numeric input value"
          description={`Value 0-255 written to the output bits.`}
          min={0}
          max={255}
          initial={numericPrompt.value}
          onConfirm={(value) =>
            setComponents((prev) =>
              prev.map((c) => (c.id === numericPrompt.id ? { ...c, state: value } : c))
            )
          }
          onCancel={() => setNumericPrompt(null)}
        />
      )}

      {customCircuitPrompt && (
        <CustomCircuitPrompt
          name={customCircuitName}
          itemCount={selectedCompIds.length}
          onChange={setCustomCircuitName}
          onCancel={() => setCustomCircuitPrompt(false)}
          onConfirm={() => createCustomCircuit(customCircuitName.trim() || 'Custom circuit')}
        />
      )}

      {/* Truth table generator modal */}
      {isTruthTableOpen && (
        <TruthTablePanel
          table={truthTable}
          isPicking={isTablePicking}
          targetCount={isTablePicking ? tableDraftTargets.length : truthTableTargets.length}
          reason="Nothing to tabulate yet. Add a gate or a part to the circuit."
          onClose={() => {
            setIsTablePicking(false);
            setIsTruthTableOpen(false);
          }}
          onTogglePicking={startTablePicking}
          onShowAll={showAllTableTargets}
        />
      )}

      {/* Floating Drag Ghost while dragging seamlessly from sidebar into the workplace */}
      {pointerDrag && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] border border-[var(--accent)] rounded-xl shadow-2xl p-2.5 flex items-center gap-3 text-[var(--text-strong)] backdrop-blur-md ring-2 ring-[var(--accent-soft)]"
          style={{ left: pointerDrag.x, top: pointerDrag.y }}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--accent-cyan)] border border-[var(--border)]">
            {getComponentIcon(pointerDrag.type, { size: 22 })}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-xs font-semibold tracking-tight">
              {componentLibrary.find((c) => c.type === pointerDrag.type)?.label ||
                pointerDrag.type.toUpperCase()}
            </span>
            <span className="text-[10px] text-[var(--accent)] font-mono">Release to place</span>
          </div>
        </div>
      )}
    </div>
  );
};
