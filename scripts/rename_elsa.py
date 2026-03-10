#!/usr/bin/env python3
"""
将代码中所有 elsa 相关字符串/标识符统一替换为 anna。
运行: python3 scripts/rename_elsa.py
"""

import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ─── 步骤一：文件重命名映射 ─────────────────────────────────────────────────────
FILE_RENAMES = {
    'common/elsaEntryUtil.js':      'common/annaEntryUtil.js',
    'common/elsa2image.js':          'common/anna2image.js',
    'core/entry/elsaEntry.js':       'core/entry/annaEntry.js',
    'core/utils/elsaDataBuilder.js': 'core/utils/annaDataBuilder.js',
}

# ─── 步骤二：内容替换规则（顺序敏感，长模式优先）─────────────────────────────
REPLACEMENTS = [
    # ── import 路径（先处理，避免后续规则误伤）
    ("elsaEntryUtil.js",       "annaEntryUtil.js"),
    ("elsa2image.js",          "anna2image.js"),
    ("elsaEntry.js",           "annaEntry.js"),
    ("elsaDataBuilder.js",     "annaDataBuilder.js"),

    # ── ELSA 大写导出名
    ("export {ELSA}",          "export {ANNA}"),
    ("export {ELSA,",          "export {ANNA,"),
    ("import {ELSA}",          "import {ANNA}"),
    ("import {ELSA,",          "import {ANNA,"),
    ("ELSA.convertGraphData",  "ANNA.convertGraphData"),
    ("ELSA.presentGraph",      "ANNA.presentGraph"),
    ("ELSA.viewGraph",         "ANNA.viewGraph"),
    ("ELSA.newGraph",          "ANNA.newGraph"),
    ("ELSA.editGraph",         "ANNA.editGraph"),
    ("ELSA.displayGraph",      "ANNA.displayGraph"),
    ("ELSA._mockRepo",         "ANNA._mockRepo"),
    ("ELSA._mockEmptyGraph",   "ANNA._mockEmptyGraph"),
    ("const ELSA = ",          "const ANNA = "),
    # ELSA_NAME_SPACE 常量名
    ("ELSA_NAME_SPACE",        "ANNA_NAME_SPACE"),
    # ELSA_COPY_MATCHER
    ("ELSA_COPY_MATCHER",      "ANNA_COPY_MATCHER"),

    # ── elsaWriter / elsatoimage / elsaWriter
    ("elsaWriter",             "annaWriter"),
    ("elsatoimage",            "annatoimage"),
    ("reGenerateId",           "reGenerateId"),   # keep as-is (no elsa in name)

    # ── 字符串字面量值
    ("'elsa-page:'",           "'anna-page:'"),
    ('"elsa-page:"',           '"anna-page:"'),
    ("`elsa-page:",            "`anna-page:"),
    ("'elsa-editor'",          "'anna-editor'"),
    ('"elsa-editor"',          '"anna-editor"'),
    ("'modelengine.fit.elsa'", "'anna'"),
    ('"modelengine.fit.elsa"', '"anna"'),
    # namespace 字符串
    ("= 'elsa'",               "= 'anna'"),
    ('= "elsa"',               '= "anna"'),
    # source 字符串
    ("source = 'elsa'",        "source = 'anna'"),
    ('source = "elsa"',        'source = "anna"'),
    # clipboard MIME types
    ('"elsa/shape"',           '"anna/shape"'),
    ("'elsa/shape'",           "'anna/shape'"),
    ('"elsa/table"',           '"anna/table"'),
    ("'elsa/table'",           "'anna/table'"),
    # 剪贴板 type 值
    ('type === "elsa"',        'type === "anna"'),
    ("type === 'elsa'",        "type === 'anna'"),
    ('"type":"elsa"',          '"type":"anna"'),
    ('type: "elsa"',           'type: "anna"'),
    # clipboard regex pattern
    ("/.*elsa\\/(?<type>",     "/.*anna\\/(?<type>"),
    ("'elsa/',",               "'anna/',"),
    ('`elsa/${',               '`anna/${'),
    # DOM IDs / CSS classes
    ('"elsaToolBar"',          '"annaToolBar"'),
    ("'elsaToolBar'",          "'annaToolBar'"),
    ('"elsa-toolbar"',         '"anna-toolbar"'),
    ("'elsa-toolbar'",         "'anna-toolbar'"),
    # WebSocket URL 参数
    ('"/elsaData?',            '"/annaData?'),
    ("'/elsaData?",            "'/annaData?"),
    ('/elsaData?"',            '/annaData?"'),
    # 后端 API URL
    ('"/elsa-backend/',        '"/anna-backend/'),
    ("'/elsa-backend/",        "'/anna-backend/"),
    # clipboardData MIME prefix in keyActions
    ("`elsa/${copyResult.type}`", "`anna/${copyResult.type}`"),
]

# ─── 扩展名过滤 ──────────────────────────────────────────────────────────────
EXTENSIONS = {'.js', '.html', '.json', '.md', '.css'}
SKIP_DIRS  = {'node_modules', '.git', 'docs'}


def should_process(path):
    ext = os.path.splitext(path)[1].lower()
    if ext not in EXTENSIONS:
        return False
    for d in SKIP_DIRS:
        if (os.sep + d + os.sep) in path or path.endswith(os.sep + d):
            return False
    return True


def replace_in_file(fpath, rules):
    with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    original = content
    for old, new in rules:
        content = content.replace(old, new)
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def collect_files(root):
    result = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            if should_process(fpath):
                result.append(fpath)
    return result


def main():
    print("=== Step 1: Rename files ===")
    for src_rel, dst_rel in FILE_RENAMES.items():
        src = os.path.join(ROOT, src_rel)
        dst = os.path.join(ROOT, dst_rel)
        if os.path.exists(src):
            shutil.move(src, dst)
            print(f"  MOVED: {src_rel} → {dst_rel}")
        else:
            print(f"  SKIP (not found): {src_rel}")

    print("\n=== Step 2: Replace strings in all files ===")
    files = collect_files(ROOT)
    changed = 0
    for fpath in files:
        if replace_in_file(fpath, REPLACEMENTS):
            rel = os.path.relpath(fpath, ROOT)
            print(f"  UPDATED: {rel}")
            changed += 1

    print(f"\nDone. {changed} files updated.")


if __name__ == '__main__':
    main()
