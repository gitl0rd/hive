"""Generate every Hive icon from one design: a glowing amber hex ring with the pixel bee.

Run: python3 scripts/make-icons.py   (needs Pillow)

Variants (each platform shapes icons differently):
- squircle  macOS-style rounded tile on a transparent 1024 canvas (Apple's 824px grid) with a soft
            shadow. Used for the installed web app (PWA) and favicon, so it looks native in the
            Mac Dock.
- bleed     full-bleed square, no rounding: iOS / apple-touch-icon and the PWA "maskable" icon,
            where the OS applies its own mask. Art stays inside the 80% safe zone.
- adaptive  Android adaptive icon: transparent foreground inside the 66% safe zone, solid
            background, and a monochrome (themed) layer.
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
S = 1024
AMBER = (255, 165, 38)
BG = (11, 6, 0)
TOP = (34, 20, 4)  # tile gradient, top -> bottom
BOTTOM = (8, 4, 0)

# 11x7 pixel bee facing right. W wing (55%), B body, H head, S stinger, s bg-colour pixel
BEE = [
    "...WW.WW...",
    "...WW.WW...",
    ".BBsBBsBB..",
    ".BBsBBsBBHH",
    "SBBsBBsBBHs",
    ".BBsBBsBBHH",
    ".BBsBBsBB..",
]


def rgba(c, a=255):
    return tuple(c) + (a,)


def hex_pts(cx, cy, r):
    """Pointy-top hexagon."""
    return [(cx + r * math.cos(math.radians(-90 + 60 * i)), cy + r * math.sin(math.radians(-90 + 60 * i))) for i in range(6)]


def draw_bee(d, cx, cy, px, color=AMBER, bg=BG):
    ox, oy = cx - 11 * px / 2, cy - 7 * px / 2
    for y, row in enumerate(BEE):
        for x, ch in enumerate(row):
            # bg=None leaves the stripe/eye pixels transparent (monochrome icons)
            stripe = rgba(bg) if bg is not None else None
            col = {'W': rgba(color, 140), 'B': rgba(color), 'H': rgba(color), 'S': rgba(color), 's': stripe}.get(ch)
            if col is not None:
                d.rectangle([ox + x * px, oy + y * px, ox + (x + 1) * px - 1, oy + (y + 1) * px - 1], fill=col)


def mark(scale=1.0, color=AMBER, glow=True, bee_bg=BG):
    """The hex ring + bee on a transparent 1024 canvas. scale=1 matches the squircle grid."""
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = S / 2, S / 2 + 6 * scale
    pts = hex_pts(cx, cy, 300 * scale)
    d.line(pts + pts[:2], fill=rgba(color), width=max(2, round(34 * scale)), joint='curve')
    draw_bee(d, cx, cy + 8 * scale, 32 * scale, color=color, bg=bee_bg)
    if not glow:
        return layer
    g = layer.filter(ImageFilter.GaussianBlur(26 * scale))
    return Image.alpha_composite(Image.alpha_composite(g, g), layer)


def tile(full_bleed=False):
    """Gradient body with a soft phosphor glow and scanlines (square, unclipped)."""
    body = Image.new('RGBA', (S, S))
    d = ImageDraw.Draw(body)
    y0, y1 = (0, S) if full_bleed else (100, 924)
    for y in range(S):
        t = min(1, max(0, (y - y0) / (y1 - y0)))
        d.line([(0, y), (S, y)], fill=rgba(tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))))
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([180, 160, 844, 784], fill=rgba(AMBER, 40))
    body = Image.alpha_composite(body, glow.filter(ImageFilter.GaussianBlur(90)))
    return body


def scanlines(img, alpha=40, step=6):
    lines = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lines)
    for y in range(0, img.size[1], step):
        d.line([(0, y), (img.size[0], y)], fill=(0, 0, 0, alpha), width=2)
    return Image.alpha_composite(img, lines)


def squircle(detail=True):
    """macOS Big Sur style: 824px rounded tile, 185 radius, shadow, rim, on transparent 1024."""
    off, size, rad = 100, 824, 185
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([off, off, off + size, off + size], rad, fill=255)
    art = Image.alpha_composite(tile(), mark())
    if detail:
        art = scanlines(art)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([off, off + 12, off + size, off + size + 12], rad, fill=(0, 0, 0, 110))
    out = Image.alpha_composite(out, shadow.filter(ImageFilter.GaussianBlur(18)))
    clipped = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    clipped.paste(art, (0, 0), mask)
    out = Image.alpha_composite(out, clipped)
    rim = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(rim).rounded_rectangle([off + 2, off + 2, off + size - 2, off + size - 2], rad - 2, outline=rgba(AMBER, 70), width=4)
    return Image.alpha_composite(out, rim)


def bleed(scale=1.0):
    """Full-bleed square (no alpha): the OS masks it. Mark scaled to sit in the safe zone."""
    img = Image.alpha_composite(tile(full_bleed=True), mark(scale))
    return scanlines(img).convert('RGB')


def save(img, size, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (img if img.size == (size, size) else img.resize((size, size), Image.LANCZOS)).save(path)
    print('wrote', os.path.relpath(path, ROOT))


mac = squircle()
mac_small = squircle(detail=False)  # no scanlines: they turn to mush at 16-48px

# Expo / native
save(bleed(1.12), 1024, 'assets', 'icon.png')  # iOS rounds it; Android legacy fallback
save(mark(1.2), 1024, 'assets', 'splash-icon.png')  # on the #0B0600 splash background
save(mac_small, 48, 'assets', 'favicon.png')
# Android adaptive: 108dp canvas, 66dp safe circle (r ~ 0.306 * S); hex r 300*0.95 + stroke fits
save(mark(0.95), 1024, 'assets', 'android-icon-foreground.png')
save(Image.new('RGBA', (S, S), rgba(BG)), 1024, 'assets', 'android-icon-background.png')
save(mark(0.95, color=(255, 255, 255), glow=False, bee_bg=None), 1024, 'assets', 'android-icon-monochrome.png')

# PWA (installed web app): Mac-style tile, plus a maskable full-bleed one for Android/Chrome
save(mac, 512, 'public', 'icons', 'icon-512.png')
save(mac, 192, 'public', 'icons', 'icon-192.png')
save(bleed(1.0), 512, 'public', 'icons', 'maskable-512.png')  # mark within the 80% safe zone
save(bleed(1.12), 180, 'public', 'icons', 'apple-touch-icon.png')
save(mac, 1024, 'public', 'icons', 'icon-1024.png')  # source / store-size copy
