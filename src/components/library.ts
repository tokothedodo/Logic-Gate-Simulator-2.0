import { ComponentType } from './types';

export interface LibraryItem {
  type: ComponentType;
  label: string;
  category: 'inputs' | 'gates' | 'outputs';
  description?: string;
}

export const componentLibrary: LibraryItem[] = [
  // Inputs
  { type: 'toggle', label: 'Toggle Switch', category: 'inputs', description: 'Interactive ON/OFF switch' },
  { type: 'pushbutton', label: 'Push Button', category: 'inputs', description: 'Momentary contact button' },
  { type: 'clock', label: 'Clock Pulse', category: 'inputs', description: 'Periodic digital square wave' },
  { type: 'constant0', label: 'Constant 0 (GND)', category: 'inputs', description: 'Tied permanently LOW (0)' },
  { type: 'constant1', label: 'Constant 1 (VCC)', category: 'inputs', description: 'Tied permanently HIGH (1)' },
  {
    type: 'numin',
    label: 'Numeric Input',
    category: 'inputs',
    description: '8-bit value 0-255, click to set',
  },

  // Gates
  { type: 'and', label: 'AND Gate', category: 'gates', description: 'Outputs 1 if all inputs are 1' },
  { type: 'or', label: 'OR Gate', category: 'gates', description: 'Outputs 1 if any input is 1' },
  { type: 'not', label: 'NOT Inverter', category: 'gates', description: 'Inverts input logic state' },
  { type: 'nand', label: 'NAND Gate', category: 'gates', description: 'Inverted AND gate' },
  { type: 'nor', label: 'NOR Gate', category: 'gates', description: 'Inverted OR gate' },
  { type: 'xor', label: 'XOR Gate', category: 'gates', description: 'Outputs 1 on odd number of 1s' },
  { type: 'xnor', label: 'XNOR Gate', category: 'gates', description: 'Inverted XOR gate' },
  { type: 'buffer', label: 'Buffer', category: 'gates', description: 'Passes digital state unchanged' },

  // Outputs
  { type: 'led', label: 'LED Light', category: 'outputs', description: 'Illuminates green on HIGH (1)' },
  { type: 'sevenseg', label: '7-Segment Display', category: 'outputs', description: '7-segment numeric readout' },
  { type: 'probe', label: 'Logic Probe', category: 'outputs', description: 'High/Low voltage state indicator' },
  {
    type: 'numout',
    label: 'Numeric Output',
    category: 'outputs',
    description: 'Reads 8 input bits as one number',
  },
];
