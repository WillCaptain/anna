# 属性配置系统（Configuration）

## 概述

Configuration 系统是**属性面板（PropertyPanel）的数据源层**，将 Shape 的属性映射为标准化的配置描述符，供 UI 面板读取和写入。

**源文件**：`core/configuration/configurationFactory.js` 及 `core/configuration/shape/` 下各子目录

---

## 架构

```
configurationFactory
  └── configMap: Map<field, ConfigurationFn>
        ├── xConfiguration(target)
        ├── yConfiguration(target)
        ├── widthConfiguration(target)
        ├── heightConfiguration(target)
        ├── rotateDegreeConfiguration(target)
        ├── cornerRadiusConfiguration(target)
        ├── globalAlphaConfiguration(target)
        ├── dashWidthConfiguration(target)
        ├── borderWidthConfiguration(target)
        ├── borderColorConfiguration(target)
        ├── backColorConfiguration(target)
        ├── beginArrowConfiguration(target)
        ├── endArrowConfiguration(target)
        └── tagConfiguration(target)
```

每个 `*Configuration(target)` 工厂函数接收 Shape 实例，返回一个**配置描述符对象**。

---

## 配置描述符接口

```js
{
  field: 'width',                   // 对应的 shape 属性名
  getValue: () => shape.width,      // 读取当前值
  getChangedData: (value) => [      // 根据新值生成要应用的数据变更列表
    { shape, field: 'width', value }
  ]
}
```

### 多选形状时的聚合

`graphAgent.getConfigurations(shapeIds[])` 会对多个 Shape 的同一字段配置进行**聚合**：

- `getChangedData`：合并所有 Shape 的变更，确保一次操作修改所有选中形状
- `getValue`：若所有选中形状的值**一致**则返回该值，否则返回空字符串 `""`（表示"多值"状态）

### 查询方式

```js
// 获取所有配置（用于属性面板初始化）
const configs = agent.getConfigurations(['shapeId1', 'shapeId2']);

// 获取特定字段配置
const widthConfig = agent.getConfigurationsByField(shapes, 'width');
const currentWidth = widthConfig.getValue();

// 应用修改
const changes = widthConfig.getChangedData(200);
// changes = [{shape, field:'width', value:200}, ...]
```

---

## 已注册配置字段

| 字段 | 分类 | 说明 |
|------|------|------|
| `x` | location | 横坐标 |
| `y` | location | 纵坐标 |
| `width` | appearance | 宽度 |
| `height` | appearance | 高度 |
| `rotateDegree` | appearance | 旋转角度（度） |
| `cornerRadius` | appearance | 圆角半径 |
| `globalAlpha` | appearance | 全局透明度（0~1） |
| `backColor` | appearance | 背景色 |
| `dashWidth` | line | 虚线间距（0=实线） |
| `borderWidth` | line | 边框宽度 |
| `borderColor` | line | 边框颜色 |
| `beginArrow` | line | 起点箭头类型 |
| `endArrow` | line | 终点箭头类型 |
| `tag` | other | 附加标签数据（JSON 对象） |

---

## pluginMeta（插件元数据）

**源文件**：`core/configuration/pluginMeta.js`

`pluginMeta` 描述一个形状插件的元信息，用于在 UI 侧展示形状工具栏中的图标和名称：

```js
pluginMeta({
  type: 'myShape',        // 形状类型名
  icon: '<svg>...</svg>', // 工具栏图标（SVG 字符串）
  label: '我的形状',       // 工具栏显示名称
  category: 'basic'       // 分类
})
```
