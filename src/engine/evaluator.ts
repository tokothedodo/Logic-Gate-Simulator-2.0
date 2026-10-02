import { Connection } from '../types';
import { computeGateOutput } from '../components/LogicGates';
import { PlacedComponent } from '../canvas/Canvas';

export interface SimulationResult {
  pinStates: Record<string, number>;
  componentStates: Record<string, number>;
  wireStates: Record<string, number>;
}

export function evaluateCircuit(
  components: PlacedComponent[],
  connections: Connection[]
): SimulationResult {
  const pinStates: Record<string, number> = {};
  const componentStates: Record<string, number> = {};
  const wireStates: Record<string, number> = {};

  // 1. Initialize generator components (switches, buttons, constants, clocks)
  components.forEach((c) => {
    const norm = c.type.toLowerCase();
    const outPin = c.pins?.find((p) => p.type === 'output');
    const outPinId = outPin?.id || `${c.id}_out`;

    if (norm === 'constant0') {
      pinStates[outPinId] = 0;
      componentStates[c.id] = 0;
    } else if (norm === 'constant1') {
      pinStates[outPinId] = 1;
      componentStates[c.id] = 1;
    } else if (norm === 'numin') {
      const value = Math.max(0, Math.min(255, c.state ?? 0));
      (c.pins ?? [])
        .filter((p) => p.type === 'output')
        .forEach((pin, i) => {
          pinStates[pin.id] = (value >> i) & 1;
        });
      componentStates[c.id] = value;
    } else if (norm === 'toggle' || norm === 'pushbutton' || norm === 'clock') {
      const val = c.state === 1 ? 1 : 0;
      pinStates[outPinId] = val;
      componentStates[c.id] = val;
    }
  });

  // Build driver map: each input pin -> list of source pins driving it
  const driversByTarget = new Map<string, string[]>();
  connections.forEach((conn) => {
    const list = driversByTarget.get(conn.targetPortId);
    if (list) {
      list.push(conn.sourcePortId);
    } else {
      driversByTarget.set(conn.targetPortId, [conn.sourcePortId]);
    }
  });

  // Input pins default to floating LOW until a driver resolves them
  driversByTarget.forEach((_sources, targetPinId) => {
    pinStates[targetPinId] = 0;
  });

  // 2. Iterative signal propagation (up to 12 passes for convergence)
  const MAX_ITERATIONS = 12;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let changed = false;

    // Each input pin has a single wire, so the first driver decides the value.
    // Must be a full recompute, not an accumulate, or HIGH values latch forever.
    driversByTarget.forEach((sources, targetPinId) => {
      const newTargetVal = (pinStates[sources[0]] ?? 0) === 1 ? 1 : 0;

      if (pinStates[targetPinId] !== newTargetVal) {
        pinStates[targetPinId] = newTargetVal;
        changed = true;
      }
    });

    // Evaluate gate outputs
    components.forEach((c) => {
      const norm = c.type.toLowerCase();
      const outPin = c.pins?.find((p) => p.type === 'output');
      const outPinId = outPin?.id || `${c.id}_out`;

      if (['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor', 'buffer'].includes(norm)) {
        const inputPins = c.pins?.filter((p) => p.type === 'input') || [];
        const inputVals: (0 | 1)[] = inputPins.map((p) => (pinStates[p.id] === 1 ? 1 : 0));

        const gateOut = computeGateOutput(norm, inputVals);
        if (pinStates[outPinId] !== gateOut) {
          pinStates[outPinId] = gateOut;
          componentStates[c.id] = gateOut;
          changed = true;
        }
      } else if (norm === 'led' || norm === 'probe') {
        const inPin = c.pins?.find((p) => p.type === 'input');
        const inVal = inPin ? pinStates[inPin.id] ?? 0 : 0;
        componentStates[c.id] = inVal;
      } else if (norm === 'numout') {
        const bitPins = (c.pins ?? []).filter((p) => p.type === 'input');
        let value = 0;
        bitPins.forEach((pin, i) => {
          if (pinStates[pin.id] === 1) value += 1 << i;
        });
        componentStates[c.id] = value;
      } else if (norm === 'sevenseg') {
        // Collect segment states
        c.pins?.forEach((p) => {
          if (p.type === 'input') {
            // Already in pinStates
          }
        });
      }
    });

    if (!changed) break;
  }

  // 3. Compute final wire states (1 if source is HIGH, 0 if LOW)
  connections.forEach((conn) => {
    wireStates[conn.id] = pinStates[conn.sourcePortId] ?? 0;
  });

  return { pinStates, componentStates, wireStates };
}
