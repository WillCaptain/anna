# 对象模型

## 层级关系

```
ELSA（单例）
  └── Graph                        # 一份完整的白板文档
        ├── pages[]                # 所有页面的序列化 JSON 数组（轻量，常驻内存）
        ├── activePage             # 当前激活的 Page 运行时对象（唯一）
        ├── plugins{}              # 形状工厂字典：type → factory(id,x,y,w,h,parent)
        ├── shapeCache             # ShapeCache：运行时 Shape 对象复用池
        ├── domCache               # DomCache：DOM 元素复用池
        ├── collaboration          # 协同服务客户端
        └── Page                   # 一页画布（继承自 Container）
              ├── shapeManager     # 该页所有 Shape 的查询与扁平化管理
              ├── div              # DOM 根节点（宿主传入）
              ├── pageDrawer       # 背景绘制器
              ├── interactDrawer   # 交互层绘制器（选中框、连接点）
              ├── animationDrawer  # 动画层绘制器
              └── Shape[]          # 形状对象树（可嵌套，Container 内可有子 Shape）
```

---

## Graph

**源文件**：`core/base/graph.js`

Graph 是整个画布文档的根管理对象，不直接渲染，只持有数据与运行时对象。

### 关键属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 文档唯一标识 |
| `title` | string | 文档标题 |
| `type` | string | 固定为 `'graph'`，子类可覆盖 |
| `tenant` | string | 租户标识，默认 `'default'` |
| `source` | string | 来源标识，默认 `'elsa'` |
| `session` | object | 当前登录用户信息 `{name, id, time}` |
| `pages[]` | array | 页面序列化数据（纯 JSON），不含运行时对象 |
| `activePage` | Page | 当前激活页面的运行时对象 |
| `plugins{}` | object | 形状类型注册表，key 为 `type` 或 `namespace.type` |
| `setting` | object | 全局默认样式（见下文） |
| `historyStrategy` | string | `'graph'`（全局历史）或 `'page'`（按页历史） |
| `collaborationSession` | string | 当前协同会话 id |
| `enableText` | boolean | 是否启用富文本编辑功能 |
| `removedCache` | object | `{pages:[], shapes:[]}` 协同撤销时的恢复缓存 |

### 全局默认样式（`defaultSetting`）

在 `graph.setting` 中存储，所有 Shape 未显式设置的属性会继承此值：

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `borderColor` | `'steelblue'` | 边框色 |
| `backColor` | `'whitesmoke'` | 背景色 |
| `fontColor` | `'steelblue'` | 文字色 |
| `fontSize` | `12` | 字号 |
| `fontFace` | `'arial'` | 字体 |
| `fontWeight` | `FONT_WEIGHT.LIGHTER` | 字重 |
| `fontStyle` | `FONT_STYLE.NORMAL` | 字形 |
| `lineHeight` | `1.5` | 行高 |
| `cornerRadius` | `4` | 圆角 |
| `borderWidth` | `1` | 边框宽度 |
| `lineWidth` | `2` | 线宽 |
| `globalAlpha` | `1` | 全局透明度 |
| `rotateDegree` | `0` | 旋转角度 |
| `dashWidth` | `0` | 虚线宽（0=实线） |
| `focusBorderColor` | `'darkorange'` | 选中边框色 |
| `mouseInColor` | `'orange'` | 鼠标悬停色 |
| `resizeable` | `true` | 可拉伸 |
| `selectable` | `true` | 可选中 |
| `moveable` | `true` | 可移动 |
| `deletable` | `true` | 可删除 |
| `rotateAble` | `true` | 可旋转 |
| `editable` | `true` | 可编辑 |
| `visible` | `true` | 可见 |
| `allowLink` | `true` | 允许线连接 |

### 核心方法

```
// 页面管理
graph.addPage(name, id, div, index, data, mode)  → Page
graph.deletePage(index)
graph.deletePages(pageIds[])
graph.changePageIndex(fromIndex, toIndex)
graph.getPageData(index)                         → JSON
graph.getPageDataById(id)                        → JSON

// Shape 工厂（内部使用，带缓存）
graph.createShape(owner, id, type, x, y, w, h, parent) → Shape

// DOM 工厂（内部使用，带缓存）
graph.createDom(owner, tagName, id, pageId)      → HTMLElement

// 工作模式入口
graph.edit(index, div, id)      → Page  // 编辑模式
graph.display(id, div)                  // 展示模式
graph.present(index, div)      → Page  // 演示模式
graph.viewPresent(div)                  // 观看协同演示

// 插件加载
graph.initialize()                              // 预加载所有内置形状
graph.staticImport(importFn, shapes)            // 静态导入（构建时打包）
graph.import(address, shapes)                   // 动态导入（运行时远程加载）

// 序列化
graph.serialize()    → JSON
graph.deSerialize(data)

// 事件
graph.addEventListener(type, handler)
graph.removeEventListener(type, handler)
graph.fireEvent(event)

// 销毁
graph.destroy()
```

---

## Page

**源文件**：`core/base/page.js`

Page 继承自 `Container`，是一页画布的完整运行时对象。每个页面对应唯一的 DOM div 根节点，三个 Drawer 分层协作渲染。

### 关键属性

| 属性 | 说明 |
|------|------|
| `id` | 格式：`anna-page:{uuid}` |
| `mode` | 当前工作模式（`PAGE_MODE` 枚举） |
| `div` | DOM 根节点 |
| `graph` | 所属 Graph 引用 |
| `sm` | ShapeManager 实例 |
| `scaleX / scaleY` | 缩放比例（默认 1） |
| `x / y` | 画布平移偏移 |
| `animations[]` | 演示动画定义列表 |
| `shapesAs{}` | 形状类型替换映射（某形状在本页以另一类型渲染） |

### 工作模式

| 模式 | 常量 | 说明 |
|------|------|------|
| 编辑 | `PAGE_MODE.CONFIGURATION` | 完整交互：拖拽、删除、编辑文字、Undo/Redo |
| 展示 | `PAGE_MODE.DISPLAY` | 运行时呈现，执行 `clickCode` 等逻辑代码 |
| 演示 | `PAGE_MODE.PRESENTATION` | 幻灯片放映，支持进入/退出动画 |
| 观看 | `PAGE_MODE.VIEW` | 只读跟随演示者，禁止任何编辑 |
| 运行 | `PAGE_MODE.RUNTIME` | 代码驱动的运行时模式 |
| 历史 | `PAGE_MODE.HISTORY` | 历史回放（只读快照） |

### 核心方法

```
page.createNew(type, x, y, properties)  → Shape  // 创建新形状
page.take(pageData, callback)                     // 加载页面数据到当前 DOM
page.zoom(rate)                                   // 缩放
page.fillScreen(force)                            // 自适应填满容器
page.getFocusedShapes()                          → Shape[]  // 当前选中形状
page.want(shapeType, properties)                  // 设置下次点击创建的形状
page.startAnimation()                             // 启动动画
page.serialize()                                 → JSON
```

---

## Shape（基类）

**源文件**：`core/base/shape.js`

所有图形的抽象基类，由 `Atom` 派生。Shape 本身不负责渲染，渲染由注入的 `drawer` 负责。

### 坐标系

Shape 的 `x, y` 使用**绝对坐标**（相对画布左上角），即使 Shape 处于某个 Container 内，坐标依然是全局坐标。Container 移动时会同步更新内部所有 Shape 的绝对坐标。

### 关键属性

| 属性 | 说明 |
|------|------|
| `id` | UUID，全局唯一 |
| `type` | 类型字符串（由 `Atom.typeChain` 维护继承链） |
| `namespace` | 命名空间，内置为 `'elsa'` |
| `x, y` | 绝对坐标 |
| `width, height` | 尺寸 |
| `container` | 所属容器 id（空字符串表示已删除） |
| `page` | 所在 Page 引用 |
| `graph` | 所在 Graph 引用 |
| `drawer` | 渲染器（可替换） |
| `connectors[]` | Connector 列表（resize 点、link 点） |
| `serializedFields` | Set，该类型需序列化的字段名 |
| `_data` | 内部数据存储（通过 Proxy 透明访问） |

### 行为能力标志

| 标志 | 默认 | 说明 |
|------|------|------|
| `resizeable` | `true` | 可拉伸尺寸 |
| `selectable` | `true` | 可被选中 |
| `moveable` | `true` | 可拖动位置 |
| `dragable` | `true` | 可拖入 Container |
| `deletable` | `true` | 可删除 |
| `rotateAble` | `true` | 可旋转 |
| `editable` | `true` | 可编辑文字 |
| `visible` | `true` | 是否渲染 |
| `allowLink` | `true` | 允许 Line 连接 |
| `allowTraced` | `true` | 允许 Ctrl+Z |
| `shareAble` | `false` | 可被多页引用 |

### JS 代码钩子（序列化字段）

Shape 支持在特定生命周期挂载 JS 代码字符串，引擎会在对应时机执行：

| 钩子字段 | 触发时机 |
|---------|---------|
| `loadCode` | 形状加载完成 |
| `clickCode` | 单击 |
| `editingCode` | 开始编辑文字 |
| `editedCode` | 编辑文字完成 |
| `movedCode` | 移动完成 |
| `resizedCode` | 尺寸改变完成 |
| `focusedCode` | 被选中 |
| `unfocusedCode` | 取消选中 |
| `textChangedCode` | 文字内容变化 |
| `animateCode` | 动画帧执行 |
| `dynamicCode` | 动态刷新（周期性执行） |
| `containerChangedCode` | 所属容器变化 |
| `mouseUpCode / mouseDownCode / mouseMoveCode` | 鼠标事件 |
| `keyPressedCode / numberPressedCode` | 键盘事件 |
| `beforeRemoveCode / afterRemovedCode` | 删除前/后 |

---

## Atom（属性响应基类）

**源文件**：`core/base/atom.js`

Atom 是所有 Shape 的最底层基类，负责属性拦截与响应。

### 核心机制

1. **Proxy 拦截**：内部使用 `new Proxy({}, handler)` 实现 `get/set` 拦截。
   - 序列化字段（在 `serializedFields` 中）读写时访问 `_data` 对象
   - 普通属性直接读写 `target`
   - 函数属性支持 `MODE_MANAGER` 的模式覆盖注入

2. **typeChain（类型继承链）**：
   - 每次 `shape.type = 'xxx'` 时自动追加到链表：`{type:'xxx', parent:{type:'shape', parent:null}}`
   - `shape.isType(type)` — 精确匹配当前类型
   - `shape.isTypeof(type)` — 沿继承链向上搜索（包含父类）

3. **serializedFields**：
   - 类型第一次设置时通过 `shapeFields.get(type)` 获取字段列表并缓存
   - 继承父类字段，支持 `delete` 属性移除父类字段
   - 字段对应的值存在 `_data` 中，外部通过 Proxy 透明访问

4. **属性监听（Detection）**：
   - `addDetection({props: Set, react: fn})` 注册监听
   - 属性 set 时若属于 props，则触发 `react(propKey, value, preValue, target)`
