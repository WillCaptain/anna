# 多人协同

## 架构概述

**源文件**：`core/collaboration/collaboration.js`

Elsa 通过 WebSocket + HTTP 双通道实现多人实时协同编辑。

```
宿主应用
  └── graphAgent
        └── Graph
              └── collaboration（客户端）
                    ├── communicator（WebSocket + HTTP POST）
                    │     ├── WebSocket：接收服务端推送消息
                    │     └── HTTP POST：发送操作指令到协同服务
                    └── graph.publish(message)
                          └── graph.subscriptions[topic](message)  → 更新本地数据
                                └── pageSubscribers[].onMessage()  → 更新渲染层
```

---

## 核心机制

### 协同会话（collaborationSession）

- **编辑模式**：`collaborationSession === graph.id`（每个 Graph 对应唯一会话）
- **演示模式**：`collaborationSession === graph.id + "_present"`
- **观看模式**：`collaborationSession` 等于演示者的会话 id

同一 `collaborationSession` 下的所有客户端共享同一个协同频道，互相实时同步操作。

### 消息流向

```
本地操作
  → shape 属性变化 / page 操作
  → collaboration.invoke({method, page, value})
  → HTTP POST 到协同服务
  → 协同服务广播给所有同 session 的客户端
  → WebSocket 推送到其他客户端
  → com.onMessage(message)
  → graph.publish(message)
  → graph.subscriptions[message.topic](message) → 更新 pages[] 数据
  → pageSubscribers[].onMessage(message)         → 更新运行时 Page 渲染
```

### mute 模式

`collaboration.mute = true` 时，`invoke` 方法不向服务端发送任何消息，用于：
- 新建 Graph 时的初始化阶段
- 演示者视角下某些本地专有操作
- 测试/离线环境

### coediteIgnored

`graph.ignoreCoedit(fn)` 包裹的操作会临时设置 `coediteIgnored = true`，使 `invoke` 直接返回 undefined，用于处理协同消息引起的本地数据更新时，避免再次向服务端发送（防止循环广播）。

---

## 协同消息 Topic

服务端推送的消息由 `graph.subscriptions` 字典处理，每个 topic 对应一个处理函数：

| Topic | 触发场景 | 处理逻辑 |
|-------|---------|---------|
| `page_added` | 远端新增页面 | 将页面数据插入本地 `graph.pages[]` |
| `page_removed` | 远端删除页面 | 从 `graph.pages[]` 移除对应页面 |
| `page_index_changed` | 远端调整页面顺序 | 更新 `graph.pages[]` 中的顺序 |
| `shape_added` | 远端新增形状 | 将形状数据追加到对应页的 `shapes[]` |
| `shape_index_changed` | 远端改变形状层级 | 更新 `shapes[]` 中的位置 |
| `page_shape_data_changed` | 远端修改形状属性 | 更新 `shapes[]` 中对应形状的字段；若 container 变为空则视为删除 |
| `session_count` | 在线人数变化 | 更新 `page.sessionCount`，重绘 |
| `comment` | 收到批注 | 将批注追加到对应 shape 的 `comments[]` |
| `freeline_done` | 自由手绘完成 | 将线段数据追加到对应形状 |
| `graph_data_changed` | Graph 属性变化（如标题） | 更新 `graph.setting` 或 Graph 自身字段 |
| `pageStepMoved` | 演示页步骤切换 | 调用 `gotoCurrentPage` 跳转到演示者当前页 |

### page_shape_data_changed 详解

这是最核心的协同消息，几乎所有形状编辑都通过它同步：

```js
message = {
  topic: 'page_shape_data_changed',
  page: 'pageId',
  value: [
    {
      shape: 'shapeId',
      properties: {
        x: 200,
        backColor: 'red'
        // ... 变化的字段
      }
    }
  ]
}
```

特殊情况：若 `properties.container === ''`，表示该形状被删除。

---

## 协同操作指令（invoke methods）

本地发送到协同服务的指令：

| Method | 参数 | 说明 |
|--------|------|------|
| `register_graph` | `{value: graphData}` | 注册/初始化 Graph 会话数据 |
| `load_graph` | `{value: graphId}` | 加载 Graph 协同数据 |
| `new_page` | `{page: pageId, value: pageData}` | 新增页面 |
| `remove_page` | `{page: pageId, value: pageId}` | 删除页面 |
| `change_page_index` | `{page: pageId, value: {fromIndex, toIndex}}` | 调整页面顺序 |
| `change_shape_data` | `{page, value: [{shape, properties}]}` | 修改形状属性 |
| `add_shape` | `{page, value: shapeData}` | 新增形状 |
| `change_graph_data` | `{value: {field, value}}` | 修改 Graph 属性 |
| `ping` | — | 心跳检测，返回在线用户列表 |
| `get_present_page_index` | `{value: session}` | 查询演示者当前页 |
| `move_page_step` | `{page, value: animationIndex}` | 演示步骤推进 |
| `register_office` | `{value: fileName}` | 注册 Office 文档会话 |

---

## 在线协作者显示

心跳（`ping`）响应返回当前 session 中所有在线用户的信息：

```js
[{ id, name, page, shape }]
```

- `page` 字段：该用户正在浏览的页面 id → 显示在页面缩略图上
- `shape` 字段：该用户正在编辑的形状 id → 显示在对应形状上

---

## pageSubscribers（运行时页面订阅）

`graph.pages[]` 存储的是**序列化数据**，协同消息优先更新这里。

但当页面正在被渲染（用户正在查看/编辑），需要同时更新运行时的 Page 对象。`pageSubscribers` 维护当前处于活跃状态的 Page 运行时实例列表，每收到协同消息后，`graph.syncSubscribedPage(message)` 会通知所有订阅页面调用 `onMessage()` 更新渲染。
