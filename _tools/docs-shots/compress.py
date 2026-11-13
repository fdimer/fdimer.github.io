# Shrinks the screenshots in a docs img folder (palette PNG). Usage: python3 compress.py <folder>/docs/img
import sys, glob
from PIL import Image
for f in glob.glob(sys.argv[1] + '/*.png'):
    im = Image.open(f)
    if im.mode == 'P': continue
    im = im.convert('RGB')
    if f.endswith('overview.png') and im.width > 2200: im = im.resize((im.width * 3 // 4, im.height * 3 // 4), Image.LANCZOS)
    im.quantize(colors=128, dither=Image.Dither.NONE).save(f, optimize=True)
