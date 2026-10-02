"""Prepare the app icon from square master artwork.

By default this takes assets/icon-master.png, cuts it to a squircle with
transparent corners, and writes the two files the project needs:

    src-tauri/icons/source.png   input for `npx tauri icon`
    public/icon.png             browser favicon

Then run:

    npx tauri icon src-tauri/icons/source.png

Pass --draw to generate the XOR gate artwork instead of using the master image.
"""

import argparse
import pathlib
import sys

from PIL import Image, ImageDraw

SIZE = 1024
SUPERSAMPLE = 4
# The squircle is drawn a touch larger than the canvas so its flat edges land on
# the boundary instead of one pixel inside it.
BLEED = 1.02

# Apple's icon grid is close to a superellipse rather than a rounded rectangle,
# which is why this exponent is above 2.
SQUIRCLE_EXPONENT = 5.0

BACKDROP = (24, 26, 31)
GATE = (53, 132, 228)
SEGMENT = (233, 236, 240)

MASTER = pathlib.Path("assets/icon-master.png")
SOURCE = pathlib.Path("src-tauri/icons/source.png")
FAVICON = pathlib.Path("public/icon.png")


def squircle_alpha(size: int, exponent: float = SQUIRCLE_EXPONENT) -> Image.Image:
    """Alpha mask covering the superellipse inscribed in the square.

    Rendered oversized and scaled down, which antialiases the curve without
    having to hand-tune a falloff width.
    """
    big = int(size * BLEED) * SUPERSAMPLE
    centre = (big - 1) / 2
    axis = [abs(x - centre) / centre for x in range(big)]
    powers = [v**exponent for v in axis]

    mask = Image.new("L", (big, big), 0)
    pixels = mask.load()
    for y in range(big):
        dy = powers[y]
        for x in range(big):
            if powers[x] + dy <= 1.0:
                pixels[x, y] = 255

    scaled = mask.resize((int(size * BLEED), int(size * BLEED)), Image.LANCZOS)
    # Drawn slightly oversized so the straight edges reach the canvas rather than
    # fading out on the last row of pixels.
    overflow = (scaled.width - size) // 2
    return scaled.crop((overflow, overflow, overflow + size, overflow + size))


def bezier(p0, p1, p2, p3, steps=72):
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        points.append(
            (
                u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
            )
        )
    return points


def quadratic(p0, p1, p2, steps=48):
    points = []
    for i in range(steps + 1):
        t = i / steps
        points.append(
            (
                (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t**2 * p2[0],
                (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t**2 * p2[1],
            )
        )
    return points


def draw_gate() -> Image.Image:
    """An XOR gate on the dark rounded square, as a fallback design."""
    margin = 0.15 * SIZE
    span = SIZE - 2 * margin
    mid = SIZE / 2

    left = margin + 0.16 * span
    neck = margin + 0.40 * span
    top = margin + 0.10 * span
    bottom = SIZE - margin - 0.10 * span
    tip = SIZE - margin - 0.04 * span

    body = [(left, top), (neck, top)]
    body += bezier(
        (neck, top),
        (neck + 0.16 * span, top + 0.01 * span),
        (tip - 0.04 * span, mid - 0.08 * span),
        (tip, mid),
    )
    body += bezier(
        (tip, mid),
        (tip - 0.04 * span, mid + 0.08 * span),
        (neck + 0.16 * span, bottom - 0.01 * span),
        (neck, bottom),
    )
    body += [(left, bottom)]
    body += quadratic((left, bottom), (left + 0.12 * span, mid), (left, top))

    arc = quadratic(
        (margin + 0.02 * span, mid),
        (margin + 0.12 * span, mid - 0.13 * span),
        (left, mid),
    )

    leads = [
        (margin, mid - 0.07 * span, left, mid - 0.07 * span),
        (margin, mid + 0.07 * span, left, mid + 0.07 * span),
        (tip, mid, tip + 0.04 * span, mid),
    ]

    image = Image.new("RGBA", (SIZE, SIZE), BACKDROP + (255,))
    draw = ImageDraw.Draw(image)
    stroke = int(0.042 * SIZE)

    for x1, y1, x2, y2 in leads:
        draw.line([(x1, y1), (x2, y2)], fill=SEGMENT + (255,), width=stroke)
        for x, y in ((x1, y1), (x2, y2)):
            r = stroke / 2
            draw.ellipse([x - r, y - r, x + r, y + r], fill=SEGMENT + (255,))

    draw.line(body, fill=GATE + (255,), width=stroke, joint="curve")
    for x, y in body:
        r = stroke / 2
        draw.ellipse([x - r, y - r, x + r, y + r], fill=GATE + (255,))

    draw.line(arc, fill=SEGMENT + (255,), width=stroke, joint="curve")
    for x, y in arc:
        r = stroke / 2
        draw.ellipse([x - r, y - r, x + r, y + r], fill=SEGMENT + (255,))

    return image


def load_master(path: pathlib.Path) -> Image.Image:
    if not path.exists():
        raise SystemExit(
            f"{path} not found. Put your 1024x1024 square artwork there, "
            "or run this script with --draw."
        )
    image = Image.open(path).convert("RGB")
    if image.width != image.height:
        raise SystemExit(f"{path} is {image.width}x{image.height}; it must be square")
    if image.size != (SIZE, SIZE):
        image = image.resize((SIZE, SIZE), Image.LANCZOS)
    return image


def report(image: Image.Image) -> None:
    alpha = image.getchannel("A")
    corners = [alpha.getpixel(p) for p in [(0, 0), (SIZE - 1, 0), (0, SIZE - 1), (SIZE - 1, SIZE - 1)]]
    centre = alpha.getpixel((SIZE // 2, SIZE // 2))
    opaque = sum(1 for value in alpha.getdata() if value > 200)

    if centre < 250:
        raise SystemExit("centre of the icon is transparent; the artwork looks empty")
    if any(corner > 8 for corner in corners):
        raise SystemExit("corners are still opaque; the squircle mask did not apply")

    colours = len(image.convert("RGB").getcolors(maxcolors=1 << 20))
    coverage = opaque / (SIZE * SIZE)
    print(
        f"colours {colours}, {coverage:.0%} opaque, "
        f"corners transparent, centre opaque"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--draw", action="store_true", help="use the generated XOR gate artwork")
    parser.add_argument("--master", type=pathlib.Path, default=MASTER, help="master artwork path")
    args = parser.parse_args()

    artwork = draw_gate() if args.draw else load_master(args.master)
    if artwork.mode != "RGBA":
        artwork = artwork.convert("RGBA")
    artwork.putalpha(squircle_alpha(SIZE))

    report(artwork)

    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    FAVICON.parent.mkdir(parents=True, exist_ok=True)
    artwork.save(SOURCE)
    artwork.resize((256, 256), Image.LANCZOS).save(FAVICON)
    print(f"wrote {SOURCE} and {FAVICON} ({SIZE}x{SIZE})")
    print("next: npx tauri icon src-tauri/icons/source.png")


if __name__ == "__main__":
    sys.exit(main())