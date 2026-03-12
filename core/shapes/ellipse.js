/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {ALIGN, ANNA_NAME_SPACE} from '../../common/const.js';
import {rectangle} from './rectangle.js';
import {canvasRectangleDrawer} from '../drawers/rectangleDrawer.js';

export const namespace = ANNA_NAME_SPACE;
/**
 * 椭圆
 * 目前是最简单的椭圆，留待未来发挥
 * 辉子 2020
 */
const ellipse = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasRectangleDrawer);
    // self.type = "ellipse";
    self.text = "";
    self.lineWidth = 1;
    self.borderWidth = 0;
    //self.borderWidth = self.borderWidth1 = 2;
    self.vAlign = ALIGN.MIDDLE;

    self.drawer.drawBorder = () => {
    }

    self.drawer.drawStatic = (context, x, y) => {
        context.dynamicEllipse(x, y, self.width, self.height, self.lineWidth, self.borderColor,
            self.backColor, self.backAlpha, self.dashWidth, self.globalAlpha);
    };
    let animAngle = 0;
    let prevTime  = 0;
    self.drawer.drawDynamic = (context, x, y) => {
        if (!self.emphasized) return;

        const now = performance.now();
        const dt  = prevTime > 0 ? Math.min(now - prevTime, 100) : 0;
        prevTime  = now;

        // 2.5s 绕一圈
        const ORBIT_DURATION = 2500;
        animAngle = (animAngle + (dt / ORBIT_DURATION) * Math.PI * 2) % (Math.PI * 2);

        const rx = self.width  / 2 - 1;
        const ry = self.height / 2 - 1;

        // 亮点半径：与椭圆短轴成比例，取较小轴的 4%，最小 1.5px
        const r     = Math.max(Math.min(rx, ry) * 0.04, 1.5);
        const color = self.getBorderColor?.() ?? '#7c6ff7';

        context.save();

        // ── 彗星尾迹：亮点前方 60° 内绘制逐渐消隐的小圆点 ──
        const TAIL_ARC   = Math.PI / 3;  // 60° 尾迹弧度
        const TAIL_STEPS = 10;
        for (let i = 0; i < TAIL_STEPS; i++) {
            const t     = animAngle - TAIL_ARC * (1 - i / TAIL_STEPS);
            const tx    = rx * Math.cos(t);
            const ty    = ry * Math.sin(t);
            const alpha = (i / TAIL_STEPS) * 0.35;
            context.globalAlpha = alpha;
            context.beginPath();
            context.arc(tx, ty, r * 1.2, 0, Math.PI * 2);
            context.fillStyle = 'rgba(255,255,255,1)';
            context.fill();
        }

        // ── 主亮点：彩色晕 + 白色辉光 + 亮芯 ──
        const cx = rx * Math.cos(animAngle);
        const cy = ry * Math.sin(animAngle);

        // 彩色晕（直接用 CSS 颜色 + globalAlpha，无需解析）
        context.globalAlpha = 0.45;
        context.beginPath();
        context.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
        context.fillStyle = color;
        context.fill();

        // 白色径向辉光
        context.globalAlpha = 1;
        const grd = context.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
        grd.addColorStop(0,    'rgba(255,255,255,0.88)');
        grd.addColorStop(0.30, 'rgba(255,255,255,0.40)');
        grd.addColorStop(0.65, 'rgba(255,255,255,0.10)');
        grd.addColorStop(1,    'rgba(255,255,255,0)');
        context.beginPath();
        context.arc(cx, cy, r * 4, 0, Math.PI * 2);
        context.fillStyle = grd;
        context.fill();

        // 亮白芯
        context.beginPath();
        context.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
        context.fillStyle = 'rgba(255,255,255,0.98)';
        context.fill();

        context.restore();
    };

    // self.serializedFields.batchAdd("lineWidth");
    return self;
};

export {ellipse};