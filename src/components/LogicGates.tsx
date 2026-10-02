import { LogicState } from '../types';
import {
  andGate,
  orGate,
  notGate,
  nandGate,
  norGate,
  xorGate,
  xnorGate,
  bufferGate,
} from '../engine/gates';

export interface GateProps {
  id: string;
  type: string;
  inputs: LogicState[];
  output?: LogicState;
}

export const computeGateOutput = (type: string, inputs: LogicState[]): LogicState => {
  switch (type) {
    case 'and':
      return andGate(inputs);
    case 'or':
      return orGate(inputs);
    case 'not':
      return notGate(inputs[0] ?? 0);
    case 'nand':
      return nandGate(inputs);
    case 'nor':
      return norGate(inputs);
    case 'xor':
      return xorGate(inputs);
    case 'xnor':
      return xnorGate(inputs);
    case 'buffer':
      return bufferGate(inputs[0] ?? 0);
    default:
      return 0;
  }
};
