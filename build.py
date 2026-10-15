"""将课程源码打包为离线可读的单文件 HTML；GitHub 评论需联网。"""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
data = json.loads((root / "content.json").read_text())
html = (root / "shell.html").read_text()
runtime_path = root / ".validation/lesson-player-build/runtime.js"
if not runtime_path.is_file():
    raise SystemExit("缺少课程三维程序，请先运行 npm run build:lessons")
# Inline classic script: no module fetch, external model, font or CDN dependency.
runtime = re.sub(r"</script", r"<\\/script", runtime_path.read_text(), flags=re.IGNORECASE)
replacements = {
    "/* GUIDE_STYLE */": "\n".join((root / name).read_text() for name in ["styles.css", "progression.css", "lesson-player/styles.css"]),
    "/* GUIDE_DATA */": json.dumps(data, ensure_ascii=False).replace("<", "\\u003c"),
    "/* GUIDE_ANIMATIONS */": (root / "animations.js").read_text(),
    "/* GUIDE_LESSON_RUNTIME */": runtime,
    "/* GUIDE_LESSON_BRIDGE */": (root / "lesson-player/bridge.js").read_text(),
    "/* GUIDE_PROGRESSION */": (root / "progression.js").read_text(),
    "/* GUIDE_COMMENTS */": (root / "comments.js").read_text(),
    "/* GUIDE_APP */": (root / "app.js").read_text(),
}
for marker, content in replacements.items():
    if html.count(marker) != 1:
        raise ValueError(f"模板标记数量异常：{marker}")
    html = html.replace(marker, content)
(root / "index.html").write_text(html)
(root / "snowboard-guide.html").write_text(html)
print(f"已生成单文件 HTML：{root / 'snowboard-guide.html'}，{len(html.encode())} bytes")
