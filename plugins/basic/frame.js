/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {container} from "@anna/core/base/container.js";

/**
 * Frame — 固定尺寸容器
 *
 * 与 group 的区别：
 *  - 用户手动画出边界（固定大小，不自动收缩/扩展）
 *  - 可将其他形状拖入其中成为子形状
 *  - 默认虚线边框，一眼可辨容器身份
 *  - containerFocusFirst：先点击 frame 本身，再点击内部子形状
 */
const frame = (id, x, y, width, height, parent) => {
    const self = container(id, x, y, width, height, parent);
    self.type = "frame";
    self.text = "";
    self.hideText = true;

    // 固定大小：不自动跟随子形状调整边界
    self.autoAlign = false;
    self.autoFit   = false;

    // 容器行为
    self.dynamicAddItem     = true;   // 允许拖入子形状
    self.ifMaskItems        = false;  // 不裁剪溢出（可看到超出边界的子形状）
    self.containerFocusFirst = true;  // 先选 frame，再选内部子形状
    self.scrollAble         = false;

    // 虚线边框（dashWidth > 4 → CSS border-style: dashed）
    self.dashWidth = 8;

    // 禁用不需要的 container 布局/滚动功能
    self.arrangeShapes = () => {};
    self.scroll        = () => {};

    return self;
};

export {frame};
