/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  图标绘制基础工具
 *  所有图标分类文件均从此导入 makeIconDrawer / makeIcon
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";
import {iconTheme, resolveIconColors} from './iconTheme.js';

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
        // 形状刚被拖拽创建时尺寸可能极小（甚至为负），直接跳过避免 arc 负半径报错
        if (W <= 0 || H <= 0) return;

        const bw     = shape.borderWidth || 1.5;
        const rawFill   = shape.getBackColor();
        const rawStroke = shape.getBorderColor();

        // 彩色 / 拟物主题：解析最终使用的颜色
        const { fill, stroke } = resolveIconColors(shape.type, rawFill, rawStroke);

        context.save();
        context.lineWidth   = bw;
        context.lineCap     = 'round';
        context.lineJoin    = 'round';
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        drawFn(context, px, py, W, H, fill, stroke, bw);

        // 拟物主题：在已绘制像素上叠加"顶部高光 → 底部阴影"线性渐变
        // source-atop：仅在目标已有不透明像素处混合，透明镂空区域不受影响
        if (iconTheme.mode === 'skeuomorphic') {
            const grad = context.createLinearGradient(px, py, px, py + H);
            grad.addColorStop(0,    'rgba(255,255,255,0.38)');
            grad.addColorStop(0.36, 'rgba(255,255,255,0.10)');
            grad.addColorStop(0.62, 'rgba(0,0,0,0.00)');
            grad.addColorStop(1,    'rgba(0,0,0,0.24)');
            context.globalCompositeOperation = 'source-atop';
            context.fillStyle = grad;
            context.fillRect(px, py, W, H);
            context.globalCompositeOperation = 'source-over';
        }

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
