import React from 'react';
import { Group, Path, Circle, Rect, Text, Line } from 'react-konva';
import { useCanvasColors } from '../hooks/useCanvasColors';

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
  color,
  hovered = false,
  onAction,
}) => {
  const c = useCanvasColors();
  const normType = type.toLowerCase();
  const stroke = hovered ? c.gateStrokeHover : color ?? c.gateStroke;

  const body = (path: string, inset = 0) => (
    <Path
      data={path}
      stroke={stroke}
      strokeWidth={2}
      fill={c.gateFill}
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
      fill={c.gateBubble}
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
            fill={c.gateFill}
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
            fill={c.gateFill}
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
              fill={c.greenBright}
              opacity={0.25}
              listening={false}
            />
          )}
          <Rect
            width={w}
            height={h}
            cornerRadius={h / 2}
            fill={isOn ? c.green : c.partStroke}
            stroke={isOn ? c.greenBright : c.partStroke}
            strokeWidth={1.5}
          />
          <Circle
            x={isOn ? w - 12 : 12}
            y={h / 2}
            radius={h / 2 - 5}
            fill={c.knob}
          />
          <Text
            text={isOn ? '1' : '0'}
            y={h + 3}
            width={w}
            align="center"
            fontSize={12}
            fontStyle="bold"
            fill={isOn ? c.greenText : c.partText}
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
          <Circle radius={r} fill={c.partFill} stroke={c.partStroke} strokeWidth={2} />
          <Circle radius={r - 5} fill={isPressed ? c.redBright : c.red} />
          <Circle
            x={-3}
            y={-3}
            radius={r * 0.28}
            fill={c.knob}
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
              stroke={c.hl}
              strokeWidth={7}
              opacity={0.25}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Path
            data={wave}
            stroke={isHigh ? c.hl : c.hlDim}
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
            fill={isHigh ? c.partHiFill : c.partFill}
            stroke={isHigh ? c.greenBright : c.partStroke}
            strokeWidth={1.5}
          />
          <Text
            text={isHigh ? '1' : '0'}
            y={size / 2 - 9}
            width={size}
            align="center"
            fontSize={15}
            fontStyle="bold"
            fill={isHigh ? c.greenText : c.partText}
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
            <Circle radius={r + 5} fill={c.greenBright} opacity={0.22} />
          )}
          <Circle
            radius={r}
            fill={c.partFill}
            stroke={isOn ? c.greenBright : c.partStroke}
            strokeWidth={2}
          />
          <Circle radius={Math.max(r - 4, 2)} fill={isOn ? c.greenBright : c.gateBubble} />
          <Circle
            x={-r * 0.3}
            y={-r * 0.3}
            radius={Math.max(r * 0.22, 1.5)}
            fill={c.knob}
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
            fill={c.partFill}
            stroke={isHigh ? c.greenBright : c.partStroke}
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
            fill={isHigh ? c.greenBright : c.partText}
          />
        </Group>
      );
    }

    case 'sevenseg': {
      const seg = (i: number) => (inputStates[i] === 1 ? c.redBright : c.segOff);
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
            fill={c.partFill}
            stroke={c.partStroke}
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
            fill={c.numinFill}
            stroke={c.numinStroke}
            strokeWidth={1.5}
          />
          <Text
            text="NUM"
            width={w}
            y={h / 2 - 22}
            align="center"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
            fill={c.numinLabel}
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
            fill={c.numinValue}
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
            fill={c.numoutFill}
            stroke={c.numoutStroke}
            strokeWidth={1.5}
          />
          <Text
            text="VALUE"
            width={w}
            y={h / 2 - 22}
            align="center"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
            fill={c.numoutLabel}
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
            fill={c.numoutValue}
            listening={false}
          />
        </Group>
      );
    }

    default:
      return null;
  }
};