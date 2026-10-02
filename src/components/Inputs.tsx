import { LogicState } from '../types';

export const toggleState = (current: LogicState): LogicState => {
  return current === 1 ? 0 : 1;
};
