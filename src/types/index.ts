export type LogicState = 0 | 1;

export interface Point {
  x: number;
  y: number;
}

export interface ComponentPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  position: Point;
  componentId: string;
}

export interface Connection {
  id: string;
  sourcePortId: string;
  targetPortId: string;
  points?: Point[];
  sourceComponentId?: string;
  targetComponentId?: string;
}

export interface ComponentProps {
  id: string;
  type: string;
  position: Point;
  rotation?: number;
  scale?: number;
  width?: number;
  height?: number;
  label?: string;
  /** Input count for variable-input gates (and/or/nand/nor). */
  numInputs?: number;
  /** Bit width for numeric input/output parts. */
  numBits?: number;
  [key: string]: any;
}

export interface Circuit {
  id: string;
  name: string;
  components: ComponentProps[];
  connections: Connection[];
  metadata?: {
    version: string;
    created: string;
    modified: string;
    customCircuits?: unknown[];
  };
}
