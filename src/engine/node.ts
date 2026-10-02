import { LogicState } from '../types';

export class LogicNode {
  id: string;
  state: LogicState = 0;
  drivenBy: string[] = [];
  drives: string[] = [];

  constructor(id: string) {
    this.id = id;
  }

  setState(state: LogicState) {
    if (this.state !== state) {
      this.state = state;
      return true;
    }
    return false;
  }
}
