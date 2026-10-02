import React from 'react';
import { Group, Line, Circle } from 'react-konva';

interface GridProps {
  stageWidth: number;
  stageHeight: number;
  stageX: number;
  stageY: number;
  scale: number;
  gridSize?: number;
  style?: 'dots' | 'lines';
}

export const Grid: React.FC<GridProps> = ({
  stageWidth,
  stageHeight,
  stageX,
  stageY,
  scale,
  gridSize = 20,
  style = 'dots',
}) => {
  // Compute visible viewport in world coordinates
  const minX = Math.floor((-stageX) / (scale * gridSize)) * gridSize - gridSize * 2;
  const maxX = Math.ceil((-stageX + stageWidth) / (scale * gridSize)) * gridSize + gridSize * 2;
  const minY = Math.floor((-stageY) / (scale * gridSize)) * gridSize - gridSize * 2;
  const maxY = Math.ceil((-stageY + stageHeight) / (scale * gridSize)) * gridSize + gridSize * 2;

  if (style === 'lines') {
    const lines: React.ReactElement[] = [];

    // Vertical lines
    for (let x = minX; x <= maxX; x += gridSize) {
      const isMajor = x % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, minY, x, maxY]}
          stroke={isMajor ? '#2a2a2a' : '#1a1a1a'}
          strokeWidth={1}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = minY; y <= maxY; y += gridSize) {
      const isMajor = y % (gridSize * 5) === 0;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[minX, y, maxX, y]}
          stroke={isMajor ? '#2a2a2a' : '#1a1a1a'}
          strokeWidth={1}
          listening={false}
        />
      );
    }

    return <Group listening={false}>{lines}</Group>;
  }

  // Dot matrix mode
  const dots: React.ReactElement[] = [];
  for (let x = minX; x <= maxX; x += gridSize) {
    const isMajorX = x % (gridSize * 5) === 0;
    for (let y = minY; y <= maxY; y += gridSize) {
      const isMajor = isMajorX && y % (gridSize * 5) === 0;
      dots.push(
        <Circle
          key={`d-${x}-${y}`}
          x={x}
          y={y}
          radius={isMajor ? 1.5 : 1}
          fill={isMajor ? '#383838' : '#222222'}
          listening={false}
        />
      );
    }
  }

  return <Group listening={false}>{dots}</Group>;
};
