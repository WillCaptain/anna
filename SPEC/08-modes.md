# 工作模式与 MODE_MANAGER

## 工作模式（PAGE_MODE）

Elsa 中每个 Page 有独立的工作模式，决定了用户在该页面上的交互能力。

| 模式 | 常量 | 典型场景 |
|------|------|---------|
| **编辑** | `PAGE_MODE.CONFIGURATION` | 设计器，完整的拖拽/编辑/删除能力 |
| **展示** | `PAGE_MODE.DISPLAY` | 运行时展示，执行形状的逻辑代码 |
| **演示** | `PAGE_MODE.PRESENTATION` | 幻灯片放映，支持进入/退出动画 |
| **观看** | `PAGE_MODE.VIEW` | 跟随演示者只读观看，禁止所有编辑 |
| **运行时** | `PAGE_MODE.RUNTIME` | 代码驱动的动态运行 |
| **历史** | `PAGE_MODE.HISTORY` | 历史快照只读回放 |

---

## MODE_MANAGER

**源文件**：`common/mode/modeManager.js`

`MODE_MANAGER` 是一个单例，用于在**不修改形状代码的前提下**，为不同模式注册覆盖方法或禁用方法，实现模式隔离。

### 注册覆盖方法

```js
MODE_MANAGER.registerOverrideMethod(mode, type, methodName, method)
// 批量注册
MODE_MANAGER.registerOverrideMethodBatch(mode, types[], methodName, method)
```

当某个形状实例被创建时，`Atom` 的 Proxy 会检查当前页面模式，若该模式为对应 `type` 注册了覆盖方法，则 `shape.methodName` 会自动返回覆盖后的实现。

### 注册禁用方法

```js
MODE_MANAGER.registerForbiddenMethods(mode, type, methodName)
```

在指定模式下，调用被禁用的方法会直接 no-op（不执行）。

---

## 各模式的行为差异

### CONFIGURATION（编辑模式）

**禁用方法**：
- `page.ifKeyPressed`（演示相关按键逻辑禁用）
- `page.cleanPresentationDiv`
- `page.presentationKeyPressed`
- `presentationFrame.managePageComment`

**覆盖方法**（page 类型）：
- `ifHideSelection` → `false`（始终显示选中框）
- `ifAddCommand` → `false`（不在 page.take 时自动添加到历史）
- `enableHistory` → `true`（启用历史记录）
- `modeKeyPressed`：拦截 `Ctrl+E`、`Ctrl+数字` 等快捷键，阻止浏览器默认行为

### DISPLAY（展示模式）

- 禁用所有形状编辑操作（选中、拖拽、resize）
- 启用 `clickCode`、`loadCode` 等逻辑代码执行
- 形状点击触发 `clickCode`，而非进入编辑状态

### PRESENTATION（演示模式）

- 启用动画播放（`animationDrawer` 激活）
- 键盘左右方向键切换动画步骤
- Space/Enter：下一步
- Escape：退出演示
- 协同广播当前演示位置（`move_page_step`）

### VIEW（观看模式）

- 所有编辑操作均禁用
- 自动跟随演示者的当前页和动画步骤（通过 `pageStepMoved` 协同消息）
- 不允许发送任何协同消息（`collaboration.mute` 在接收阶段不静默）

### RUNTIME（运行时模式）

- 支持 `dynamicCode`（周期性执行的动态刷新代码）
- 表单类形状（htmlRadioBox、htmlTree 等）进入可交互状态

---

## 形状的模式感知

形状可以通过 `self.ignorePageMode = true` 声明**忽略页面模式**，这样即使在 display/presentation 等只读模式下，该形状仍保持编辑状态（常用于特殊交互控件）。

也可通过 `shape.page.mode` 在 `clickCode` 等代码钩子中获取当前模式，进行差异化处理：

```js
// 在 clickCode 中
if (shape.page.mode === 'display') {
  // 展示模式下的行为
}
```
