"""Generate PWA icons for NOXwear."""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = "/home/z/my-project/public/icons"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colors from theme
BG_GOLD_DARK = (120, 70, 12)        # dark gold/amber
BG_GOLD = (245, 158, 11)           # primary gold (#f59e0b)
BG_GOLD_LIGHT = (251, 191, 36)     # lighter gold gradient
BG_BLACK = (15, 18, 22)            # dark background
BG_BLACK_DEEP = (8, 10, 12)

def make_gradient(size, color_start, color_end):
    """Create a diagonal gradient image."""
    img = Image.new('RGB', (size, size), color_start)
    draw = ImageDraw.Draw(img)
    for i in range(size):
        # Linear interpolation
        ratio = i / size
        r = int(color_start[0] * (1 - ratio) + color_end[0] * ratio)
        g = int(color_start[1] * (1 - ratio) + color_end[1] * ratio)
        b = int(color_start[2] * (1 - ratio) + color_end[2] * ratio)
        draw.line([(i, 0), (i, size)], fill=(r, g, b))
    return img

def make_icon(size, maskable=False):
    """Create a NOXwear icon: gold gradient bg with N letter."""
    # Background: dark with gold gradient circle in the middle
    img = Image.new('RGBA', (size, size), BG_BLACK_DEEP + (255,))

    # For maskable, fill the entire background with gradient
    if maskable:
        bg = make_gradient(size, BG_GOLD, BG_GOLD_DARK)
        img.paste(bg, (0, 0))
    else:
        # Rounded square background (for regular icons)
        bg = make_gradient(size, BG_GOLD, BG_GOLD_DARK)
        # Use mask to round corners
        mask = Image.new('L', (size, size), 0)
        mdraw = ImageDraw.Draw(mask)
        radius = size // 6
        mdraw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
        img.paste(bg, (0, 0), mask)

    # Try to load a good font
    font = None
    font_paths = [
        '/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, int(size * 0.6))
                break
            except Exception:
                continue

    if font is None:
        font = ImageFont.load_default()

    # Draw "N" letter
    draw = ImageDraw.Draw(img)
    text = "N"
    # Get text bounding box to center it
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
    except Exception:
        text_w, text_h = size * 0.4, size * 0.5

    x = (size - text_w) // 2
    y = (size - text_h) // 2 - int(size * 0.05)

    # Draw letter with dark color (since bg is gold)
    draw.text((x, y), text, fill=BG_BLACK_DEEP, font=font)

    return img

# Generate icons at various sizes
sizes_to_generate = [
    (192, 'icon-192.png', False),
    (512, 'icon-512.png', False),
    (192, 'icon-192-maskable.png', True),
    (512, 'icon-512-maskable.png', True),
    (180, 'apple-touch-icon.png', False),
    (32, 'favicon-32.png', False),
    (16, 'favicon-16.png', False),
]

for size, name, maskable in sizes_to_generate:
    icon = make_icon(size, maskable=maskable)
    path = os.path.join(OUTPUT_DIR, name)
    icon.save(path, 'PNG', optimize=True)
    print(f"Generated: {path} ({size}x{size})")

# Generate a favicon.ico containing multiple sizes
icon_16 = make_icon(16, maskable=False)
icon_32 = make_icon(32, maskable=False)
icon_48 = make_icon(48, maskable=False)
icon_16.save(os.path.join(OUTPUT_DIR, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print(f"Generated: {OUTPUT_DIR}/favicon.ico")

print("\nAll icons generated successfully!")
