/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasTabletDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        if (W < 4 || H < 4) return;
        const bw = shape.borderWidth || 1.5;
        const r  = H * 0.1;           // body corner radius (portrait)
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        // ── device body ───────────────────────────────────────────────────────
        context.beginPath();
        context.roundRect(px, py, W, H, r);
        context.fill();
        context.stroke();

        // ── screen ────────────────────────────────────────────────────────────
        const spx = W * 0.08, spy = H * 0.08;
        const sw  = W - spx * 2, sh = H - spy * 2;
        context.fillStyle = stroke;
        context.globalAlpha = 0.1;
        context.beginPath();
        context.roundRect(px + spx, py + spy, sw, sh, r * 0.4);
        context.fill();
        context.globalAlpha = 1;
        context.beginPath();
        context.roundRect(px + spx, py + spy, sw, sh, r * 0.4);
        context.stroke();

        // ── front camera (top centre) ─────────────────────────────────────────
        const camR = Math.min(W, H) * 0.028;
        context.beginPath();
        context.arc(px + W / 2, py + spy * 0.5, camR, 0, Math.PI * 2);
        context.stroke();

        // ── home button (right centre for portrait) ───────────────────────────
        const btnR = H * 0.038;
        context.beginPath();
        context.arc(px + W - spx * 0.5, py + H / 2, btnR, 0, Math.PI * 2);
        context.stroke();

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const tablet = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasTabletDrawer);
    self.width  = 80;
    self.height = 110;
    self.type   = "tablet";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {tablet};
