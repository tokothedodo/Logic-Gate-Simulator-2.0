import { Point } from '../types';
import { CUSTOM_TYPE_PREFIX, getCustomCircuitByType } from '../engine/customCircuit';

export interface GeometryPin {
  name: string;
  offset: Point;
}

export interface ComponentGeometry {
  width: number;
  height: number;
  /** Length of the schematic leg drawn between a pin and the symbol body. */
  lead: number;
  symbolX: number;
  symbolY: number;
  symbolWidth: number;
  symbolHeight: number;
  inputs: GeometryPin[];
  outputs: GeometryPin[];
  interactive: boolean;
}

/** Degrees clockwise, normalised to 0/90/180/270 whenever possible. */
export const normalizeRotation = (rotation?: number): number => {
  const deg = ((rotation ?? 0) % 360 + 360) % 360;
  return deg;
};

/**
 * Rotates a point of a part's own box about that box's centre. Pin offsets are
 * always stored unrotated, so wires and hit tests derive the drawn position.
 */
export const rotateOffset = (
  offset: Point,
  width: number,
  height: number,
  rotation?: number
): Point => {
  const deg = normalizeRotation(rotation);
  if (deg === 0) return offset;

  const cx = width / 2;
  const cy = height / 2;
  // Clockwise on screen, where y grows downward
  if (deg === 90) return { x: cx + cy - offset.y, y: cy - cx + offset.x };
  if (deg === 180) return { x: width - offset.x, y: height - offset.y };
  if (deg === 270) return { x: cx - cy + offset.y, y: cy + cx - offset.x };

  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = offset.x - cx;
  const dy = offset.y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

/** Axis-aligned bounds of a part's box once it has been rotated about its centre. */
export const rotatedBounds = (
  position: Point,
  width: number,
  height: number,
  rotation?: number
): { x: number; y: number; width: number; height: number } => {
  const deg = normalizeRotation(rotation);
  if (deg === 0) return { x: position.x, y: position.y, width, height };

  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const spanX = width * cos + height * sin;
  const spanY = width * sin + height * cos;

  // The box keeps its centre, so the bounds grow evenly on both sides
  return {
    x: position.x + (width - spanX) / 2,
    y: position.y + (height - spanY) / 2,
    width: spanX,
    height: spanY,
  };
};

const GATE_BODY_WIDTH: Record<string, number> = {
  and: 28,
  or: 28,
  nand: 30,
  nor: 30,
  xor: 32,
  xnor: 34,
};

export const isVariableInputGate = (type: string): boolean => {
  const norm = type.toLowerCase();
  return norm === 'and' || norm === 'or' || norm === 'nand' || norm === 'nor';
};

export const supportsCustomInputs = (type: string): boolean => {
  const norm = type.toLowerCase();
  return (
    isVariableInputGate(norm) ||
    norm === 'xor' ||
    norm === 'xnor' ||
    norm === 'not' ||
    norm === 'buffer'
  );
};

export const MIN_GATE_INPUTS = 2;
export const MAX_GATE_INPUTS = 8;

const GATE_LEAD = 13;
const INVERTER_LEAD = 11;
const INDICATOR_LEAD = 9;
const SOURCE_LEAD = 10;
const SEG_LEAD = 12;

const GATE_PIN_SPACING = 14;
const GATE_PIN_MARGIN = 10;
const BUS_PIN_SPACING = 14;
const BUS_MARGIN = 14;
export const MIN_NUMERIC_BITS = 1;
export const MAX_NUMERIC_BITS = 16;
export const DEFAULT_NUMERIC_BITS = 8;
const clampBits = (bits?: number) =>
  Math.max(MIN_NUMERIC_BITS, Math.min(MAX_NUMERIC_BITS, Math.round(bits || DEFAULT_NUMERIC_BITS)));

const gateHeight = (count: number) =>
  GATE_PIN_MARGIN * 2 + (count - 1) * GATE_PIN_SPACING;

const spreadPins = (count: number, height: number, x: number): GeometryPin[] => {
  if (count === 1) return [{ name: 'A', offset: { x, y: height / 2 } }];
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  // Even spacing keeps every terminal at least 14px from its neighbour
  return Array.from({ length: count }, (_, i) => ({
    name: names[i],
    offset: { x, y: GATE_PIN_MARGIN + i * GATE_PIN_SPACING },
  }));
};

const baseGeometry = (type: string, numInputs: number, numBits?: number): ComponentGeometry => {
  const norm = type.toLowerCase();
  const count = Math.max(MIN_GATE_INPUTS, Math.min(MAX_GATE_INPUTS, numInputs || 2));

  switch (norm) {
    case 'and':
    case 'or':
    case 'nand':
    case 'nor':
    case 'xor':
    case 'xnor': {
      const height = gateHeight(count);
      const symbolWidth = GATE_BODY_WIDTH[norm];
      const width = symbolWidth + GATE_LEAD * 2;
      return {
        width,
        height,
        lead: GATE_LEAD,
        symbolX: GATE_LEAD,
        symbolY: 0,
        symbolWidth,
        symbolHeight: height,
        inputs: spreadPins(count, height, 0),
        outputs: [{ name: 'Y', offset: { x: width, y: height / 2 } }],
        interactive: false,
      };
    }

    case 'not': {
      const height = 30;
      const symbolWidth = 21;
      const width = symbolWidth + INVERTER_LEAD * 2;
      return {
        width,
        height,
        lead: INVERTER_LEAD,
        symbolX: INVERTER_LEAD,
        symbolY: 0,
        symbolWidth,
        symbolHeight: height,
        inputs: [{ name: 'A', offset: { x: 0, y: height / 2 } }],
        outputs: [{ name: 'Y', offset: { x: width, y: height / 2 } }],
        interactive: false,
      };
    }

    case 'buffer': {
      const height = 30;
      const symbolWidth = 25;
      const width = symbolWidth + INVERTER_LEAD * 2;
      return {
        width,
        height,
        lead: INVERTER_LEAD,
        symbolX: INVERTER_LEAD,
        symbolY: 0,
        symbolWidth,
        symbolHeight: height,
        inputs: [{ name: 'A', offset: { x: 0, y: height / 2 } }],
        outputs: [{ name: 'Y', offset: { x: width, y: height / 2 } }],
        interactive: false,
      };
    }

    case 'toggle': {
      const symbolWidth = 54;
      const symbolHeight = 32;
      const width = symbolWidth + SOURCE_LEAD;
      return {
        width,
        height: 44,
        lead: SOURCE_LEAD,
        symbolX: symbolWidth / 2,
        symbolY: 16,
        symbolWidth,
        symbolHeight,
        inputs: [],
        outputs: [{ name: 'OUT', offset: { x: width, y: 16 } }],
        interactive: true,
      };
    }

    case 'pushbutton': {
      const symbolWidth = 30;
      const symbolHeight = 30;
      const width = symbolWidth + SOURCE_LEAD;
      return {
        width,
        height: 42,
        lead: SOURCE_LEAD,
        symbolX: 15,
        symbolY: 15,
        symbolWidth,
        symbolHeight,
        inputs: [],
        outputs: [{ name: 'OUT', offset: { x: width, y: 15 } }],
        interactive: true,
      };
    }

    case 'clock': {
      const symbolWidth = 36;
      const symbolHeight = 16;
      const width = symbolWidth + SOURCE_LEAD;
      return {
        width,
        height: 20,
        lead: SOURCE_LEAD,
        symbolX: symbolWidth / 2 - 2,
        symbolY: 10,
        symbolWidth,
        symbolHeight,
        inputs: [],
        outputs: [{ name: 'OUT', offset: { x: width, y: 10 } }],
        interactive: false,
      };
    }

    case 'constant0':
    case 'constant1': {
      const symbolWidth = 28;
      const width = symbolWidth + INDICATOR_LEAD;
      return {
        width,
        height: 28,
        lead: INDICATOR_LEAD,
        symbolX: INDICATOR_LEAD + symbolWidth / 2,
        symbolY: 14,
        symbolWidth,
        symbolHeight: 28,
        inputs: [],
        outputs: [{ name: 'OUT', offset: { x: width, y: 14 } }],
        interactive: false,
      };
    }

    case 'led': {
      const symbolWidth = 30;
      const width = symbolWidth + INDICATOR_LEAD;
      return {
        width,
        height: 30,
        lead: INDICATOR_LEAD,
        symbolX: INDICATOR_LEAD + symbolWidth / 2,
        symbolY: 15,
        symbolWidth,
        symbolHeight: 30,
        inputs: [{ name: 'IN', offset: { x: 0, y: 15 } }],
        outputs: [],
        interactive: false,
      };
    }

    case 'probe': {
      const symbolWidth = 48;
      const width = symbolWidth + INDICATOR_LEAD;
      return {
        width,
        height: 28,
        lead: INDICATOR_LEAD,
        symbolX: INDICATOR_LEAD + symbolWidth / 2,
        symbolY: 14,
        symbolWidth,
        symbolHeight: 28,
        inputs: [{ name: 'IN', offset: { x: 0, y: 14 } }],
        outputs: [],
        interactive: false,
      };
    }

    case 'numin': {
      const bitCount = clampBits(numBits);
      const symbolWidth = 40;
      const height = BUS_PIN_SPACING * (bitCount - 1) + BUS_MARGIN * 2;
      const lead = 14;
      const width = lead + symbolWidth + lead;
      return {
        width,
        height,
        lead,
        symbolX: lead + symbolWidth / 2,
        symbolY: height / 2,
        symbolWidth,
        symbolHeight: height - 16,
        inputs: [],
        outputs: Array.from({ length: bitCount }, (_, i) => ({
          name: `B${i}`,
          offset: { x: width, y: BUS_MARGIN + i * BUS_PIN_SPACING },
        })),
        interactive: true,
      };
    }

    case 'numout': {
      const bitCount = clampBits(numBits);
      const symbolWidth = 40;
      const height = BUS_PIN_SPACING * (bitCount - 1) + BUS_MARGIN * 2;
      const lead = 14;
      const width = lead + symbolWidth + lead;
      return {
        width,
        height,
        lead,
        symbolX: lead + symbolWidth / 2,
        symbolY: height / 2,
        symbolWidth,
        symbolHeight: height - 16,
        inputs: Array.from({ length: bitCount }, (_, i) => ({
          name: `B${i}`,
          offset: { x: 0, y: BUS_MARGIN + i * BUS_PIN_SPACING },
        })),
        outputs: [],
        interactive: false,
      };
    }

    case 'sevenseg': {
      // Pins are evenly spaced along a tall lead (14px apart) so no two
      // terminals overlap; each pin is lettered A-G for an unambiguous mapping.
      const segmentNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const symbolWidth = 46;
      const symbolHeight = 96;
      const lead = INDICATOR_LEAD + SEG_LEAD;
      const spacing = 14;
      const top = (116 - (segmentNames.length - 1) * spacing) / 2;

      return {
        width: lead + symbolWidth,
        height: 116,
        lead,
        symbolX: lead + symbolWidth / 2,
        symbolY: 58,
        symbolWidth,
        symbolHeight,
        inputs: segmentNames.map((name, i) => ({
          name,
          offset: { x: 0, y: top + i * spacing },
        })),
        outputs: [],
        interactive: false,
      };
    }

    default: {
      const symbolWidth = 28;
      const width = symbolWidth + GATE_LEAD * 2;
      return {
        width,
        height: 30,
        lead: GATE_LEAD,
        symbolX: GATE_LEAD,
        symbolY: 0,
        symbolWidth,
        symbolHeight: 30,
        inputs: [{ name: 'A', offset: { x: 0, y: 15 } }],
        outputs: [{ name: 'Y', offset: { x: width, y: 15 } }],
        interactive: false,
      };
    }
  }
};

/** Custom blocks get roomier connectors so several stay easy to tell apart. */
const CUSTOM_PIN_SPACING = 20;
const CUSTOM_PIN_MARGIN = 14;

const customBlockGeometry = (inputCount: number, outputCount: number): ComponentGeometry => {
  const rows = Math.max(inputCount, outputCount, 1);
  const height = Math.max(64, rows * CUSTOM_PIN_SPACING + CUSTOM_PIN_MARGIN * 2);
  const top = (height - (rows - 1) * CUSTOM_PIN_SPACING) / 2;
  // Pins sit on the outer edge, clear of the body and of the name inside it
  const lead = 18;
  const width = 108;

  return {
    width,
    height,
    lead,
    symbolX: width / 2,
    symbolY: height / 2,
    symbolWidth: width - lead * 2,
    symbolHeight: height - lead * 2,
    inputs: Array.from({ length: inputCount }, (_, i) => ({
      name: `IN${i + 1}`,
      offset: { x: 0, y: top + i * CUSTOM_PIN_SPACING },
    })),
    outputs: Array.from({ length: outputCount }, (_, i) => ({
      name: `OUT${i + 1}`,
      offset: { x: width, y: top + i * CUSTOM_PIN_SPACING },
    })),
    interactive: false,
  };
};

export const getComponentGeometry = (
  type: string,
  numInputs?: number,
  numBits?: number
): ComponentGeometry => {
  if (type.startsWith(CUSTOM_TYPE_PREFIX)) {
    const def = getCustomCircuitByType(type);
    if (def) {
      return customBlockGeometry(def.inputs.length, def.outputs.length);
    }
  }
  return baseGeometry(type, numInputs ?? 2, numBits);
};