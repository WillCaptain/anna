#!/usr/bin/env python3
"""
修补脚本：专门处理"移动文件自身"的 import 路径问题。

第一轮脚本已更新了"被移动文件"被别人 import 的路径，
但对于移动文件本身内部所有的相对 import（包括指向未移动文件），
其路径也因为文件目录的改变而失效——此脚本修复这部分。
"""
import os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# 与 refactor_dirs.py 完全相同的移动映射
MOVE_MAP = {
    "core/atom.js":                  "core/base/atom.js",
    "core/shape.js":                 "core/base/shape.js",
    "core/page.js":                  "core/base/page.js",
    "core/graph.js":                 "core/base/graph.js",
    "core/container.js":             "core/base/container.js",
    "core/shapeFields.js":           "core/base/shapeFields.js",
    "core/connector.js":             "core/interaction/connector.js",
    "core/hitRegion.js":             "core/interaction/hitRegion.js",
    "core/history.js":               "core/history/history.js",
    "core/commands.js":              "core/history/commands.js",
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
    "core/bottomArrow.js":           "core/shapes/arrows/bottomArrow.js",
    "core/dovetailArrow.js":         "core/shapes/arrows/dovetailArrow.js",
    "core/leftAndRightArrow.js":     "core/shapes/arrows/leftAndRightArrow.js",
    "core/rightArrow.js":            "core/shapes/arrows/rightArrow.js",
    "core/rightCurlyBrace.js":       "core/shapes/arrows/rightCurlyBrace.js",
    "core/diamond.js":               "core/shapes/geometry/diamond.js",
    "core/triangle.js":              "core/shapes/geometry/triangle.js",
    "core/parallelogram.js":         "core/shapes/geometry/parallelogram.js",
    "core/pentagram.js":             "core/shapes/geometry/pentagram.js",
    "core/regularPentagonal.js":     "core/shapes/geometry/regularPentagonal.js",
    "core/roundedRectangleCallout.js": "core/shapes/geometry/roundedRectangleCallout.js",
    "core/audio.js":                 "core/shapes/media/audio.js",
    "core/video.js":                 "core/shapes/media/video.js",
    "common/collaboration.js":       "core/collaboration/collaboration.js",
    "common/guideLineUtil.js":       "core/utils/guideLineUtil.js",
    "core/elsaDataBuilder.js":       "core/utils/elsaDataBuilder.js",
    "core/svg/icons.js":             "core/shapes/svg_icons.js",
    "core/src/index.js":             "core/index.js",
}

# 绝对路径映射
ABS_MOVE = {
    os.path.normpath(os.path.join(ROOT, k)): os.path.normpath(os.path.join(ROOT, v))
    for k, v in MOVE_MAP.items()
}

# 反向映射：新绝对路径 → 旧绝对路径
ABS_MOVE_REVERSE = {v: k for k, v in ABS_MOVE.items()}

IMPORT_RE = re.compile(
    r"""((?:import|export)\b[^'"]*?from\s+|import\s+)(['"])(\.\.?/[^'"]+)\2""",
    re.MULTILINE,
)


def resolve_abs(importer_abs: str, spec: str) -> str:
    """从 importer_abs 的目录出发解析 spec 为绝对路径，存在则返回。"""
    base = os.path.dirname(importer_abs)
    p = os.path.normpath(os.path.join(base, spec))
    if os.path.exists(p):
        return p
    if os.path.exists(p + ".js"):
        return p + ".js"
    if os.path.exists(os.path.join(p, "index.js")):
        return os.path.join(p, "index.js")
    return p  # 可能不存在，返回规范化路径供后续判断


def make_rel(from_file: str, to_file: str, keep_ext: bool) -> str:
    rel = os.path.relpath(to_file, os.path.dirname(from_file)).replace(os.sep, "/")
    if not rel.startswith("."):
        rel = "./" + rel
    if not keep_ext and rel.endswith(".js"):
        rel = rel[:-3]
    return rel


def patch_moved_file(new_abs: str):
    """
    对于一个移动了的文件（new_abs），重新计算它所有相对 import。
    - 用旧路径上下文解析 import spec → 被 import 的目标文件绝对路径
    - 目标文件可能也移动了（查 ABS_MOVE），也可能没移动（原地）
    - 用新路径上下文生成正确相对路径
    """
    old_abs = ABS_MOVE_REVERSE[new_abs]

    with open(new_abs, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False

    def replacer(m: re.Match) -> str:
        nonlocal changed
        prefix, quote, spec = m.group(1), m.group(2), m.group(3)

        # 用旧路径上下文解析
        target_old = resolve_abs(old_abs, spec)
        # 目标文件移到了哪里？
        target_new = ABS_MOVE.get(target_old, target_old)

        keep_ext = spec.endswith(".js")
        new_spec = make_rel(new_abs, target_new, keep_ext)

        if new_spec != spec:
            changed = True
            return f"{prefix}{quote}{new_spec}{quote}"
        return m.group(0)

    new_content = IMPORT_RE.sub(replacer, content)
    if changed:
        with open(new_abs, "w", encoding="utf-8") as f:
            f.write(new_content)
        rel = os.path.relpath(new_abs, ROOT)
        print(f"  [fixed] {rel}")
    return changed


def main():
    print("=== 修复移动文件内部 import 路径 ===\n")
    total = 0
    for new_abs in ABS_MOVE_REVERSE:
        if not os.path.exists(new_abs):
            print(f"  [missing] {os.path.relpath(new_abs, ROOT)}")
            continue
        if patch_moved_file(new_abs):
            total += 1
    print(f"\n共修复 {total} 个文件")
    print("=== 完成 ===")


if __name__ == "__main__":
    main()
