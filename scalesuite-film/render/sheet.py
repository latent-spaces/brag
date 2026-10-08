"""Tile PNG stills into a labelled contact sheet: python3 sheet.py out.jpg cols thumbW img1 img2 ..."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
pad, lab = 10, 26
sheet = Image.new('RGB', (cols * (tw + pad) + pad, rows * (th + pad + lab) + pad), (40, 44, 43))
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
except Exception: font = None
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + pad + lab)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + lab))
    d.text((x + 2, y + 3), os.path.splitext(os.path.basename(f))[0], fill=(235, 245, 243), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
