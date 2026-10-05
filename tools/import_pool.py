"""Convert the original Kotlin figure map into static web data."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "DivePoolTrainer"
KOTLIN = SOURCE / "app/src/main/java/com/example/fsdivepooltrainer/Utils/DIvePool.kt"
DRAWABLE = SOURCE / "app/src/main/res/drawable"

pattern = re.compile(
    r'"(?P<id>(?:FourWay|EightWay)_[A-Z0-9a-z]+)"\s+to\s+'
    r'FigureDetails\("(?P<code>[A-Z0-9]+)","(?P<name>[^"]+)",\s*'
    r'R\.drawable\.\s*(?P<image>[a-z0-9_]+),\s*(?P<points>[12])\)'
)

figures = []
for match in pattern.finditer(KOTLIN.read_text(encoding="utf-8")):
    item = match.groupdict()
    filename = item["image"] + ".png"
    if not (DRAWABLE / filename).is_file():
        raise FileNotFoundError(filename)
    figures.append(
        {
            "id": item["id"],
            "code": item["code"],
            "name": item["name"],
            "image": f"assets/{filename}",
            "points": int(item["points"]),
        }
    )

if len(figures) != 78:
    raise ValueError(f"Expected 78 figure entries, found {len(figures)}")

pools = {
    "FS4 AAA": [f["id"] for f in figures if f["id"].startswith("FourWay_")],
    "FS4 AAA ISR": [
        f["id"]
        for f in figures
        if f["id"].startswith("FourWay_") and f["code"] not in {"4", "8", "20"}
    ],
    "FS8 Outdoor": [
        f["id"]
        for f in figures
        if f["id"].startswith("EightWay_") and not f["id"].endswith("Indoor")
    ],
    "FS8 Indoor": [
        f["id"]
        for f in figures
        if f["id"].startswith("EightWay_") and not f["id"].endswith("Outdoor")
    ],
}
assert [len(p) for p in pools.values()] == [38, 35, 38, 38]

(ROOT / "data").mkdir(exist_ok=True)
(ROOT / "assets").mkdir(exist_ok=True)
(ROOT / "data/pool.json").write_text(
    json.dumps({"figures": figures, "pools": pools}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
for figure in figures:
    filename = Path(figure["image"]).name
    shutil.copy2(DRAWABLE / filename, ROOT / "assets" / filename)

print(f"Imported {len(figures)} entries, {len(set(f['image'] for f in figures))} images")
