"""Contact sheet with one row per scene: python3 render/sheet-v3.py out.jpg thumbW "Title|a.png,b.png" ...
Each label shows the scene title on the row and the timestamp (from the file name, e.g. s1-0.60.png) on the frame."""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

out, tw = sys.argv[1], int(sys.argv[2])
rows = [(a.split('|')[0], a.split('|')[1].split(',')) for a in sys.argv[3:]]
first = Image.open(rows[0][1][0])
th = int(tw * first.height / first.width)
cols = max(len(f) for _, f in rows)
pad, head, lab = 14, 46, 30
W = pad + cols * (tw + pad)
H = pad + len(rows) * (head + lab + th + pad)
sheet = Image.new('RGB', (W, H), (38, 42, 41))
d = ImageDraw.Draw(sheet)
def font(sz):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
fh, fl = font(26), font(20)
y = pad
for title, files in rows:
    d.text((pad + 2, y + 8), title, fill=(120, 230, 214), font=fh)
    for i, f in enumerate(files):
        x = pad + i * (tw + pad)
        ts = os.path.splitext(os.path.basename(f))[0].split('-')[-1]
        d.text((x + 2, y + head + 3), f't = {ts} s', fill=(235, 245, 243), font=fl)
        sheet.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + head + lab))
    y += head + lab + th + pad
sheet.save(out, quality=90)
print(out, sheet.size)
