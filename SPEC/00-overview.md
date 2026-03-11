# Elsa 图形引擎 — 总览

> 版权所有 © 2026 12th.ai Studio

---

## 项目定位

**Elsa** 是一个面向 Web 的矢量图形/白板引擎，设计为可嵌入任意宿主应用的图形编辑核心库。

核心能力包括：

- 多页画布（类 PPT/白板）
- 丰富的内置形状系统（30+ 种），支持自定义插件形状
- 三种渲染技术并存（HTML/DOM、Canvas 2D、SVG）
- 多工作模式：编辑、展示、演示、观看
- 实时多人协同编辑（WebSocket）
- 完整的 Undo/Redo（Command 模式）
- 流程编排节点（Flowable/AIPP）
- 思维导图（MindMap）

---

## 目录结构

```
anna/
├── core/                        # 引擎核心
│   │
│   ├── index.js                 # 统一对外导出入口
│   │
│   ├── entry/
│   │   └── annaEntry.js         # ELSA 单例（对外 API 入口）
│   │
│   ├── base/                    # 核心基类（引擎骨架）
│   │   ├── atom.js              # Atom（属性响应 Proxy 基类）
│   │   ├── shape.js             # Shape 基类（所有图形的抽象基础）
│   │   ├── page.js              # Page（一页画布，继承自 Container）
│   │   ├── graph.js             # Graph（最高管理层，文档根对象）
│   │   ├── container.js         # 容器形状（可包含子形状）
│   │   ├── shapeFields.js       # 各类型序列化字段声明
│   │   ├── defaultGraph.js      # 带富文本编辑器的默认 Graph 实现
│   │   ├── shapeManager.js      # ShapeManager（页内形状查询与管理）
│   │   └── writer.js            # annaWriter（统一外部写操作入口）
│   │
│   ├── interaction/             # 交互系统（连接点 + 热区）
│   │   ├── connector.js         # Connector（resize/link 交互点）
│   │   └── hitRegion.js         # HitRegion（形状上的自定义交互区域）
│   │
│   ├── history/                 # 历史管理（Command 模式）
│   │   ├── history.js           # Undo/Redo 历史管理
│   │   └── commands.js          # Command 对象（增/删/移/改）
│   │
│   ├── collaboration/           # 多人协同客户端
│   │   └── collaboration.js
│   │
│   ├── shapes/                  # 所有具体形状类型
│   │   ├── rectangle.js         # 矩形及文字节点
│   │   ├── ellipse.js           # 椭圆
│   │   ├── line.js              # 连接线
│   │   ├── lineHelper.js        # 线条路径算法辅助
│   │   ├── freeLine.js          # 自由手绘线
│   │   ├── group.js             # 临时编组
│   │   ├── icon.js              # 内置图标
│   │   ├── image.js             # 图片
│   │   ├── table.js             # 表格
│   │   ├── svg.js               # SVG 图形
│   │   ├── sticker.js           # 便签
│   │   ├── thumb.js             # 缩略图
│   │   ├── reference.js         # 跨页引用形状
│   │   ├── vector.js            # 矢量图形（支持自定义绘制代码）
│   │   ├── charts.js            # 图表
│   │   ├── others.js            # 杂项形状（倒计时、计算器等）
│   │   ├── svg_icons.js         # 内置 SVG 图标资源
│   │   ├── arrows/              # 箭头类形状
│   │   │   ├── bottomArrow.js
│   │   │   ├── dovetailArrow.js
│   │   │   ├── leftAndRightArrow.js
│   │   │   ├── rightArrow.js
│   │   │   └── rightCurlyBrace.js
│   │   ├── geometry/            # 几何形状
│   │   │   ├── diamond.js
│   │   │   ├── triangle.js
│   │   │   ├── parallelogram.js
│   │   │   ├── pentagram.js
│   │   │   ├── regularPentagonal.js
│   │   │   └── roundedRectangleCallout.js
│   │   └── media/               # 媒体类形状
│   │       ├── audio.js
│   │       └── video.js
│   │
│   ├── drawers/                 # 绘制器体系（见 04-drawers.md）
│   │   ├── htmlDrawer.js
│   │   ├── canvasDrawer.js
│   │   ├── rectangleDrawer.js
│   │   ├── containerDrawer.js
│   │   ├── groupDrawer.js
│   │   ├── canvasGeometryDrawer.js
│   │   ├── svgDrawer.js
│   │   ├── lineDrawer.js
│   │   ├── pageDrawer.js
│   │   ├── interactDrawer.js
│   │   ├── cursorDrawer.js
│   │   └── animationDrawer.js
│   │
│   ├── configuration/           # 属性面板配置（见 05-configuration.md）
│   │   ├── configurationFactory.js
│   │   ├── fieldConfiguration.js
│   │   ├── pluginMeta.js
│   │   └── shape/
│   │
│   ├── contextToolbar/          # 上下文工具栏
│   │   ├── contextToolbar.js
│   │   ├── menu.js
│   │   └── popupMenu.js
│   │
│   ├── cache/                   # ShapeCache / DomCache
│   │   ├── domCache.js
│   │   ├── domFactory.js
│   │   └── shapeCache.js
│   │
│   ├── actions/                 # 用户输入事件层（鼠标/键盘/复制粘贴）
│   │   ├── mouseActions.js      # 鼠标与触摸事件处理，坐标换算，Command 生成
│   │   ├── keyActions.js        # 键盘快捷键 attach/detach（绑定到 document）
│   │   └── copyPasteHelper.js   # 复制/粘贴/剪切（ElsaData / PlainText / Image）
│   │
│   └── utils/                   # core 内部工具
│       ├── guideLineUtil.js
│       └── annaDataBuilder.js
│
├── common/                      # 无业务逻辑的纯工具层
│   ├── const.js                 # 全局常量与枚举
│   ├── util.js                  # 通用工具函数
│   ├── ajax.js                  # HTTP 请求封装
│   ├── algorithm.js             # 算法工具
│   ├── commandChain.js          # 命令链工具
│   ├── communication.js         # 底层通信封装
│   ├── graphics.js              # 几何算法
│   ├── keyCode.js               # 键盘码常量
│   ├── optional.js              # Optional 工具
│   ├── annaEntryUtil.js         # 序列化 id 工具
│   ├── anna2image.js            # 导出画布为图片
│   ├── dom2image.js             # DOM 转图片
│   ├── extensions/              # Array/Canvas/String 等原生扩展
│   ├── mode/
│   │   └── modeManager.js       # 模式覆盖方法管理器
│   └── component/
│       └── popup.js
│
├── config/                      # 运行时配置
│   ├── envConfig.js
│   ├── daily-config.json
│   └── product-config.json
│
├── test/                        # 单元测试（Jest）
│   ├── __mocks__/
│   └── cases/
│       ├── base/                # 对应 core/base/
│       ├── interaction/         # 对应 core/interaction/
│       ├── history/             # 对应 core/history/
│       ├── drawers/             # 对应 core/drawers/
│       ├── shapes/              # 对应 core/shapes/
│       ├── actions/             # 对应 core/actions/
│       ├── _jadeNodes/
│       └── popMenu/
│
├── plugins/                     # 外部插件（本仓库不含，由宿主注入）
│
└── SPEC/                        # 本规格说明目录
    ├── 00-overview.md           # 本文件：总览与目录结构
    ├── 01-object-model.md       # 对象模型：Graph / Page / Shape / Atom
    ├── 02-shapes.md             # 形状体系：内置类型、序列化字段、插件扩展
    ├── 03-api.md                # 对外 API：ELSA 单例与 graphAgent
    ├── 04-drawers.md            # 绘制器体系
    ├── 05-configuration.md      # 属性配置与属性面板
    ├── 06-collaboration.md      # 多人协同
    ├── 07-history.md            # 历史管理（Undo/Redo）与 Command
    ├── 08-modes.md              # 工作模式与 MODE_MANAGER
    └── 09-constants.md          # 关键常量与枚举
```

---

## 快速索引

| 主题 | 规格文件 |
|------|---------|
| 对象模型（Graph/Page/Shape） | [01-object-model.md](./01-object-model.md) |
| 形状类型与序列化 | [02-shapes.md](./02-shapes.md) |
| 对外 API | [03-api.md](./03-api.md) |
| 绘制器 | [04-drawers.md](./04-drawers.md) |
| 属性面板配置 | [05-configuration.md](./05-configuration.md) |
| 多人协同 | [06-collaboration.md](./06-collaboration.md) |
| Undo/Redo & Command | [07-history.md](./07-history.md) |
| 工作模式 | [08-modes.md](./08-modes.md) |
| 常量与枚举 | [09-constants.md](./09-constants.md) |
| 功能路线图 | [10-roadmap.md](./10-roadmap.md) |
