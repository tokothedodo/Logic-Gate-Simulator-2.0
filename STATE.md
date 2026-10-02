# Logic Gate Simulator - Current State

## Where things stand

The editor, simulation, and file formats are working end to end. Nothing is
half-finished; what remains is packaging and polish rather than features.

- Canvas: zoom/pan, grid snap, marquee select, orthogonal wire paths, live pin states
- Parts: gates, toggles, push buttons, clocks, LEDs, probes, constants, numeric
  input/output (1-16 bits), seven-segment displays, custom circuit blocks
- Simulation: run, pause, step, tick speed, reset; evaluation is synchronous
- Oscilloscope: records every wire by default, optional channel picker
- Truth table: whole circuit by default, optional part picker
- Custom circuits: build from selection, reuse as a block, explode back to parts,
  saved with the circuit
- Files: native `.json` (lossless), `.gcg` for GateSim, `.circ` for Logisim

## Known limitations

- `.circ` is approximate in both directions; Logisim's pin spacing differs, so
  imported wires are only reattached when unambiguous
- Seven-segment displays have no GateSim equivalent, so `.gcg` writes them as 7-bit
  numeric outputs and the app says so when you save
- Custom circuits are saved in `.json` only, not `.gcg`

## Not built

- Undo/redo
- Circuit validation (unconnected inputs, conflicting drivers, loops)
- Sub-circuits spanning multiple files

## Quick start

```bash
npm install
npm run tauri dev
```