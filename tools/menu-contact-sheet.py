"""Review loading photographs in three sheets, seven areas per sheet."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

rows = json.loads(Path('assets/menu/map.json').read_text(encoding='utf-8'))['catalogue']
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
Path('shots/menu-sights').mkdir(parents=True, exist_ok=True)
for start in range(0, len(rows), 7):
    group = rows[start:start+7]
    sheet = Image.new('RGB', (1500, len(group)*204), '#24172d')
    draw = ImageDraw.Draw(sheet)
    for row, area in enumerate(group):
        draw.text((8, row*204+4), area['name']+' / '+area['id'], fill='white', font=font)
        for i, file in enumerate(area['images']):
            image = Image.open(file).convert('RGB')
            image.thumbnail((298, 168))
            sheet.paste(image, (i*300, row*204+30))
    file = f'shots/menu-sights/contact-{start//7+1}.jpg'
    sheet.save(file, quality=90)
    print(file)
