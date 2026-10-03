import React, { useState } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import { Pin } from '../canvas/Pin';
import { GateCanvasSymbol } from '../canvas/GateCanvasSymbol';
import { Point } from '../types';
import { useCanvasColors } from '../hooks/useCanvasColors';
import { getComponentGeometry } from '../components/componentGeometry';
import {
  CUSTOM_TYPE_PREFIX,
  customPinId,
  getCustomCircuitByType,
} from '../engine/customCircuit';

export interface RenderedPin {
  id: string;
  type: 'input' | 'output';
  name: string;
  offset: Point;
}

export interface ComponentRendererProps {
  id: string;
  type: string;
  label?: string;
  position: Point;
  width?: number;
  height?: number;
  pins?: RenderedPin[];
  numInputs?: number;
  numBits?: number;
  state?: number;
  isSelected?: boolean;
  isDrawingWire?: boolean;
  isDraggable?: boolean;
pinStates?: Record<string, number>;
  onPinClick?: (pinId: string, type: 'input' | 'output', e: any) => void;
  isPinTaken?: (pinId: string) => boolean;
  onPinHover?: (pinId: string, hovering: boolean) => void;
  onSelect?: (id: string, e: any) => void;
  onContextMenu?: (id: string, clientPos: Point) => void;
  onDragStart?: (id: string, startPos: Point) => void;
  onDragMove?: (id: string, newPos: Point) => void;
  onDragEnd?: (id: string, newPos: Point) => void;
  onComponentAction?: (id: string) => void;
}

export const getDefaultPinsForType = (
  type: string,
  compId: string,
  numInputs?: number,
  numBits?: number
): RenderedPin[] => {
  const geometry = getComponentGeometry(type, numInputs, numBits);
  const customDef = getCustomCircuitByType(type);
  if (customDef) {
    return [
      ...customDef.inputs.map((pin, i) => ({
        id: customPinId(compId, pin.pinId),
        type: 'input' as const,
        name: pin.name,
        offset: geometry.inputs[i].offset,
      })),
      ...customDef.outputs.map((pin, i) => ({
        id: customPinId(compId, pin.pinId),
        type: 'output' as const,
        name: pin.name,
        offset: geometry.outputs[i].offset,
      })),
    ];
  }

  return [
    ...geometry.inputs.map((pin, i) => ({
      id: gateInputPinId(compId, type, i),
      type: 'input' as const,
      name: pin.name,
      offset: pin.offset,
    })),
    ...geometry.outputs.map((pin, i) => ({
      id: `${compId}_out${geometry.outputs.length > 1 ? i : ''}`,
      type: 'output' as const,
      name: pin.name,
      offset: pin.offset,
    })),
  ];
};

const gateInputPinId = (compId: string, type: string, index: number) => {
  const geometry = getComponentGeometry(type);
  if (geometry.inputs.length <= 1) return `${compId}_in`;
  return `${compId}_in${index + 1}`;
};

export const getDefaultSizeForType = (type: string, numInputs?: number, numBits?: number) => {
  const geometry = getComponentGeometry(type, numInputs, numBits);
  return { width: geometry.width, height: geometry.height };
};

const customDefOf = (type: string) =>
  type.startsWith(CUSTOM_TYPE_PREFIX) ? getCustomCircuitByType(type) : undefined;

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  id,
  type,
  label,
  position,
  pins,
  numInputs,
  numBits,
  state = 0,
  isSelected = false,
  isDrawingWire = false,
  isDraggable = true,
  pinStates = {},
  onPinClick,
  isPinTaken,
  onPinHover,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
  onComponentAction,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const c = useCanvasColors();
  const geometry = getComponentGeometry(type, numInputs, numBits);
  const pinList = pins || getDefaultPinsForType(type, id, numInputs, numBits);
  const customDef = customDefOf(type);
  const displayLabel = customDef ? '' : label || type.toUpperCase();

  const inputPinStates = pinList
    .filter((p) => p.type === 'input')
    .map((p) => pinStates[p.id] ?? 0);

  const labelY = geometry.height + 6;

  return (
    <Group
      x={position.x}
      y={position.y}
      draggable={isDraggable && !isDrawingWire}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect && onSelect(id, e);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect && onSelect(id, e);
      }}
      onContextMenu={(e: any) => {
        e.evt.preventDefault();
        e.cancelBubble = true;
        onContextMenu &&
          onContextMenu(id, { x: e.evt.clientX, y: e.evt.clientY });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(e) => {
        e.cancelBubble = true;
        const node = e.currentTarget || e.target;
        onDragStart && onDragStart(id, { x: node.x(), y: node.y() });
      }}
      onDragMove={(e) => {
        const node = e.currentTarget || e.target;
        onDragMove && onDragMove(id, { x: node.x(), y: node.y() });
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true;
        const node = e.currentTarget || e.target;
        onDragEnd && onDragEnd(id, { x: node.x(), y: node.y() });
      }}
    >
      {/* Invisible hit area so bare symbols remain clickable/grabbable */}
      <Rect
        width={geometry.width}
        height={geometry.height}
        fill="transparent"
        listening
      />

      {/* Selection ring only — components render bare, with no card */}
      {isSelected && (
        <Rect
          x={-5}
          y={-5}
          width={geometry.width + 10}
          height={geometry.height + 10}
          cornerRadius={8}
          stroke={c.hl}
          strokeWidth={1.5}
          dash={[4, 3]}
          listening={false}
        />
      )}

      {type.startsWith(CUSTOM_TYPE_PREFIX) && customDefOf(type) ? (
        <>
          <Rect
            width={geometry.width}
            height={geometry.height}
            cornerRadius={8}
            fill={c.gateBubble}
            stroke={isSelected ? c.hl : c.partStroke}
            strokeWidth={1.5}
            listening={false}
          />
          <Text
            text={customDefOf(type)?.name ?? 'Custom'}
            fill={c.gateStroke}
            fontSize={11}
            fontStyle="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
            x={6}
            y={6}
            width={geometry.width - 12}
            align="center"
            listening={false}
          />
          <Text
            text={`${customDefOf(type)?.inputs.length ?? 0} in · ${
              customDefOf(type)?.outputs.length ?? 0
            } out`}
            fill={c.partText}
            fontSize={9}
            fontFamily="system-ui, -apple-system, sans-serif"
            x={6}
            y={geometry.height - 18}
            width={geometry.width - 12}
            align="center"
            listening={false}
          />
        </>
      ) : (
      <GateCanvasSymbol
        type={type}
        x={geometry.symbolX}
        y={geometry.symbolY}
        width={geometry.symbolWidth}
        height={geometry.symbolHeight}
        state={state}
        inputStates={inputPinStates}
        hovered={isHovered}
        onAction={() => onComponentAction && onComponentAction(id)}
      />
      )}

      <Text
        text={displayLabel}
        fill={isHovered ? c.gateStroke : c.pinIdle}
        fontSize={9}
        fontStyle="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        x={-20}
        y={labelY}
        width={geometry.width + 40}
        align="center"
        listening={false}
      />

      {pinList.map((pin) => {
        const pinState = pinStates[pin.id] ?? (pin.type === 'output' ? state : 0);
        const legEndX = pin.type === 'input' ? geometry.lead : geometry.width - geometry.lead;

        return (
          <Group key={pin.id}>
            {/* Schematic leg: pin terminal -> symbol body */}
            <Line
              points={[pin.offset.x, pin.offset.y, legEndX, pin.offset.y]}
              stroke={pinState === 1 ? c.greenBright : c.hlDim}
              strokeWidth={2}
              lineCap="round"
              listening={false}
            />

            <Pin
              x={pin.offset.x}
              y={pin.offset.y}
              type={pin.type}
              state={pinState}
              isDrawingWire={isDrawingWire}
              isTaken={isPinTaken ? isPinTaken(pin.id) : false}
              onHover={(hovering) => onPinHover && onPinHover(pin.id, hovering)}
              onClick={(e) => {
                e.cancelBubble = true;
                onPinClick && onPinClick(pin.id, pin.type, e);
              }}
            />
          </Group>
        );
      })}
    </Group>
  );
};