import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "SILK-V2-NEXT.html").read_text(encoding="utf-8")
OUT = ROOT / "audit" / "WORLD_OFFLINE_PREVIEW.png"
OUT.parent.mkdir(parents=True, exist_ok=True)


def embedded(script_id):
    pattern = rf'<script[^>]+id=["\']{re.escape(script_id)}["\'][^>]*>(.*?)</script>'
    match = re.search(pattern, HTML, re.I | re.S)
    if not match:
        raise RuntimeError(f"missing embedded script: {script_id}")
    return json.loads(match.group(1))


data = embedded("silk-sphere-cells")
grid = embedded("silk-sphere-grid")
if grid.get("format") == "silk-sphere-grid-packed-v1":
    grid = {
        "frequency": grid["frequency"],
        "cells": [
            {
                "center": grid["centers"][index * 3:index * 3 + 3],
                "faces": grid["faces"][grid["face_offsets"][index]:grid["face_offsets"][index + 1]],
            }
            for index in range(grid["cell_count"])
        ],
        "faceCenters": [grid["face_centers"][index:index + 3] for index in range(0, len(grid["face_centers"]), 3)],
    }
width, height = 1400, 1000
cx, cy, radius = 700, 510, 430
owned_points = [grid["cells"][index]["center"] for index, owner in enumerate(data["owners"]) if owner >= 0]
focus = [sum(point[axis] for point in owned_points) for axis in range(3)] if owned_points else [0, 0, 1]
focus_length = math.sqrt(sum(value * value for value in focus)) or 1
focus = [value / focus_length for value in focus]
yaw = -math.atan2(focus[0], focus[2])
pitch = math.atan2(focus[1], math.hypot(focus[0], focus[2]))
image = Image.new("RGB", (width, height), "#ece9dc")
draw = ImageDraw.Draw(image)


def rotate(point):
    cyaw, syaw = math.cos(yaw), math.sin(yaw)
    cpitch, spitch = math.cos(pitch), math.sin(pitch)
    x = point[0] * cyaw + point[2] * syaw
    z0 = -point[0] * syaw + point[2] * cyaw
    return x, point[1] * cpitch - z0 * spitch, point[1] * spitch + z0 * cpitch


def project(point):
    x, y, z = rotate(point)
    return cx + x * radius, cy - y * radius, z


terrain_palette = {
    0: "#183d4c", 1: "#315868", 2: "#788e58", 3: "#355f43",
    4: "#b89a61", 5: "#81786a", 6: "#dddcd2", 7: "#557b67",
    8: "#59433b", 9: "#9ba49a",
}
terrain_names = {"ocean": 1, "sea": 1, "grassland": 2, "plains": 2, "forest": 3, "desert": 4, "mountain": 5, "snow": 6, "glacier": 6, "wetland": 7, "volcanic": 8, "tundra": 9}

draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill="#315868", outline="#f6f1dd", width=3)
visible = []
for index, cell in enumerate(grid["cells"]):
    center = project(cell["center"])
    if center[2] < -0.06:
        continue
    visible.append((center[2], index, cell))

for _, index, cell in sorted(visible):
    ring = [project(grid["faceCenters"][face]) for face in cell["faces"]]
    if all(point[2] < -0.04 for point in ring):
        continue
    points = [(point[0], point[1]) for point in ring]
    raw = data["terrain"][index]
    semantic = data.get("terrain_legend", {}).get(str(raw), data.get("terrain_legend", {}).get(raw, raw))
    code = terrain_names.get(str(semantic).lower(), int(semantic) if str(semantic).lstrip('-').isdigit() else 2)
    color = terrain_palette.get(code, "#788e58")
    draw.polygon(points, fill=color)

for border in data.get("borders", []):
    a, b = project(border["a"]), project(border["b"])
    if a[2] < 0 or b[2] < 0:
        continue
    color = "#f2ecd8" if border.get("kind") == "coast" else "#171d17"
    line_width = 2 if border.get("kind") == "coast" else 3
    draw.line((a[0], a[1], b[0], b[1]), fill=color, width=line_width)

font_path = Path(r"C:\Windows\Fonts\YuGothM.ttc")
font_bold_path = Path(r"C:\Windows\Fonts\YuGothB.ttc")
font = ImageFont.truetype(str(font_path), 14) if font_path.exists() else ImageFont.load_default()
font_bold = ImageFont.truetype(str(font_bold_path), 17) if font_bold_path.exists() else font
occupied = []


def place_label(text, point, label_font, priority=False):
    x, y, z = project(point)
    if z < 0.08:
        return False
    box = draw.textbbox((0, 0), text, font=label_font)
    tw, th = box[2] - box[0], box[3] - box[1]
    rect = (x - tw / 2 - 7, y - th / 2 - 5, x + tw / 2 + 7, y + th / 2 + 5)
    if not priority:
        for other in occupied:
            if not (rect[2] < other[0] or other[2] < rect[0] or rect[3] < other[1] or other[3] < rect[1]):
                return False
    occupied.append(rect)
    draw.rectangle(rect, fill="#f7f4e8", outline="#68705f", width=1)
    draw.text((x, y), text, font=label_font, fill="#151b15", anchor="mm")
    return True


layouts = {item["id"]: item for item in data.get("country_label_layout", [])}
for country in sorted(data.get("countries", []), key=lambda item: item.get("cells", 0), reverse=True):
    layout = layouts.get(country["id"], {})
    place_label(layout.get("short_name") or country.get("name") or country["id"], layout.get("anchor") or country["point"], font_bold)

for settlement in sorted(data.get("settlements", []), key=lambda item: item.get("importance", 0), reverse=True):
    x, y, z = project(settlement["point"])
    if z < 0.04:
        continue
    size = 5 if settlement.get("importance", 0) >= 95 else 3
    draw.ellipse((x - size, y - size, x + size, y + size), fill="#f8f4e3", outline="#111711", width=2)
    if settlement.get("importance", 0) >= 95:
        place_label(settlement.get("name") or settlement["id"], settlement["point"], font, priority=False)

title_font = ImageFont.truetype(str(font_bold_path), 28) if font_bold_path.exists() else font_bold
small_font = ImageFont.truetype(str(font_path), 12) if font_path.exists() else font
draw.text((48, 42), "SILK V2.NEXT / OFFLINE WORLD DATA AUDIT", font=title_font, fill="#151b15")
draw.text((50, 82), f"{len(grid['cells']):,} cells / {len(data.get('countries', []))} countries / {len(data.get('settlements', []))} settlements / {len(data.get('borders', []))} borders", font=small_font, fill="#4e574b")
draw.text((50, 952), "This image validates embedded geography only. It is not browser or interaction proof.", font=small_font, fill="#68705f")
image.save(OUT)
print(OUT)
