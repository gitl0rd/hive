"""Generate Hive app icons (pixel bee inside a hex ring) into assets/ and public/.

Run: python3 scripts/make-icons.py   (needs Pillow)
"""
import math
import os
from PIL import Image, ImageDraw, ImageFilter

BG = (11, 6, 0, 255)
SCREEN = (255, 165, 38, 255)
ROOT = os.path.join(os.path.dirname(__file__), '..')

# 11x7 pixel bee, facing right. W = wing (55%), B = body, H = head, . = empty, s = bg-colour pixel, S = stinger
BEE = [
    "..WWW.WWW..",
    "..WWW.WWW..",
    ".BBBBBBBB..",
    ".BBsBBsBBHs",
    "SBBsBBsBBHH",
    ".BBsBBsBBHH",
    ".BBBBBBBB..",
]


def hex_points(cx, cy, r):
    # pointy-top
    return [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(-90, 270, 60)]


def draw_icon(size, *, bg=True, ring=True, bee_scale=0.62, transparent=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else BG)
    cx = cy = size / 2
    if ring:
        glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        g = ImageDraw.Draw(glow)
        r = size * 0.40
        w = max(2, round(size * 0.035))
        pts = hex_points(cx, cy, r)
        g.line(pts + pts[:2], fill=SCREEN, width=w, joint='curve')
        blurred = glow.filter(ImageFilter.GaussianBlur(size * 0.02))
        img = Image.alpha_composite(img, blurred)
        img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img)
    px = (size * 0.40 * bee_scale * 2) / 11
    ox = cx - px * 11 / 2
    oy = cy - px * 7 / 2
    wing = SCREEN[:3] + (int(255 * 0.55),)
    for y, row in enumerate(BEE):
        for x, ch in enumerate(row):
            col = {'W': wing, 'B': SCREEN, 'H': SCREEN, 'S': SCREEN, 's': BG}.get(ch)
            if col is None:
                continue
            d.rectangle([ox + x * px, oy + y * px, ox + (x + 1) * px - 1, oy + (y + 1) * px - 1], fill=col)
    # scanlines
    if bg and not transparent:
        lines = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        ld = ImageDraw.Draw(lines)
        step = max(3, size // 128)
        for y in range(0, size, step):
            ld.line([(0, y), (size, y)], fill=(0, 0, 0, 66))
        img = Image.alpha_composite(img, lines)
    return img


def save(img, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print('wrote', path)


save(draw_icon(1024), 'assets', 'icon.png')
save(draw_icon(1024, ring=False, bee_scale=0.9), 'assets', 'splash-icon.png')
save(draw_icon(48), 'assets', 'favicon.png')
# Android adaptive icon: transparent foreground inside the 66% safe zone, solid background
save(draw_icon(1024, bee_scale=0.62, transparent=True).resize((1024, 1024)), 'assets', 'android-icon-foreground.png')
save(Image.new('RGBA', (1024, 1024), BG), 'assets', 'android-icon-background.png')
mono = draw_icon(1024, transparent=True)
save(mono, 'assets', 'android-icon-monochrome.png')
# PWA
save(draw_icon(192), 'public', 'icons', 'icon-192.png')
save(draw_icon(512), 'public', 'icons', 'icon-512.png')
save(draw_icon(512, ring=False, bee_scale=0.75), 'public', 'icons', 'maskable-512.png')
save(draw_icon(180), 'public', 'icons', 'apple-touch-icon.png')
