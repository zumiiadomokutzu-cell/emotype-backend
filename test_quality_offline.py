
from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parent
BRIDGE = ROOT / "pathumma-test" / "pathumma_bridge.py"

print("Checking:", BRIDGE)

if not BRIDGE.is_file():
    raise FileNotFoundError(f"Cannot find: {BRIDGE}")

source = BRIDGE.read_text(encoding="utf-8")

# ตรวจว่าโค้ด Python เขียนถูกหลัก Syntax
ast.parse(source)

# ตรวจว่า Bridge มีชื่อ Field ที่ Backend ต้องใช้
required_fields = [
    "primaryEmotion",
    "secondaryEmotion",
    "relationship",
    "interpretation",
    "reflectionMessage",
    "visualMetaphor",
    "artworkTitle",
]

for field in required_fields:
    if field not in source:
        raise AssertionError(f"Missing field: {field}")

print("PASS: Pathumma Bridge syntax")
print("PASS: Required JSON fields")
print("OFFLINE QUALITY CHECK PASSED")