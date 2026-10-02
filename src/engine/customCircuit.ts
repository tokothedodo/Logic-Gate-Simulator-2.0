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

export const listCustomCircuits = (): CustomCircuitDef[] =>
  Array.from(store.values());

interface AnyComponent {
  id: string;
  type: string;
  label?: string;
  numInputs?: number;
  state?: number;
  position: Point;
  pins?: { id: string; type: 'input' | 'output'; name: string; offset: Point }[];
}

export interface BuildResult {
  def: CustomCircuitDef;
  /** Inner pin ids that were wired to the outside world. */
  exposed: string[];
}

/**
 * Wraps a selection into a reusable block. Pins that carry a wire out of the
 * selection become terminals on the block; everything else stays internal.
 */
export const buildCustomCircuit = (
  name: string,
  components: AnyComponent[],
  connections: Connection[]
): BuildResult => {
  const selected = new Set(components.map((c) => c.id));
  const minX = Math.min(...components.map((c) => c.position.x));
  const minY = Math.min(...components.map((c) => c.position.y));
  const maxX = Math.max(...components.map((c) => c.position.x));
  const maxY = Math.max(...components.map((c) => c.position.y));

  const exposedInputs = new Map<string, CustomCircuitPin>();
  const exposedOutputs = new Map<string, CustomCircuitPin>();

  const pinOwner = new Map<string, { comp: AnyComponent; pin: NonNullable<AnyComponent['pins']>[number] }>();
  components.forEach((c) =>
    (c.pins ?? []).forEach((pin) => pinOwner.set(pin.id, { comp: c, pin }))
  );

  connections.forEach((conn) => {
    const src = pinOwner.get(conn.sourcePortId);
    const dst = pinOwner.get(conn.targetPortId);
    const srcInside = Boolean(src && selected.has(src.comp.id));
    const dstInside = Boolean(dst && selected.has(dst.comp.id));
    if (srcInside === dstInside) return;

    if (dstInside && dst && !exposedInputs.has(dst.pin.id)) {
      exposedInputs.set(dst.pin.id, {
        pinId: dst.pin.id,
        name: labelFor(dst.comp, dst.pin.name),
        type: 'input',
      });
    }
    if (srcInside && src && !exposedOutputs.has(src.pin.id)) {
      exposedOutputs.set(src.pin.id, {
        pinId: src.pin.id,
        name: labelFor(src.comp, src.pin.name),
        type: 'output',
      });
    }
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
      position: { x: c.position.x - minX, y: c.position.y - minY },
      pins: (c.pins ?? []).map((pin) => ({ ...pin, offset: { ...pin.offset } })),
    })),
    connections: connections
      .filter((conn) => pinOwner.has(conn.sourcePortId) && pinOwner.has(conn.targetPortId))
      .map((conn) => ({ ...conn })),
    inputs: Array.from(exposedInputs.values()),
    outputs: Array.from(exposedOutputs.values()),
    size: { width: maxX - minX + 80, height: maxY - minY + 60 },
  };

  return { def, exposed: [...exposedInputs.keys(), ...exposedOutputs.keys()] };
};

const labelFor = (comp: AnyComponent, pinName: string) => {
  const base = comp.label || comp.type;
  return `${base}·${pinName}`;
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