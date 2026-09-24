"""从现有地图 PNG 生成静态碰撞网格。需要 Pillow；运行后提交生成的 JS。"""

import base64
import json
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/config/collision-masks.config.js"
MAPS = {1: "forest", 4: "harbor", 5: "ruins"}
HARBOR_PATHS = [
    [(0.91, 0.86), (0.76, 0.74), (0.56, 0.67), (0.37, 0.59), (0.27, 0.52)],
    [(0.27, 0.52), (0.42, 0.50), (0.54, 0.56), (0.69, 0.48), (0.65, 0.39), (0.49, 0.34), (0.35, 0.27), (0.35, 0.23)],
]


def distance_to_segment(x, y, a, b, aspect):
    ax, ay = a[0], a[1] * aspect
    bx, by = b[0], b[1] * aspect
    py = y * aspect
    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    t = max(0, min(1, ((x - ax) * dx + (py - ay) * dy) / length_sq)) if length_sq else 0
    return ((x - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2) ** 0.5


def terrain_pixel(map_id, r, g, b, x, y, aspect):
    sand = r > 205 and g > 165 and b > 105 and r > g + 10 and g > b + 25
    if map_id == 1:
        bridge_wood = (0.47 < x < 0.70 and 0.34 < y < 0.48
                       and r > 135 and g > 100 and 65 < b < 155
                       and r > g + 16 and g > b + 12)
        return sand or bridge_wood
    if map_id != 4:
        return sand

    # 海港的地面是暖色石砖和木板；离码头很远的船只、屋顶不算地面。
    warm = r > 145 and g > 105 and b > 65 and r > g + 12 and g > b + 4 and b < g + 17
    near_dock = min(
        distance_to_segment(x, y, a, b, aspect)
        for path in HARBOR_PATHS
        for a, b in zip(path, path[1:])
    ) < 0.20
    return warm and near_dock and 0.13 < y < 0.92


def build_mask(map_id, name):
    image = Image.open(ROOT / f"assets/maps/map_{map_id:02d}_{name}.png").convert("RGB")
    cols = 96
    rows = round(cols * image.height / image.width)
    small = image.resize((cols, rows), Image.Resampling.BILINEAR)
    mask = Image.new("L", (cols, rows))
    pixels = mask.load()
    aspect = image.height / image.width

    for y in range(rows):
        for x in range(cols):
            r, g, b = small.getpixel((x, y))
            pixels[x, y] = 255 if terrain_pixel(map_id, r, g, b, (x + 0.5) / cols, (y + 0.5) / rows, aspect) else 0

    # 填补石砖缝、木板缝和纹理造成的小孔，保持真实地面边缘。
    mask = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    bits = bytearray((cols * rows + 7) // 8)
    for index, value in enumerate(mask.getdata()):
        if value:
            bits[index >> 3] |= 1 << (index & 7)
    return {"cols": cols, "rows": rows, "bits": base64.b64encode(bits).decode("ascii")}


def main():
    masks = {map_id: build_mask(map_id, name) for map_id, name in MAPS.items()}
    body = json.dumps(masks, ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text(
        "/** 由 scripts/build-map-collision.py 根据地图原图生成；坐标从左上角开始。 */\n"
        f"const MAP_COLLISION_MASKS = {body};\n"
        "if (typeof module !== 'undefined' && module.exports) module.exports = MAP_COLLISION_MASKS;\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
