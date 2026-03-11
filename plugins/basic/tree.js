/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasTreeDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        const bw = shape.borderWidth || 1.5;
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        const cx      = px + W / 2;
        const trunkW  = W * 0.22;
        const trunkH  = H * 0.24;
        const trunkX  = cx - trunkW / 2;
        const trunkY  = py + H - trunkH;

        // Two layered triangles (bottom one wider, top one shifted up)
        const t1Base  = W,       t1Top = py + H * 0.60,  t1Bot = trunkY;
        const t2Base  = W * 0.8, t2Top = py,              t2Bot = py + H * 0.50;
        const t2OffX  = W * 0.1; // left indent for narrower triangle

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;

        // ── trunk ─────────────────────────────────────────────────────────────
        context.fillStyle = fill;
        context.beginPath();
        context.rect(trunkX, trunkY, trunkW, trunkH);
        context.fill();
        context.stroke();

        // ── bottom foliage triangle ───────────────────────────────────────────
        context.fillStyle = fill;
        context.beginPath();
        context.moveTo(cx,          t1Top);
        context.lineTo(px + t1Base, t1Bot);
        context.lineTo(px,          t1Bot);
        context.closePath();
        context.fill();
        context.stroke();

        // ── top foliage triangle (slightly overlapping) ───────────────────────
        context.beginPath();
        context.moveTo(cx,              t2Top);
        context.lineTo(px + t2OffX + t2Base, t2Bot);
        context.lineTo(px + t2OffX,          t2Bot);
        context.closePath();
        context.fill();
        context.stroke();

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const tree = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasTreeDrawer);
    self.width  = 90;
    self.height = 110;
    self.type   = "tree";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {tree};
