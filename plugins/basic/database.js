/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasDatabaseDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        const bw = shape.borderWidth || 1.5;
        const ry = H * 0.14;
        const rx = W / 2;
        const cx = px + rx;
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        // ── fill body (rect + bottom half-ellipse) ────────────────────────────
        context.beginPath();
        context.rect(px, py + ry, W, H - 2 * ry);
        context.fill();

        context.beginPath();
        context.ellipse(cx, py + H - ry, rx, ry, 0, 0, Math.PI);
        context.fill();

        // ── fill top ellipse ─────────────────────────────────────────────────
        context.beginPath();
        context.ellipse(cx, py + ry, rx, ry, 0, 0, Math.PI * 2);
        context.fill();

        // ── stroke: left & right sides ───────────────────────────────────────
        context.beginPath();
        context.moveTo(px,     py + ry);
        context.lineTo(px,     py + H - ry);
        context.moveTo(px + W, py + ry);
        context.lineTo(px + W, py + H - ry);
        context.stroke();

        // ── stroke: bottom visible arc ────────────────────────────────────────
        context.beginPath();
        context.ellipse(cx, py + H - ry, rx, ry, 0, 0, Math.PI);
        context.stroke();

        // ── stroke: top ellipse ───────────────────────────────────────────────
        context.beginPath();
        context.ellipse(cx, py + ry, rx, ry, 0, 0, Math.PI * 2);
        context.stroke();

        // ── partition lines (simulate DB sections) ────────────────────────────
        context.globalAlpha = 0.4;
        const sections = [0.35, 0.65];
        for (const t of sections) {
            const ey = py + ry + (H - 2 * ry) * t;
            context.beginPath();
            context.ellipse(cx, ey, rx, ry, 0, 0, Math.PI * 2);
            context.stroke();
        }
        context.globalAlpha = 1;

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const database = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasDatabaseDrawer);
    self.width  = 90;
    self.height = 110;
    self.type   = "database";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {database};
