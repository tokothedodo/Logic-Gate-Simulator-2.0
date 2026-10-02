import { LogicState } from '../types';

export function andGate(inputs: LogicState[]): LogicState {
  if (inputs.length === 0) return 0;
  return inputs.every((i) => i === 1) ? 1 : 0;
}

export function orGate(inputs: LogicState[]): LogicState {
  if (inputs.length === 0) return 0;
  return inputs.some((i) => i === 1) ? 1 : 0;
}

export function notGate(input: LogicState): LogicState {
  return input === 1 ? 0 : 1;
}

export function nandGate(inputs: LogicState[]): LogicState {
  return notGate(andGate(inputs));
}

export function norGate(inputs: LogicState[]): LogicState {
  return notGate(orGate(inputs));
}

export function xorGate(inputs: LogicState[]): LogicState {
  if (inputs.length === 0) return 0;
  const count = inputs.filter((i) => i === 1).length;
  return count % 2 === 1 ? 1 : 0;
}

export function xnorGate(inputs: LogicState[]): LogicState {
  return notGate(xorGate(inputs));
}

export function bufferGate(input: LogicState): LogicState {
  return input;
}
