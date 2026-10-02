import { Circuit, ComponentProps } from '../types';
import { Parser } from './types';
import { getDefaultPinsForType } from '../components/ComponentRenderer';

/** Logisim libraries, by the index it expects in a .circ file. */
const LIB_WIRING = 0;
const LIB_GATES = 1;
const LIB_IO = 5;

type CircPart = { lib: number; name: string; attrs?: Record<string, string> };

const PART_BY_TYPE: Record<string, CircPart> = {
  and: { lib: LIB_GATES, name: 'AND Gate' },
  or: { lib: LIB_GATES, name: 'OR Gate' },
  nand: { lib: LIB_GATES, name: 'NAND Gate' },
  nor: { lib: LIB_GATES, name: 'NOR Gate' },
  xor: { lib: LIB_GATES, name: 'XOR Gate' },
  xnor: { lib: LIB_GATES, name: 'XNOR Gate' },
  not: { lib: LIB_GATES, name: 'NOT Gate' },
  buffer: { lib: LIB_GATES, name: 'Buffer' },
  constant0: { lib: LIB_WIRING, name: 'Constant' },
  constant1: { lib: LIB_WIRING, name: 'Constant' },
  led: { lib: LIB_IO, name: 'LED' },
  probe: { lib: LIB_IO, name: 'Probe' },
  sevenseg: { lib: LIB_IO, name: '7-Segment Display' },
  toggle: { lib: LIB_IO, name: 'Button' },
  pushbutton: { lib: LIB_IO, name: 'Button' },
  clock: { lib: LIB_IO, name: 'Clock' },
};

/** Logisim writes `lib` as an index, so keys are "index:part name". */
const TYPE_BY_PART: Record<string, string> = {
  '0:constant': 'constant1',
  '0:constant 0': 'constant0',
  '0:constant 1': 'constant1',
  '0:const0': 'constant0',
  '0:const1': 'constant1',
  '0:ground': 'constant0',
  '0:gnd': 'constant0',
  '0:power': 'constant1',
  '0:vcc': 'constant1',
  '1:and': 'and',
  '1:and gate': 'and',
  '1:or': 'or',
  '1:or gate': 'or',
  '1:or gate (large)': 'or',
  '1:nand': 'nand',
  '1:nand gate': 'nand',
  '1:nor': 'nor',
  '1:nor gate': 'nor',
  '1:xor': 'xor',
  '1:xor gate': 'xor',
  '1:xnor': 'xnor',
  '1:xnor gate': 'xnor',
  '1:not': 'not',
  '1:not gate': 'not',
  '1:buffer': 'buffer',
  '5:button': 'toggle',
  '5:push button': 'pushbutton',
  '5:toggle switch': 'toggle',
  '5:dip switch': 'toggle',
  '5:clock': 'clock',
  '5:led': 'led',
  '5:probe': 'probe',
  '5:7-segment display': 'sevenseg',
  '5:seven segment': 'sevenseg',
  '5:seven segment display': 'sevenseg',
};

const VARIABLE_INPUT_TYPES = new Set(['and', 'or', 'nand', 'nor']);
const SOURCE_ONLY_TYPES = new Set(['toggle', 'pushbutton', 'clock', 'constant0', 'constant1']);
const SINK_ONLY_TYPES = new Set(['led', 'probe']);

/** Wires shorter than this are dropped instead of guessing at a connection. */
const MATCH_RADIUS = 40;
/** If two pins are this close to the same spot, the match is treated as ambiguous. */
const MATCH_MARGIN = 6;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const parseLoc = (loc: string): { x: number; y: number } => {
  const [x, y] = loc.replace(/[()]/g, '').split(',');
  return { x: parseFloat(x || '0') || 0, y: parseFloat(y || '0') || 0 };
};

const formatLoc = (x: number, y: number): string => `(${Math.round(x)},${Math.round(y)})`;

const pinsOf = (comp: ComponentProps) =>
  getDefaultPinsForType(comp.type, comp.id, comp.numInputs, comp.numBits);

export class CircParser implements Parser {
  extensions = ['.circ'];
  warnings: string[] = [];

  parse(data: string | ArrayBuffer): Circuit {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const doc = new DOMParser().parseFromString(text, 'text/xml');

    const circuit: Circuit = {
      id: 'circuit_circ',
      name: 'Logisim Circuit',
      components: [],
      connections: [],
    };

    const root = doc.querySelector('circuit') || doc.documentElement;
    const parts = Array.from(root.children);

    for (const part of parts) {
      const tag = part.tagName.toLowerCase();
      if (tag === 'comp') {
        const lib = part.getAttribute('lib') || '';
        const name = part.getAttribute('name') || '';
        const loc = part.getAttribute('loc') || '0,0';
        const id = part.getAttribute('id') || `comp_${circuit.components.length}`;
        const attrs = Array.from(part.children)
          .filter((child) => child.tagName.toLowerCase() === 'a')
          .map((child) => [
            child.getAttribute('name') || '',
            child.getAttribute('val') || '',
          ]);

        const comp: ComponentProps = {
          id,
          type: mapCircType(lib, name),
          position: parseLoc(loc),
          label: part.getAttribute('label') || undefined,
        };

        const inputs = attrs.find(([key]) => key === 'inputs');
        if (inputs && VARIABLE_INPUT_TYPES.has(comp.type)) {
          const count = parseInt(inputs[1], 10);
          if (!isNaN(count)) comp.numInputs = Math.max(2, Math.min(8, count));
        }

        circuit.components.push(comp);
      }
    }

    let dropped = 0;
    for (const part of parts) {
      if (part.tagName.toLowerCase() !== 'wire') continue;
      const from = parseLoc(part.getAttribute('from') || '0,0');
      const to = parseLoc(part.getAttribute('to') || '0,0');
      const source = this.matchPin(circuit.components, from);
      const target = this.matchPin(circuit.components, to);
      if (!source || !target) {
        dropped++;
        continue;
      }

      circuit.connections.push({
        id: `wire_${circuit.connections.length}`,
        sourcePortId: source.pin.id,
        sourceComponentId: source.comp.id,
        targetPortId: target.pin.id,
        targetComponentId: target.comp.id,
      });
    }

    this.warnings = dropped
      ? [
          `${dropped} wire${dropped === 1 ? '' : 's'} could not be attached to pins. Logisim places pins differently, so check the connections and rewire anything missing.`,
        ]
      : [];

    return circuit;
  }

  private matchPin(components: ComponentProps[], at: { x: number; y: number }) {
    let best: { comp: ComponentProps; pin: { id: string }; dist: number } | null = null;
    let second = Number.POSITIVE_INFINITY;

    for (const comp of components) {
      for (const pin of pinsOf(comp)) {
        const pos = { x: comp.position.x + pin.offset.x, y: comp.position.y + pin.offset.y };
        const dist = Math.hypot(pos.x - at.x, pos.y - at.y);
        if (dist > MATCH_RADIUS) continue;
        if (!best || dist < best.dist) {
          second = best ? best.dist : second;
          best = { comp, pin, dist };
        } else if (dist < second) {
          second = dist;
        }
      }
    }

    if (!best) return null;
    if (best.comp.id === '') return null;
    if (second - best.dist < MATCH_MARGIN) return null;
    return best;
  }

  serialize(circuit: Circuit): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
    lines.push('<project source="2.7.1" version="1.0">');
    lines.push(`  <lib desc="#Wiring" name="${LIB_WIRING}"/>`);
    lines.push(`  <lib desc="#Gates" name="${LIB_GATES}"/>`);
    lines.push(`  <lib desc="#I/O" name="${LIB_IO}"/>`);
    lines.push('  <main name="main"/>');
    lines.push('  <circuit name="main">');
    lines.push('    <a name="appearance" val="logisim_evolution"/>');

    circuit.components.forEach((comp, index) => {
      const part = PART_BY_TYPE[comp.type.toLowerCase()];
      if (!part) return;
      const compId = `lgs${index}`;

      lines.push(
        `    <comp lib="${part.lib}" loc="${formatLoc(comp.position.x, comp.position.y)}" name="${escapeXml(
          part.name
        )}" id="${compId}">`
      );
      if (VARIABLE_INPUT_TYPES.has(comp.type)) {
        const count = comp.numInputs || 2;
        lines.push(`      <a name="inputs" val="${count}"/>`);
      }
      if (SOURCE_ONLY_TYPES.has(comp.type) || SINK_ONLY_TYPES.has(comp.type)) {
        if (comp.label) lines.push(`      <a name="label" val="${escapeXml(comp.label)}"/>`);
      }
      lines.push('    </comp>');
    });

    for (const conn of circuit.connections) {
      const fromComp = circuit.components.find((c) => c.id === conn.sourceComponentId);
      const toComp = circuit.components.find((c) => c.id === conn.targetComponentId);
      if (!fromComp || !toComp) continue;
      if (!PART_BY_TYPE[fromComp.type.toLowerCase()]) continue;
      if (!PART_BY_TYPE[toComp.type.toLowerCase()]) continue;

      const fromPin = pinsOf(fromComp).find((p) => p.id === conn.sourcePortId);
      const toPin = pinsOf(toComp).find((p) => p.id === conn.targetPortId);
      if (!fromPin || !toPin) continue;

      lines.push(
        `    <wire from="${formatLoc(fromComp.position.x + fromPin.offset.x, fromComp.position.y + fromPin.offset.y)}" to="${formatLoc(
          toComp.position.x + toPin.offset.x,
          toComp.position.y + toPin.offset.y
        )}"/>`
      );
    }

    lines.push('  </circuit>');
    lines.push('</project>');

    return lines.join('\n');
  }
}

function mapCircType(lib: string, name: string): string {
  const key = `${lib}:${name}`.toLowerCase();
  if (TYPE_BY_PART[key]) return TYPE_BY_PART[key];
  if (TYPE_BY_PART[name.toLowerCase()]) return TYPE_BY_PART[name.toLowerCase()];
  return name.toLowerCase() || 'and';
}