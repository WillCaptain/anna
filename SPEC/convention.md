# Anna 开发约定（Convention）

> 所有新插件/形状/图表在开发前必须阅读此文件。它是优先级最高的规范，高于一切"感觉应该这样"的直觉。

---

## 1. 主题适配（Theme Adaptation）★★★ 最重要

### 1.1 主题系统运作原理

Anna 有 5 套画布主题（light / dark / warm / colorful / skeuomorphic）。  
切换主题时 `applyColorsToAllShapes()` 会将所有形状的 `backColor` / `borderColor` / `fontColor` 统一改写，然后调用 `s.invalidate()` 触发重绘。

**结论：形状 drawStatic 每次执行时，颜色已经是当前主题对应的值。**

```
用户切换主题
  → applyColorsToAllShapes()
    → shape.backColor   = theme.shapeBackColor   （所有普通形状）
    → shape.borderColor = theme.shapeBorderColor
    → shape.fontColor   = theme.shapeFontColor
    → shape.invalidate()
      → drawStatic(context, px, py)  ← 重新执行
        → shape.getBackColor()      ← 拿到新主题颜色 ✅
        → shape.getBorderColor()    ← 拿到新主题颜色 ✅
```

---

### 1.2 形状颜色使用规则（必须遵守）

| 用途 | 正确写法 | ❌ 错误写法 |
|---|---|---|
| 卡片/形状背景 | `shape.getBackColor()` | `'#ffffff'` |
| 线条/边框/坐标轴 | `shape.getBorderColor()` | `'#cccccc'` |
| 半透明衍生色 | `hexAlpha(stroke, alpha)` | `'rgba(0,0,0,0.1)'` |
| 白色分隔线（在填充上） | `hexAlpha(fill, 0.50)` | `'rgba(255,255,255,0.5)'` |
| 数据系列色（图表） | `PALETTE[i]` | 自行写死 hex |
| 语义色（图标彩色模式） | `resolveIconColors(type, fill, stroke)` | 直接写 hex |

```javascript
// ✅ 正确：所有颜色从 shape 获取，自动随主题变化
self.drawStatic = (context, px, py) => {
    const fill   = shape.getBackColor();
    const stroke = shape.getBorderColor();

    // 背景卡片
    context.fillStyle   = fill;
    context.strokeStyle = stroke;

    // 标签文字：用 hexAlpha 在 stroke 基础上调整透明度
    context.fillStyle = hexAlpha(stroke, 0.60);

    // 网格线：更淡
    context.strokeStyle = hexAlpha(stroke, 0.12);

    // 分隔线（叠在已填充区域上）
    context.strokeStyle = hexAlpha(fill, 0.50);
};
```

---

### 1.3 图标 vs 图表的颜色策略差异

| 类型 | 数据颜色来源 | 原因 |
|---|---|---|
| **图标**（security / symbols / vehicles 等） | `resolveIconColors(type, fill, stroke)` | 图标有语义颜色（盾牌=蓝，警报=红），彩色/拟物主题需要覆盖 |
| **图表**（barChart / pieChart 等） | 固定 `PALETTE`（不经 resolveIconColors） | 图表系列色是数据分类标识，不应随主题语义变色 |
| **几何形状**（rectangle / hexagon 等） | 纯 `shape.getBackColor()` / `getBorderColor()` | 无语义，完全跟随主题 |

---

### 1.4 `drawCard` 约定（charts 专用）

所有图表必须用 `drawCard()` 绘制背景卡片，不要自行写 roundRect：

```javascript
import {drawCard, hexAlpha} from './_chartBase.js';

// 正确：统一用 drawCard
drawCard(context, px, py, W, H, fill, stroke, bw);
// 可选圆角（默认 6px）
drawCard(context, px, py, W, H, fill, stroke, bw, 8);
```

---

## 2. 图表绘制规范（Chart Drawing）

### 2.1 坐标系与内边距

```
drawStatic(context, px, py)
  px ≈ 1（shape.margin），py ≈ 1
  有效宽度 W = shape.width  - 2
  有效高度 H = shape.height - 2

图表内边距约定（PAD）：
  { top: 12, right: 10, bottom: 20, left: 14 }
  plotX = px + PAD.left
  plotY = py + PAD.top
  plotW = W  - PAD.left - PAD.right
  plotH = H  - PAD.top  - PAD.bottom
```

### 2.2 图表分层绘制顺序

```
1. drawCard（背景卡片）
2. 网格线（grid lines）           — hexAlpha(stroke, 0.10~0.14), lineWidth 0.5
3. 坐标轴（axes）                 — hexAlpha(stroke, 0.35~0.45), lineWidth 0.8
4. 数据主体（bars / lines / arcs）— PALETTE 颜色，lineWidth 1.8
5. 文字标签（labels）             — hexAlpha(stroke, 0.55~0.70), font 7~9px
6. 图例（legend）                 — hexAlpha(stroke, 0.70), font 7.5px
```

### 2.3 透明度参考值（hexAlpha alpha 参数）

| 用途 | alpha | 备注 |
|---|---|---|
| 网格线 | 0.10 ~ 0.14 | 最淡，仅作参考 |
| 坐标轴 | 0.35 ~ 0.45 | 清晰但不抢眼 |
| 次要文字（刻度/图例） | 0.55 | 可读但不主导 |
| 主要标签 | 0.70 ~ 0.80 | 清晰标注 |
| 交互提示/说明 | 0.45 | 辅助信息 |
| 面积填充 | 0.08 ~ 0.18 | 淡化背景 |
| 区域分隔 | 0.06 ~ 0.10 | 交替行背景等 |
| 表头背景 | 0.15 ~ 0.20 | 略深于正文区 |

### 2.4 文字渲染约定

```javascript
// ✅ 标准写法
context.save();
context.font         = '8px sans-serif';   // 7~9px，无 serif
context.textBaseline = 'middle';           // 垂直居中对齐
context.textAlign    = 'center';           // 或 'left' / 'right'
context.fillStyle    = hexAlpha(stroke, 0.60);
context.fillText(text, x, y);
context.restore();

// 字号指南
//   6.5px — 极小辅助信息（图例说明、来源标注）
//   7px   — 刻度、轴标签
//   7.5px — 图例
//   8~9px — 数据标注、表格单元格
//   bold 9px — 表头
```

---

## 3. 图标绘制规范（Icon Drawing）

### 3.1 所有图标必须使用 `makeIconDrawer` + `makeIcon`

```javascript
import {makeIconDrawer, makeIcon} from '../icons/_iconBase.js';

const myIconDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    // drawFn：直接绘制，无需 context.save/restore（_iconBase 已包裹）
    // fill   = resolveIconColors() 处理后的最终 fill
    // stroke = resolveIconColors() 处理后的最终 stroke
});

export const myIcon = makeIcon('myIcon', 90, 90, myIconDrawer);
```

### 3.2 图标新增时必须在 `iconTheme.js` 的 COLORFUL 中注册语义色

```javascript
// iconTheme.js → COLORFUL 对象内追加：
myIcon: { fill: '#3b82f6', stroke: '#1d4ed8' },
```

彩色模式下不注册 = 图标会降级为 flat 模式（用 shape 颜色），不会报错，但体验不一致。

---

## 4. 插件形状规范（Plugin Shape）

### 4.1 文件位置约定

```
plugins/
  basic/      — 纯几何扩展形状（hexagon、cross 等）
  icons/      — 图标库（security、symbols、vehicles 等）
  data/       — 数据可视化（table、charts）
  mind/       — 思维导图专用节点
```

新增分类请按语义创建子目录，不要把所有东西堆进 `basic/`。

### 4.2 shape.type 命名规则

- 全局唯一，采用 **camelCase**，不加前缀/后缀
- 形状类：`hexagon`, `octagon`, `database`
- 图标类：`key`, `padlock`, `car`, `butterfly`
- 图表类：`barChart`, `lineChart`, `pieChart`
- 表格类：`table`

### 4.3 注册流程（每次新增形状都要做）

```
1. plugins/<category>/<name>.js  → 创建文件，export 工厂函数
2. src/whiteboard.js
   ├── import * as nameMod from '@anna/plugins/<category>/<name>.js';
   ├── SHAPE_MODULES 数组 → 追加 nameMod
   ├── TOOL_TYPE_MAP → 追加 name: 'type'
   └── getDefaultProperties() → 追加尺寸默认值
3. index.html → 在对应 shape-category 内添加 <button class="shape-item">
4. src/i18n.js
   ├── LOCALE_ZH → 's.name' / 'tool.name'
   └── LOCALE_EN → 's.name' / 'tool.name'
```

### 4.4 getDefaultProperties 默认尺寸

- 正方形图标：`width: 90, height: 90`
- 纵向图标（手机/树）：`width: 60~80, height: 100~130`
- 横向图标（显示器）：`width: 110~130, height: 80~100`
- 图表（宽）：`width: 200~220, height: 140~160`
- 图表（圆形）：`width: 160~200, height: 150~180`
- 漏斗/雷达（高）：`width: 160~180, height: 180~200`

---

## 5. Drawer 体系选择

| 场景 | 使用的 Drawer/工厂 | 导入来源 |
|---|---|---|
| 图标（svg 路径/几何图案） | `makeIconDrawer` | `plugins/icons/_iconBase.js` |
| 图表（柱/线/饼/散点…） | `makeChartDrawer` | `plugins/data/_chartBase.js` |
| 多边形几何（顶点描述） | `canvasGeometryDrawer` | `@anna/core/drawers/canvasGeometryDrawer.js` |
| 含文字/HTML 特性的矩形 | `rectangleDrawer` | `@anna/core/drawers/rectangleDrawer.js` |
| 容器形状 | `canvasContainerDrawer` | `@anna/core/drawers/canvasContainerDrawer.js` |

两个关键抑制（使用 canvasGeometryDrawer 时必须加）：

```javascript
self.drawBorder      = () => {};  // 抑制，否则边框重复渲染
self.backgroundRefresh = () => {}; // 抑制，否则出现异常底色
```

---

## 6. i18n 键名约定

| 前缀 | 用途 | 示例 |
|---|---|---|
| `s.` | 侧边栏按钮标签（简短） | `s.barChart` → `柱状图` |
| `tool.` | 状态栏"工具: ×××"文本 | `tool.barChart` → `柱状图` |
| `grp.` | 形状分组标题 | `grp.data.bar` → `柱线图` |
| `tab.` | 左侧面板页签 | `tab.data` → `数据` |
| `grp.icon.` | 图标库分组 | `grp.icon.security` |
| `grp.data.` | 数据面板分组 | `grp.data.bar` |

规则：
- `LOCALE_ZH` 和 `LOCALE_EN` 必须**同步添加**，不允许只加一个
- `s.×` 标签控制在 4 个中文字以内（网格格子宽度有限）
- `tool.×` 可以写完整名称

---

## 7. HTML 面板结构约定

```html
<!-- 正确的侧边栏按钮 -->
<button class="shape-item" data-tool="barChart" title="柱状图">
  <svg viewBox="0 0 24 24" fill="none">
    <!-- 24×24 viewBox，stroke/fill 用 currentColor -->
    <!-- stroke-width 建议 1.5 / 1.8，保持视觉一致 -->
  </svg>
  <span data-i18n="s.barChart">柱状图</span>
</button>

<!-- SVG 图标设计原则 -->
<!-- ✅ 使用 currentColor 让图标颜色跟随 CSS 变量 --text 变化 -->
<!-- ✅ viewBox="0 0 24 24"，内容留 2px 内边距 -->
<!-- ✅ 笔画用 stroke，填充用 fill-opacity 表现层次 -->
<!-- ❌ 不要硬编码颜色如 fill="#7c6ff7" -->
```

---

## 8. 数据图表（Data Plugin）专用约定

### 8.1 调色板（PALETTE）

`plugins/data/_chartBase.js` 导出的 8 色 `PALETTE` 是**唯一认可的图表系列颜色来源**。

```javascript
import {PALETTE} from './_chartBase.js';
context.fillStyle = PALETTE[i % PALETTE.length];
```

不允许在各图表文件里各自定义颜色数组，保证视觉一致性。

### 8.2 语义固定色（例外）

仪表盘的危险/警告/良好区域使用语义色，此情形不使用 PALETTE：

```javascript
const ZONES = [
    { color: '#ef5350' }, // 危险 — 全局固定，不跟随主题
    { color: '#ffb74d' }, // 警告
    { color: '#81c784' }, // 良好
];
```

### 8.3 面积图渐变

渐变必须用 `hexAlpha` 而不是写死 rgba：

```javascript
const grad = context.createLinearGradient(0, plotY, 0, baseY);
grad.addColorStop(0,   hexAlpha(color, 0.50));
grad.addColorStop(0.7, hexAlpha(color, 0.08));
grad.addColorStop(1,   hexAlpha(color, 0.00));
```

---

## 9. 尺寸防御（Size Guard）

`drawStatic` 内第一件事：防止尺寸为零或负数导致 canvas API 报错：

```javascript
self.drawStatic = (context, px, py) => {
    const W = shape.width  - 2;
    const H = shape.height - 2;
    if (W <= 0 || H <= 0) return; // ← 必须有这行
    // ...
};
```

---

## 10. 版权头

所有 `plugins/` 下的 JS 文件第一行必须包含版权注释：

```javascript
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  <一句话描述这个文件的职责>
 *--------------------------------------------------------------------------------------------*/
```
