import { ComponentProps, Connection } from '../types';
import { getDefaultPinsForType } from './ComponentRenderer';

export interface SampleCircuit {
  id: string;
  name: string;
  description: string;
  components: ComponentProps[];
  connections: Connection[];
}

export const sampleCircuits: SampleCircuit[] = [
  {
    id: 'basic-demo',
    name: 'Basic Logic Gates Demo',
    description: 'Interactive AND, OR, and NOT gates connected to switches and LEDs',
    components: [
      // Switch A
      {
        id: 'sw_a',
        type: 'toggle',
        label: 'Switch A',
        position: { x: 100, y: 120 },
        state: 1,
        pins: getDefaultPinsForType('toggle', 'sw_a'),
      },
      // Switch B
      {
        id: 'sw_b',
        type: 'toggle',
        label: 'Switch B',
        position: { x: 100, y: 220 },
        state: 1,
        pins: getDefaultPinsForType('toggle', 'sw_b'),
      },
      // AND Gate
      {
        id: 'gate_and',
        type: 'and',
        label: 'AND Gate',
        position: { x: 260, y: 160 },
        pins: getDefaultPinsForType('and', 'gate_and'),
      },
      // LED for AND
      {
        id: 'led_and',
        type: 'led',
        label: 'A AND B',
        position: { x: 440, y: 160 },
        pins: getDefaultPinsForType('led', 'led_and'),
      },
      // NOT Gate
      {
        id: 'gate_not',
        type: 'not',
        label: 'Inverter',
        position: { x: 260, y: 300 },
        pins: getDefaultPinsForType('not', 'gate_not'),
      },
      // LED for NOT
      {
        id: 'led_not',
        type: 'led',
        label: 'NOT A',
        position: { x: 440, y: 300 },
        pins: getDefaultPinsForType('led', 'led_not'),
      },
    ],
    connections: [
      { id: 'c1', sourceComponentId: 'sw_a', sourcePortId: 'sw_a_out', targetComponentId: 'gate_and', targetPortId: 'gate_and_in1' },
      { id: 'c2', sourceComponentId: 'sw_b', sourcePortId: 'sw_b_out', targetComponentId: 'gate_and', targetPortId: 'gate_and_in2' },
      { id: 'c3', sourceComponentId: 'gate_and', sourcePortId: 'gate_and_out', targetComponentId: 'led_and', targetPortId: 'led_and_in' },
      { id: 'c4', sourceComponentId: 'sw_a', sourcePortId: 'sw_a_out', targetComponentId: 'gate_not', targetPortId: 'gate_not_in' },
      { id: 'c5', sourceComponentId: 'gate_not', sourcePortId: 'gate_not_out', targetComponentId: 'led_not', targetPortId: 'led_not_in' },
    ],
  },
  {
    id: 'half-adder',
    name: 'Half Adder Circuit',
    description: 'Computes binary Sum (XOR) and Carry (AND) of two inputs',
    components: [
      {
        id: 'in_x',
        type: 'toggle',
        label: 'Input X',
        position: { x: 100, y: 140 },
        state: 1,
        pins: getDefaultPinsForType('toggle', 'in_x'),
      },
      {
        id: 'in_y',
        type: 'toggle',
        label: 'Input Y',
        position: { x: 100, y: 260 },
        state: 1,
        pins: getDefaultPinsForType('toggle', 'in_y'),
      },
      {
        id: 'ha_xor',
        type: 'xor',
        label: 'XOR (Sum)',
        position: { x: 280, y: 140 },
        pins: getDefaultPinsForType('xor', 'ha_xor'),
      },
      {
        id: 'ha_and',
        type: 'and',
        label: 'AND (Carry)',
        position: { x: 280, y: 260 },
        pins: getDefaultPinsForType('and', 'ha_and'),
      },
      {
        id: 'led_sum',
        type: 'led',
        label: 'Sum S',
        position: { x: 460, y: 140 },
        pins: getDefaultPinsForType('led', 'led_sum'),
      },
      {
        id: 'led_carry',
        type: 'led',
        label: 'Carry C',
        position: { x: 460, y: 260 },
        pins: getDefaultPinsForType('led', 'led_carry'),
      },
    ],
    connections: [
      { id: 'ha_c1', sourceComponentId: 'in_x', sourcePortId: 'in_x_out', targetComponentId: 'ha_xor', targetPortId: 'ha_xor_in1' },
      { id: 'ha_c2', sourceComponentId: 'in_y', sourcePortId: 'in_y_out', targetComponentId: 'ha_xor', targetPortId: 'ha_xor_in2' },
      { id: 'ha_c3', sourceComponentId: 'in_x', sourcePortId: 'in_x_out', targetComponentId: 'ha_and', targetPortId: 'ha_and_in1' },
      { id: 'ha_c4', sourceComponentId: 'in_y', sourcePortId: 'in_y_out', targetComponentId: 'ha_and', targetPortId: 'ha_and_in2' },
      { id: 'ha_c5', sourceComponentId: 'ha_xor', sourcePortId: 'ha_xor_out', targetComponentId: 'led_sum', targetPortId: 'led_sum_in' },
      { id: 'ha_c6', sourceComponentId: 'ha_and', sourcePortId: 'ha_and_out', targetComponentId: 'led_carry', targetPortId: 'led_carry_in' },
    ],
  },
  {
    id: 'clock-oscillator',
    name: 'Clock Pulse & Blinker',
    description: 'Digital clock driving an inverter buffer chain and LED',
    components: [
      {
        id: 'clk1',
        type: 'clock',
        label: 'Master Clock',
        position: { x: 100, y: 180 },
        pins: getDefaultPinsForType('clock', 'clk1'),
      },
      {
        id: 'buf1',
        type: 'buffer',
        label: 'Buffer',
        position: { x: 260, y: 174 },
        pins: getDefaultPinsForType('buffer', 'buf1'),
      },
      {
        id: 'probe1',
        type: 'probe',
        label: 'Monitor',
        position: { x: 420, y: 130 },
        pins: getDefaultPinsForType('probe', 'probe1'),
      },
      {
        id: 'led1',
        type: 'led',
        label: 'Pulse LED',
        position: { x: 420, y: 220 },
        pins: getDefaultPinsForType('led', 'led1'),
      },
    ],
    connections: [
      { id: 'clk_c1', sourceComponentId: 'clk1', sourcePortId: 'clk1_out', targetComponentId: 'buf1', targetPortId: 'buf1_in' },
      { id: 'clk_c2', sourceComponentId: 'buf1', sourcePortId: 'buf1_out', targetComponentId: 'probe1', targetPortId: 'probe1_in' },
      { id: 'clk_c3', sourceComponentId: 'buf1', sourcePortId: 'buf1_out', targetComponentId: 'led1', targetPortId: 'led1_in' },
    ],
  },
];
