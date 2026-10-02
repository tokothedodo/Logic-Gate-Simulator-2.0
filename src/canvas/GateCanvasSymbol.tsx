import React from 'react';
import { Group, Path, Circle, Rect, Text, Line } from 'react-konva';

interface GateCanvasSymbolProps {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  state?: number;
  inputStates?: number[];
  color?: string;
  hovered?: boolean;
  onAction?: () => void;
}

const andPath = (w: number, h: number) =>
  `M 0 0 L ${w - 13} 0 C ${w - 3} 0, ${w} ${h * 0.16}, ${w} ${h / 2} ` +
  `C ${w} ${h * 0.84}, ${w - 3} ${h}, ${w - 13} ${h} L 0 ${h} Z`;

const orPath = (w: number, h: number) =>
  `M 0 0 C ${w * 0.22} ${h * 0.22}, ${w * 0.22} ${h * 0.78}, 0 ${h} ` +
  `C ${w * 0.36} ${h * 0.94}, ${w * 0.74} ${h * 0.72}, ${w} ${h / 2} ` +
  `C ${w * 0.74} ${h * 0.28}, ${w * 0.36} ${h * 0.06}, 0 0 Z`;

const xorArc = (inset: number, h: number) =>
  `M ${inset} 0 C ${inset - 5} ${h * 0.25}, ${inset - 5} ${h * 0.75}, ${inset} ${h}`;

const BUBBLE = 3.5;

export const GateCanvasSymbol: React.FC<GateCanvasSymbolProps> = ({
  type,
  x,
  y,
  width = 28,
  height = 30,
  state = 0,
  inputStates = [],
  color = '#e2e8f0',
  hovered = false,
  onAction,
}) => {
  const normType = type.toLowerCase();
  const stroke = hovered ? '#f1f5f9' : color;

  const body = (path: string, inset = 0) => (
    <Path
      data={path}
      stroke={stroke}
      strokeWidth={2}
      fill="#334155"
      fillOpacity={hovered ? 0.65 : 0.4}
      lineJoin="round"
      x={inset}
      listening={false}
    />
  );

  const bubble = (cx: number) => (
    <Circle
      x={cx}
      y={height / 2}
      radius={BUBBLE}
      stroke={stroke}
      strokeWidth={2}
      fill="#1e293b"
      listening={false}
    />
  );

  const bubbleWidth = BUBBLE * 2;
  const arcInset = 7;

  switch (normType) {
    case 'and':
      return (
        <Group x={x} y={y} listening={false}>
          {body(andPath(width, height))}
        </Group>
      );

    case 'or':
      return (
        <Group x={x} y={y} listening={false}>
          {body(orPath(width, height))}
        </Group>
      );

    case 'nand':
      return (
        <Group x={x} y={y} listening={false}>
          {body(andPath(width - bubbleWidth, height))}
          {bubble(width - BUBBLE)}
        </Group>
      );

    case 'nor':
      return (
        <Group x={x} y={y} listening={false}>
          {body(orPath(width - bubbleWidth, height))}
          {bubble(width - BUBBLE)}
        </Group>
      );

    case 'xor':
      return (
        <Group x={x} y={y} listening={false}>
          <Path
            data={xorArc(arcInset, height)}
            stroke={stroke}
            strokeWidth={2}
            fill="transparent"
            lineCap="round"
            listening={false}
          />
          {body(orPath(width - arcInset, height), arcInset)}
        </Group>
      );

    case 'xnor':
      return (
        <Group x={x} y={y} listening={false}>
          <Path
            data={xorArc(arcInset, height)}
            stroke={stroke}
            strokeWidth={2}
            fill="transparent"
            lineCap="round"
            listening={false}
          />
          {body(orPath(width - arcInset - bubbleWidth, height), arcInset)}
          {bubble(width - BUBBLE)}
        </Group>
      );

    case 'not':
      return (
        <Group x={x} y={y} listening={false}>
          <Path
            data={`M 0 ${height * 0.08} L ${width - bubbleWidth} ${height / 2} L 0 ${
              height * 0.92
            } Z`}
            stroke={stroke}
            strokeWidth={2}
            fill="#334155"
            fillOpacity={hovered ? 0.65 : 0.4}
            lineJoin="round"
          />
          {bubble(width - BUBBLE)}
        </Group>
      );

    case 'buffer':
      return (
        <Group x={x} y={y} listening={false}>
          <Path
            data={`M 0 ${height * 0.08} L ${width} ${height / 2} L 0 ${height * 0.92} Z`}
            stroke={stroke}
            strokeWidth={2}
            fill="#334155"
            fillOpacity={hovered ? 0.65 : 0.4}
            lineJoin="round"
          />
        </Group>
      );

    case 'toggle': {
      const isOn = state === 1;
      const w = width;
      const h = height;
      return (
        <Group
          x={x - w / 2}
          y={y - h / 2}
          onClick={onAction}
          onTap={onAction}
          style={{ cursor: 'pointer' }}
        >
          {isOn && (
            <Rect
              width={w}
              height={h}
              cornerRadius={h / 2}
              fill="#22c55e"
              opacity={0.25}
              listening={false}
            />
          )}
          <Rect
            width={w}
            height={h}
            cornerRadius={h / 2}
            fill={isOn ? '#15803d' : '#3f3f46'}
            stroke={isOn ? '#22c55e' : '#52525b'}
            strokeWidth={1.5}
          />
          <Circle
            x={isOn ? w - 12 : 12}
            y={h / 2}
            radius={h / 2 - 5}
            fill="#ffffff"
          />
          <Text
            text={isOn ? '1' : '0'}
            y={h + 3}
            width={w}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fill={isOn ? '#4ade80' : '#a1a1aa'}
            listening={false}
          />
        </Group>
      );
    }

    case 'pushbutton': {
      const isPressed = state === 1;
      const r = width / 2;
      return (
        <Group
          x={x}
          y={y}
          onClick={onAction}
          onTap={onAction}
          style={{ cursor: 'pointer' }}
        >
          <Circle radius={r} fill="#27272a" stroke="#52525b" strokeWidth={2} />
          <Circle radius={r - 5} fill={isPressed ? '#ef4444' : '#dc2626'} />
          <Circle
            x={-3}
            y={-3}
            radius={r * 0.28}
            fill="#ffffff"
            opacity={0.25}
            listening={false}
          />
        </Group>
      );
    }

    case 'clock': {
      const isHigh = state === 1;
      const h = height;
      const w = width;
      const wave = `M ${-w / 2} ${h / 2} L ${-w / 2} ${-h / 2} L 0 ${-h / 2} L 0 ${h / 2} L ${
        w / 2
      } ${h / 2} L ${w / 2} ${-h / 2}`;
      return (
        <Group x={x} y={y} listening={false}>
          {isHigh && (
            <Path
              data={wave}
              stroke="#38bdf8"
              strokeWidth={7}
              opacity={0.25}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Path
            data={wave}
            stroke={isHigh ? '#38bdf8' : '#64748b'}
            strokeWidth={2.5}
            lineCap="round"
            lineJoin="round"
          />
        </Group>
      );
    }

    case 'constant0':
    case 'constant1': {
      const isHigh = normType === 'constant1';
      const size = width;
      return (
        <Group x={x - size / 2} y={y - size / 2} listening={false}>
          <Rect
            width={size}
            height={size}
            cornerRadius={5}
            fill={isHigh ? '#064e3b' : '#18181b'}
            stroke={isHigh ? '#22c55e' : '#52525b'}
            strokeWidth={1.5}
          />
          <Text
            text={isHigh ? '1' : '0'}
            y={size / 2 - 9}
            width={size}
            align="center"
            fontSize={15}
            fontStyle="bold"
            fill={isHigh ? '#4ade80' : '#9ca3af'}
          />
        </Group>
      );
    }

    case 'led': {
      const isOn = state === 1;
      const r = width / 2;
      return (
        <Group x={x} y={y} listening={false}>
          {isOn && (
            <Circle radius={r + 5} fill="#22c55e" opacity={0.22} />
          )}
          <Circle
            radius={r}
            fill="#18181b"
            stroke={isOn ? '#22c55e' : '#3f3f46'}
            strokeWidth={2}
          />
          <Circle radius={Math.max(r - 4, 2)} fill={isOn ? '#22c55e' : '#1e293b'} />
          <Circle
            x={-r * 0.3}
            y={-r * 0.3}
            radius={Math.max(r * 0.22, 1.5)}
            fill="#ffffff"
            opacity={isOn ? 0.65 : 0.15}
          />
        </Group>
      );
    }

    case 'probe': {
      const isHigh = state === 1;
      return (
        <Group x={x} y={y} listening={false}>
          <Rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            cornerRadius={5}
            fill="#09090b"
            stroke={isHigh ? '#22c55e' : '#3f3f46'}
            strokeWidth={1.5}
          />
          <Text
            text={isHigh ? '1' : '0'}
            y={-7}
            width={width}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fontFamily="monospace"
            fill={isHigh ? '#22c55e' : '#71717a'}
          />
        </Group>
      );
    }

    case 'sevenseg': {
      const seg = (i: number) => (inputStates[i] === 1 ? '#ef4444' : '#2a2a2e');
      const w = width;
      const h = height;
      const pad = 6;
      const left = pad;
      const right = w - pad;
      const midY = h / 2;
      const line = (i: number, pts: number[]) => (
        <Line
          points={pts}
          stroke={seg(i)}
          strokeWidth={4}
          lineCap="round"
          listening={false}
        />
      );
      return (
        <Group x={x - w / 2} y={y - h / 2} listening={false}>
          <Rect
            width={w}
            height={h}
            cornerRadius={3}
            fill="#09090b"
            stroke="#27272a"
            strokeWidth={2}
          />
          {line(0, [left, pad, right, pad])}
          {line(1, [right, pad, right, midY])}
          {line(2, [right, midY, right, h - pad])}
          {line(3, [left, h - pad, right, h - pad])}
          {line(4, [left, midY, left, h - pad])}
          {line(5, [left, pad, left, midY])}
          {line(6, [left, midY, right, midY])}
        </Group>
      );
    }

    case 'numin': {
      const w = width;
      const h = height;
      const value = Math.max(0, Math.min(255, state));
      return (
        <Group
          x={x - w / 2}
          y={y - h / 2}
          onClick={onAction}
          onTap={onAction}
          style={{ cursor: 'pointer' }}
        >
          <Rect
            width={w}
            height={h}
            cornerRadius={6}
            fill="#12233b"
            stroke="#3b6ea5"
            strokeWidth={1.5}
          />
          <Text
            text="NUM"
            width={w}
            y={h / 2 - 22}
            align="center"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
            fill="#7dd3fc"
            listening={false}
          />
          <Text
            text={String(value)}
            width={w}
            y={h / 2 - 6}
            align="center"
            fontSize={14}
            fontStyle="bold"
            fontFamily="monospace"
            fill="#e2e8f0"
            listening={false}
          />
        </Group>
      );
    }

    case 'numout': {
      const w = width;
      const h = height;
      const value = Math.max(0, Math.min(255, state));
      return (
        <Group x={x - w / 2} y={y - h / 2} listening={false}>
          <Rect
            width={w}
            height={h}
            cornerRadius={6}
            fill="#0f2417"
            stroke="#3f7a53"
            strokeWidth={1.5}
          />
          <Text
            text="VALUE"
            width={w}
            y={h / 2 - 22}
            align="center"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
            fill="#86efac"
            listening={false}
          />
          <Text
            text={String(value)}
            width={w}
            y={h / 2 - 6}
            align="center"
            fontSize={14}
            fontStyle="bold"
            fontFamily="monospace"
            fill="#f0fdf4"
            listening={false}
          />
        </Group>
      );
    }

    default:
      return null;
  }
};