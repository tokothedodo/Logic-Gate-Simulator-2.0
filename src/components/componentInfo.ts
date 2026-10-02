export interface ComponentInfo {
  title: string;
  summary: string;
  detail: string;
}

const GATE_EXPRESSIONS: Record<string, (n: number) => string> = {
  and: (n) => `Y = ${join(n)}`,
  or: (n) => `Y = ${join(n, ' + ')}`,
  nand: (n) => `Y = NOT(${join(n)})`,
  nor: (n) => `Y = NOT(${join(n, ' + ')})`,
  xor: (n) => `Y = ${join(n, ' ⊕ ')}`,
  xnor: (n) => `Y = NOT(${join(n, ' ⊕ ')})`,
  not: () => 'Y = NOT A',
  buffer: () => 'Y = A',
};

const join = (n: number, sep = ' · ') =>
  Array.from({ length: n }, (_, i) => `A${i === 0 ? '' : i + 1}`).join(sep);

export const getComponentInfo = (
  type: string,
  label?: string,
  numInputs?: number,
  state = 0
): ComponentInfo => {
  const norm = type.toLowerCase();
  const inputs = Math.max(2, numInputs || 2);
  const gate = GATE_EXPRESSIONS[norm];

  if (gate) {
    return {
      title: norm === 'not' ? 'NOT gate' : `${norm.toUpperCase()} gate`,
      summary:
        norm === 'not' || norm === 'buffer'
          ? 'Single input logic gate'
          : `Outputs 1 when ${norm === 'and' ? 'every input is 1' : norm === 'or' ? 'any input is 1' : norm === 'xor' || norm === 'xnor' ? 'an odd number of inputs are 1' : 'the rule below is met'}`,
      detail: `${gate(inputs)} · ${inputs} input${inputs > 1 ? 's' : ''}`,
    };
  }

  switch (norm) {
    case 'toggle':
      return {
        title: label || 'Toggle switch',
        summary: 'Click to flip between 0 and 1',
        detail: `Currently ${state === 1 ? 'HIGH' : 'LOW'}`,
      };
    case 'pushbutton':
      return {
        title: label || 'Push button',
        summary: 'HIGH while held, springs back to LOW',
        detail: `Currently ${state === 1 ? 'HIGH' : 'LOW'}`,
      };
    case 'clock':
      return {
        title: label || 'Clock',
        summary: 'Free-running square wave, flips on every tick',
        detail: 'Set the rate from the header while a clock is on the canvas',
      };
    case 'constant0':
      return { title: 'Constant 0', summary: 'Ground, always LOW', detail: 'Output Y = 0' };
    case 'constant1':
      return { title: 'Constant 1', summary: 'Supply, always HIGH', detail: 'Output Y = 1' };
    case 'numin':
      return {
        title: label || 'Numeric input',
        summary: 'Click to type a number from 0 to 255',
        detail: `Value ${state} · outputs B0-B7, B0 is the lowest bit`,
      };
    case 'numout':
      return {
        title: label || 'Numeric output',
        summary: 'Reads eight input bits as one number',
        detail: `Showing ${state}`,
      };
    case 'led':
      return {
        title: label || 'LED',
        summary: 'Lights up while its input is HIGH',
        detail: `Currently ${state === 1 ? 'ON' : 'OFF'}`,
      };
    case 'probe':
      return {
        title: label || 'Logic probe',
        summary: 'Shows the logic level at a point',
        detail: `Currently ${state === 1 ? 'HIGH (1)' : 'LOW (0)'}`,
      };
    case 'sevenseg':
      return {
        title: label || '7-segment display',
        summary: 'One input per segment, A at the top',
        detail: 'A top, B top right, C bottom right, D bottom, E bottom left, F top left, G middle',
      };
    default:
      if (norm.startsWith('custom:')) {
        return {
          title: label || 'Custom circuit',
          summary: 'A circuit you grouped into one part',
          detail: 'Right-click it and pick Explode to edit the parts inside',
        };
      }
      return { title: label || type, summary: 'Component', detail: '' };
  }
};