from pathlib import Path
from PIL import Image, ImageDraw

target = Path('/home/ubuntu/spsa-cobil-premium/client/public/icons')
target.mkdir(parents=True, exist_ok=True)

for size in (192, 512):
    image = Image.new('RGBA', (size, size), '#0d0d28')
    draw = ImageDraw.Draw(image)
    pad = round(size * 0.12)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 0.27), fill='#0d0d28')
    center = size / 2
    for scale, color, width in ((0.74, '#786cff', 0.038), (0.50, '#a69cff', 0.030), (0.28, '#d8d4ff', 0.022)):
        radius = size * scale / 2
        stroke = max(2, round(size * width))
        draw.ellipse((center - radius, center - radius, center + radius, center + radius), outline=color, width=stroke)
    line = max(3, round(size * 0.034))
    draw.line((center, pad, center, size - pad), fill='#efedff', width=line)
    draw.line((pad, center, size - pad, center), fill='#b8b1ff', width=max(2, round(size * 0.018)))
    dot = max(4, round(size * 0.05))
    draw.ellipse((center - dot, center - dot, center + dot, center + dot), fill='#ffffff')
    image.save(target / f'icon-{size}.png', optimize=True)
