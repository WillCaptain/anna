/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {canvasDrawer} from './canvasDrawer.js';
import {drawer} from './htmlDrawer.js';

/**
 * 绘制发光的边缘：4 个等间距亮点 + 渐变短尾，沿矩形边框顺时针匀速运行
 */
const emphasizeShine = (context, x, y, shape, control) => {
    const W = shape.width;
    const H = shape.height;
    const perimeter = 2 * (W + H);

    const now = performance.now();
    const dt  = control.prevTime > 0 ? Math.min(now - control.prevTime, 100) : 0;
    control.prevTime = now;

    const SPEED    = 75;  // px/s（慢两倍）
    const TAIL_LEN = 60;  // 尾迹长度（像素）
    const DOT_R    = 2.5;
    control.pixelPos = ((control.pixelPos ?? 0) + (dt / 1000) * SPEED) % perimeter;

    // 将周长位置展开到各边坐标（以形状中心为原点，顺时针：上→右→下→左）
    const drawDotWithTail = (pos) => {
        const p = ((pos % perimeter) + perimeter) % perimeter;
        let cx, cy, tx1, ty1;   // 亮点坐标 & 尾巴起点

        if (p < W) {
            const ep = p, ts = Math.max(0, ep - TAIL_LEN);
            cx = -W/2 + ep;    cy = -H/2;
            tx1 = -W/2 + ts;  ty1 = -H/2;
        } else if (p < W + H) {
            const ep = p - W, ts = Math.max(0, ep - TAIL_LEN);
            cx = W/2;          cy = -H/2 + ep;
            tx1 = W/2;         ty1 = -H/2 + ts;
        } else if (p < 2*W + H) {
            const ep = p - W - H, ts = Math.max(0, ep - TAIL_LEN);
            cx = W/2 - ep;     cy = H/2;
            tx1 = W/2 - ts;   ty1 = H/2;
        } else {
            const ep = p - 2*W - H, ts = Math.max(0, ep - TAIL_LEN);
            cx = -W/2;         cy = H/2 - ep;
            tx1 = -W/2;        ty1 = H/2 - ts;
        }

        context.save();

        // 渐变尾巴（尾端透明 → 头部暖金色）
        const tail = context.createLinearGradient(tx1, ty1, cx, cy);
        tail.addColorStop(0,   'rgba(210,140,50,0)');
        tail.addColorStop(0.6, 'rgba(230,165,75,0.50)');
        tail.addColorStop(1,   'rgba(255,205,110,0.85)');
        context.strokeStyle = tail;
        context.lineWidth   = 2;
        context.lineCap     = 'round';
        context.beginPath();
        context.moveTo(tx1, ty1);
        context.lineTo(cx, cy);
        context.stroke();

        // 亮点辉光（白色中心 + 暖金外晕）
        const grd = context.createRadialGradient(cx, cy, 0, cx, cy, DOT_R * 3);
        grd.addColorStop(0,   'rgba(255,255,255,0.92)');
        grd.addColorStop(0.4, 'rgba(255,220,140,0.40)');
        grd.addColorStop(1,   'rgba(255,220,140,0)');
        context.beginPath();
        context.arc(cx, cy, DOT_R * 3, 0, Math.PI * 2);
        context.fillStyle = grd;
        context.fill();

        // 亮白芯
        context.beginPath();
        context.arc(cx, cy, DOT_R * 0.7, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255,255,255,0.98)';
        context.fill();

        context.restore();
    };

    for (let i = 0; i < 4; i++) {
        drawDotWithTail(control.pixelPos + i * perimeter / 4);
    }
};

/**
 * 绘制流光特效
 * 辉子 2021
 */
const drawGradientLight = (context, x, y, shape, control) => {
    const OFFSET = 50;
    const RATE = 1.5;
    context.fillStyle = "red";
    let g = context.createLinearGradient(control.times - shape.width / 2, shape.height / 2, control.times - shape.width / 2 + OFFSET, -shape.height / 2)
    g.addColorStop(0, "transparent");
    g.addColorStop(0.4, shape.shineColor2 ? shape.shineColor2 : "rgba(255,255,255,0.7)");
    g.addColorStop(0.5, shape.shineColor1 ? shape.shineColor1 : "rgba(255,255,255,0.8)");
    g.addColorStop(0.6, shape.shineColor2 ? shape.shineColor2 : "rgba(255,255,255,0.7)");
    g.addColorStop(1, "transparent");
    context.fillStyle = g;
    context.beginPath();
    context.rect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
    context.fill();

    control.times += 1;
    if (control.times > (shape.width + OFFSET * RATE)) {
        control.times = -OFFSET * RATE;
    }

};

/**
 * 绘制动画
 * 辉子 2021
 */
const drawDynamic = (context, x, y, shape, control) => {
    if (!shape.visible) {
        return;
    }
    if (shape.dynamicCode) {
        try {
            eval("(async function eventCode(){" + shape.dynamicCode + "})();");
        } catch (e) {
            // 没关系，继续，不影响其他错误信息的处理.
        }
    } else {
        if (!shape.emphasized) {
            return;
        }
        switch (shape.emphasizeType) {
            case 1:
                drawGradientLight(context, x, y, shape, control);
                break;
            // add more here
            default:
                emphasizeShine(context, x, y, shape, control);
                break;
        }
    }
};

/**
 * 以html形式绘制
 * 辉子 2021
 */
const rectangleDrawer = (shape, div, x, y) => {
    let self = drawer(shape, div, x, y);
    self.type = "rectangle html drawer";
    self.drawStatic = (context, varX, varY) => {
        self.parent.style.opacity = shape.globalAlpha;
    };

    self.drawFocusFrame = context => drawFocusFrame(shape, context);

    self.drawLinkingFrame = context => drawLinkingFrame(shape, context);

    let resize = self.resize;
    self.resize = () => {
        let size = resize.call(self);
        return autoHeightResize(self, shape, size);
    };

    let control = { percent: 0, times: 0, pixelPos: 0, prevTime: 0 };
    self.drawDynamic = (context, x, y) => {
        drawDynamic(context, x, y, shape, control);
    };

    return self;
};

/**
 * 自定义的contextMenu drawer
 *
 * @param shapeLength 选中的图形数量
 * @param baseDrawer 基类drawer
 * @returns {function(*, *, *, *): {}}
 */
const contextMenuDrawer = (shapeLength, baseDrawer = drawer) => {
    return (shape, div, x, y) => {
        const self = baseDrawer(shape, div, x, y);
        self.type = "context menu html drawer";
        let drawStatic = self.drawStatic;

        self.drawStatic = (x, y) => {
            if (shapeLength > 1) {
                self.parent.style.border = "2px dashed #aeb5c0";
            } else {
                self.parent.style.border = "0px dashed #aeb5c0";
            }
            drawStatic.call(self, x, y);
        };
        return self;
    }
};

/**
 * 以画布形式绘制
 */
const canvasRectangleDrawer = function (shape, div, x, y) {
    let self = canvasDrawer(shape, div, x, y);
    self.type = "rectangle canvas drawer";
    self.drawStatic = (context, x, y) => {
        context.beginPath();
        context.rect(x, y, shape.width - 2, shape.height - 2);
        context.fillStyle = shape.backColor;
        context.globalAlpha = shape.backAlpha;
        context.fill();
        context.globalAlpha = 1;
    };

    self.drawFocusFrame = context => drawFocusFrame(shape, context);

    self.drawLinkingFrame = context => drawLinkingFrame(shape, context);

    let control = { percent: 0, times: 0, pixelPos: 0, prevTime: 0 };
    self.drawDynamic = (context, x, y) => {
        drawDynamic(context, x, y, shape, control);
    };

    let resize = self.resize;
    self.resize = () => {
        let size = resize.call(self);
        return autoHeightResize(self, shape, size);
    };

    return self;
};

const drawFocusFrame = (shape, context) => {
    if (!shape.ifDrawFocusFrame()) {
        return;
    }
    const frame = shape.getFrame();
    const x0 = frame.x - shape.x;
    const y0 = frame.y - shape.y;
    let pad = 1;
    let focusMargin = shape.focusMargin;
    let x1 = x0 - shape.width / 2 - focusMargin;
    let y1 = y0 - shape.height / 2 - focusMargin;
    if (shape.page.focusFrameColor !== undefined && shape.page.focusFrameColor !== "") {
        if (shape.drawer.customizedDrawFocus) {
            shape.drawer.customizedDrawFocus(context, x1, y1, frame.width + 2 * pad + 2 * focusMargin, frame.height + 2 * pad + 2 * focusMargin);
        } else {
            context.dashedRect(x1, y1, frame.width + 2 * focusMargin, frame.height + 2 * focusMargin, 5, 1.5, shape.page.focusFrameColor);
            // Draw connecting line from top-center to the rotate handle (matches multi-select style)
            if (shape.getRotateAble && shape.getRotateAble()) {
                const topMidX = x1 + (frame.width + 2 * focusMargin) / 2;
                context.save();
                context.strokeStyle = shape.page.focusFrameColor;
                context.lineWidth = 1;
                context.setLineDash([]);
                context.beginPath();
                context.moveTo(topMidX, y1);
                context.lineTo(topMidX, y1 - 7);
                context.stroke();
                context.restore();
            }
        }
    }
};

const drawLinkingFrame = (shape, context) => {
    const frame = shape.getFrame();
    const x0 = frame.x - shape.x;
    const y0 = frame.y - shape.y;
    let pad = 3;
    let focusMargin = shape.focusMargin;
    let x1 = x0 - shape.width / 2 - focusMargin;
    let y1 = y0 - shape.height / 2 - focusMargin;
    context.dashedRect(x1 - shape.borderWidth / 2, y1 - shape.borderWidth / 2, frame.width + 2 * focusMargin, frame.height + 2 * focusMargin, 2, 1, "darkred");
};

const autoHeightResize = (self, shape, originSize) => {
    if (!shape.autoHeight) {
        return originSize;
    }

    const height = self.parent.offsetHeight < shape.fontSize ? originSize.height : self.parent.offsetHeight;
    if (shape.minHeight && height < shape.minHeight) {
        shape.height = shape.minHeight;
        self.parent.style.height = shape.height + "px";
        originSize.height = shape.height;
    } else {
        shape.height = height < 22 ? 22 : height;
        self.parent.style.height = "auto";
        originSize.height = shape.height;
    }

    return originSize;
};

export { rectangleDrawer, canvasRectangleDrawer, contextMenuDrawer};