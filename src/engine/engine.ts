import { LogicState } from '../types';
import { LogicNode } from './node';

export interface NodeMap {
  [id: string]: LogicNode;
}

export class LogicEngine {
  private nodes: NodeMap = {};
  private listeners: Set<() => void> = new Set();
  private dirtyNodes: Set<string> = new Set();

  getNode(id: string): LogicNode | undefined {
    return this.nodes[id];
  }

  createNode(id: string): LogicNode {
    if (!this.nodes[id]) {
      this.nodes[id] = new LogicNode(id);
    }
    return this.nodes[id];
  }

  addNode(node: LogicNode) {
    this.nodes[node.id] = node;
  }

  removeNode(id: string) {
    delete this.nodes[id];
  }

  connect(sourceId: string, targetId: string) {
    const source = this.createNode(sourceId);
    const target = this.createNode(targetId);
    if (!source.drives.includes(targetId)) {
      source.drives.push(targetId);
    }
    if (!target.drivenBy.includes(sourceId)) {
      target.drivenBy.push(sourceId);
    }
    this.markDirty(targetId);
  }

  disconnect(sourceId: string, targetId: string) {
    const source = this.nodes[sourceId];
    const target = this.nodes[targetId];
    if (source) {
      source.drives = source.drives.filter((id) => id !== targetId);
    }
    if (target) {
      target.drivenBy = target.drivenBy.filter((id) => id !== sourceId);
    }
  }

  setInput(id: string, state: LogicState) {
    const node = this.createNode(id);
    if (node.setState(state)) {
      node.drives.forEach((driveId) => this.markDirty(driveId));
      this.notify();
    }
  }

  getState(id: string): LogicState {
    return this.nodes[id]?.state ?? 0;
  }

  markDirty(id: string) {
    this.dirtyNodes.add(id);
  }

  evaluate() {
    let changed = false;
    const toProcess = Array.from(this.dirtyNodes);
    this.dirtyNodes.clear();

    toProcess.forEach((nodeId) => {
      const node = this.nodes[nodeId];
      if (!node) return;
      const newState = this.computeState(node);
      if (node.setState(newState)) {
        changed = true;
        node.drives.forEach((driveId) => this.markDirty(driveId));
      }
    });

    if (changed || toProcess.length > 0) {
      this.notify();
    }

    if (this.dirtyNodes.size > 0) {
      this.evaluate();
    }
  }

  private computeState(node: LogicNode): LogicState {
    if (node.drivenBy.length === 0) {
      return node.state;
    }
    let result: LogicState = 0;
    for (const driverId of node.drivenBy) {
      const driver = this.nodes[driverId];
      if (driver && driver.state === 1) {
        result = 1;
        break;
      }
    }
    return result;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  clear() {
    this.nodes = {};
    this.listeners.clear();
    this.dirtyNodes.clear();
  }
}
