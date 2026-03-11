/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  图标绘制基础工具
 *  所有图标分类文件均从此导入 makeIconDrawer / makeIcon
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

/**
 * 创建一个图标 drawer 工厂函数。
 *
 * drawFn 签名：(context, px, py, W, H, fill, stroke, bw) => void
 *   px, py  — drawStatic 传入的坐标原点（≈ shape.margin = 1）
 *   W, H    — 有效绘制尺寸（shape.width-2, shape.height-2）
 *   fill    — shape.getBackColor()
 *   stroke  — shape.getBorderColor()
 *   bw      — shape.borderWidth
 *
 * 约定：
 *   - context.save / restore 已由本函数包裹，drawFn 内无需再包
 *   - lineCap='round', lineJoin='round' 已预设
 *   - 需要镂空时使用 destination-out 合成操作，用后立即恢复 source-over
 */
export const makeIconDrawer = (drawFn) => (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W      = shape.width  - 2;
        const H      = shape.height - 2;
        const bw     = shape.borderWidth || 1.5;
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.lineCap     = 'round';
        context.lineJoin    = 'round';
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        drawFn(context, px, py, W, H, fill, stroke, bw);

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

/**
 * 创建图标 shape 工厂函数。
 *
 * @param {string}   typeName  — shape.type 唯一字符串
 * @param {number}   defaultW  — 默认宽度
 * @param {number}   defaultH  — 默认高度
 * @param {Function} drawerFn  — 由 makeIconDrawer() 返回的 drawer 工厂
 */
export const makeIcon = (typeName, defaultW, defaultH, drawerFn) => {
    return (id, x, y, width, height, parent) => {
        let self = rectangle(id, x, y, width, height, parent, drawerFn);
        self.width  = defaultW;
        self.height = defaultH;
        self.type   = typeName;
        self.text   = "";

        const getConfigurations = self.getConfigurations;
        self.getConfigurations = () => {
            const cfg = getConfigurations.apply(self);
            cfg.remove(c => c.field === 'cornerRadius');
            return cfg;
        };
        return self;
    };
};
