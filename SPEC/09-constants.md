# 关键常量与枚举

**源文件**：`common/const.js`

---

## 数值常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `ANNA_NAME_SPACE` | `'anna'` | 内置形状的命名空间前缀 |
| `EDITOR_NAME` | `'anna-editor'` | 全局富文本编辑器的 DOM id |
| `CONNECTION_RADIUS` | `12` | Connector（resize/link 点）的尺寸，单位 px |
| `SHAPE_MOVE_STEP` | `1` | 方向键每次移动的步长，单位 px |
| `MIN_WIDTH` | `2.1` | 形状最小宽度（防止缩为 0） |
| `Z_INDEX_OFFSET` | `100` | 形状 z-index 的基准偏移值 |
| `DEFAULT_FOLLOW_BAR_OFFSET` | `-60` | 上下文工具栏的纵向偏移（相对选中形状顶边），单位 px |
| `GRID_CELL_WIDTH` | `100` | 表格列默认宽度，单位 px |
| `GRID_CELL_HEIGHT` | `22` | 表格行默认高度，单位 px |
| `GRID_TOOL_WIDTH` | `20` | 表格工具栏宽度 |
| `GRID_HEAD_WIDTH` | `46` | 表格行头宽度 |
| `GRID_HEAD_HEIGHT` | `24` | 表格列头高度 |

---

## PAGE_MODE — 页面工作模式

| 值 | 说明 |
|----|------|
| `'configuration'` | 编辑模式 |
| `'display'` | 展示/运行模式 |
| `'presentation'` | 演示模式（幻灯片放映） |
| `'view'` | 观看模式（跟随演示者） |
| `'runtime'` | 代码运行时模式 |
| `'history'` | 历史回放模式 |

---

## ALIGN — 对齐方式

| 值 | 说明 |
|----|------|
| `'left'` | 左对齐 |
| `'right'` | 右对齐 |
| `'top'` | 顶对齐 |
| `'bottom'` | 底对齐 |
| `'center'` | 居中 |
| `'fill'` | 填满 |
| `'none'` | 无对齐约束 |

---

## DOCK_MODE — 容器内子形状排列

| 值 | 说明 |
|----|------|
| `'vertical'` | 纵向排列，横向撑满 |
| `'horizontal'` | 横向排列，纵向撑满 |
| `'fill'` | 填满容器（单子形状） |
| `'none'` | 自由排列 |

---

## PARENT_DOCK_MODE — 子形状在父容器中的停靠

| 值 | 说明 |
|----|------|
| `'left' / 'right' / 'top' / 'bottom'` | 停靠到对应边 |
| `'fill'` | 撑满父容器 |
| `'none'` | 自由 |

---

## LINEMODE — 线条模式

| 值 | 说明 | 切换顺序 |
|----|------|---------|
| `'straight'` | 直线 | → AUTO_CURVE |
| `'auto_curve'` | 引擎自动平滑曲线 | → BROKEN |
| `'broken'` | 折线 | → CURVE |
| `'curve'` | 手动贝塞尔曲线 | → STRAIGHT |

---

## DIRECTION — Connector 方向

用于 resize Connector 的方向标识：

| Key | 光标 | 说明 |
|-----|------|------|
| `W / E` | `ew-resize` | 左/右边中点 |
| `N / S` | `ns-resize` | 上/下边中点 |
| `NW / SE` | `nwse-resize` | 左上/右下角 |
| `NE / SW` | `nesw-resize` | 右上/左下角 |
| `R` | `pointer` | 旋转 |
| `L` | `crosshair` | 连线（拖出 Line） |
| `T` | `crosshair` | 文字编辑 |
| `V / H` | `ns-resize / ew-resize` | 表格行/列分割线 |
| `ROW / COL` | `row-resize / col-resize` | 表格行/列拖拽 |

---

## CURSORS — 光标类型

| 值 | 说明 |
|----|------|
| `'default'` | 默认指针 |
| `'none'` | 隐藏光标 |
| `'pointer'` | 手型 |
| `'move'` | 移动十字 |
| `'crosshair'` | 精准十字 |
| `'pen'` | 画笔（自定义绘制） |
| `'eraser'` | 橡皮擦 |
| `'text'` | 文字输入 |
| `'grab' / 'grabbing'` | 拖拽画布 |
| `'presentation'` | 演示模式 |

---

## EVENT_TYPE — 事件类型

| 事件 | 触发时机 |
|------|---------|
| `graphLoaded` | Graph 加载完成 |
| `editorSelectionChange` | 富文本编辑器选区变化 |
| `focusedShapesChange` | 选中形状集合变化 |
| `focusedPageChange` | 当前激活页变化 |
| `contextCreate` | 右键菜单触发 |
| `shapeAdded` | 形状被添加到页面 |
| `shapeMoved` | 形状移动完成 |
| `shapeMoving` | 形状正在移动中 |
| `shapeResized` | 形状尺寸改变完成 |
| `shapeResizing` | 形状尺寸正在改变中 |
| `shapeLongClick` | 形状长按 |
| `pageLongClick` | 页面背景长按 |
| `pageHistory` | 页面历史发生变化 |
| `pageDirty` | 页面数据变脏（有未保存修改） |
| `touchStart / touchEnd` | 触摸开始/结束 |
| `regionClick` | HitRegion 被点击 |
| `insertNodeRegionClick` | 流程图"插入节点"区域被点击 |
| `flowableStateTypeChange` | 流程节点状态类型变化 |
| `errorOccurred` | 发生错误 |

---

## FONT_STYLE / FONT_WEIGHT

| 常量 | 值 |
|------|-----|
| `FONT_STYLE.NORMAL` | `'normal'` |
| `FONT_STYLE.ITALIC` | `'italic'` |
| `FONT_WEIGHT.BOLD` | `'bold'` |
| `FONT_WEIGHT.LIGHTER` | `'lighter'` |
| `FONT_WEIGHT.NORMAL` | `'normal'` |

---

## INFO_TYPE — 形状信息角标

每个 Shape 右上角可显示信息角标（通过 HitRegion 实现）：

| 值 | 颜色 | 说明 |
|----|------|------|
| `NONE` | — | 不显示 |
| `INFORMATION` | 蓝色 | 信息提示 |
| `WARNING` | 黄色 | 警告 |
| `ERROR` | 红色 | 错误 |

---

## PROGRESS_STATUS — 形状进度状态

| 值 | 颜色 | 说明 |
|----|------|------|
| `NONE` | gray | 无状态 |
| `NOTSTARTED` | gray | 未开始 |
| `DOING` | gray | 进行中 |
| `RUNNING` | lightseagreen | 运行中 |
| `PAUSE` | salmon | 已暂停 |
| `COMPLETE` | green | 已完成 |
| `ERROR` | red | 出错 |
| `UNKNOWN` | dimgray | 未知 |

---

## MIND_MODE — 思维导图展示模式

| 值 | 说明 |
|----|------|
| `'mindCenter'` | 双向展开（居中主题） |
| `'organization'` | 组织架构图（向下） |
| `'mindLeft'` | 向左展开 |
| `'mindRight'` | 向右展开 |

---

## DOCUMENT_FORMAT — 文档格式

| 值 | 说明 |
|----|------|
| `'document'` | 文档模式 |
| `'paragraph'` | 段落模式 |
| `'body'` | 正文模式 |
| `'painting'` | 绘图模式 |

---

## TEXT_ATTRIBUTES — 富文本格式属性名

| 常量 | 值 | 说明 |
|------|-----|------|
| `BOLD` | `'bold'` | 粗体 |
| `ITALIC` | `'italic'` | 斜体 |
| `STRIKETHROUGH` | `'strikethrough'` | 删除线 |
| `UNDERLINE` | `'underline'` | 下划线 |
| `BACK_COLOR` | `'fontBackgroundColor'` | 文字背景色 |
| `FONT_COLOR` | `'fontColor'` | 文字颜色 |
| `FONT_FACE` | `'fontFace'` | 字体 |
| `FONT_SIZE` | `'fontSize'` | 字号 |
| `NUMBERED_LIST` | `'numberedList'` | 有序列表 |
| `BULLETED_LIST` | `'bulletedList'` | 无序列表 |
