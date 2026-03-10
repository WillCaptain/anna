# 形状体系

## 形状类型注册

所有形状以**工厂函数**的形式注册到 `graph.plugins` 字典中：

```js
// 工厂函数签名
(id, x, y, width, height, parent) => Shape

// 注册 key
// 内置形状：直接使用 type 名，如 'rectangle'
// 插件形状：使用 'namespace.type'，如 'my.app.myShape'
```

`graph.createShape(owner, id, type, x, y, w, h, parent)` 是统一的创建入口，内部查找 `plugins[type]`，若找不到则回退到 `rectangle`。

---

## 内置形状列表

### 基础几何

| 类型 | 源文件 | 继承链 | 说明 |
|------|--------|--------|------|
| `rectangle` | `core/shapes/rectangle.js` | shape → rectangle | 矩形，最常用基础形状 |
| `ellipse` | `core/shapes/ellipse.js` | shape → rectangle → ellipse | 椭圆 |
| `triangle` | `core/shapes/geometry/triangle.js` | shape → rectangle → triangle | 三角形 |
| `diamond` | `core/shapes/geometry/diamond.js` | shape → rectangle → diamond | 菱形 |
| `parallelogram` | `core/shapes/geometry/parallelogram.js` | shape → rectangle → parallelogram | 平行四边形 |
| `regularPentagonal` | `core/shapes/geometry/regularPentagonal.js` | — | 正五边形 |
| `pentagram` | `core/shapes/geometry/pentagram.js` | — | 五角星 |

### 箭头类

| 类型 | 源文件 | 说明 |
|------|--------|------|
| `rightArrow` | `core/shapes/arrows/rightArrow.js` | 向右箭头 |
| `bottomArrow` | `core/shapes/arrows/bottomArrow.js` | 向下箭头 |
| `dovetailArrow` | `core/shapes/arrows/dovetailArrow.js` | 燕尾箭头 |
| `leftAndRightArrow` | `core/shapes/arrows/leftAndRightArrow.js` | 双向水平箭头 |

### 标注 / 装饰

| 类型 | 源文件 | 说明 |
|------|--------|------|
| `rightCurlyBrace` | `core/shapes/arrows/rightCurlyBrace.js` | 右花括号 |
| `roundedRectangleCallout` | `core/shapes/geometry/roundedRectangleCallout.js` | 圆角矩形气泡（对话框） |

### 容器与分组

| 类型 | 源文件 | 继承链 | 说明 |
|------|--------|--------|------|
| `container` | `core/base/container.js` | shape → rectangle → container | 通用容器，支持 dock 布局 |
| `group` | `core/shapes/group.js` | — | 临时编组（不影响层级） |
| `page` | `core/base/page.js` | shape → rectangle → container → page | 页面本身也是最顶层容器 |

### 连接线

| 类型 | 源文件 | 说明 |
|------|--------|------|
| `line` | `core/shapes/line.js` | 连接线，支持直线/曲线/折线/自动曲线 |
| `freeLine` | `core/shapes/freeLine.js` | 自由手绘线 |

### 媒体与图形

| 类型 | 源文件 | 说明 |
|------|--------|------|
| `image` | `core/shapes/image.js` | 图片（`src` 字段） |
| `video` | `core/shapes/media/video.js` | 视频（`src` 字段） |
| `audio` | `core/shapes/media/audio.js` | 音频（`src` 字段） |
| `svg` | `core/shapes/svg.js` | SVG 图形 |
| `vector` | `core/shapes/vector.js` | 矢量图形，支持 `drawDynamicCode` 自定义绘制 |
| `icon` | `core/shapes/icon.js` | 内置图标（`iconName` 字段） |
| `sticker` | `core/shapes/sticker.js` | 便签 |

### 高级形状

| 类型 | 源文件 | 说明 |
|------|--------|------|
| `table` | `core/shapes/table.js` | 表格（含 grid 数据） |
| `charts` | `core/shapes/charts.js` | 图表（`cells / grid / range` 字段） |
| `reference` | `core/shapes/reference.js` | 跨页引用（镜像另一页某形状，实时同步） |

### 流程编排（Flowable / AIPP）

| 类型 | 说明 |
|------|------|
| `node` | 流程节点（`triggerMode / runningTask / callback`） |
| `state` | 状态节点（`task / jober / taskFilter / retryNum`） |
| `event` | 事件节点（`conditionRule`） |
| `start` | 开始节点 |
| `aippState` | AIPP 状态节点（含 `isAgent / tags` 字段） |
| `aippStart` | AIPP 开始节点 |
| `aippEnd` | AIPP 结束节点 |

### 思维导图（MindMap）

| 类型 | 说明 |
|------|------|
| `mind` | 思维导图根（`mode` 字段：mindCenter/organization/mindLeft/mindRight） |
| `topic` | 思维导图节点（`status / direction / root / attaches / parent` 字段） |

### 演示（Presentation）

| 类型 | 说明 |
|------|------|
| `presentation` | 演示页（`isTemplate / basePage / animations / inMethod / outMethod`） |
| `presentationPage` | 同 presentation，作为独立 page 类型注册 |
| `frame` | 演示框架节点（`pros / cons / socialCode`） |

---

## 序列化字段体系

**源文件**：`core/base/shapeFields.js`

每种类型的序列化字段通过 `shapeFields.get(type)` 获取，规则：

1. 子类继承父类字段（通过 `typeChain` 驱动，`Atom` 自动合并）
2. `fields.delete = ['field1', 'field2']` → 从继承字段中移除
3. `fields.delete = []`（空数组）→ 清空所有继承字段（完全重定义）

### Shape 公共序列化字段（所有类型共享）

```
id, x, y, width, height
type, namespace, container, index
text, description, title, desc
backColor, backAlpha, borderColor, borderWidth, globalAlpha
fontSize, fontFace, fontColor, fontWeight, fontStyle
hAlign, vAlign, textAlign, lineHeight, letterSpacing, wordSpacing
cornerRadius, dashWidth, margin, pad, padLeft, padRight, padTop, padBottom
rotateDegree, autoHeight, autoWidth
shadow, focusShadow, shadowData, shadowColor
outstanding, emphasized
tag, tagPattern, properties, tags, local
visible, editable, readOnly, selectable, resizeable, moveable, dragable, deletable, rotateAble
allowLink, scrollLock
bold, italic, strikethrough, underline, numberedList, bulletedList
enableAnimation
loadCode, clickCode, editingCode, editedCode, numberPressedCode, keyPressedCode,
selectedCode, unSelectedCode, beforeRemoveCode, afterRemovedCode, resizedCode,
movedCode, focusedCode, unfocusedCode, containerChangedCode, textChangedCode,
draggingCode, mouseUpCode, mouseDownCode, mouseMoveCode, animateCode, dynamicCode
pDock, ignoreDock, ignorePageMode
referenceId, textInnerHtml, version, minHeight, entangleIdE
```

### 各类型额外字段

| 类型 | 额外字段 |
|------|---------|
| `rectangle` | `emphasized, priority, infoType, progressStatus, progressPercent, showedProgress, shineColor1/2, assignTo, shared, sharedBy` |
| `container` | `dockMode, dockAlign, itemPad, itemSpace, itemScroll, division` |
| `page` | `background, editable, timerCode, animationCode, bulletSpeed, shapesAs, displayPageNumber, displayDateTime, displayHeader, displayFooter`（同时移除 `readOnly, width, height, x, y`） |
| `line` | `fromShape, toShape, definedFromConnector, definedToConnector, lineMode, curvePoint1/2, beginArrow, endArrow, beginArrowSize, endArrowSize, lineWidth, borderColor, textX/Y, brokenPoints, arrowBeginPoint, arrowEndPoint` |
| `ellipse` | `lineWidth` |
| `freeLine` | `lines, closed`（移除 `x, y, width, height`） |
| `reference` | `autoFit, keepOrigin, readOnly, referenceShape, referencePage, referenceData` |
| `vector` | `originWidth, originHeight, drawDynamicCode` |
| `svg` | `lines, originWidth, originHeight, lineWidth` |
| `icon` | `iconName` |
| `video / image` | `src` |
| `chart` | `cells, grid, range` |
| `grid` | `cells, rows, columns, borders, changes, groups, frozens, hiddens, headBorderColor, headBackColor, headTextColor, headWidth/Height, cellWidth/Height, minWidth, minRow/Column, maxRow/Column, data, withColumnHead, withRowHead, wrap` |
| `mind` | `mode` |
| `topic` | `status, direction, root, attaches, parent` |

---

## 线条（Line）详解

**源文件**：`core/shapes/line.js`

Line 是 Elsa 中最复杂的形状，连接任意两个 Shape。

### 连接模式（LINEMODE）

| 模式 | 说明 |
|------|------|
| `STRAIGHT` | 直线 |
| `CURVE` | 贝塞尔曲线（可拖拽 `curvePoint1/2` 调节） |
| `BROKEN` | 折线（含 `brokenPoints`） |
| `AUTO_CURVE` | 引擎自动计算的平滑曲线 |

按 Tab 键可循环切换模式：`STRAIGHT → AUTO_CURVE → BROKEN → CURVE → STRAIGHT`。

### 连接逻辑

- `fromShape / toShape`：序列化时只存 Shape id
- `definedFromConnector / definedToConnector`：指定连接到哪个 Connector（如 `'N'`、`'S'`）
- 未指定 Connector 时，Line 自动连接两端形状中距离最近的 Connector

---

## 容器（Container）布局

**源文件**：`core/base/container.js`

Container 可以对子 Shape 进行自动布局：

### DOCK_MODE（容器控制子形状排列方式）

| 值 | 说明 |
|----|------|
| `VERTICAL` | 纵向排列，每个子形状横向撑满 |
| `HORIZONTAL` | 横向排列，每个子形状纵向撑满 |
| `FILL` | 单个子形状撑满整个容器 |
| `NONE` | 不自动布局（自由排列） |

### PARENT_DOCK_MODE（子形状相对父容器的停靠方式）

| 值 | 说明 |
|----|------|
| `LEFT / RIGHT / TOP / BOTTOM` | 停靠到对应边 |
| `FILL` | 撑满父容器 |
| `NONE` | 自由 |

---

## 插件扩展

### 注册自定义形状

```js
// 方式一：通过文件 URL 动态加载（运行时）
await ELSA.import('./my-shapes.js');
// my-shapes.js 中 export 工厂函数，key 即 type name

// 方式二：通过 graph 实例加载
graph.import('./my-shapes.js').then(callback);

// 方式三：静态打包时加载
graph.staticImport(() => import('./my-shapes.js'));
```

### 命名空间

插件文件可导出 `namespace` 字符串，此时形状以 `namespace.type` 作为完整 key：

```js
// my-shapes.js
export const namespace = 'my.app';
export const myBox = (id, x, y, w, h, parent) => { ... };

// 创建时使用
page.createNew('my.app.myBox', x, y);
```
