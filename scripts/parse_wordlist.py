"""
解析 eng.pdf 末尾「Word lists（按单元）」生词表 → scripts/eng-words.json
每条：{english, chinese, unit, grade, difficulty}
- difficulty: 带 * 的非核心词记 2，其余记 1
- 全挖空策略由导入端处理（按单词拆空）
"""
import fitz
import json
import re
from pathlib import Path

PDF = Path(__file__).resolve().parent.parent / "eng.pdf"
OUT = Path(__file__).resolve().parent / "eng-words.json"

# 「按单元」生词表所在的页（0-based）：book 110~112
PART1_PAGES = [109, 110, 111]

CJK = re.compile(r"[\u4e00-\u9fff]")
PAGEREF = re.compile(r"\(\d+\)")
UNIT = re.compile(r"^Unit\s+(\d+)")


def main():
    doc = fitz.open(PDF)
    lines = []
    for p in PART1_PAGES:
        lines.extend(doc[p].get_text().split("\n"))

    entries = []
    seen = set()
    unit = None
    buf = []
    star = False

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        mu = UNIT.match(s)
        if mu:
            unit = int(mu.group(1))
            buf, star = [], False
            continue
        if s.startswith("说明") or "Word lists" in s:
            buf, star = [], False
            continue
        if re.fullmatch(r"[I ]+", s):  # 罗马数字分节标记 I / I I
            continue
        if re.fullmatch(r"\d+", s):  # 页眉页码
            continue

        if not buf and s.lstrip().startswith("*"):
            star = True
        buf.append(s)

        if PAGEREF.search(s):  # 出现 (页码) → 一条词条结束
            chunk = " ".join(buf)
            buf, this_star = [], star
            star = False

            chunk = PAGEREF.sub("", chunk)           # 去页码
            chunk = chunk.replace("*", "")
            chunk = re.sub(r"\([^)]*\)", "", chunk)    # 去 (AmE color) 之类注释
            chunk = re.sub(r"[\x00-\x1f\x7f]", "", chunk)  # 去控制字符（PDF 杂质）
            m = CJK.search(chunk)
            if not m or unit is None:
                continue
            eng = re.sub(r"\s+", " ", chunk[: m.start()]).strip()
            chi = chunk[m.start():].strip().rstrip("，,；; ")
            # 规范撇号
            eng = eng.replace("\u2019", "'")
            if not eng or not chi:
                continue
            key = (eng.lower(), unit)
            if key in seen:
                continue
            seen.add(key)
            entries.append({
                "english": eng,
                "chinese": chi,
                "unit": unit,
                "grade": 6,
                "difficulty": 2 if this_star else 1,
            })

    OUT.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    by_unit = {}
    for e in entries:
        by_unit[e["unit"]] = by_unit.get(e["unit"], 0) + 1
    print(f"total={len(entries)}  by_unit={dict(sorted(by_unit.items()))}")
    for e in entries[:30]:
        print(f"  U{e['unit']} d{e['difficulty']}  {e['english']:<24} {e['chinese']}")


if __name__ == "__main__":
    main()
