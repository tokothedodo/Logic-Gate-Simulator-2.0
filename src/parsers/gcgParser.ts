import { Circuit, ComponentProps, Connection } from '../types';
import { Parser } from './types';
import { getDefaultPinsForType } from '../components/ComponentRenderer';

const GCG_VERSION = '1.2';

const GCG_TYPE_BY_COMP: Record<string, string> = {
  and: 'And',
  or: 'Or',
  nand: 'Nand',
  nor: 'Nor',
  xor: 'Xor',
  xnor: 'Xnor',
  not: 'Not',
  buffer: 'Buffer',
  toggle: 'UserInput',
  pushbutton: 'UserInput',
  clock: 'Clock',
  constant0: 'NumericInput',
  constant1: 'NumericInput',
  led: 'UserOutput',
  probe: 'UserOutput',
  sevenseg: 'NumericOutput',
  numin: 'NumericInput',
  numout: 'NumericOutput',
};

const COMP_BY_GCG_TYPE: Record<string, string> = {
  And: 'and',
  Or: 'or',
  Nand: 'nand',
  Nor: 'nor',
  Xor: 'xor',
  Xnor: 'xnor',
  Not: 'not',
  Buffer: 'buffer',
  UserInput: 'toggle',
  NumericInput: 'constant1',
  UserOutput: 'probe',
  NumericOutput: 'sevenseg',
  Clock: 'clock',
};

const VARIABLE_INPUT_TYPES = new Set(['And', 'Or', 'Nand', 'Nor']);

const isNumericType = (gcgType: string) => gcgType === 'NumericInput' || gcgType === 'NumericOutput';

const inputCountOf = (comp: ComponentProps) =>
  getDefaultPinsForType(comp.type, comp.id, comp.numInputs, comp.numBits).filter(
    (p) => p.type === 'input'
  ).length;

const countPins = (comp: ComponentProps) => ({
  inputs: inputCountOf(comp),
  outputs: getDefaultPinsForType(comp.type, comp.id, comp.numInputs, comp.numBits).filter(
    (p) => p.type === 'output'
  ).length,
});

const portIndexForPin = (comp: ComponentProps, pinId: string, direction: 'input' | 'output'): number => {
  const pins = getDefaultPinsForType(comp.type, comp.id, comp.numInputs, comp.numBits).filter(
    (p) => p.type === direction
  );
  return pins.findIndex((p) => p.id === pinId);
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export class GcgParser implements Parser {
  extensions = ['.gcg'];

  parse(data: string | ArrayBuffer): Circuit {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const doc = new DOMParser().parseFromString(text, 'text/xml');

    if (doc.querySelector('parsererror')) {
      throw new Error('Invalid XML in .gcg file');
    }

    const root = doc.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'circuitgroup') {
      throw new Error('Not a valid .gcg file: expected <CircuitGroup> root element');
    }

    const version = root.getAttribute('Version');
    if (version && version !== GCG_VERSION) {
      throw new Error(`Unsupported .gcg version "${version}" (expected ${GCG_VERSION})`);
    }

    const circuits = Array.from(root.querySelectorAll('Circuit'));
    if (circuits.length === 0) {
      throw new Error('No <Circuit> elements found in .gcg file');
    }

    const main =
      circuits.find((c) => !c.hasAttribute('Name')) ?? circuits[circuits.length - 1];

    const components: ComponentProps[] = [];
    const idToComponent = new Map<string, ComponentProps>();

    Array.from(main.querySelectorAll('Gates > Gate')).forEach((gate) => {
      const gcgType = gate.getAttribute('Type') || '';
      const numericId = gate.getAttribute('ID') || '';
      let compType = COMP_BY_GCG_TYPE[gcgType];

      if (!compType) {
        if (gcgType === 'IC' || gcgType === 'Comment') return;
        compType = gcgType.toLowerCase();
      }

      if (gcgType === 'NumericInput') {
        compType = 'numin';
      } else if (gcgType === 'NumericOutput') {
        compType = 'numout';
      }

      const id = `gcg_${numericId}`;
      const point = gate.querySelector('Point');
      const numInputsAttr = gate.getAttribute('NumInputs');

      const comp: ComponentProps = {
        id,
        type: compType,
        position: {
          x: parseFloat(point?.getAttribute('X') || '0'),
          y: parseFloat(point?.getAttribute('Y') || '0'),
        },
        rotation: parseFloat(point?.getAttribute('Angle') || '0'),
        ...(numInputsAttr ? { numInputs: parseInt(numInputsAttr, 10) } : {}),
      };

      const name = gate.getAttribute('Name');
      if (name) comp.label = name;
      if (gcgType === 'Clock') {
        comp.milliseconds = parseFloat(gate.getAttribute('Milliseconds') || '1000');
      }

      const bits = parseInt(gate.getAttribute('Bits') || '', 10);
      const value = parseInt(gate.getAttribute('Value') || '', 10);

      // GCG has no LED/probe/toggle distinction, so we stash the exact type in a
      // namespaced attribute. GateSim's XElement loader ignores attributes it
      // doesn't read, so real .gcg files still open fine.
      const preservedType = gate.getAttribute('LgsType');
      if (preservedType && COMP_BY_GCG_TYPE[gcgType]) {
        comp.type = preservedType;
      }
      if (isNumericType(gcgType) && !isNaN(bits)) {
        comp.numBits = bits;
      }
      if (comp.type === 'numin' && !isNaN(value)) {
        const limit = comp.numBits ? (1 << comp.numBits) - 1 : 255;
        comp.state = Math.max(0, Math.min(limit, value));
      }

      components.push(comp);
      idToComponent.set(numericId, comp);
    });

    const connections: Connection[] = [];

    Array.from(main.querySelectorAll('Wires > Wire')).forEach((wire) => {
      const from = wire.querySelector('From');
      const to = wire.querySelector('To');
      if (!from || !to) return;

      const fromComp = idToComponent.get(from.getAttribute('ID') || '');
      const toComp = idToComponent.get(to.getAttribute('ID') || '');
      if (!fromComp || !toComp) return;

      const fromPort = parseInt(from.getAttribute('Port') || '0', 10);
      const toPort = parseInt(to.getAttribute('Port') || '0', 10);

      const sourcePin = pickPin(fromComp, 'output', fromPort);
      const targetPin = pickPin(toComp, 'input', toPort);
      if (!sourcePin || !targetPin) return;

      connections.push({
        id: `gcg_wire_${connections.length}`,
        sourcePortId: sourcePin,
        sourceComponentId: fromComp.id,
        targetPortId: targetPin,
        targetComponentId: toComp.id,
      });
    });

    return {
      id: 'circuit_gcg',
      name: main.getAttribute('Name') || 'GCG Circuit',
      components,
      connections,
    };
  }

  serialize(circuit: Circuit): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<CircuitGroup Version="${GCG_VERSION}">`);
    lines.push('  <Circuit>');
    lines.push('    <Gates>');

    const numericIds = new Map<string, string>();
    circuit.components.forEach((comp, index) => {
      numericIds.set(comp.id, String(index + 1));
    });

    circuit.components.forEach((comp) => {
      const gcgType = GCG_TYPE_BY_COMP[comp.type.toLowerCase()] || 'Buffer';
      const { inputs, outputs } = countPins(comp);

      const attrs = [
        `Type="${gcgType}"`,
        `Name="${escapeXml(comp.label || defaultName(gcgType))}"`,
        `ID="${numericIds.get(comp.id)}"`,
      ];

      if (VARIABLE_INPUT_TYPES.has(gcgType)) {
        attrs.push(`NumInputs="${Math.max(inputs, 2)}"`);
      }
      if (isNumericType(gcgType)) {
        attrs.push(`Bits="${comp.numBits || (gcgType === 'NumericInput' ? outputs : inputs)}"`);
        attrs.push('SelRep="2"');
        if (gcgType === 'NumericInput') {
          const raw =
            comp.type.toLowerCase() === 'constant0'
              ? 0
              : comp.type.toLowerCase() === 'constant1'
              ? 1
              : Math.max(0, Math.min(255, Number(comp.state ?? 0)));
          attrs.push(`Value="${raw}"`);
        }
      }
      if (gcgType === 'Clock') {
        const ms = typeof comp.milliseconds === 'number' ? comp.milliseconds : 1000;
        attrs.push(`Milliseconds="${Math.max(0, ms)}"`);
      }
      if (COMP_BY_GCG_TYPE[gcgType] && GCG_TYPE_BY_COMP[comp.type.toLowerCase()] === gcgType) {
        attrs.push(`LgsType="${escapeXml(comp.type.toLowerCase())}"`);
      }

      lines.push(`      <Gate ${attrs.join(' ')}>`);
      lines.push(
        `        <Point X="${round(comp.position.x)}" Y="${round(comp.position.y)}" Angle="${round(
          comp.rotation ?? 0
        )}" />`
      );
      lines.push('      </Gate>');
    });

    lines.push('    </Gates>');
    lines.push('    <Wires>');

    circuit.connections.forEach((conn) => {
      const fromComp = circuit.components.find((c) => c.id === conn.sourceComponentId);
      const toComp = circuit.components.find((c) => c.id === conn.targetComponentId);
      if (!fromComp || !toComp) return;

      const fromPort = portIndexForPin(fromComp, conn.sourcePortId, 'output');
      const toPort = portIndexForPin(toComp, conn.targetPortId, 'input');
      if (fromPort < 0 || toPort < 0) return;

      lines.push('      <Wire>');
      lines.push(`        <From ID="${numericIds.get(fromComp.id)}" Port="${fromPort}" />`);
      lines.push(`        <To ID="${numericIds.get(toComp.id)}" Port="${toPort}" />`);
      lines.push('      </Wire>');
    });

    lines.push('    </Wires>');
    lines.push('  </Circuit>');
    lines.push('</CircuitGroup>');

    return lines.join('\n');
  }
}

const round = (value: number) => Math.round(value * 100) / 100;

const defaultName = (gcgType: string) => {
  const names: Record<string, string> = {
    And: 'And',
    Or: 'Or',
    Nand: 'Nand',
    Nor: 'Nor',
    Xor: 'Xor',
    Xnor: 'Xnor',
    Not: 'Not',
    Buffer: 'Buffer',
    Clock: 'Clock',
    UserInput: 'Input',
    UserOutput: 'Output',
    NumericInput: 'Numeric Input',
    NumericOutput: 'Numeric Output',
  };
  return names[gcgType] || gcgType;
};

const pickPin = (
  comp: ComponentProps,
  direction: 'input' | 'output',
  portIndex: number
): string | null => {
  const pins = getDefaultPinsForType(comp.type, comp.id, comp.numInputs, comp.numBits).filter(
    (p) => p.type === direction
  );
  const pin = pins[portIndex];
  return pin ? pin.id : null;
};