"""将可维护源码打包为完全离线的单文件 HTML。"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
data = json.loads((root / "content.json").read_text())
html = (root / "shell.html").read_text()
replacements = {
    "/* GUIDE_STYLE */": (root / "styles.css").read_text(),
    "/* GUIDE_DATA */": json.dumps(data, ensure_ascii=False).replace("<", "\\u003c"),
    "/* GUIDE_ANIMATIONS */": (root / "animations.js").read_text(),
    "/* GUIDE_APP */": (root / "app.js").read_text(),
}
for marker, content in replacements.items():
    if html.count(marker) != 1:
        raise ValueError(f"模板标记数量异常：{marker}")
    html = html.replace(marker, content)
(root / "index.html").write_text(html)
(root / "snowboard-guide.html").write_text(html)
print(f"已生成单文件 HTML：{root / 'snowboard-guide.html'}，{len(html.encode())} bytes")
