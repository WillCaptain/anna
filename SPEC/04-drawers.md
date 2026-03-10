# 绘制器体系（Drawers）

## 设计原则

Elsa 将**形状数据**与**渲染实现**分离：Shape 对象只持有数据与逻辑，Drawer 负责将 Shape 数据渲染到 DOM 中。同一个 Shape 可以使用不同的 Drawer（Canvas / SVG / HTML），满足不同性能与效果需求。

---

## Drawer 层级

```
htmlDrawer（基类）
  ├── rectangleDrawer      — HTML DOM 矩形
  │     └── canvasRectangleDrawer
  ├── canvasDrawer         — Canvas 2D 几何图形
  │     └── canvasGeometryDrawer
  ├── svgDrawer            — SVG 元素（通用）
  │     └── svgLineDrawer  — 线条 SVG 专用
  ├── containerDrawer      — 容器（HTML）
  ├── groupDrawer          — 编组
  ├── htmlDrawer（直接用）  — 纯 HTML 内容（富文本等）
  └── pageDrawer           — 页面背景（特殊，不挂在 htmlDrawer 体系下）

交互层（独立，附加到 Page）：
  ├── interactDrawer       — 选中框、Connector、光标
  ├── animationDrawer      — 演示动画效果层
  └── cursorDrawer         — 自定义光标图形
```

---

## DOM 分层结构

Page 对应的 DOM 结构如下：

```html
<div id="host-div">                          <!-- 宿主传入的 div -->
  <div id="background:{pageId}">             <!-- pageDrawer.background，z-index=0，页面背景色/图 -->
  </div>
  <div id="pageContainer:{pageId}">          <!-- pageDrawer.container，所有形状 DOM 的挂载点 -->
    <!-- transform: scale(scaleX,scaleY) translate(x,y) -->
    <div id="shape-dom-1">...</div>
    <div id="shape-dom-2">...</div>
    ...
  </div>
  <!-- interactDrawer 的 canvas（覆盖在最上层，接收鼠标事件） -->
  <!-- animationDrawer 的层（演示模式下激活） -->
</div>
```

缩放和平移通过 `pageContainer` 的 CSS `transform` 实现，不影响 DOM 坐标计算。

---

## 各 Drawer 说明

### htmlDrawer（基类）
**文件**：`core/drawers/htmlDrawer.js`

所有 Drawer 的基类，提供：
- `self.parent`：形状的 DOM 根容器 div
- `self.text`：文字 DOM 节点
- `createElement(tagName, id)`：创建并缓存 DOM 元素（走 `DomCache`）
- `resize()`：响应 shape.width / shape.height 变化更新 DOM 尺寸
- `move()`：响应 shape.x / shape.y 变化更新 DOM 位置
- `draw()`：完整重绘（调用 `resize + move + drawBorder + drawText + drawBack`）
- `containsBack(x, y)`：点击检测（鼠标是否在形状区域内）
- `invalidate()`：标记需要重绘，下一帧执行

### canvasDrawer
**文件**：`core/drawers/canvasDrawer.js`

在 `htmlDrawer.parent` 内创建一个 `<canvas>` 元素进行 2D 绘制：
- 支持像素级点击检测（`getImageData` 读取透明度）
- `pixelRate`：设备像素比适配（高清屏）
- `resizeCanvas(size)`：同步调整 canvas 的 width/height 属性
- 需子类实现 `drawShape(context)` 完成实际图形绘制

### svgDrawer / svgLineDrawer
**文件**：`core/drawers/svgDrawer.js`、`core/drawers/lineDrawer.js`

- 在 parent div 内创建 `<svg>` 元素
- `svgLineDrawer` 专门用于 Line 形状，处理箭头、折线、曲线的 SVG path 计算

### rectangleDrawer
**文件**：`core/drawers/rectangleDrawer.js`

用 HTML div 实现矩形（border、border-radius、background-color），性能最优，适合文字节点。

### containerDrawer
**文件**：`core/drawers/containerDrawer.js`

用于 Container 形状，管理子形状 DOM 的挂载与卸载，处理 dock 布局时子形状的重排。

### pageDrawer
**文件**：`core/drawers/pageDrawer.js`

专用于 Page：
- 创建 `background` div（页面背景色、背景图）
- 创建 `container` div（所有形状 DOM 的根，应用 scale/translate transform）
- `transform()`：统一更新缩放和平移
- `drawBackground()`：绘制背景色/图/网格
- `drawRegions()`：绘制 HitRegion（如在线人数、评论气泡等全局 Region）

### interactDrawer
**文件**：`core/drawers/interactDrawer.js`

覆盖在最上层的交互 Canvas 层（pointer-events 独占）：
- 绘制选中框（虚线边框）
- 绘制 Connector 小方块（resize/link 点）
- 绘制编组边框
- 绘制光标（自定义画笔、橡皮擦等）
- 处理鼠标坐标换算（考虑缩放、设备像素比）

### animationDrawer
**文件**：`core/drawers/animationDrawer.js`

演示模式下激活，负责：
- 形状进入/退出动画（淡入、飞入、缩放等）
- 逐步播放动画队列（`animationIndex` 控制当前播放位置）

---

## 渲染触发链路

```
shape.属性变化（x/y/width/backColor 等）
  → Proxy set 拦截
  → shape.invalidate() / shape.invalidateAlone()
  → drawer.draw() / drawer.invalidate()
  → requestAnimationFrame
  → 实际 DOM 更新
```

批量更新时使用 `page.batchInvalidate()` 合并多次重绘请求，减少 DOM 操作次数。
