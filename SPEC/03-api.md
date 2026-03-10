# 对外 API

## ANNA 单例

**源文件**：`core/entry/annaEntry.js`

`ANNA` 是引擎的全局入口单例，所有操作从此开始。宿主应用通过 `ANNA` 获取 `graphAgent` 后进行操作。

### 初始化与打开 Graph

| 方法 | 说明 | 返回 |
|------|------|------|
| `ANNA.newGraph(id, graphType, div)` | 新建空白 Graph，持久化到 Repo | `Promise<graphAgent>` |
| `ANNA.editGraph(graphId, graphType, div, initializer?)` | 编辑已有 Graph（优先从协同服务加载，降级从 Repo 加载） | `Promise<graphAgent>` |
| `ANNA.createEmptyGraph(graphType, div, session?)` | 创建无持久化的空白 Graph（调试/测试用） | `Promise<graphAgent>` |
| `ANNA.data2Graph(graphType, div, graphId, version?, tenantId?)` | 按版本/租户加载特定快照（静默模式，不开启协同） | `Promise<graphAgent>` |

### 展示与演示

| 方法 | 说明 | 返回 |
|------|------|------|
| `ANNA.displayGraph(graphId, graphType, div)` | 预览模式（只读展示，不协同） | `Promise<Graph>` |
| `ANNA.presentGraph(graphId, graphType, div, index?, data?)` | 演示者视角（幻灯片放映，开启协同广播） | `Promise<Graph>` |
| `ANNA.viewGraph(session, graphType, div, errorCallback?)` | 观看者视角（跟随演示者，只读） | `Promise<Graph>` |
| `ANNA.editOffice(fileName, div)` | 加载 Office 文档格式数据 | `Promise<graphAgent>` |

### 插件与配置

| 方法 | 说明 |
|------|------|
| `ANNA.import(address, definedGraphs?)` | 动态加载外部 Graph 类型插件 |
| `ANNA.setRepo(repository)` | 注入持久化仓库实现 |
| `ANNA.getRepo()` | 获取当前仓库 |
| `ANNA.convertGraphData(data)` | 迁移旧格式数据（将 `properties` 字段展开到 shape 根级） |

### 参数说明

- `graphType`：字符串，默认 `'graph'`，对应 `ANNA` 内部 `graphTypes` 字典中注册的 Graph 类型
- `div`：HTML `div` 元素，画布将在此 div 内渲染
- `initializer(graphAgent)`：`editGraph` 首次创建时调用的初始化回调

---

## graphAgent（Graph 实例代理）

`graphAgent` 是 `ANNA.newGraph / editGraph` 等方法返回的操作代理对象，是宿主应用与 Anna 引擎之间的**唯一安全接口**，隔离了引擎内部实现。

### 基础属性

| 属性 | 说明 |
|------|------|
| `agent.id` | Graph 的唯一 id |
| `agent.title` | Graph 标题 |
| `agent.type` | Graph 类型 |
| `agent.session` | 当前用户 session |
| `agent.tenant` | 租户标识 |
| `agent.updateTime / createTime` | 更新/创建时间 |

### 页面操作

| 方法 | 说明 |
|------|------|
| `agent.editPage(id, div)` | 切换到指定页面（编辑模式），若当前已有激活页则调用 `take` 切换 |
| `agent.displayPage(id, div)` | 以展示模式显示指定页面 |
| `agent.getPages()` | 获取所有页面的序列化数据数组 |
| `agent.getActivePage()` | 获取当前激活的 Page 运行时对象 |
| `agent.present(index)` | 以演示模式放映，从指定页开始 |

### 形状操作

| 方法 | 说明 |
|------|------|
| `agent.want(shapeType, properties)` | 设置下一次点击画布时创建的形状类型（类似"选中绘图工具"） |
| `agent.getFocusedShapes()` | 获取当前选中的形状列表 |
| `agent.change(operation)` | **统一写操作入口**，`operation` 接收 `annaWriter` 并执行操作，内部自动处理历史记录 |

### 查询与配置

| 方法 | 说明 |
|------|------|
| `agent.getGraph()` | 获取整个 Graph 的序列化 JSON 数据 |
| `agent.getMode()` | 获取当前工作模式（`PAGE_MODE` 值） |
| `agent.getFrame()` | 获取当前页面的 frame 信息 |
| `agent.getCenterPoint()` | 获取画布中心点坐标 `{x, y}` |
| `agent.getConfigurations(shapeIds[])` | 获取属性面板配置描述符（支持多选聚合） |
| `agent.getConfigurationsByField(shapes[], field)` | 按字段名获取属性配置 |
| `agent.getFormatValue(shape, key)` | 获取文本格式化值（粗体/斜体等） |
| `agent.getGraphProperty(property)` | 读取 Graph 级属性或 setting 中的值 |
| `agent.getShapeAnimation(shapeId)` | 获取指定形状的动画配置 |

### 视图控制

| 方法 | 说明 |
|------|------|
| `agent.zoom(rate)` | 按比例缩放当前画布 |
| `agent.reset(width?, height?)` | 重置画布大小并重绘 |

### 数据管理

| 方法 | 说明 |
|------|------|
| `agent.save()` | 调用 Repo 持久化当前 Graph | `Promise` |
| `agent.setGraphData(data)` | 直接替换 Graph 数据（不走历史） |
| `agent.initGraphWithTemplate(data)` | 从模板初始化：重新生成所有 id，保持 container/reference 关联 |

### 协同

| 方法 | 说明 |
|------|------|
| `agent.openCollaboration()` | 建立协同 WebSocket 连接 |
| `agent.closeCollaboration()` | 断开协同连接 |

### 事件监听

| 方法 | 说明 |
|------|------|
| `agent.addFocusedShapeChangeListener(fn)` | 选中形状变化时触发 |
| `agent.addFocusedPageChangeListener(fn)` | 当前激活页变化时触发 |
| `agent.addEditorSelectionChangeListener(fn)` | 文本编辑器选区变化时触发 |
| `agent.addRegionListener(fn)` | HitRegion 被点击时触发 |
| `agent.dirtied` | 可覆盖的脏数据回调，签名：`(serializedData, event) => void` |

### 导出

| 属性 | 说明 |
|------|------|
| `agent.annaToImage` | 导出当前画布为图片的工具函数 |

---

## annaWriter（写操作 API）

**源文件**：`core/base/writer.js`

通过 `agent.change(operation => operation.xxx())` 使用，是对画布进行编程修改的推荐方式，自动记录 Undo/Redo 历史。

| 方法 | 说明 |
|------|------|
| `writer.addPage({name, id, targetDiv, index, data})` | 新增页面 |
| `writer.movePage(id, index)` | 调整页面顺序 |
| `writer.newShapes(shapes[])` | 批量创建形状，每个元素 `{type, properties}` |
| `writer.setShapeAttributes(shape, attributes)` | 批量设置形状属性 |
| `writer.deleteShapes(shapes[])` | 批量删除形状 |
| `writer.moveShapes(shapes[], deltaX, deltaY)` | 批量移动形状 |
| `writer.resizeShape(shape, width, height)` | 改变形状尺寸 |

### 使用示例

```js
// 创建形状
agent.change(writer => {
  writer.newShapes([
    { type: 'rectangle', properties: { x: 100, y: 100, width: 200, height: 100, text: 'Hello' } },
    { type: 'ellipse',   properties: { x: 350, y: 100, width: 120, height: 120 } }
  ]);
});

// 修改属性
agent.change(writer => {
  const shape = agent.getFocusedShapes()[0];
  writer.setShapeAttributes(shape, { backColor: '#ff0000', text: 'World' });
});
```

---

## 持久化仓库接口（Repository）

通过 `ANNA.setRepo(repository)` 注入，须实现以下方法：

| 方法 | 说明 |
|------|------|
| `repo.getGraph(graphId, version?, tenantId?)` | 获取 Graph 序列化数据，返回 JSON 或 `null` |
| `repo.saveGraph(data)` | 保存 Graph 序列化数据 |
| `repo.getSession()` | 获取当前用户 session 信息 `{name, id}` |

`ENV_CONFIG`（`config/envConfig.js`）中保存全局运行时配置：

| 配置项 | 说明 |
|-------|------|
| `collaborationUrl` | 协同服务的 HTTP/WebSocket 基础 URL |
