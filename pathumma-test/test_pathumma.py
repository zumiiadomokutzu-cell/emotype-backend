import json
import os
from pathlib import Path

from dotenv import load_dotenv
from aift import setting
from aift.multimodal import textqa

# 1. หาไฟล์ .env ที่อยู่ในโฟลเดอร์หลัก
project_dir = Path(__file__).resolve().parent.parent
load_dotenv(project_dir / ".env")

# 2. อ่าน API Key
api_key = os.getenv("AIFORTHAI_API_KEY")

if not api_key:
    raise RuntimeError("ไม่พบ AIFORTHAI_API_KEY ในไฟล์ .env")

# 3. ตั้งค่า SDK
setting.set_api_key(api_key)

# 4. ข้อความที่ต้องการทดลอง
message = "วันนี้เหนื่อยมาก แต่ก็ภูมิใจที่ทำสำเร็จ"

# 5. สร้าง Prompt บังคับให้ตอบกลับเป็น JSON
prompt = f"""
คุณเป็น AI ที่ช่วยตีความข้อความภาษาไทย
เพื่อสร้างงานศิลปะ Experimental Typography
สำหรับโปรเจกต์ EMOTYPE

หน้าที่ของคุณคือวิเคราะห์ความหมายทางอารมณ์
ไม่ใช่วาดภาพหรือเขียนโปรแกรม

ข้อความจากผู้ใช้:
{json.dumps(message, ensure_ascii=False)}

กฎ:
1. วิเคราะห์จากข้อความเท่านั้น
2. ข้อความอาจมีหลายอารมณ์พร้อมกัน
3. ห้ามวินิจฉัยสุขภาพจิต
4. ห้ามแต่งเติมเรื่องราวที่ไม่มีในข้อความ
5. ห้ามเสนอภาพคน สถานที่ หรือสิ่งของเป็นองค์ประกอบหลัก
6. Visual concept ต้องเป็นนามธรรม
   โดยใช้แสง สี พื้นที่ว่าง และตัวอักษร
7. หากไม่แน่ใจ ให้ใช้ "uncertain"
8. ตอบเป็น JSON Object เท่านั้น
   ห้ามมี Markdown หรือข้อความนอก JSON

โครงสร้าง JSON:

{{
  "primaryEmotion": "ชื่ออารมณ์ภาษาอังกฤษ",
  "secondaryEmotion": "ชื่ออารมณ์ภาษาอังกฤษหรือ none",
  "relationship": "mixed / aligned / contrasting / uncertain",
  "interpretation": "อธิบายความรู้สึกสั้นๆ ภาษาไทย",
  "visualMetaphor": "แนวคิดเชิงนามธรรมภาษาอังกฤษ",
  "artworkTitle": "ชื่อผลงานภาษาอังกฤษ 2-5 คำ"
}}
"""

print("กำลังเรียก Pathumma...")

# 6. เรียก API จริง
result = textqa.generate(
    instruction=prompt,
    temperature=0.2,
    max_new_tokens=500,
    return_json=True
)

# 7. แสดงผลลัพธ์ดิบ และแปลงเป็น JSON
print("\n--- RAW PATHUMMA RESPONSE ---")
print(result)

content = result.get("content", "")

try:
    parsed = (
        json.loads(content)
        if isinstance(content, str)
        else content
    )

    print("\n--- PARSED EMOTION DATA ---")
    print(json.dumps(
        parsed,
        ensure_ascii=False,
        indent=2
    ))

except (json.JSONDecodeError, TypeError) as error:
    print("JSON parsing failed:", error)
    print("Raw content:", content)