"""Generate every Hive icon from one design: a glowing hex ring with the theme's pixel sprite.

Run: python3 scripts/make-icons.py   (needs Pillow)

One set per theme (src/themes): HIVE (amber, pixel bee) is the default app icon; BRAIN HIVE (pink,
winged brain) is an alternate icon the app switches to when that theme is picked.

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
# Pixel sprites (same as src/themes/sprites.ts). W wing, B body, s bg-colour pixel
BEE = [
    "...WW.WW...",
    "...WW.WW...",
    ".BBsBBsBB..",
    ".BBsBBsBBBB",
    "BBBsBBsBBBs",
    ".BBsBBsBBBB",
    ".BBsBBsBB..",
]
BRAIN = [
    ".............",
    ".WW.BB.BB.WW.",
    "WWWBBBsBBBWWW",
    "WWBBBBsBBBBWW",
    "..BssBsBssB..",
    "..BBBBsBBBB..",
    "..BBsBsBBsB..",
    "...BBBBBBB...",
    "......B......",
]

THEMES = {
    # screen colour, bg, tile gradient top -> bottom, sprite, wing colour + opacity, sprite px
    'hive': dict(screen=(255, 165, 38), bg=(11, 6, 0), top=(34, 20, 4), bottom=(8, 4, 0),
                 sprite=BEE, wing=None, wing_a=140, px=32),
    'brain': dict(screen=(255, 143, 184), bg=(14, 5, 9), top=(40, 12, 26), bottom=(10, 3, 7),
                  sprite=BRAIN, wing=(127, 227, 255), wing_a=190, px=30),
}
T = THEMES['hive']


def rgba(c, a=255):
    return tuple(c) + (a,)


def hex_pts(cx, cy, r):
    """Pointy-top hexagon."""
    return [(cx + r * math.cos(math.radians(-90 + 60 * i)), cy + r * math.sin(math.radians(-90 + 60 * i))) for i in range(6)]


def draw_bee(d, cx, cy, px, color, bg, mono=False):
    sprite = T['sprite']
    ox, oy = cx - len(sprite[0]) * px / 2, cy - len(sprite) * px / 2
    wing = color if mono or T['wing'] is None else T['wing']
    for y, row in enumerate(sprite):
        for x, ch in enumerate(row):
            # bg=None leaves the stripe/eye pixels transparent (monochrome icons)
            stripe = rgba(bg) if bg is not None else None
            col = {'W': rgba(wing, T['wing_a']), 'B': rgba(color), 's': stripe}.get(ch)
            if col is not None:
                d.rectangle([ox + x * px, oy + y * px, ox + (x + 1) * px - 1, oy + (y + 1) * px - 1], fill=col)


def mark(scale=1.0, color=None, glow=True, bee_bg='theme'):
    """The hex ring + bee on a transparent 1024 canvas. scale=1 matches the squircle grid."""
    mono = color is not None
    color = color or T['screen']
    bee_bg = T['bg'] if bee_bg == 'theme' else bee_bg
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = S / 2, S / 2 + 6 * scale
    pts = hex_pts(cx, cy, 300 * scale)
    d.line(pts + pts[:2], fill=rgba(color), width=max(2, round(34 * scale)), joint='curve')
    draw_bee(d, cx, cy + 8 * scale, T['px'] * scale, color=color, bg=bee_bg, mono=mono)
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
        d.line([(0, y), (S, y)], fill=rgba(tuple(int(T['top'][i] + (T['bottom'][i] - T['top'][i]) * t) for i in range(3))))
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([180, 160, 844, 784], fill=rgba(T['screen'], 40))
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
    ImageDraw.Draw(rim).rounded_rectangle([off + 2, off + 2, off + size - 2, off + size - 2], rad - 2, outline=rgba(T['screen'], 70), width=4)
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


def hive_icons():
    mac = squircle()
    mac_small = squircle(detail=False)  # no scanlines: they turn to mush at 16-48px

    # Expo / native
    save(bleed(1.12), 1024, 'assets', 'icon.png')  # iOS rounds it; Android legacy fallback
    save(mark(1.2), 1024, 'assets', 'splash-icon.png')  # on the #0B0600 splash background
    save(mac_small, 48, 'assets', 'favicon.png')
    # Android adaptive: 108dp canvas, 66dp safe circle (r ~ 0.306 * S); hex r 300*0.95 + stroke fits
    save(mark(0.95), 1024, 'assets', 'android-icon-foreground.png')
    save(Image.new('RGBA', (S, S), rgba(T['bg'])), 1024, 'assets', 'android-icon-background.png')
    save(mark(0.95, color=(255, 255, 255), glow=False, bee_bg=None), 1024, 'assets', 'android-icon-monochrome.png')

    # PWA (installed web app): Mac-style tile, plus a maskable full-bleed one for Android/Chrome
    save(mac, 512, 'public', 'icons', 'icon-512.png')
    save(mac, 192, 'public', 'icons', 'icon-192.png')
    save(bleed(1.0), 512, 'public', 'icons', 'maskable-512.png')  # mark within the 80% safe zone
    save(bleed(1.12), 180, 'public', 'icons', 'apple-touch-icon.png')
    save(mac, 1024, 'public', 'icons', 'icon-1024.png')  # source / store-size copy
    save(mac_small, 48, 'public', 'icons', 'favicon-hive.png')  # web favicon when switching back


def alt_icons(name):
    """An alternate theme: native alternate icon (expo-alternate-app-icons) + web favicons."""
    save(bleed(1.12), 1024, 'assets', 'themes', name, 'icon.png')
    save(mark(0.95), 1024, 'assets', 'themes', name, 'android-icon-foreground.png')
    save(squircle(detail=False), 48, 'public', 'icons', f'favicon-{name}.png')
    save(bleed(1.12), 180, 'public', 'icons', f'apple-touch-icon-{name}.png')
    save(squircle(), 512, 'assets', 'themes', name, 'icon-512.png')  # preview / docs copy


for _name, T in THEMES.items():
    hive_icons() if _name == 'hive' else alt_icons(_name)
