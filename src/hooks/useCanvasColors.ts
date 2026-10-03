import { useLayoutEffect, useState } from 'react';
import { readCanvasColors, type CanvasColors } from '../utils/canvasColors';
import { useTheme } from './useTheme';

/**
 * Resolved after layout so the new `data-theme` rules are live before the
 * canvas reads them, which keeps Konva repaints in sync with the DOM theme.
 */
export const useCanvasColors = (): CanvasColors => {
  const { resolved } = useTheme();
  const [colors, setColors] = useState<CanvasColors>(readCanvasColors);

  useLayoutEffect(() => {
    setColors(readCanvasColors());
  }, [resolved]);

  return colors;
};