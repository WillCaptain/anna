#!/usr/bin/env python3
"""验证所有 JS 文件的相对 import 是否能正确解析"""
import os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMPORT_RE = re.compile(r"""(?:import|export)\b[^'"]*?from\s+['"](\./[^'"]+|\.\.\/[^'"]+)['"]""", re.MULTILINE)
SKIP = {"node_modules", ".git", "SPEC", "scripts", "docs"}

errors = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP]
    for fn in filenames:
        if not fn.endswith(".js"):
            continue
        filepath = os.path.join(dirpath, fn)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        for m in IMPORT_RE.finditer(content):
            spec = m.group(1)
            base = os.path.dirname(filepath)
            p = os.path.normpath(os.path.join(base, spec))
            ok = os.path.exists(p) or os.path.exists(p+".js") or os.path.exists(os.path.join(p,"index.js"))
            if not ok:
                rel_file = os.path.relpath(filepath, ROOT)
                errors.append((rel_file, spec))

if errors:
    print(f"发现 {len(errors)} 个无法解析的 import：\n")
    for f, spec in errors:
        print(f"  {f}\n    import '{spec}'")
else:
    print("✓ 所有 import 路径均可解析")
