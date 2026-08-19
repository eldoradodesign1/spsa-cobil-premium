from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/spsa-cobil-mark.png')
target = Path('/home/ubuntu/spsa-cobil-premium/client/public/icons')
target.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert('RGBA')
for size in (192, 512):
    rendered = image.resize((size, size), Image.Resampling.LANCZOS)
    rendered.save(target / f'icon-{size}.png', optimize=True)
