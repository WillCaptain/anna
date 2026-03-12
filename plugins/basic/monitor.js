/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasMonitorDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        if (W < 4 || H < 4) return;
        const bw = shape.borderWidth || 1.5;
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        const screenH = H * 0.68;
        const baseH   = H * 0.08;
        const neckW   = W * 0.12;
        const neckH   = H * 0.16;
        const baseW   = W * 0.56;
        const screenR = 4;

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        // ── screen body ───────────────────────────────────────────────────────
        context.beginPath();
        context.roundRect(px, py, W, screenH, screenR);
        context.fill();
        context.stroke();

        // ── screen bezel inner (dark fill) ────────────────────────────────────
        const bp = W * 0.05;
        context.fillStyle = stroke;
        context.globalAlpha = 0.1;
        context.beginPath();
        context.roundRect(px + bp, py + bp, W - bp * 2, screenH - bp * 2, screenR * 0.5);
        context.fill();
        context.globalAlpha = 1;
        context.fillStyle = fill;
        context.beginPath();
        context.roundRect(px + bp, py + bp, W - bp * 2, screenH - bp * 2, screenR * 0.5);
        context.stroke();

        // ── neck ──────────────────────────────────────────────────────────────
        const neckX = px + W / 2 - neckW / 2;
        const neckY = py + screenH;
        context.beginPath();
        context.rect(neckX, neckY, neckW, neckH);
        context.fill();
        context.stroke();

        // ── base ──────────────────────────────────────────────────────────────
        const baseX = px + W / 2 - baseW / 2;
        const baseY = py + screenH + neckH;
        context.beginPath();
        context.roundRect(baseX, baseY, baseW, baseH, baseH / 2);
        context.fill();
        context.stroke();

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const monitor = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasMonitorDrawer);
    self.width  = 130;
    self.height = 100;
    self.type   = "monitor";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {monitor};
