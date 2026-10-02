import { Connection, Point } from '../types';
import { evaluateCircuit } from './evaluator';

interface TruthPin {
  id: string;
  type: 'input' | 'output';
  name: string;
  offset: Point;
}

interface TruthComponent {
  id: string;
  type: string;
  position: Point;
  label?: string;
  numInputs?: number;
  numBits?: number;
  state?: number;
  pins?: TruthPin[];
}

export interface TruthTableColumn {
  key: string;
  label: string;
}

export interface TruthTableResult {
  title: string;
  inputs: TruthTableColumn[];
  outputs: TruthTableColumn[];
  /** Row values aligned with inputs followed by outputs. */
  rows: number[][];
  truncated: boolean;
  freeInputCount: number;
  constantCount: number;
}

const GENERATOR_TYPES = new Set(['toggle', 'pushbutton', 'clock']);
const CONSTANT_TYPES = new Set(['constant0', 'constant1']);
const MAX_VARIABLES = 8;

const displayName = (comp: TruthComponent): string => {
  if (comp.label) return comp.label;
  const spaced = comp.type.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const GENERATOR_NORM = new Set([
  'toggle',
  'pushbutton',
  'clock',
  'constant0',
  'constant1',
  'numin',
]);

/**
 * Enumerates every combination of the generators and floating inputs feeding
 * `targetIds` (or the whole circuit when that list is empty) and re-evaluates
 * the circuit once per row. Every target contributes its own output columns,
 * so a selection of several parts produces one combined table.
 */
export const generateTruthTable = (
  components: TruthComponent[],
  connections: Connection[],
  targetIds: string[] = []
): TruthTableResult | null => {
  const byId = new Map(components.map((c) => [c.id, c]));

  const targets = (
    targetIds.length > 0
      ? targetIds.map((id) => byId.get(id))
      : components.filter((c) => {
          const norm = c.type.toLowerCase();
          if (GENERATOR_NORM.has(norm)) return false;
          const pins = c.pins ?? [];
          return pins.some((pin) => pin.type === 'output') || pins.some((pin) => pin.type === 'input');
        })
  ).filter((c): c is TruthComponent => Boolean(c));

  if (targets.length === 0) return null;

  const driversOf = new Map<string, Connection[]>();
  connections.forEach((conn) => {
    const list = driversOf.get(conn.targetPortId);
    if (list) list.push(conn);
    else driversOf.set(conn.targetPortId, [conn]);
  });

  const variables: { key: string; label: string }[] = [];
  const variableKeys = new Set<string>();
  const freeInputs: { pinId: string; key: string; label: string }[] = [];
  const constants: string[] = [];
  const visited = new Set<string>();
  const queue: string[] = targets.map((t) => t.id);

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);

    const comp = byId.get(id);
    if (!comp) continue;

    (comp.pins ?? [])
      .filter((pin) => pin.type === 'input')
      .forEach((pin) => {
        const drivers = driversOf.get(pin.id) ?? [];

        if (drivers.length === 0) {
          // Floating input: it can be driven by an implicit variable
          freeInputs.push({
            pinId: pin.id,
            key: `free:${pin.id}`,
            label: `${displayName(comp)}·${pin.name}`,
          });
          return;
        }

        drivers.forEach((conn) => {
          const srcId = conn.sourceComponentId;
          if (!srcId) return;
          const src = byId.get(srcId);
          if (!src) return;

          const srcNorm = src.type.toLowerCase();
          if (GENERATOR_TYPES.has(srcNorm)) {
            if (!variableKeys.has(src.id)) {
              variableKeys.add(src.id);
              variables.push({ key: src.id, label: displayName(src) });
            }
          } else if (CONSTANT_TYPES.has(srcNorm)) {
            if (!constants.includes(displayName(src))) constants.push(displayName(src));
          } else if (srcNorm === 'numin') {
            const label = `${displayName(src)}=${src.state ?? 0}`;
            if (!constants.includes(label)) constants.push(label);
          }

          queue.push(srcId);
        });
      });
  }

  const outputs: TruthTableColumn[] = [];
  targets.forEach((target) => {
    if (target.type.toLowerCase() === 'numout') {
      outputs.push({
        key: `__num__:${target.id}`,
        label: `${displayName(target)} (${target.numBits ?? 8}-bit)`,
      });
      return;
    }

    const outPins = (target.pins ?? []).filter((pin) => pin.type === 'output');
    if (outPins.length > 0) {
      outPins.forEach((pin) =>
        outputs.push({ key: pin.id, label: `${displayName(target)}·${pin.name}` })
      );
    } else {
      outputs.push({ key: `__state__:${target.id}`, label: displayName(target) });
    }
  });

  const columns: TruthTableColumn[] = [
    ...variables.map((v) => ({ key: `gen:${v.key}`, label: v.label })),
    ...freeInputs.map((f) => ({ key: f.key, label: f.label })),
  ];

  const truncated = columns.length > MAX_VARIABLES;
  const activeColumns = columns.slice(0, MAX_VARIABLES);
  const activeFreeInputs = freeInputs.slice(
    0,
    Math.max(0, MAX_VARIABLES - variables.length)
  );

  const rowCount = 1 << activeColumns.length;
  const rows: number[][] = [];

  for (let mask = 0; mask < rowCount; mask++) {
    const assignment = new Map<string, number>();
    activeColumns.forEach((col, index) => {
      assignment.set(col.key, (mask >> (activeColumns.length - 1 - index)) & 1);
    });

    // Generators read their own state, so setting it is all that is needed
    const simComponents: TruthComponent[] = components.map((c) => ({ ...c }));
    const simConnections: Connection[] = connections.map((c) => ({ ...c }));

    variables.forEach((v) => {
      const value = assignment.get(`gen:${v.key}`) ?? 0;
      simComponents.forEach((c) => {
        if (c.id === v.key) c.state = value;
      });
    });

    activeFreeInputs.forEach((f) => {
      const value = assignment.get(f.key) ?? 0;
      const pseudoId = `tt_free_${f.pinId}`;
      simComponents.push({
        id: pseudoId,
        type: value === 1 ? 'constant1' : 'constant0',
        position: { x: -9999, y: -9999 },
        pins: [
          { id: `${pseudoId}_out`, type: 'output', name: 'OUT', offset: { x: 0, y: 0 } },
        ],
      });
      simConnections.push({
        id: `tt_free_wire_${f.pinId}`,
        sourcePortId: `${pseudoId}_out`,
        targetPortId: f.pinId,
        sourceComponentId: pseudoId,
        targetComponentId: '',
      });
    });

    const result = evaluateCircuit(simComponents as never, simConnections);

    const inputValues = activeColumns.map((col) => assignment.get(col.key) ?? 0);
    const outputValues = outputs.map((out) => {
      if (out.key.startsWith('__state__:')) {
        return result.componentStates[out.key.slice('__state__:'.length)] ?? 0;
      }
      if (out.key.startsWith('__num__:')) {
        return result.componentStates[out.key.slice('__num__:'.length)] ?? 0;
      }
      return result.pinStates[out.key] ?? 0;
    });

    rows.push([...inputValues, ...outputValues]);
  }

  return {
    title:
      targetIds.length > 0
        ? targets.map(displayName).join(' + ')
        : 'Whole circuit',
    inputs: activeColumns,
    outputs,
    rows,
    truncated,
    freeInputCount: freeInputs.length,
    constantCount: constants.length,
  };
};