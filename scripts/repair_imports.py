#!/usr/bin/env python3
"""
终极 import 路径修复脚本：
对每一个无法解析的相对 import，通过文件名在项目中查找真实位置，
然后重新计算正确的相对路径。
"""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {"node_modules", ".git", "SPEC", "scripts", "docs"}

IMPORT_RE = re.compile(
    r"""((?:import|export)\b[^'"]*?from\s+|import\s+)(['"])(\.\.?/[^'"]+)\2""",
    re.MULTILINE,
)


def resolve(importer: str, spec: str) -> str | None:
    """尝试从 importer 的目录解析 spec，返回真实绝对路径，失败返回 None。"""
    base = os.path.dirname(importer)
    p = os.path.normpath(os.path.join(base, spec))
    if os.path.isfile(p):
        return p
    if os.path.isfile(p + ".js"):
        return p + ".js"
    if os.path.isfile(os.path.join(p, "index.js")):
        return os.path.join(p, "index.js")
    return None


# 构建项目内所有 JS 文件的 {filename → [abs_path]} 索引
def build_index() -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".js"):
                abs_p = os.path.join(dirpath, fn)
                idx.setdefault(fn, []).append(abs_p)
    return idx


FILE_INDEX = build_index()


def find_target(importer: str, broken_spec: str) -> str | None:
    """
    对一个无法解析的 spec，通过文件名在全局索引里查找最合理的候选。
    策略：取 spec 最后一个 path segment 作为文件名（自动补 .js），
    在索引中找到后，选最近的（os.path.commonpath 最长）候选。
    """
    # 取文件名部分
    base_name = os.path.basename(broken_spec)
    if not base_name.endswith(".js"):
        base_name += ".js"

    candidates = FILE_INDEX.get(base_name, [])
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    # 多个候选 → 选与 importer 路径公共前缀最长的
    importer_dir = os.path.dirname(importer)
    best = max(candidates, key=lambda c: len(os.path.commonpath([importer_dir, c])))
    return best


def make_rel(from_file: str, to_file: str, keep_ext: bool) -> str:
    rel = os.path.relpath(to_file, os.path.dirname(from_file)).replace(os.sep, "/")
    if not rel.startswith("."):
        rel = "./" + rel
    if not keep_ext and rel.endswith(".js"):
        rel = rel[:-3]
    return rel


def repair_file(filepath: str) -> int:
    """修复 filepath 里所有无法解析的相对 import。返回修复数量。"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    fixes = 0

    def replacer(m: re.Match) -> str:
        nonlocal fixes
        prefix, quote, spec = m.group(1), m.group(2), m.group(3)

        # 可以正常解析 → 不动
        if resolve(filepath, spec) is not None:
            return m.group(0)

        # 无法解析 → 尝试查找
        target = find_target(filepath, spec)
        if target is None:
            return m.group(0)  # 找不到，保持原样（跨项目依赖）

        keep_ext = spec.endswith(".js")
        new_spec = make_rel(filepath, target, keep_ext)

        # 新路径能解析才接受
        if resolve(filepath, new_spec) is not None and new_spec != spec:
            fixes += 1
            return f"{prefix}{quote}{new_spec}{quote}"
        return m.group(0)

    new_content = IMPORT_RE.sub(replacer, content)
    if fixes > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [repaired {fixes}] {os.path.relpath(filepath, ROOT)}")
    return fixes


def all_js_files():
    result = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith(".js"):
                result.append(os.path.join(dirpath, fn))
    return result


if __name__ == "__main__":
    print("=== 修复无效 import 路径 ===\n")
    total_files = 0
    for f in all_js_files():
        if repair_file(f) > 0:
            total_files += 1
    print(f"\n共修复 {total_files} 个文件")
    print("=== 完成 ===")
