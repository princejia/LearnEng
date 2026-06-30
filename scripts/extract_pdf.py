"""
从 eng.pdf（译林版六年级上册英语课本）抽取候选英文句子。
输出：scripts/extracted-sentences.json （[{english, page}]）

抽取策略（保守，宁缺毋滥）：
- 合并每页文本为一段，按句末标点 . ? ! 切句
- 过滤：单词数 3~16、以大写字母开头、主要由字母构成
- 丢弃明显的栏目标签 / 标题 / 页眉（Cartoon time、Unit、Get ready 等）
- 去重
"""
import fitz  # PyMuPDF
import json
import re
from pathlib import Path

PDF = Path(__file__).resolve().parent.parent / "eng.pdf"
OUT = Path(__file__).resolve().parent / "extracted-sentences.json"

# 栏目 / 标题短语：从文本中整体抹掉，避免跨栏粘连污染句子
LABEL_PHRASES = [
    "Story time", "Grammar time", "Wrap-up time", "Assessment time",
    "Cartoon time", "Fun time", "Song time", "Rhyme time", "Sound time",
    "Checkout time", "Ticking time", "Culture time", "Get ready",
    "Big question", "Learning objectives", "Characters", "Project",
    "Review", "Act in a play", "Keep trying", "Have a go",
]

LABEL_RE = re.compile(
    r"\b(" + "|".join(re.escape(p) for p in LABEL_PHRASES) + r")\b",
    re.IGNORECASE,
)
UNIT_RE = re.compile(r"\b(Unit|Class|Page)\s*\d+\b", re.IGNORECASE)


def clean_page(text: str) -> str:
    text = text.replace("\n", " ")
    text = LABEL_RE.sub(" ", text)
    text = UNIT_RE.sub(" ", text)
    text = re.sub(r"\s+\d+\s+", " ", text)  # 孤立数字（页码/编号）
    text = re.sub(r"\s+", " ", text)
    return text


def good(s: str) -> bool:
    if "…" in s or "/" in s:
        return False
    if re.search(r"\bla la\b", s, re.IGNORECASE):
        return False
    words = s.split()
    if not (3 <= len(words) <= 16):
        return False
    if not s[0].isupper():
        return False
    letters = sum(c.isalpha() for c in s)
    if letters / max(len(s), 1) < 0.65:
        return False
    return True


def main():
    doc = fitz.open(PDF)
    seen = set()
    out = []
    for i in range(doc.page_count):
        text = clean_page(doc[i].get_text())
        for sent in re.split(r"(?<=[.!?])\s+", text):
            s = sent.strip()
            if not s.endswith((".", "!", "?")):
                continue
            s = re.sub(r"\s+([.!?])", r"\1", s)
            if not good(s):
                continue
            key = s.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append({"english": s, "page": i})
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"pages={doc.page_count}  sentences={len(out)}")
    for item in out[:40]:
        print(f"  p{item['page']:>3}  {item['english']}")


if __name__ == "__main__":
    main()
