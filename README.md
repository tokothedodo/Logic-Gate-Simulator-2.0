# Logic Gate Simulator 2.0

A desktop app for building digital circuits and watching them run. Place parts on a
grid, wire them together, and the simulation updates every pin as the logic settles.

Built with Tauri 2, React, TypeScript and Konva.

## What it does

- **Gates and parts** — AND, OR, NOT, NAND, NOR, XOR, XNOR, buffers, toggles, push
  buttons, clocks, LEDs, probes, and constant sources.
- **Numeric parts** — numeric inputs and outputs with 1 to 16 connectors, so you can
  work with buses instead of one wire per bit. You choose the width when you place
  the part, and the same width is carried through save, load and export.
- **Seven-segment displays** — drive the segments directly, or feed them from a
  numeric output.
- **Live simulation** — logic states propagate as you wire things up. High signals
  are green, low signals are grey. Run, pause, single-step, change the tick speed,
  or reset.
- **Oscilloscope** — records every wire by default and plots them over time. Pick
  specific wires if you only want a few traces.
- **Truth tables** — generates a table for the whole circuit or for parts you pick,
  enumerating every combination of the circuit's inputs.
- **Custom circuits** — turn a selection into a reusable block with named pins, then
  explode it back into its parts when you want to edit the inside.
- **File formats** — saves in the native `.json` format, reads and writes GateSim
  `.gcg` files, and reads Logisim `.circ` files.

## Running it

You need [Node.js](https://nodejs.org/) 20+ and
[Rust](https://www.rust-lang.org/tools/install).

```bash
npm install
npm run tauri dev
```

## Building a release

```bash
npm run tauri build
```

Artifacts land in `src-tauri/target/release/bundle/`: an `.app` and `.dmg` on macOS,
an AppImage on Linux, and an `.msi` plus `.exe` on Windows.

The app icon is prepared from master artwork rather than hand-placed files. Put your
own square 1024×1024 image at `assets/icon-master.png`, then:

```bash
python3 scripts/prepare-icon.py
npx tauri icon src-tauri/icons/source.png
```

`prepare-icon.py` cuts the artwork to a squircle with transparent corners (so the
icon looks native in the macOS Dock rather than a square block), writes the
favicon to `public/icon.png`, and fails if the artwork is not square or comes out
empty. Pass `--draw` to generate the built-in XOR gate artwork instead.

The icon command also writes `src-tauri/icons/android` and `ios`, which this
desktop app does not use; delete them after regenerating.

## Checks

```bash
npx tsc --noEmit     # types
npm run build        # types and production bundle
cd src-tauri && cargo check
```

## Notes on file formats

**Native `.json`** is the only format that stores everything, including custom
circuit definitions, so prefer it for your own work.

**GateSim `.gcg`** has no seven-segment part and no notion of a probe or LED
distinction. Parts that the original format cannot express are written using the
closest supported type and tagged with an extra `LgsType` attribute, which GateSim
ignores. Files written here reopen correctly in this app; in GateSim, seven-segment
displays appear as 7-bit numeric outputs.

**Logisim `.circ`** is best-effort in both directions. Logisim draws parts with its
own pin spacing, so imported wires are only reattached when an endpoint lands close
enough to a pin to be unambiguous, and exported files use approximate geometry. Open
the result in Logisim and check the layout.

## Licence

GPL-3.0-or-later. See [LICENSE](LICENSE).