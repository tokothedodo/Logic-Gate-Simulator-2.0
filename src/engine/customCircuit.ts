import { Connection, Point } from '../types';

export interface CustomCircuitPin {
  /** Inner pin id this terminal exposes. */
  pinId: string;
  name: string;
  type: 'input' | 'output';
}

export interface CustomCircuitComponent {
  id: string;
  type: string;
  label?: string;
  numInputs?: number;
  state?: number;
  /** Degrees clockwise about the part's own centre. */
  rotation?: number;
  /** Position relative to the block origin. */
  position: Point;
  pins: { id: string; type: 'input' | 'output'; name: string; offset: Point }[];
}

export interface CustomCircuitDef {
  name: string;
  /** Slug used in component types, e.g. "Custom" + slug. */
  slug: string;
  components: CustomCircuitComponent[];
  connections: Connection[];
  inputs: CustomCircuitPin[];
  outputs: CustomCircuitPin[];
  /** Size of the original selection, in world units. */
  size: { width: number; height: number };
}

export const CUSTOM_TYPE_PREFIX = 'custom:';

export const customTypeFor = (slug: string) => `${CUSTOM_TYPE_PREFIX}${slug}`;

export const slugForName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'circuit';

export const nameFromCustomType = (type: string) => {
  const idx = type.indexOf(':');
  return idx === -1 ? type : type.slice(idx + 1);
};

const store = new Map<string, CustomCircuitDef>();

export const registerCustomCircuit = (def: CustomCircuitDef) => {
  store.set(def.slug, def);
  return def;
};

export const getCustomCircuit = (slug: string) => store.get(slug);

export const getCustomCircuitByType = (type: string) =>
  type.startsWith(CUSTOM_TYPE_PREFIX)
    ? store.get(nameFromCustomType(type))
    : undefined;

/** Drops a definition, so it disappears from the sidebar and cannot be placed. */
export const deleteCustomCircuit = (slug: string): boolean => store.delete(slug);

/**
 * Renames a definition. The slug is deliberately left alone, because it is
 * baked into the `custom:` type of every placed block and into saved files.
 */
export const renameCustomCircuit = (slug: string, name: string): CustomCircuitDef | undefined => {
  const def = store.get(slug);
  if (!def) return undefined;
  def.name = name;
  return def;
};

export interface CustomCircuitRename {
  pinId: string;
  name: string;
}

/** Renames terminals in place, ignoring blanks and unknown pins. */
export const renameCustomCircuitTerminals = (
  slug: string,
  renames: CustomCircuitRename[]
): CustomCircuitDef | undefined => {
  const def = store.get(slug);
  if (!def) return undefined;
  const wanted = new Map(renames.map((r) => [r.pinId, r.name.trim()]));
  [...def.inputs, ...def.outputs].forEach((pin) => {
    const next = wanted.get(pin.pinId);
    if (next) pin.name = next;
  });
  return def;
};

export const listCustomCircuits = (): CustomCircuitDef[] =>
  Array.from(store.values());

interface AnyComponent {
  id: string;
  type: string;
  label?: string;
  numInputs?: number;
  state?: number;
  rotation?: number;
  position: Point;
  pins?: { id: string; type: 'input' | 'output'; name: string; offset: Point }[];
}

export interface BuildResult {
  def: CustomCircuitDef;
  /** Inner pin ids that were promoted to terminals on the block. */
  exposed: string[];
}

type Pin = NonNullable<AnyComponent['pins']>[number];

/**
 * Parts that become input terminals. This follows Logicly, where a toggle
 * switch inside the selection turns into a connector on the finished block.
 */
const CUSTOM_INPUT_SOURCES = new Set(['toggle', 'pushbutton', 'clock']);

/** Parts that become output terminals, which is Logicly's light bulbs. */
const CUSTOM_OUTPUT_SINKS = new Set(['led', 'probe']);

/** Multi-bit parts would need a bus terminal, so they stay inside for now. */
const CUSTOM_UNSUPPORTED = new Set(['numin', 'numout', 'sevenseg']);

const INPUT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const pinOfType = (comp: AnyComponent, type: Pin['type']) =>
  (comp.pins ?? []).find((p) => p.type === type);

/** Top to bottom, then left to right, so terminals keep the layout's order. */
const byLayout = (a: AnyComponent, b: AnyComponent) =>
  a.position.y - b.position.y || a.position.x - b.position.x;

export interface CustomCircuitInspection {
  inputs: number;
  outputs: number;
  unsupported: string[];
  ok: boolean;
  message: string;
}

/**
 * Reports what a selection would export. Logicly refuses to build an
 * integrated circuit unless it holds at least one toggle switch and one light
 * bulb, since those are the only parts that become connectors.
 */
export const inspectCustomCircuit = (components: AnyComponent[]): CustomCircuitInspection => {
  const norm = (c: AnyComponent) => c.type.toLowerCase();
  const inputs = components.filter(
    (c) => CUSTOM_INPUT_SOURCES.has(norm(c)) && pinOfType(c, 'output')
  ).length;
  const outputs = components.filter(
    (c) => CUSTOM_OUTPUT_SINKS.has(norm(c)) && pinOfType(c, 'input')
  ).length;
  const unsupported = [
    ...new Set(components.map(norm).filter((t) => CUSTOM_UNSUPPORTED.has(t))),
  ];

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  let message: string;
  if (inputs === 0) {
    message = 'Select at least one toggle switch. Switches become the block inputs.';
  } else if (outputs === 0) {
    message = 'Select at least one LED. LEDs become the block outputs.';
  } else {
    message = `${plural(inputs, 'input')} from the switches, ${plural(outputs, 'output')} from the LEDs.`;
  }
  if (unsupported.length > 0) {
    message += ` ${unsupported.join(', ')} cannot be exported yet and stays inside the block.`;
  }

  return { inputs, outputs, unsupported, ok: inputs > 0 && outputs > 0, message };
};

/**
 * Wraps a selection into a reusable block. Following Logicly, the toggle
 * switches in the selection become the block's input terminals and the LEDs
 * become its outputs; every other part, and every wire between them, stays
 * internal. Run `inspectCustomCircuit` first, since a selection missing either
 * kind has nothing to expose.
 */
export const buildCustomCircuit = (
  name: string,
  components: AnyComponent[],
  connections: Connection[]
): BuildResult => {
  const minX = Math.min(...components.map((c) => c.position.x));
  const minY = Math.min(...components.map((c) => c.position.y));
  const maxX = Math.max(...components.map((c) => c.position.x));
  const maxY = Math.max(...components.map((c) => c.position.y));

  const ordered = [...components].sort(byLayout);

  const pinOwner = new Map<string, { comp: AnyComponent; pin: Pin }>();
  components.forEach((c) =>
    (c.pins ?? []).forEach((pin) => pinOwner.set(pin.id, { comp: c, pin }))
  );

  const inputs: CustomCircuitPin[] = ordered
    .filter((c) => CUSTOM_INPUT_SOURCES.has(c.type.toLowerCase()) && pinOfType(c, 'output'))
    .map((comp, i) => {
      const pin = pinOfType(comp, 'output') as Pin;
      return {
        pinId: pin.id,
        name: comp.label?.trim() || INPUT_LETTERS[i] || `IN${i + 1}`,
        type: 'input',
      };
    });

  const outputs: CustomCircuitPin[] = ordered
    .filter((c) => CUSTOM_OUTPUT_SINKS.has(c.type.toLowerCase()) && pinOfType(c, 'input'))
    .map((comp, i) => {
      const pin = pinOfType(comp, 'input') as Pin;
      return {
        pinId: pin.id,
        name: comp.label?.trim() || `OUT${i + 1}`,
        type: 'output',
      };
    });

  const def: CustomCircuitDef = {
    name,
    slug: slugForName(name),
    components: components.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      numInputs: c.numInputs,
      state: c.state,
      rotation: c.rotation,
      position: { x: c.position.x - minX, y: c.position.y - minY },
      pins: (c.pins ?? []).map((pin) => ({ ...pin, offset: { ...pin.offset } })),
    })),
    connections: connections
      .filter((conn) => pinOwner.has(conn.sourcePortId) && pinOwner.has(conn.targetPortId))
      .map((conn) => ({ ...conn })),
    inputs,
    outputs,
    size: { width: maxX - minX + 80, height: maxY - minY + 60 },
  };

  return { def, exposed: [...inputs.map((p) => p.pinId), ...outputs.map((p) => p.pinId)] };
};

/** Outer pin id on the block for a given inner pin id. */
export const customPinId = (compId: string, innerPinId: string) => `${compId}__${innerPinId}`;

/**
 * Inlines every custom block into ordinary parts so the evaluator can run it
 * without knowing about sub-circuits.
 */
export const expandCustomCircuits = <T extends AnyComponent>(
  components: T[],
  connections: Connection[]
): { components: AnyComponent[]; connections: Connection[] } => {
  const customs = components.filter((c) => c.type.startsWith(CUSTOM_TYPE_PREFIX));
  if (customs.length === 0) return { components, connections };

  const flatComps: AnyComponent[] = [];
  const flatConns: Connection[] = [];

  components.forEach((comp) => {
    const def: CustomCircuitDef | undefined =
      getCustomCircuitByType(comp.type) ?? (comp as unknown as { customDef?: CustomCircuitDef }).customDef;
    if (!def) {
      flatComps.push(comp);
      return;
    }

    const prefix = `${comp.id}~`;

    def.components.forEach((inner: CustomCircuitComponent) => {
      flatComps.push({
        ...inner,
        id: `${prefix}${inner.id}`,
        position: { x: comp.position.x + inner.position.x, y: comp.position.y + inner.position.y },
        pins: (inner.pins ?? []).map((pin) => ({ ...pin, id: `${prefix}${pin.id}` })),
      });
    });

    def.connections.forEach((conn: Connection) => {
      flatConns.push({
        ...conn,
        id: `${prefix}${conn.id}`,
        sourcePortId: `${prefix}${conn.sourcePortId}`,
        targetPortId: `${prefix}${conn.targetPortId}`,
        sourceComponentId: conn.sourceComponentId ? `${prefix}${conn.sourceComponentId}` : undefined,
        targetComponentId: conn.targetComponentId ? `${prefix}${conn.targetComponentId}` : undefined,
      });
    });

    // Exposed inputs take their value from the wire landing on the block
    def.inputs.forEach((pin: CustomCircuitPin) => {
      flatConns.push({
        id: `${prefix}in_${pin.pinId}`,
        sourcePortId: customPinId(comp.id, pin.pinId),
        targetPortId: `${prefix}${pin.pinId}`,
        targetComponentId: undefined,
      });
    });

    // Exposed outputs publish the inner value on the block terminal
    def.outputs.forEach((pin: CustomCircuitPin) => {
      flatConns.push({
        id: `${prefix}out_${pin.pinId}`,
        sourcePortId: `${prefix}${pin.pinId}`,
        targetPortId: customPinId(comp.id, pin.pinId),
        sourceComponentId: undefined,
      });
    });
  });

  // Wires that landed on block terminals already point at the ids the bridges
  // above publish, so they are copied through untouched.
  connections.forEach((conn) => flatConns.push({ ...conn }));

  return { components: flatComps, connections: flatConns };
};