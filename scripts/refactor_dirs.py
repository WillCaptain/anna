#!/usr/bin/env python3
"""
目录结构重构脚本
按照 SPEC/13-directory-refactor-plan.md 的规划移动文件，并自动更新所有 JS import 路径。

执行逻辑：
  1. 创建新目录骨架
  2. 移动文件（shutil.move）
  3. 对所有 JS 文件扫描 import/export from，
     - 用"文件原始位置"解析旧相对路径 → 被 import 文件的绝对路径
     - 用"文件新位置"重新计算相对路径
  4. 清理空目录 / 归档旧测试
"""
import os, re, shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ─────────────────────────────────────────────────────────────────
#  文件移动映射  (相对于 ROOT 的路径)
# ─────────────────────────────────────────────────────────────────
MOVE_MAP = {
    # core/base/ ──────────────────────────────────
    "core/atom.js":                  "core/base/atom.js",
    "core/shape.js":                 "core/base/shape.js",
    "core/page.js":                  "core/base/page.js",
    "core/graph.js":                 "core/base/graph.js",
    "core/container.js":             "core/base/container.js",
    "core/shapeFields.js":           "core/base/shapeFields.js",

    # core/interaction/ ───────────────────────────
    "core/connector.js":             "core/interaction/connector.js",
    "core/hitRegion.js":             "core/interaction/hitRegion.js",

    # core/history/ ───────────────────────────────
    "core/history.js":               "core/history/history.js",
    "core/commands.js":              "core/history/commands.js",

    # core/shapes/ ────────────────────────────────
    "core/rectangle.js":             "core/shapes/rectangle.js",
    "core/ellipse.js":               "core/shapes/ellipse.js",
    "core/line.js":                  "core/shapes/line.js",
    "core/lineHelper.js":            "core/shapes/lineHelper.js",
    "core/freeLine.js":              "core/shapes/freeLine.js",
    "core/group.js":                 "core/shapes/group.js",
    "core/icon.js":                  "core/shapes/icon.js",
    "core/image.js":                 "core/shapes/image.js",
    "core/table.js":                 "core/shapes/table.js",
    "core/svg.js":                   "core/shapes/svg.js",
    "core/sticker.js":               "core/shapes/sticker.js",
    "core/thumb.js":                 "core/shapes/thumb.js",
    "core/reference.js":             "core/shapes/reference.js",
    "core/vector.js":                "core/shapes/vector.js",
    "core/charts.js":                "core/shapes/charts.js",
    "core/others.js":                "core/shapes/others.js",

    # core/shapes/arrows/ ─────────────────────────
    "core/bottomArrow.js":           "core/shapes/arrows/bottomArrow.js",
    "core/dovetailArrow.js":         "core/shapes/arrows/dovetailArrow.js",
    "core/leftAndRightArrow.js":     "core/shapes/arrows/leftAndRightArrow.js",
    "core/rightArrow.js":            "core/shapes/arrows/rightArrow.js",
    "core/rightCurlyBrace.js":       "core/shapes/arrows/rightCurlyBrace.js",

    # core/shapes/geometry/ ───────────────────────
    "core/diamond.js":               "core/shapes/geometry/diamond.js",
    "core/triangle.js":              "core/shapes/geometry/triangle.js",
    "core/parallelogram.js":         "core/shapes/geometry/parallelogram.js",
    "core/pentagram.js":             "core/shapes/geometry/pentagram.js",
    "core/regularPentagonal.js":     "core/shapes/geometry/regularPentagonal.js",
    "core/roundedRectangleCallout.js": "core/shapes/geometry/roundedRectangleCallout.js",

    # core/shapes/media/ ──────────────────────────
    "core/audio.js":                 "core/shapes/media/audio.js",
    "core/video.js":                 "core/shapes/media/video.js",

    # core/collaboration/ ─────────────────────────
    "common/collaboration.js":       "core/collaboration/collaboration.js",

    # core/utils/ ─────────────────────────────────
    "common/guideLineUtil.js":       "core/utils/guideLineUtil.js",
    "core/elsaDataBuilder.js":       "core/utils/elsaDataBuilder.js",

    # svg/icons 跟随 core/shapes/
    "core/svg/icons.js":             "core/shapes/svg_icons.js",

    # 统一出口
    "core/src/index.js":             "core/index.js",
}

# 绝对路径映射（供 import 路径计算使用）
ABS_MOVE: dict[str, str] = {
    os.path.normpath(os.path.join(ROOT, k)): os.path.normpath(os.path.join(ROOT, v))
    for k, v in MOVE_MAP.items()
}


# ─────────────────────────────────────────────────────────────────
#  新目录列表
# ─────────────────────────────────────────────────────────────────
NEW_DIRS = [
    "core/base", "core/interaction", "core/history", "core/collaboration",
    "core/shapes", "core/shapes/arrows", "core/shapes/geometry", "core/shapes/media",
    "core/utils",
    "test/cases/base", "test/cases/interaction", "test/cases/history",
    "test/cases/drawers", "test/cases/shapes", "test/cases/actions",
]


# ─────────────────────────────────────────────────────────────────
#  工具函数
# ─────────────────────────────────────────────────────────────────
IMPORT_RE = re.compile(
    r"""((?:import|export)\b[^'"]*?from\s+|import\s+)(['"])(\.\.?/[^'"]+)\2""",
    re.MULTILINE,
)


def resolve_abs(importer_abs: str, spec: str) -> str:
    """从 importer 的目录出发，把相对 spec 解析为绝对路径（规范化）。"""
    base = os.path.dirname(importer_abs)
    p = os.path.normpath(os.path.join(base, spec))
    # 尝试补全 .js
    if not os.path.exists(p):
        if os.path.exists(p + ".js"):
            p = p + ".js"
        elif os.path.exists(os.path.join(p, "index.js")):
            p = os.path.join(p, "index.js")
    return p


def make_rel(from_file: str, to_file: str, keep_ext: bool) -> str:
    """计算 from_file 到 to_file 的相对路径字符串。"""
    rel = os.path.relpath(to_file, os.path.dirname(from_file)).replace(os.sep, "/")
    if not rel.startswith("."):
        rel = "./" + rel
    if not keep_ext:
        # 去掉 .js 后缀（保持与原始 import 风格一致）
        if rel.endswith(".js"):
            rel = rel[:-3]
    return rel


def patch_file(old_abs: str, new_abs: str) -> bool:
    """
    读取 new_abs 处的内容（文件已移动），
    用 old_abs 的目录上下文解析旧 import 路径，
    重新计算并写入新路径。
    返回是否有改动。
    """
    try:
        with open(new_abs, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"  [error reading] {new_abs}: {e}")
        return False

    changed = False

    def replacer(m: re.Match) -> str:
        nonlocal changed
        prefix, quote, spec = m.group(1), m.group(2), m.group(3)
        imported_old = resolve_abs(old_abs, spec)
        if imported_old in ABS_MOVE:
            imported_new = ABS_MOVE[imported_old]
            keep_ext = spec.endswith(".js")
            new_spec = make_rel(new_abs, imported_new, keep_ext)
            if new_spec != spec:
                changed = True
                return f"{prefix}{quote}{new_spec}{quote}"
        return m.group(0)

    new_content = IMPORT_RE.sub(replacer, content)
    if changed:
        with open(new_abs, "w", encoding="utf-8") as f:
            f.write(new_content)
        from_root = os.path.relpath(new_abs, ROOT)
        print(f"  [patched] {from_root}")
    return changed


def all_js_files() -> list[str]:
    """遍历项目，返回所有 JS 文件的绝对路径（排除 node_modules/.git）。"""
    skip = {"node_modules", ".git", "SPEC", "scripts", "docs"}
    result = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in skip]
        for fn in filenames:
            if fn.endswith(".js"):
                result.append(os.path.join(dirpath, fn))
    return result


# ─────────────────────────────────────────────────────────────────
#  主流程
# ─────────────────────────────────────────────────────────────────
def step1_create_dirs():
    print("\n[Step 1] 创建目录骨架")
    for d in NEW_DIRS:
        os.makedirs(os.path.join(ROOT, d), exist_ok=True)
    print("  完成")


def step2_move_files():
    print("\n[Step 2] 移动文件")
    for old_rel, new_rel in MOVE_MAP.items():
        old_abs = os.path.normpath(os.path.join(ROOT, old_rel))
        new_abs = os.path.normpath(os.path.join(ROOT, new_rel))
        if not os.path.exists(old_abs):
            print(f"  [skip] {old_rel} (不存在)")
            continue
        os.makedirs(os.path.dirname(new_abs), exist_ok=True)
        shutil.move(old_abs, new_abs)
        print(f"  {old_rel} → {new_rel}")
    print("  完成")


def step3_update_imports():
    print("\n[Step 3] 更新 import 路径")
    js_files = all_js_files()
    total = 0
    for f in js_files:
        # 这个文件在移动前的位置（如果被移动了）
        old_f = {v: k for k, v in ABS_MOVE.items()}.get(f, f)
        if patch_file(old_f, f):
            total += 1
    print(f"  共修改 {total} 个文件")


def step4_cleanup():
    print("\n[Step 4] 清理旧目录")

    # core/src/ 应已为空
    core_src = os.path.join(ROOT, "core", "src")
    if os.path.isdir(core_src):
        remaining = list(os.listdir(core_src))
        if not remaining:
            os.rmdir(core_src)
            print("  已删除空目录 core/src/")
        else:
            print(f"  [warn] core/src/ 还有文件 {remaining}，跳过")

    # core/svg/ 若已为空则删除
    core_svg = os.path.join(ROOT, "core", "svg")
    if os.path.isdir(core_svg):
        remaining = list(os.listdir(core_svg))
        if not remaining:
            os.rmdir(core_svg)
            print("  已删除空目录 core/svg/")
        else:
            print(f"  [warn] core/svg/ 还有文件 {remaining}，跳过")

    # core/tests/ 归档
    core_tests = os.path.join(ROOT, "core", "tests")
    if os.path.isdir(core_tests):
        legacy_dir = os.path.join(ROOT, "docs", "legacy-tests")
        os.makedirs(legacy_dir, exist_ok=True)
        shutil.move(core_tests, os.path.join(legacy_dir, "tests"))
        print("  core/tests/ 已归档到 docs/legacy-tests/")

    print("  完成")


if __name__ == "__main__":
    print("=" * 50)
    print("  目录结构重构脚本")
    print("=" * 50)
    step1_create_dirs()
    step2_move_files()
    step3_update_imports()
    step4_cleanup()
    print("\n" + "=" * 50)
    print("  重构完成！")
    print("=" * 50)
