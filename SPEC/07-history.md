# 历史管理（Undo / Redo）与 Command

## 总体设计

**源文件**：`core/history/history.js`、`core/history/commands.js`

Elsa 使用 **Command 模式** 实现 Undo/Redo：每次操作创建一个 Command 对象并入栈，撤销时逆向执行，重做时正向执行。

```
用户操作（拖动/删除/输入...）
  → 创建 Command 对象
  → history.addCommand(command, page)
  → commands[] 入栈，cursor 前移
  
Ctrl+Z
  → history.undo()
  → commands[cursor].undo(host)
  → cursor 后退

Ctrl+Shift+Z
  → history.redo()
  → commands[cursor+1].redo(host)
  → cursor 前移
```

---

## 历史策略

通过 `graph.historyStrategy` 选择：

| 策略 | 说明 |
|------|------|
| `'graph'`（默认） | 全局唯一历史栈，跨页操作可以统一 Undo/Redo |
| `'page'` | 每页独立历史栈，切换页面不影响其他页的历史 |

`'graph'` 策略下，历史栈以 Graph id 为 key 存储为单例，同一个 Graph 的所有操作共享一个栈。

---

## 批次号（batchNo）

同一次逻辑操作可能创建多个 Command（如同时移动多个形状），批次号将它们绑定为一组：

- 同一批次的 Command 在 Undo/Redo 时**作为整体**一次性执行
- `history.clearBatchNo()`：在每次 `graph.change()` 调用前重置，确保不同操作不会混入同一批次

---

## Command 基类

```js
command(host, shapes, type, init)
```

| 属性/方法 | 说明 |
|----------|------|
| `command.type` | 命令类型字符串 |
| `command.shapes` | 操作涉及的形状快照（序列化后的数据） |
| `command.host` | 宿主（Page 或 Graph）的序列化快照 |
| `command.batchNo` | 批次号，同批次命令一起 Undo/Redo |
| `command.redo(host)` | 重做执行 |
| `command.undo(host)` | 撤销执行 |
| `command.execute()` | 首次创建时执行（部分 Command 使用） |

---

## 内置 Command 类型

### 形状操作

| Command | 创建函数 | 说明 |
|---------|---------|------|
| 新增形状 | `addCommand(page, [{shape}])` | 记录形状添加，undo 删除，redo 恢复 |
| 删除形状 | `deleteCommand(page, shapes)` | 记录形状删除，undo 恢复，redo 删除 |
| 移动位置 | `positionCommand(page, shapes)` | 记录 x/y 变化，undo/redo 互换坐标 |
| 改变尺寸 | `resizeCommand(page, shapes)` | 记录 width/height 变化 |
| 布局变更 | `layoutCommand(page, shapes)` | 容器布局调整（包括子形状重排） |
| 橡皮擦 | `eraserComamnd(page, shapes)` | 橡皮擦删除操作 |
| 更新自由线 | `updateFreeLineCommand(page, shape)` | 自由手绘线更新 |
| 文本编辑 | `editorCommand(page, editor, operation, shape, ...)` | 富文本编辑器操作（与 CKEditor 历史集成） |

### 页面操作

| Command | 创建函数 | 说明 |
|---------|---------|------|
| 新增页面 | `pageAddedCommand(graph, pageData, index)` | undo 删除页面，redo 恢复页面 |
| 删除页面 | `pageRemovedCommand(graph, pageObj, index)` | undo 恢复页面，redo 删除页面 |
| 调整顺序 | `pageIndexChangedCommand(graph, fromIndex, toIndex)` | undo/redo 互换 index |

### 事务 Command

```js
transactionCommand(page, commands[], strictOrder)
```

将多个 Command 包装为一个事务，一起 Undo/Redo：

- `strictOrder = true`：undo 时**严格逆序**执行（适用于有依赖关系的场景，如先删容器再删子形状）
- `strictOrder = false`：undo 时并行执行

---

## 跨页 Undo

在 `'graph'` 策略下，Undo 某个操作时，若该操作发生在**非当前激活页**，历史管理器会自动：

1. 调用 `graph.edit()` 切换到操作所在页
2. 等待页面加载完成（`await`）
3. 执行 Command 的 undo 方法

这确保了跨页剪切粘贴、跨页移动等操作都能正确撤销。

---

## 历史 API

```js
const history = graph.getHistory();

history.undo()            // 撤销（Ctrl+Z）
history.redo()            // 重做（Ctrl+Shift+Z）
history.canUndo()         // → boolean
history.canRedo()         // → boolean
history.addCommand(cmd, host)   // 添加命令到历史栈
history.clearBatchNo()    // 清除当前批次号（开始新操作）
history.commands[]        // 历史命令数组
history.cursor            // 当前游标位置
```
