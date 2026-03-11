# Anna 图标库 — 进度追踪

> 目标：建立类似 PowerPoint 内置图标库的全套矢量图标，可放置到白板画布上，支持自定义填充色与边框色。

---

## 图标绘制规范

### 文件与注册

| 项目 | 规范 |
|---|---|
| 存放位置 | `plugins/icons/<category>.js` |
| 每个文件 | 一个分类，可包含多个图标 |
| 公共基础 | `plugins/icons/_iconBase.js` 提供 `makeIconDrawer` / `makeIcon` |
| 注册路径 | 在 `src/whiteboard.js` 中 import 并加入 `SHAPE_MODULES` + `TOOL_TYPE_MAP` |

### Canvas 绘制约定

```
drawStatic(context, px, py) 调用时：
  px = shape.margin ≈ 1（内部偏移，直接使用即可）
  py = shape.margin ≈ 1
  有效绘制区：(px, py) 到 (px + W, py + H)
  W = shape.width  - 2
  H = shape.height - 2
```

| 属性 | 约定 |
|---|---|
| 填充色 | `shape.getBackColor()` |
| 描边色 | `shape.getBorderColor()` |
| 线宽 | `shape.borderWidth`（默认 1.5）|
| 线帽/连接 | `context.lineCap = 'round'; context.lineJoin = 'round'` |
| 圆角 | 配置中移除 `cornerRadius`（`configurations.remove(c => c.field === "cornerRadius")`）|
| 文字 | `self.text = ""`（图标不含文字）|
| 默认尺寸 | 90×90（正方形图标），特殊比例图标除外 |

### 镂空（打孔）技术

对于钥匙圆孔、锁孔等需要"透明镂空"的区域，使用 Canvas 合成操作：

```javascript
// 先绘制填充区域
context.beginPath();
context.arc(cx, cy, outerR, 0, Math.PI * 2);
context.fill();

// 用 destination-out 打孔（变透明，显示画布背景）
context.globalCompositeOperation = 'destination-out';
context.beginPath();
context.arc(cx, cy, innerR, 0, Math.PI * 2);
context.fill();
context.globalCompositeOperation = 'source-over';

// 最后描边轮廓
context.stroke();
```

### 图标类型

| 类型 | 说明 | 示例 |
|---|---|---|
| **填充型** | 有主体填充，形状轮廓 + 内部细节描边 | 钥匙、保险柜 |
| **描边型** | 无填充（或浅填充），全部描边线条 | 连线类、符号类 |
| **混合型** | 主体填充 + 部分描边细节 | 大多数图标 |

---

## 进度总览

| # | 分类 | 状态 | 完成 | 总计 |
|---|---|---|---|---|
| 01 | 安全与司法 | ✅ 全部完成 | 16 | 16 |
| 02 | 标志与符号 | ✅ 全部完成 | 28 | 28 |
| 03 | 车辆 | ⬜ 未开始 | 0 | 20 |
| 04 | 虫子 | ⬜ 未开始 | 0 | 10 |
| 05 | 动物 | ⬜ 未开始 | 0 | 25 |
| 06 | 分析 | ⬜ 未开始 | 0 | 18 |
| 07 | 风景 | ⬜ 未开始 | 0 | 15 |
| 08 | 服饰 | ⬜ 未开始 | 0 | 20 |
| 09 | 辅助功能 | ⬜ 未开始 | 0 | 14 |
| 10 | 工具与建筑物 | ⬜ 未开始 | 0 | 24 |
| 11 | 技术与电子 | 🟢 部分 | 4 | 22 |
| 12 | 假日 | ⬜ 未开始 | 0 | 15 |
| 13 | 箭头 | 🟢 部分 | 4 | 20 |
| 14 | 教育 | ⬜ 未开始 | 0 | 20 |
| 15 | 界面 | ⬜ 未开始 | 0 | 24 |
| 16 | 居家 | ⬜ 未开始 | 0 | 25 |
| 17 | 恐龙 | ⬜ 未开始 | 0 | 8 |
| 18 | 脸 | ⬜ 未开始 | 0 | 16 |
| 19 | 流程 | ⬜ 未开始 | 0 | 12 |
| 20 | 贸易 | ⬜ 未开始 | 0 | 16 |
| 21 | 拼图与游戏 | ⬜ 未开始 | 0 | 14 |
| 22 | 庆典 | ⬜ 未开始 | 0 | 14 |
| 23 | 人员 | ⬜ 未开始 | 0 | 20 |
| 24 | 商业 | ⬜ 未开始 | 0 | 25 |
| 25 | 身体部位 | ⬜ 未开始 | 0 | 15 |
| 26 | 食品和饮料 | ⬜ 未开始 | 0 | 25 |
| 27 | 体育 | ⬜ 未开始 | 0 | 22 |
| 28 | 天气和季节 | ⬜ 未开始 | 0 | 20 |
| 29 | 通信 | ⬜ 未开始 | 0 | 20 |
| 30 | 位置 | ⬜ 未开始 | 0 | 15 |
| 31 | 医学 | ⬜ 未开始 | 0 | 20 |
| 32 | 艺术 | ⬜ 未开始 | 0 | 15 |
| 33 | 职业 | ⬜ 未开始 | 0 | 16 |
| 34 | 自然和户外 | ⬜ 未开始 | 0 | 25 |

> 🟢 = 部分完成  🟡 = 进行中  ⬜ = 未开始  ✅ = 全部完成

---

## 01 — 安全与司法 (`plugins/icons/security.js`)

| icon type | 中文 | 状态 | 备注 |
|---|---|---|---|
| `key` | 钥匙 | ✅ 完成 | 水平朝右，圆头+齿 |
| `padlock` | 锁（关） | ✅ 完成 | 闭合 U 型锁扣 |
| `padlockOpen` | 锁（开） | ✅ 完成 | 右侧锁扣脱开 |
| `vault` | 保险柜 | ✅ 完成 | 表盘+把手+铰链 |
| `camera` | 摄像头 | ✅ 完成 | 梯形机身+镜头 |
| `streetLight` | 路灯 | ✅ 完成 | 弯臂灯柱+光晕 |
| `gavel` | 法院锤 | ✅ 完成 | 旋转木槌+底座 |
| `handcuffs` | 手铐 | ✅ 完成 | 双圆环+链节 |
| `prisonBars` | 监狱栏杆 | ✅ 完成 | 5竖杆+上下横档 |
| `scales` | 法庭天秤 | ✅ 完成 | 立柱+倾斜横梁+双盘 |
| `policeLamp` | 法警灯 | ✅ 完成 | 灯体+圆弧灯罩+光线 |
| `shield` | 盾牌 | ✅ 完成 | 盾形外框+内部五角星 |
| `fingerprint` | 指纹 | ✅ 完成 | 7条同心弧 |
| `badge` | 警徽/徽章 | ✅ 完成 | 六角星+内圆 |
| `cctv` | 监控球机 | ✅ 完成 | 顶部支架+球形摄像头 |
| `alarm` | 报警器 | ✅ 完成 | 圆形主体+声波弧 |

## 02 — 标志与符号 (`plugins/icons/symbols.js`)

| icon type | 中文 | 状态 | 备注 |
|---|---|---|---|
| `symbolMale` | 男标志 | ✅ | 圆+斜向上箭头 |
| `symbolFemale` | 女标志 | ✅ | 圆+十字下 |
| `droplet` | 水滴 | ✅ | 贝塞尔泪滴 |
| `heart` | 心形 | ✅ | 双段贝塞尔心形 |
| `thumbsUp` | 赞 | ✅ | 握拳+斜向拇指 |
| `thumbsDown` | 踩 | ✅ | thumbsUp 翻转 |
| `cursorPointer` | 手指指向 | ✅ | 食指+掌心 |
| `info` | Information | ✅ | 圆+i字 |
| `warning` | 警告 | ✅ | 三角+! |
| `error` | 错误 | ✅ | 圆+× |
| `question` | 疑问 | ✅ | 圆+?弧+点 |
| `forbidden` | 禁止 | ✅ | 圆+对角斜线 |
| `sparkle` | 火花 | ✅ | 8条射线+中心圆 |
| `radioactive` | 放射性 | ✅ | 3扇叶环形扇区+大圆 |
| `recycle` | 可循环 | ✅ | 3段弧+填充三角箭头 |
| `infinity` | 无限 | ✅ | 双贝塞尔∞ |
| `questionMark` | 问号 | ✅ | 大?弧+竖+点 |
| `exclamation` | 感叹号 | ✅ | 粗竖+圆点 |
| `checkCircle` | 圆圈勾 | ✅ | 圆+✓ |
| `xCircle` | 圆圈叉 | ✅ | 圆+× |
| `star` | 星星 | ✅ | 五角星外+内交替点 |
| `wifi` | WiFi信号 | ✅ | 3同心圆弧+中心点 |
| `bluetooth` | 蓝牙 | ✅ | 竖脊柱+双菱形交叉 |
| `copyright` | 版权 © | ✅ | 圆+内C弧 |
| `trademark` | 商标 ™ | ✅ | T字+M字 |
| `registered` | 注册 ® | ✅ | 圆+内R字 |
| `biohazard` | 生化危险 | ✅ | 外圆+3偏心叶片圆 |
| `peace` | 和平符号 | ✅ | 圆+竖线+两斜线 |

## 03 — 车辆 (`plugins/icons/vehicles.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `car` | 轿车 | ⬜ |
| `truck` | 卡车 | ⬜ |
| `bus` | 公交车 | ⬜ |
| `bicycle` | 自行车 | ⬜ |
| `motorcycle` | 摩托车 | ⬜ |
| `airplane` | 飞机 | ⬜ |
| `helicopter` | 直升机 | ⬜ |
| `ship` | 轮船 | ⬜ |
| `train` | 火车 | ⬜ |
| `rocket` | 火箭 | ⬜ |
| `submarine` | 潜水艇 | ⬜ |
| `ambulance` | 救护车 | ⬜ |
| `fireEngine` | 消防车 | ⬜ |
| `tractor` | 拖拉机 | ⬜ |
| `sailboat` | 帆船 | ⬜ |
| `taxi` | 出租车 | ⬜ |
| `scooter` | 电动车 | ⬜ |
| `drone` | 无人机 | ⬜ |
| `forklift` | 叉车 | ⬜ |
| `tank` | 坦克 | ⬜ |

## 04 — 虫子 (`plugins/icons/insects.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `butterfly` | 蝴蝶 | ⬜ |
| `bee` | 蜜蜂 | ⬜ |
| `ant` | 蚂蚁 | ⬜ |
| `beetle` | 甲虫 | ⬜ |
| `ladybug` | 瓢虫 | ⬜ |
| `spider` | 蜘蛛 | ⬜ |
| `dragonfly` | 蜻蜓 | ⬜ |
| `mosquito` | 蚊子 | ⬜ |
| `caterpillar` | 毛毛虫 | ⬜ |
| `snail` | 蜗牛 | ⬜ |

## 05 — 动物 (`plugins/icons/animals.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `dog` | 狗 | ⬜ |
| `cat` | 猫 | ⬜ |
| `bird` | 鸟 | ⬜ |
| `fish` | 鱼 | ⬜ |
| `lion` | 狮子 | ⬜ |
| `elephant` | 大象 | ⬜ |
| `bear` | 熊 | ⬜ |
| `rabbit` | 兔子 | ⬜ |
| `horse` | 马 | ⬜ |
| `cow` | 牛 | ⬜ |
| `pig` | 猪 | ⬜ |
| `penguin` | 企鹅 | ⬜ |
| `dolphin` | 海豚 | ⬜ |
| `shark` | 鲨鱼 | ⬜ |
| `eagle` | 老鹰 | ⬜ |
| `owl` | 猫头鹰 | ⬜ |
| `fox` | 狐狸 | ⬜ |
| `wolf` | 狼 | ⬜ |
| `deer` | 鹿 | ⬜ |
| `turtle` | 乌龟 | ⬜ |
| `frog` | 青蛙 | ⬜ |
| `crocodile` | 鳄鱼 | ⬜ |
| `snake` | 蛇 | ⬜ |
| `octopus` | 章鱼 | ⬜ |
| `monkey` | 猴子 | ⬜ |

## 06 — 分析 (`plugins/icons/analytics.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `barChart` | 柱状图 | ⬜ |
| `lineChart` | 折线图 | ⬜ |
| `pieChart` | 饼图 | ⬜ |
| `areaChart` | 面积图 | ⬜ |
| `scatterChart` | 散点图 | ⬜ |
| `gaugeChart` | 仪表盘 | ⬜ |
| `funnel` | 漏斗图 | ⬜ |
| `trendUp` | 趋势上升 | ⬜ |
| `trendDown` | 趋势下降 | ⬜ |
| `kpi` | KPI 指标 | ⬜ |
| `table` | 数据表 | ⬜ |
| `filter` | 筛选器 | ⬜ |
| `sort` | 排序 | ⬜ |
| `calculator` | 计算器 | ⬜ |
| `report` | 报表 | ⬜ |
| `dashboard` | 仪表板 | ⬜ |
| `magnify` | 放大镜分析 | ⬜ |
| `target` | 目标/靶心 | ⬜ |

## 07 — 风景 (`plugins/icons/scenery.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `mountain` | 山脉 | ⬜ |
| `volcano` | 火山 | ⬜ |
| `island` | 小岛 | ⬜ |
| `beach` | 海滩 | ⬜ |
| `lake` | 湖泊 | ⬜ |
| `forest` | 森林 | ⬜ |
| `desert` | 沙漠 | ⬜ |
| `waterfall` | 瀑布 | ⬜ |
| `bridge` | 桥梁 | ⬜ |
| `lighthouse` | 灯塔 | ⬜ |
| `cityscape` | 城市天际线 | ⬜ |
| `farm` | 农场 | ⬜ |
| `cave` | 洞穴 | ⬜ |
| `glacier` | 冰川 | ⬜ |
| `canyon` | 峡谷 | ⬜ |

## 08 — 服饰 (`plugins/icons/clothing.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `tshirt` | T恤 | ⬜ |
| `jacket` | 外套 | ⬜ |
| `dress` | 连衣裙 | ⬜ |
| `pants` | 裤子 | ⬜ |
| `shoes` | 鞋子 | ⬜ |
| `hat` | 帽子 | ⬜ |
| `gloves` | 手套 | ⬜ |
| `scarf` | 围巾 | ⬜ |
| `tie` | 领带 | ⬜ |
| `socks` | 袜子 | ⬜ |
| `bag` | 手提包 | ⬜ |
| `backpack` | 背包 | ⬜ |
| `glasses` | 眼镜 | ⬜ |
| `sunglasses` | 太阳镜 | ⬜ |
| `watch` | 手表 | ⬜ |
| `ring` | 戒指 | ⬜ |
| `necklace` | 项链 | ⬜ |
| `crown` | 皇冠 | ⬜ |
| `umbrella` | 雨伞 | ⬜ |
| `boot` | 靴子 | ⬜ |

## 09 — 辅助功能 (`plugins/icons/accessibility.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `wheelchair` | 轮椅 | ⬜ |
| `hearingAid` | 助听器 | ⬜ |
| `braille` | 盲文 | ⬜ |
| `blindCane` | 盲杖 | ⬜ |
| `signLanguage` | 手语 | ⬜ |
| `lowVision` | 低视力 | ⬜ |
| `cognitiveDisability` | 认知障碍 | ⬜ |
| `ramp` | 无障碍坡道 | ⬜ |
| `elevator` | 电梯 | ⬜ |
| `accessibleToilet` | 无障碍卫生间 | ⬜ |
| `captioning` | 字幕 | ⬜ |
| `audioDescription` | 音频描述 | ⬜ |
| `universalAccess` | 通用访问 | ⬜ |
| `easyRead` | 易读 | ⬜ |

## 10 — 工具与建筑物 (`plugins/icons/tools.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `hammer` | 锤子 | ⬜ |
| `screwdriver` | 螺丝刀 | ⬜ |
| `wrench` | 扳手 | ⬜ |
| `saw` | 锯子 | ⬜ |
| `drill` | 电钻 | ⬜ |
| `scissors` | 剪刀 | ⬜ |
| `ruler` | 直尺 | ⬜ |
| `paintbrush` | 油漆刷 | ⬜ |
| `building` | 楼房 | ⬜ |
| `house` | 住宅 | ⬜ |
| `factory` | 工厂 | ⬜ |
| `bridge` | 桥梁 | ⬜ |
| `tower` | 塔楼 | ⬜ |
| `crane` | 塔吊 | ⬜ |
| `bricks` | 砖块 | ⬜ |
| `hardhat` | 安全帽 | ⬜ |
| `pliers` | 钳子 | ⬜ |
| `tape` | 卷尺 | ⬜ |
| `level` | 水平仪 | ⬜ |
| `shovel` | 铁锹 | ⬜ |
| `pickaxe` | 镐 | ⬜ |
| `ladder` | 梯子 | ⬜ |
| `bucket` | 水桶 | ⬜ |
| `blueprint` | 蓝图 | ⬜ |

## 11 — 技术与电子 (`plugins/icons/technology.js`)（已有部分）

| icon type | 中文 | 状态 | 文件 |
|---|---|---|---|
| `monitor` | 显示器 | ✅ | `plugins/basic/monitor.js` |
| `phone` | 手机 | ✅ | `plugins/basic/phone.js` |
| `tablet` | 平板 | ✅ | `plugins/basic/tablet.js` |
| `database` | 数据库 | ✅ | `plugins/basic/database.js` |
| `server` | 服务器 | ⬜ | |
| `router` | 路由器 | ⬜ | |
| `keyboard` | 键盘 | ⬜ | |
| `mouse` | 鼠标 | ⬜ | |
| `printer` | 打印机 | ⬜ | |
| `scanner` | 扫描仪 | ⬜ | |
| `speaker` | 音响 | ⬜ | |
| `headphones` | 耳机 | ⬜ | |
| `microphone` | 麦克风 | ⬜ | |
| `camera` | 相机 | ⬜ | |
| `gamepad` | 手柄 | ⬜ | |
| `chip` | 芯片 | ⬜ | |
| `battery` | 电池 | ⬜ | |
| `usb` | USB 接口 | ⬜ | |
| `sdCard` | SD 卡 | ⬜ | |
| `smartwatch` | 智能手表 | ⬜ | |
| `vr` | VR 设备 | ⬜ | |
| `projector` | 投影仪 | ⬜ | |

## 12 — 假日 (`plugins/icons/holiday.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `christmasTree` | 圣诞树 | ⬜ |
| `gift` | 礼物 | ⬜ |
| `pumpkin` | 南瓜灯 | ⬜ |
| `firework` | 烟花 | ⬜ |
| `lantern` | 灯笼 | ⬜ |
| `cake` | 生日蛋糕 | ⬜ |
| `balloon` | 气球 | ⬜ |
| `easter` | 复活节彩蛋 | ⬜ |
| `turkey` | 火鸡 | ⬜ |
| `snowman` | 雪人 | ⬜ |
| `santaHat` | 圣诞帽 | ⬜ |
| `candyCane` | 糖果棒 | ⬜ |
| `stocking` | 圣诞袜 | ⬜ |
| `menorah` | 烛台 | ⬜ |
| `mooncake` | 月饼 | ⬜ |

## 13 — 箭头 (`plugins/icons/arrows.js`)（已有部分）

| icon type | 中文 | 状态 | 文件 |
|---|---|---|---|
| `rightArrow` | 右箭头 | ✅ | `plugins/basic/rightArrow.js` |
| `bottomArrow` | 下箭头 | ✅ | `plugins/basic/bottomArrow.js` |
| `leftAndRightArrow` | 双向箭头 | ✅ | `plugins/basic/leftAndRightArrow.js` |
| `dovetailArrow` | 燕尾箭头 | ✅ | `plugins/basic/dovetailArrow.js` |
| `leftArrow` | 左箭头 | ⬜ | |
| `topArrow` | 上箭头 | ⬜ | |
| `circleArrow` | 循环箭头 | ⬜ | |
| `refreshArrow` | 刷新箭头 | ⬜ | |
| `expandArrow` | 展开箭头 | ⬜ | |
| `collapseArrow` | 折叠箭头 | ⬜ | |
| `branchArrow` | 分叉箭头 | ⬜ | |
| `mergeArrow` | 合并箭头 | ⬜ | |
| `curveArrow` | 弯曲箭头 | ⬜ | |
| `spiralArrow` | 螺旋箭头 | ⬜ | |
| `bounceArrow` | 反弹箭头 | ⬜ | |
| `swapArrow` | 交换箭头 | ⬜ | |

## 14 — 教育 (`plugins/icons/education.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `book` | 书籍 | ⬜ |
| `openBook` | 翻开的书 | ⬜ |
| `pencil` | 铅笔 | ⬜ |
| `eraser` | 橡皮擦 | ⬜ |
| `backpack` | 书包 | ⬜ |
| `school` | 学校建筑 | ⬜ |
| `graduationCap` | 学士帽 | ⬜ |
| `diploma` | 毕业证书 | ⬜ |
| `globe` | 地球仪 | ⬜ |
| `microscope` | 显微镜 | ⬜ |
| `flask` | 烧杯 | ⬜ |
| `abacus` | 算盘 | ⬜ |
| `chalkboard` | 黑板 | ⬜ |
| `ruler_education` | 三角尺 | ⬜ |
| `compass` | 圆规 | ⬜ |
| `calculator_edu` | 计算器 | ⬜ |
| `trophy` | 奖杯 | ⬜ |
| `medal` | 奖牌 | ⬜ |
| `certificate` | 证书 | ⬜ |
| `library` | 图书馆 | ⬜ |

## 15 — 界面 (`plugins/icons/ui.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `home` | 首页 | ⬜ |
| `search` | 搜索 | ⬜ |
| `settings` | 设置 | ⬜ |
| `notification` | 通知 | ⬜ |
| `user` | 用户 | ⬜ |
| `menu` | 菜单 | ⬜ |
| `close` | 关闭 | ⬜ |
| `back` | 返回 | ⬜ |
| `share` | 分享 | ⬜ |
| `download` | 下载 | ⬜ |
| `upload` | 上传 | ⬜ |
| `refresh` | 刷新 | ⬜ |
| `zoomIn` | 放大 | ⬜ |
| `zoomOut` | 缩小 | ⬜ |
| `fullscreen` | 全屏 | ⬜ |
| `minimize` | 最小化 | ⬜ |
| `copy` | 复制 | ⬜ |
| `paste` | 粘贴 | ⬜ |
| `undo` | 撤销 | ⬜ |
| `redo` | 重做 | ⬜ |
| `trash` | 删除 | ⬜ |
| `edit` | 编辑 | ⬜ |
| `pin` | 图钉 | ⬜ |
| `link` | 链接 | ⬜ |

## 16 — 居家 (`plugins/icons/home.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `sofa` | 沙发 | ⬜ |
| `bed` | 床 | ⬜ |
| `bathtub` | 浴缸 | ⬜ |
| `toilet` | 马桶 | ⬜ |
| `fridge` | 冰箱 | ⬜ |
| `washingMachine` | 洗衣机 | ⬜ |
| `microwave` | 微波炉 | ⬜ |
| `stove` | 灶台 | ⬜ |
| `lamp` | 台灯 | ⬜ |
| `curtain` | 窗帘 | ⬜ |
| `door` | 门 | ⬜ |
| `window` | 窗户 | ⬜ |
| `wardrobe` | 衣柜 | ⬜ |
| `bookshelf` | 书架 | ⬜ |
| `desk` | 桌子 | ⬜ |
| `chair` | 椅子 | ⬜ |
| `clock` | 时钟 | ⬜ |
| `plant` | 植物 | ⬜ |
| `picture` | 挂画 | ⬜ |
| `candle` | 蜡烛 | ⬜ |
| `fireplace` | 壁炉 | ⬜ |
| `vacuum` | 吸尘器 | ⬜ |
| `iron` | 熨斗 | ⬜ |
| `fan` | 风扇 | ⬜ |
| `airConditioner` | 空调 | ⬜ |

## 17 — 恐龙 (`plugins/icons/dinosaurs.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `trex` | 霸王龙 | ⬜ |
| `triceratops` | 三角龙 | ⬜ |
| `brachiosaurus` | 腕龙 | ⬜ |
| `stegosaurus` | 剑龙 | ⬜ |
| `pterodactyl` | 翼手龙 | ⬜ |
| `velociraptor` | 迅猛龙 | ⬜ |
| `ankylosaurus` | 甲龙 | ⬜ |
| `diplodocus` | 梁龙 | ⬜ |

## 18 — 脸 (`plugins/icons/faces.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `faceSmile` | 笑脸 | ⬜ |
| `faceSad` | 悲伤脸 | ⬜ |
| `faceAngry` | 愤怒脸 | ⬜ |
| `faceSurprised` | 惊讶脸 | ⬜ |
| `faceLove` | 爱心眼 | ⬜ |
| `faceCool` | 酷脸（墨镜）| ⬜ |
| `faceWink` | 眨眼脸 | ⬜ |
| `faceTongue` | 吐舌脸 | ⬜ |
| `faceCry` | 哭脸 | ⬜ |
| `faceThink` | 思考脸 | ⬜ |
| `faceBlush` | 害羞脸 | ⬜ |
| `faceSleep` | 睡觉脸 | ⬜ |
| `faceSick` | 生病脸 | ⬜ |
| `faceMask` | 口罩脸 | ⬜ |
| `faceParty` | 派对脸 | ⬜ |
| `faceMonster` | 怪物脸 | ⬜ |

## 19 — 流程 (`plugins/icons/flowchart.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `flowStart` | 开始/结束（椭圆）| ⬜ |
| `flowProcess` | 处理（矩形）| ⬜ |
| `flowDecision` | 判断（菱形）| ⬜ |
| `flowInput` | 输入/输出（平行四边形）| ⬜ |
| `flowDatabase` | 数据库（圆柱）| ⬜ |
| `flowDocument` | 文档 | ⬜ |
| `flowMultiDoc` | 多文档 | ⬜ |
| `flowManualInput` | 手工输入 | ⬜ |
| `flowPrep` | 准备（六边形）| ⬜ |
| `flowConnector` | 连接符（圆）| ⬜ |
| `flowLoop` | 循环 | ⬜ |
| `flowMerge` | 合并 | ⬜ |

## 20 — 贸易 (`plugins/icons/trade.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `shoppingCart` | 购物车 | ⬜ |
| `shoppingBag` | 购物袋 | ⬜ |
| `wallet` | 钱包 | ⬜ |
| `creditCard` | 信用卡 | ⬜ |
| `coin` | 硬币 | ⬜ |
| `banknote` | 纸币 | ⬜ |
| `receipt` | 收据 | ⬜ |
| `barcode` | 条形码 | ⬜ |
| `qrcode` | 二维码 | ⬜ |
| `priceTag` | 价格标签 | ⬜ |
| `store` | 商店 | ⬜ |
| `package` | 包裹 | ⬜ |
| `delivery` | 配送 | ⬜ |
| `contract` | 合同 | ⬜ |
| `invoice` | 发票 | ⬜ |
| `scale` | 秤 | ⬜ |

## 21 — 拼图与游戏 (`plugins/icons/games.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `puzzle` | 拼图 | ⬜ |
| `chess` | 国际象棋棋子 | ⬜ |
| `dice` | 骰子 | ⬜ |
| `joystick` | 摇杆 | ⬜ |
| `gamepad` | 手柄 | ⬜ |
| `cards` | 扑克牌 | ⬜ |
| `domino` | 多米诺 | ⬜ |
| `trophy_game` | 奖杯 | ⬜ |
| `medal_game` | 奖牌 | ⬜ |
| `lego` | 积木 | ⬜ |
| `kite` | 风筝 | ⬜ |
| `top` | 陀螺 | ⬜ |
| `marbles` | 弹珠 | ⬜ |
| `pacman` | Pacman 风格 | ⬜ |

## 22 — 庆典 (`plugins/icons/celebration.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `confetti` | 彩纸 | ⬜ |
| `partyPopper` | 派对礼炮 | ⬜ |
| `champagne` | 香槟 | ⬜ |
| `fireworks` | 烟花 | ⬜ |
| `ribbon` | 彩带 | ⬜ |
| `cake_cel` | 蛋糕 | ⬜ |
| `balloons` | 气球 | ⬜ |
| `star_cel` | 庆典星 | ⬜ |
| `crown_cel` | 王冠 | ⬜ |
| `gift_cel` | 礼物 | ⬜ |
| `horn` | 号角 | ⬜ |
| `banner` | 横幅 | ⬜ |
| `sparkler` | 手持烟花棒 | ⬜ |
| `weddingRings` | 婚戒 | ⬜ |

## 23 — 人员 (`plugins/icons/people.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `person` | 单人 | ⬜ |
| `personGroup` | 群组 | ⬜ |
| `personAdd` | 添加用户 | ⬜ |
| `personRemove` | 移除用户 | ⬜ |
| `personCheck` | 已验证用户 | ⬜ |
| `personBlock` | 封禁用户 | ⬜ |
| `baby` | 婴儿 | ⬜ |
| `child` | 儿童 | ⬜ |
| `adult` | 成人 | ⬜ |
| `elder` | 老人 | ⬜ |
| `couple` | 情侣 | ⬜ |
| `family` | 家庭 | ⬜ |
| `runner` | 跑步者 | ⬜ |
| `swimmer` | 游泳者 | ⬜ |
| `businessman` | 商务人士 | ⬜ |
| `worker` | 工人 | ⬜ |
| `doctor` | 医生 | ⬜ |
| `teacher` | 教师 | ⬜ |
| `chef` | 厨师 | ⬜ |
| `astronaut` | 宇航员 | ⬜ |

## 24 — 商业 (`plugins/icons/business.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `briefcase` | 公文包 | ⬜ |
| `office` | 办公楼 | ⬜ |
| `meeting` | 会议室 | ⬜ |
| `presentation` | 演示文稿 | ⬜ |
| `signature` | 签名 | ⬜ |
| `email` | 邮件 | ⬜ |
| `calendar` | 日历 | ⬜ |
| `clock_biz` | 时钟 | ⬜ |
| `target_biz` | 目标 | ⬜ |
| `handshake` | 握手 | ⬜ |
| `megaphone` | 扩音器 | ⬜ |
| `award` | 奖项 | ⬜ |
| `chart_biz` | 图表 | ⬜ |
| `idea` | 灯泡/想法 | ⬜ |
| `teamwork` | 团队合作 | ⬜ |
| `network` | 网络图 | ⬜ |
| `workflow` | 工作流 | ⬜ |
| `strategy` | 策略棋盘 | ⬜ |
| `growth` | 增长 | ⬜ |
| `investment` | 投资 | ⬜ |
| `startup` | 创业火箭 | ⬜ |
| `partnership` | 合作 | ⬜ |
| `revenue` | 收入 | ⬜ |
| `expense` | 支出 | ⬜ |
| `budget` | 预算 | ⬜ |

## 25 — 身体部位 (`plugins/icons/bodyparts.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `eye` | 眼睛 | ⬜ |
| `ear` | 耳朵 | ⬜ |
| `nose` | 鼻子 | ⬜ |
| `mouth` | 嘴巴 | ⬜ |
| `hand` | 手 | ⬜ |
| `foot` | 脚 | ⬜ |
| `brain` | 大脑 | ⬜ |
| `heart_body` | 心脏 | ⬜ |
| `lung` | 肺 | ⬜ |
| `bone` | 骨骼 | ⬜ |
| `muscle` | 肌肉 | ⬜ |
| `tooth` | 牙齿 | ⬜ |
| `fingerPrint` | 指纹 | ⬜ |
| `dna` | DNA | ⬜ |
| `cell` | 细胞 | ⬜ |

## 26 — 食品和饮料 (`plugins/icons/food.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `apple` | 苹果 | ⬜ |
| `banana` | 香蕉 | ⬜ |
| `orange` | 橙子 | ⬜ |
| `strawberry` | 草莓 | ⬜ |
| `burger` | 汉堡 | ⬜ |
| `pizza` | 披萨 | ⬜ |
| `sushi` | 寿司 | ⬜ |
| `noodles` | 面条 | ⬜ |
| `rice` | 米饭碗 | ⬜ |
| `bread` | 面包 | ⬜ |
| `coffee` | 咖啡 | ⬜ |
| `tea` | 茶 | ⬜ |
| `juice` | 果汁 | ⬜ |
| `beer` | 啤酒 | ⬜ |
| `wine` | 红酒 | ⬜ |
| `iceCream` | 冰淇淋 | ⬜ |
| `cake_food` | 蛋糕 | ⬜ |
| `cookie` | 饼干 | ⬜ |
| `candy` | 糖果 | ⬜ |
| `popcorn` | 爆米花 | ⬜ |
| `hotDog` | 热狗 | ⬜ |
| `taco` | 塔可 | ⬜ |
| `salad` | 沙拉 | ⬜ |
| `soup` | 汤 | ⬜ |
| `egg` | 鸡蛋 | ⬜ |

## 27 — 体育 (`plugins/icons/sports.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `soccer` | 足球 | ⬜ |
| `basketball` | 篮球 | ⬜ |
| `tennis` | 网球 | ⬜ |
| `baseball` | 棒球 | ⬜ |
| `volleyball` | 排球 | ⬜ |
| `rugby` | 橄榄球 | ⬜ |
| `golf` | 高尔夫 | ⬜ |
| `swimming` | 游泳 | ⬜ |
| `cycling` | 骑行 | ⬜ |
| `boxing` | 拳击 | ⬜ |
| `skiing` | 滑雪 | ⬜ |
| `surfing` | 冲浪 | ⬜ |
| `archery` | 射箭 | ⬜ |
| `weightlifting` | 举重 | ⬜ |
| `gymnastics` | 体操 | ⬜ |
| `pingpong` | 乒乓球 | ⬜ |
| `badminton` | 羽毛球 | ⬜ |
| `fencing` | 击剑 | ⬜ |
| `rowing` | 赛艇 | ⬜ |
| `marathon` | 马拉松 | ⬜ |
| `yoga` | 瑜伽 | ⬜ |
| `martialArts` | 武术 | ⬜ |

## 28 — 天气和季节 (`plugins/icons/weather.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `sun` | 晴天 | ⬜ |
| `moon` | 月亮 | ⬜ |
| `cloud` | 云 | ⬜ |
| `rain` | 下雨 | ⬜ |
| `snow` | 下雪 | ⬜ |
| `storm` | 暴风 | ⬜ |
| `lightning` | 闪电 | ⬜ |
| `fog` | 雾 | ⬜ |
| `tornado` | 龙卷风 | ⬜ |
| `rainbow` | 彩虹 | ⬜ |
| `wind` | 风 | ⬜ |
| `temperature` | 温度计 | ⬜ |
| `spring` | 春天 | ⬜ |
| `summer` | 夏天 | ⬜ |
| `autumn` | 秋天 | ⬜ |
| `winter` | 冬天 | ⬜ |
| `sunrise` | 日出 | ⬜ |
| `sunset` | 日落 | ⬜ |
| `drought` | 干旱 | ⬜ |
| `flood` | 洪水 | ⬜ |

## 29 — 通信 (`plugins/icons/communication.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `chatBubble` | 聊天气泡 | ⬜ |
| `chatGroup` | 群聊 | ⬜ |
| `mail` | 邮件信封 | ⬜ |
| `mailOpen` | 打开邮件 | ⬜ |
| `videoCall` | 视频通话 | ⬜ |
| `voiceCall` | 语音通话 | ⬜ |
| `phone_com` | 电话 | ⬜ |
| `antenna` | 天线 | ⬜ |
| `satellite` | 卫星 | ⬜ |
| `podcast` | 播客 | ⬜ |
| `broadcast` | 广播 | ⬜ |
| `newspaper` | 报纸 | ⬜ |
| `megaphone_com` | 广播喇叭 | ⬜ |
| `signal` | 信号波 | ⬜ |
| `walkie` | 对讲机 | ⬜ |
| `fax` | 传真 | ⬜ |
| `beeper` | 寻呼机 | ⬜ |
| `qrShare` | 扫码分享 | ⬜ |
| `pushNotif` | 推送通知 | ⬜ |
| `chatBot` | 聊天机器人 | ⬜ |

## 30 — 位置 (`plugins/icons/location.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `mapPin` | 地图图钉 | ⬜ |
| `map` | 地图 | ⬜ |
| `compass_loc` | 指南针 | ⬜ |
| `gps` | GPS 信号 | ⬜ |
| `route` | 路线 | ⬜ |
| `destination` | 目的地（旗帜）| ⬜ |
| `home_loc` | 家（位置）| ⬜ |
| `office_loc` | 办公室（位置）| ⬜ |
| `hospital_loc` | 医院（位置）| ⬜ |
| `airport_loc` | 机场（位置）| ⬜ |
| `parking` | 停车场 P | ⬜ |
| `subway` | 地铁 | ⬜ |
| `globe_loc` | 地球仪 | ⬜ |
| `territory` | 区域边界 | ⬜ |
| `landmark` | 地标建筑 | ⬜ |

## 31 — 医学 (`plugins/icons/medical.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `cross_med` | 医疗十字 | ⬜ |
| `stethoscope` | 听诊器 | ⬜ |
| `syringe` | 注射器 | ⬜ |
| `pill` | 药片 | ⬜ |
| `capsule` | 胶囊 | ⬜ |
| `bandaid` | 创可贴 | ⬜ |
| `hospital` | 医院 | ⬜ |
| `ambulance_med` | 救护车 | ⬜ |
| `heartbeat` | 心电图 | ⬜ |
| `xray` | X光 | ⬜ |
| `microscope_med` | 显微镜 | ⬜ |
| `virus` | 病毒 | ⬜ |
| `bacteria` | 细菌 | ⬜ |
| `dna_med` | DNA 双螺旋 | ⬜ |
| `wheelchair_med` | 轮椅 | ⬜ |
| `firstAid` | 急救箱 | ⬜ |
| `thermometer` | 温度计 | ⬜ |
| `bloodDrop` | 血滴 | ⬜ |
| `lungs` | 肺部 | ⬜ |
| `brain_med` | 大脑 | ⬜ |

## 32 — 艺术 (`plugins/icons/art.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `palette` | 调色盘 | ⬜ |
| `paintbrush_art` | 画笔 | ⬜ |
| `canvas` | 画布/画架 | ⬜ |
| `sculpture` | 雕塑 | ⬜ |
| `camera_art` | 照相机 | ⬜ |
| `film` | 胶卷 | ⬜ |
| `music` | 音乐符号 | ⬜ |
| `guitar` | 吉他 | ⬜ |
| `piano` | 钢琴 | ⬜ |
| `violin` | 小提琴 | ⬜ |
| `microphone_art` | 麦克风 | ⬜ |
| `theater` | 戏剧面具 | ⬜ |
| `quill` | 羽毛笔 | ⬜ |
| `book_art` | 书籍 | ⬜ |
| `origami` | 折纸 | ⬜ |

## 33 — 职业 (`plugins/icons/professions.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `doctor_pro` | 医生 | ⬜ |
| `nurse` | 护士 | ⬜ |
| `teacher_pro` | 教师 | ⬜ |
| `lawyer` | 律师 | ⬜ |
| `engineer` | 工程师 | ⬜ |
| `scientist` | 科学家 | ⬜ |
| `chef_pro` | 厨师 | ⬜ |
| `firefighter` | 消防员 | ⬜ |
| `police` | 警察 | ⬜ |
| `soldier` | 士兵 | ⬜ |
| `astronaut_pro` | 宇航员 | ⬜ |
| `farmer` | 农民 | ⬜ |
| `artist_pro` | 艺术家 | ⬜ |
| `athlete` | 运动员 | ⬜ |
| `programmer` | 程序员 | ⬜ |
| `architect` | 建筑师 | ⬜ |

## 34 — 自然和户外 (`plugins/icons/nature.js`)

| icon type | 中文 | 状态 |
|---|---|---|
| `leaf` | 叶子 | ⬜ |
| `flower` | 花 | ⬜ |
| `tree_nat` | 树 | ✅ | `plugins/basic/tree.js` |
| `cactus` | 仙人掌 | ⬜ |
| `mushroom` | 蘑菇 | ⬜ |
| `grass` | 草地 | ⬜ |
| `wave` | 海浪 | ⬜ |
| `fire` | 火焰 | ⬜ |
| `water` | 水波 | ⬜ |
| `rock` | 石头 | ⬜ |
| `crystal` | 水晶 | ⬜ |
| `seed` | 种子 | ⬜ |
| `sprout` | 嫩芽 | ⬜ |
| `bamboo` | 竹子 | ⬜ |
| `coral` | 珊瑚 | ⬜ |
| `seashell` | 贝壳 | ⬜ |
| `feather` | 羽毛 | ⬜ |
| `paw` | 爪印 | ⬜ |
| `web` | 蜘蛛网 | ⬜ |
| `nest` | 鸟巢 | ⬜ |
| `hive` | 蜂巢 | ⬜ |
| `footprint` | 脚印 | ⬜ |
| `campfire` | 篝火 | ⬜ |
| `tent` | 帐篷 | ⬜ |
| `compass_nat` | 指南针 | ⬜ |
