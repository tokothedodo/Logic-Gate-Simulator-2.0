import React from 'react';
import { Path, Group } from 'react-konva';
import { Point } from '../types';
import { useCanvasColors } from '../hooks/useCanvasColors';

export type WireRoutingStyle = 'bezier' | 'orthogonal';

export interface WireLoopBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface WireProps {
  id?: string;
  points: Point[];
  state?: number;
  isSelected?: boolean;
  isDrawing?: boolean;
  isBlocked?: boolean;
  routingStyle?: WireRoutingStyle;
  /** Set when a wire runs from a part back into that same part. */
  loopBounds?: WireLoopBounds;
  onClick?: (e: any) => void;
}

/** Clearance kept between a feedback wire and the body it loops around. */
const LOOP_GAP = 26;

/**
 * A wire whose two ends sit on the same part would otherwise run straight
 * through that part, hidden underneath it and impossible to grab. This walks
 * out of the source, round the outside, and back into the target.
 */
export const buildSelfLoopPath = (
  p1: Point,
  p2: Point,
  box: WireLoopBounds,
  gap = LOOP_GAP
): string => {
  const midX = (box.left + box.right) / 2;
  const outX = p1.x >= midX ? box.right + gap : box.left - gap;
  const inX = p2.x >= midX ? box.right + gap : box.left - gap;
  // Loop on the side the source is furthest from, so the wire never cuts the body
  const laneY = p1.y >= p2.y ? box.bottom + gap : box.top - gap;

  return [
    `M ${p1.x} ${p1.y}`,
    `L ${outX} ${p1.y}`,
    `L ${outX} ${laneY}`,
    `L ${inX} ${laneY}`,
    `L ${inX} ${p2.y}`,
    `L ${p2.x} ${p2.y}`,
  ].join(' ');
};

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
  loopBounds,
  onClick,
}) => {
  const c = useCanvasColors();

  if (points.length < 2) return null;

  const p1 = points[0];
  const p2 = points[points.length - 1];

  const path =
    loopBounds !== undefined
      ? buildSelfLoopPath(p1, p2, loopBounds)
      : routingStyle === 'orthogonal'
      ? buildOrthogonalPath(p1, p2)
      : buildBezierPath(p1, p2);

  const isHigh = state === 1;

  const activeColor = isBlocked
    ? c.redBright
    : isSelected
    ? c.hl
    : isHigh
    ? c.greenBright
    : c.wireIdle;
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
