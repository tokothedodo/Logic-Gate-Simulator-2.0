import React, { useState } from 'react';
import { Circle, Group, Text } from 'react-konva';
import { useCanvasColors } from '../hooks/useCanvasColors';

interface PinProps {
  x: number;
  y: number;
  type: 'input' | 'output';
  name?: string;
  state?: number;
  isDrawingWire?: boolean;
  isSelected?: boolean;
  isTaken?: boolean;
  onClick?: (e: any) => void;
  onHover?: (hovering: boolean) => void;
}

export const Pin: React.FC<PinProps> = ({
  x,
  y,
  type,
  name,
  state = 0,
  isDrawingWire = false,
  isSelected = false,
  isTaken = false,
  onClick,
  onHover,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const c = useCanvasColors();
  const isHigh = state === 1;

  // While a wire is in hand, inputs that already have one are shown as taken
  const isTarget = isDrawingWire && type === 'input' && !isTaken;
  const isBlocked = isDrawingWire && type === 'input' && isTaken;
  const radius = isHovered ? 7 : isTarget || isBlocked ? 6.5 : 5.5;

  const pinFill = isBlocked
    ? c.pinLo
    : isHigh
    ? c.pinHi
    : isTarget
    ? c.hl
    : c.pinIdle;

  const pinStroke = isBlocked
    ? c.redBright
    : isSelected
    ? c.hl
    : isHigh
    ? c.greenBright
    : isTarget
    ? c.hl
    : c.pinIdle;

  return (
    <Group
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover && onHover(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onHover && onHover(false);
      }}
      style={{ cursor: isBlocked ? 'not-allowed' : 'crosshair' }}
    >
      {/* Target pulse ring when dragging wire */}
      {isTarget && (
        <Circle
          x={x}
          y={y}
          radius={11}
          stroke={c.hl}
          strokeWidth={1.5}
          dash={[3, 3]}
          opacity={0.7}
        />
      )}

      {/* Larger transparent hit zone for effortless clicking */}
      <Circle
        x={x}
        y={y}
        radius={14}
        fill="transparent"
      />

      {isBlocked && (
        <Circle x={x} y={y} radius={11} stroke={c.redBright} strokeWidth={1.5} opacity={0.55} />
      )}

      {/* Main Pin Circle */}
      <Circle
        x={x}
        y={y}
        radius={radius}
        fill={pinFill}
        stroke={pinStroke}
        strokeWidth={1.5}
      />

      {/* Pin Name Label */}
      {name && (
        <Text
          text={name}
          fill={isHovered ? c.knob : c.pinIdle}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fontStyle="bold"
          x={type === 'output' ? x - 32 : x + 9}
          y={y - 5}
          align={type === 'output' ? 'right' : 'left'}
          width={24}
          listening={false}
        />
      )}
    </Group>
  );
};
