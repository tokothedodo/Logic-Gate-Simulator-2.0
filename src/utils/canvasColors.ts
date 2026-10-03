/**
 * Konva draws to a <canvas>, so it cannot consume CSS variables directly.
 * These tokens mirror the `--k-*` variables in App.css and are read once per
 * theme change.
 */
const TOKEN_VARS = {
  gridMinor: '--k-grid-minor',
  gridMajor: '--k-grid-major',
  gridAxis: '--k-grid-axis',
  canvas: '--k-canvas',
  gateFill: '--k-gate-fill',
  gateBubble: '--k-gate-bubble',
  gateStroke: '--k-gate-stroke',
  gateStrokeHover: '--k-gate-stroke-hover',
  partFill: '--k-part-fill',
  partFillAlt: '--k-part-fill-alt',
  partStroke: '--k-part-stroke',
  partText: '--k-part-text',
  partHiFill: '--k-part-hi-fill',
  hl: '--k-hl',
  hlDim: '--k-hl-dim',
  knob: '--k-knob',
  red: '--k-red',
  redBright: '--k-red-bright',
  green: '--k-green',
  greenBright: '--k-green-bright',
  greenText: '--k-green-text',
  numinFill: '--k-numin-fill',
  numinStroke: '--k-numin-stroke',
  numinLabel: '--k-numin-label',
  numinValue: '--k-numin-value',
  numoutFill: '--k-numout-fill',
  numoutStroke: '--k-numout-stroke',
  numoutLabel: '--k-numout-label',
  numoutValue: '--k-numout-value',
  segOff: '--k-seg-off',
  wireHi: '--k-wire-hi',
  wireLo: '--k-wire-lo',
  wireIdle: '--k-wire-idle',
  pinHi: '--k-pin-hi',
  pinLo: '--k-pin-lo',
  pinIdle: '--k-pin-idle',
} as const;

export type CanvasColors = Record<keyof typeof TOKEN_VARS, string>;

const FALLBACK: CanvasColors = {
  gridMinor: '#1a1a1a',
  gridMajor: '#2a2a2a',
  gridAxis: '#383838',
  canvas: '#121212',
  gateFill: '#334155',
  gateBubble: '#1e293b',
  gateStroke: '#e2e8f0',
  gateStrokeHover: '#f1f5f9',
  partFill: '#18181b',
  partFillAlt: '#0f172a',
  partStroke: '#3f3f46',
  partText: '#71717a',
  partHiFill: '#064e3b',
  hl: '#38bdf8',
  hlDim: '#64748b',
  knob: '#ffffff',
  red: '#dc2626',
  redBright: '#ef4444',
  green: '#15803d',
  greenBright: '#22c55e',
  greenText: '#4ade80',
  numinFill: '#12233b',
  numinStroke: '#3b6ea5',
  numinLabel: '#7dd3fc',
  numinValue: '#e2e8f0',
  numoutFill: '#0f2417',
  numoutStroke: '#3f7a53',
  numoutLabel: '#86efac',
  numoutValue: '#f0fdf4',
  segOff: '#2a2a2e',
  wireHi: '#22c55e',
  wireLo: '#7f1d1d',
  wireIdle: '#475569',
  pinHi: '#22c55e',
  pinLo: '#7f1d1d',
  pinIdle: '#334155',
};

export const readCanvasColors = (): CanvasColors => {
  const styles = getComputedStyle(document.documentElement);
  const entries = Object.entries(TOKEN_VARS) as [keyof CanvasColors, string][];

  return entries.reduce((colors, [key, variable]) => {
    const value = styles.getPropertyValue(variable).trim();
    colors[key] = value || FALLBACK[key];
    return colors;
  }, {} as CanvasColors);
};