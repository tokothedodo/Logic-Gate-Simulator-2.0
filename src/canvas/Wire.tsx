import React from 'react';
import { Path, Group } from 'react-konva';
import { Point } from '../types';

export type WireRoutingStyle = 'bezier' | 'orthogonal';

interface WireProps {
  id?: string;
  points: Point[];
  state?: number;
  isSelected?: boolean;
  isDrawing?: boolean;
  isBlocked?: boolean;
  routingStyle?: WireRoutingStyle;
  onClick?: (e: any) => void;
}

export const buildBezierPath = (p1: Point, p2: Point): string => {
  const dx = Math.max(Math.abs(p2.x - p1.x) * 0.5, 40);
  const cp1 = { x: p1.x + dx, y: p1.y };
  const cp2 = { x: p2.x - dx, y: p2.y };
  return `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
};

export const buildOrthogonalPath = (p1: Point, p2: Point): string => {
  const margin = 24;
  if (p2.x >= p1.x + margin * 2) {
    const midX = (p1.x + p2.x) / 2;
    return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  // Target is behind or vertically aligned with source
  const midY = (p1.y + p2.y) / 2;
  return `M ${p1.x} ${p1.y} L ${p1.x + margin} ${p1.y} L ${p1.x + margin} ${midY} L ${p2.x - margin} ${midY} L ${p2.x - margin} ${p2.y} L ${p2.x} ${p2.y}`;
};

export const Wire: React.FC<WireProps> = ({
  points,
  state = 0,
  isSelected = false,
  isDrawing = false,
  isBlocked = false,
  routingStyle = 'bezier',
  onClick,
}) => {
  if (points.length < 2) return null;

  const p1 = points[0];
  const p2 = points[points.length - 1];

  const path = routingStyle === 'orthogonal'
    ? buildOrthogonalPath(p1, p2)
    : buildBezierPath(p1, p2);

  const isHigh = state === 1;

  const activeColor = isBlocked
    ? '#ef4444'
    : isSelected
    ? '#38bdf8'
    : isHigh
    ? '#22c55e'
    : '#475569';
  const strokeWidth = isSelected || isBlocked ? 3 : isHigh ? 2.5 : 2;

  return (
    <Group onClick={onClick} onTap={onClick}>
      {/* Invisible wider hit region for easy clicking/selecting */}
      <Path
        data={path}
        stroke="transparent"
        strokeWidth={14}
        lineCap="round"
        lineJoin="round"
      />

      {/* Main wire path */}
      <Path
        data={path}
        stroke={activeColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        dash={isDrawing ? [6, 4] : undefined}
      />

    </Group>
  );
};
