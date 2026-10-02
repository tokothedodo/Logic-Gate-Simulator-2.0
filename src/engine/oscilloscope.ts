import { Connection } from '../types';

export interface ScopeChannel {
  /** Wire connection id being observed. */
  id: string;
  label: string;
  color: string;
}

export interface ScopeFrame {
  times: number[];
  /** Parallel to channels: history[i] is the per-channel value series. */
  series: number[][];
}

const CHANNEL_COLORS = [
  '#22c55e',
  '#38bdf8',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#2dd4bf',
  '#e879f9',
];

/** Human readable name for a component, falling back to a title-cased type. */
export const describeComponent = (
  comp: { type: string; label?: string } | undefined
): string => {
  if (!comp) return '?';
  if (comp.label) return comp.label;
  const spaced = comp.type.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Decide which wires the scope should record.
 * `wireIds` of null means "record everything"; otherwise the caller picked an
 * explicit set (via the scope's channel picker) and only those are recorded.
 * Clicking around the canvas never changes the channels on its own.
 */
export const deriveScopeChannels = (
  connections: Connection[],
  components: { id: string; type: string; label?: string }[],
  wireIds: string[] | null
): ScopeChannel[] => {
  const nameOf = (id?: string) => {
    const comp = components.find((c) => c.id === id);
    return describeComponent(comp);
  };

  const labelFor = (conn: Connection) =>
    `${nameOf(conn.sourceComponentId)} → ${nameOf(conn.targetComponentId)}`;

  const picked = wireIds
    ? wireIds
        .map((id) => connections.find((c) => c.id === id))
        .filter((c): c is Connection => Boolean(c))
    : connections;

  return picked.map((conn, i) => ({
    id: conn.id,
    label: labelFor(conn),
    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }));
};

/** Every wire attached to the given components (used by the channel picker). */
export const wiresForComponents = (
  connections: Connection[],
  componentIds: string[]
): string[] =>
  connections
    .filter(
      (c) =>
        componentIds.includes(c.sourceComponentId || '') ||
        componentIds.includes(c.targetComponentId || '')
    )
    .map((c) => c.id);

/**
 * Fixed-capacity rolling sample buffer. Frames are stored as a single
 * time-ordered array of per-channel value tuples so the scope can render a
 * scrolling digital trace without unbounded growth.
 */
export class ScopeRecorder {
  private capacity: number;
  private times: number[] = [];
  private frames: number[][] = [];

  constructor(capacity = 320) {
    this.capacity = Math.max(16, capacity);
  }

  get length(): number {
    return this.times.length;
  }

  push(time: number, channelIds: string[], values: Record<string, number>): void {
    this.times.push(time);
    this.frames.push(channelIds.map((id) => (values[id] === 1 ? 1 : 0)));

    if (this.times.length > this.capacity) {
      this.times.shift();
      this.frames.shift();
    }
  }

  /** Transpose stored frames into one series per channel. */
  frame(channelIds: string[]): ScopeFrame {
    const series = channelIds.map((_, i) => this.frames.map((row) => row[i] ?? 0));
    return { times: [...this.times], series };
  }

  clear(): void {
    this.times = [];
    this.frames = [];
  }
}