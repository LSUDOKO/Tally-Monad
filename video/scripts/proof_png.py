"""Renders the captured CLI proof (video/public/proof/*.txt) as terminal-style PNGs for the README."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "video/public/proof"
OUT = ROOT / "docs/images/monad/proof"
MONO = "/usr/share/fonts/TTF/JetBrainsMono-Regular.ttf"
MONO_B = "/usr/share/fonts/TTF/JetBrainsMono-Bold.ttf"

INK, PANEL, BAR = (3, 6, 15), (4, 8, 18), (11, 20, 48)
TEXT, MUTED, BRIGHT, PAID, BLOCKED = (238, 244, 255), (179, 194, 222), (92, 157, 255), (61, 189, 140), (255, 107, 107)


def color(line: str):
    s = line.strip()
    if s.startswith("$"):
        return BRIGHT
    if s.startswith("#"):
        return MUTED
    low = s.lower()
    if "[pass]" in low or " passed" in low or "exact_match" in low or "success" in low:
        return PAID
    if "[fail]" in low or "status               0" in low:
        return BLOCKED
    return TEXT


def render(txt: Path, title: str):
    lines = txt.read_text().rstrip("\n").split("\n")[:30]
    font = ImageFont.truetype(MONO, 26)
    bold = ImageFont.truetype(MONO_B, 24)
    cw = max(font.getlength(l) for l in lines + ["x" * 60])
    w = int(min(max(cw + 96, 1200), 2000))
    lh = 40
    h = 96 + lh * len(lines) + 48
    img = Image.new("RGB", (w + 80, h + 80), INK)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, 40 + w, 40 + h), radius=28, fill=PANEL, outline=(40, 62, 110), width=2)
    d.rounded_rectangle((40, 40, 40 + w, 104), radius=28, fill=BAR)
    d.rectangle((40, 80, 40 + w, 104), fill=BAR)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((72 + i * 34, 62, 92 + i * 34, 82), fill=c)
    d.text((190, 58), title, font=bold, fill=MUTED)
    y = 128
    for line in lines:
        text = line if font.getlength(line) <= w - 80 else line[: int((w - 120) / font.getlength("x"))] + "…"
        d.text((80, y), text, font=font, fill=color(line))
        y += lh
    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f"{txt.stem}.png", optimize=True)
    return OUT / f"{txt.stem}.png"


if __name__ == "__main__":
    names = sys.argv[1:] or [p.stem for p in sorted(SRC.glob("*.txt"))]
    for n in names:
        print(render(SRC / f"{n}.txt", f"{n}.txt"))
