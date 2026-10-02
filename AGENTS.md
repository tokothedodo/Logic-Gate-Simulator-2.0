# Logic Gate Simulator - Agent Context

Tauri v2 + React + TypeScript + Tailwind CSS + Konva desktop app for building and
simulating digital logic circuits.

## Project Structure
- `src/` - React frontend
  - `canvas/` - Konva canvas (Canvas, Wire, Pin, GateCanvasSymbol)
  - `engine/` - Logic engine, evaluator, oscilloscope, truth tables, custom circuits
  - `components/` - Sidebar, renderers, modals, icons
  - `parsers/` - File formats (.gcg, .circ, .json)
  - `types/` - Shared TypeScript types
- `src-tauri/` - Rust backend (Tauri), window config and icons
- `scripts/prepare-icon.py` - Cuts `assets/icon-master.png` to a squircle and writes
  the icon source plus favicon, which `npx tauri icon` then expands

## Core Architecture
- Canvas with zoom/pan, grid snapping, wire drawing, marquee selection
- Evaluation is pure and synchronous: `evaluate()` takes components plus connections
  and returns pin states. No incremental event queue.
- Components carry pins with local `offset`s, sized by `componentGeometry.ts`
- Wires run output to input only, and an input accepts a single wire
- Simulation loop ticks on `requestAnimationFrame` at the configured speed

## Behaviour Worth Knowing
- Startup is empty; sample circuits load from the File menu
- Oscilloscope records every wire unless the user picks channels explicitly
- Truth table defaults to the whole circuit; the picker narrows it
- Numeric parts ask for 1-16 connectors when placed; the width is stored on the
  component and carried through save, load, copy/paste and export
- Custom circuits are built from a selection, keep their definition on the placed
  block, and are saved in `circuit.metadata.customCircuits`
- Info for each part lives in `componentInfo.ts` and is shown from sidebar buttons

## File Formats
- `.json` is native and lossless, including custom circuit definitions
- `.gcg` targets GateSim, which has no seven-segment or probe/LED distinction.
  Those parts are written as the nearest supported type plus an `LgsType` attribute
  that GateSim ignores, so files round-trip here but not there
- `.circ` targets Logisim and is best-effort: import only reattaches wires whose
  endpoints land unambiguously on a pin, and export uses approximate geometry

## Build Commands
- `npm run tauri dev` - Run in dev mode
- `npm run tauri build` - Build the app
- `npm run build` - TypeScript and Vite build
- `npx tsc --noEmit` - Typecheck
- `cd src-tauri && cargo check` - Rust check
- `cd src-tauri && cargo fmt && cargo clippy -- -D warnings` - Rust checks used by CI

## Conventions
- Konva event types: use `Konva.KonvaEventObject`
- Keep types strict
- Comments explain why, not what
- Tailwind v3