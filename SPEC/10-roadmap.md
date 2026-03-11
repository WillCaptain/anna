# Anna 引擎 — 功能路线图

> 版权所有 © 2026 12th.ai Studio

本文件记录已确定的未来开发方向。每个条目包含背景、目标、优先级拆解和架构影响。

---

## Item 1 — Canvas 原生文本引擎 + Document 形状

### 背景

当前文字系统依赖 CKEditor（通过 `defaultGraph` / `annaCKEditor` 适配层）：

- 基础白板（`whiteboard.js`）使用 `graph`（基类），`createEditor` 返回 `undefined`，
  文字通过 `htmlDrawer.renderTextByEditor` 的 `innerHTML` fallback 写入 DOM。
- 富文本路径（`defaultGraph` + `annaCKEditor`）在本仓库中仅有桩实现，无法真正编辑。
- 一般形状的文字编辑（双击进入编辑）完全依赖外部编辑器，目前不可用。

**目标：**

1. 新增 `document` 插件形状 — 完全基于 Canvas 2D 渲染，对标 Google Docs 的能力集。
2. 去除 CKEditor 依赖，改用引擎自研的 Canvas 文本引擎。
3. 为所有 `rectangle` 系形状实现 PPT 风格的内联文字编辑（双击即可编辑、光标、选区）。

---

### 功能优先级（参照 Google Docs 能力集）

#### P0 — Canvas 文本渲染核心（地基，其余均依赖此层）

| 子功能 | 说明 |
|--------|------|
| 文本布局引擎 | 字符度量、自动换行、行高计算、多段落排版 |
| 光标渲染 | 插入点（caret）计算与闪烁动画 |
| 选区渲染 | 按字符粒度高亮选中范围 |
| 基础键盘输入 | 字符插入、Backspace / Delete、方向键移动光标 |
| 鼠标点击定位 | 像素坐标 → 字符索引映射（hit-test） |
| Undo / Redo 接入 | 文字操作产生 Command，纳入现有历史管理 |

#### P1 — 内联文字格式

| 子功能 | 说明 |
|--------|------|
| Bold / Italic / Underline / Strikethrough | 字符级属性，Run 模型 |
| 字号 / 字体族 | 同一行可混排不同字号（影响行高计算） |
| 文字颜色 / 背景高亮色 | 字符级 |

#### P2 — 段落样式

| 子功能 | 说明 |
|--------|------|
| 标题 H1–H4、正文 | 段落级预设样式（字号 + 行距 + 间距） |
| 无序列表 / 有序列表 | 缩进 + 项目符号/序号渲染 |
| 段落对齐 | left / center / right / justify |
| 行间距 / 段前段后间距 | 段落级属性 |
| 首行缩进 / 悬挂缩进 | |

#### P3 — Document 形状专属

| 子功能 | 说明 |
|--------|------|
| 分页 | 按页面高度自动断页，多页连续滚动 |
| 页边距设置 | top / right / bottom / left |
| 页眉 / 页脚 | 独立文本域，支持页码占位符 |
| 目录生成 | 扫描 H1–H3 自动生成并维护锚点 |

#### P4 — 高级功能（长期）

| 子功能 | 说明 |
|--------|------|
| 表格 | 行列管理、单元格合并、表格内文字 |
| 图片内嵌 | 图文混排（inline / wrap 两种模式） |
| 批注 / 评论 | 选区附加评论，侧边栏展示 |
| 查找 / 替换 | 高亮匹配、逐条替换、全部替换 |
| 导出 PDF / HTML | Canvas 截图或序列化 |

---

### PPT 风格的形状内文字编辑（所有 rectangle 系形状）

优先级与 Document P0/P1 并行，复用同一套 Canvas 文本引擎。

| 功能 | 说明 |
|------|------|
| 双击进入编辑模式 | 在 shape 的 canvas 层绘制光标与选区覆盖层 |
| 单行 / 多行自适应 | `autoHeight = true` 时随内容伸缩 |
| 基础格式快捷键 | Ctrl+B/I/U，选中范围应用格式 |
| 点击外部退出编辑 | `blur` 时提交文字变更，进入 Undo 历史 |
| 占位符 | 未输入时显示灰色 placeholder 文字 |

---

### 架构影响

```
core/
└── text/                          ← 新增目录
    ├── textEngine.js              # 布局引擎：段落/行/Run 树，度量，换行
    ├── textCursor.js              # 光标 & 选区模型（字符索引）
    ├── textRenderer.js            # Canvas 2D 渲染（文字、光标、选区、装饰线）
    ├── textInputHandler.js        # 键鼠事件 → 编辑操作（insert/delete/select）
    └── textCommands.js            # 文字编辑操作封装为 Command（接入 history）

plugins/
└── document/
    ├── documentShape.js           # Document 形状（继承 container，canvas drawer）
    ├── documentDrawer.js          # Canvas 绘制器：分页、页边距、滚动
    └── documentToolbar.js         # 浮动格式工具栏（段落样式、格式按钮）
```

**需要移除 / 简化的：**

| 文件 | 现状 | 目标 |
|------|------|------|
| `core/editor/default/annaCKEditor.js` | 桩实现（本轮已补全 innerHTML 降级） | P0 完成后替换为 `textEngine` 适配层，最终删除 |
| `core/editor/default/anna-editor.js` | AnnaEditor 桩 | P0 完成后删除 |
| `core/base/defaultGraph.js` `createEditor` | 依赖外部 editor 对象 | 改为调用 `textEngine` 创建编辑器实例 |
| `htmlDrawer.renderTextByEditor` innerHTML fallback | 当前过渡方案 | P0 后由 `textRenderer` 接管，fallback 可移除 |

---

### 里程碑草案

| 阶段 | 交付物 | 依赖 |
|------|--------|------|
| M1 | P0 Canvas 文本引擎（布局 + 光标 + 选区 + 键盘） | — |
| M2 | PPT 风格形状内文字编辑（接入 M1 引擎） | M1 |
| M3 | P1 内联格式（Bold/Italic/Color 等） | M1 |
| M4 | Document 形状 P0+P1（可用的文档编辑器） | M1, M3 |
| M5 | Document P2 段落样式 + 列表 | M4 |
| M6 | 移除 CKEditor 依赖，删除桩文件 | M2, M4 |
| M7 | Document P3（分页 / 页眉页脚 / 目录） | M5 |
| M8 | Document P4（表格 / 图片 / 批注 / 导出） | M7 |
