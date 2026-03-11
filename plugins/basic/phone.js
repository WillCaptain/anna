/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasPhoneDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        const bw = shape.borderWidth || 1.5;
        const r  = W * 0.14;          // body corner radius
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        // ── device body (rounded rect) ────────────────────────────────────────
        context.beginPath();
        context.roundRect(px, py, W, H, r);
        context.fill();
        context.stroke();

        // ── screen (inset) ────────────────────────────────────────────────────
        const sp   = W * 0.1;       // screen padding
        const sy   = H * 0.14;      // screen top offset
        const sh   = H * 0.66;      // screen height
        const sr   = r * 0.5;
        context.fillStyle = stroke;
        context.globalAlpha = 0.12;
        context.beginPath();
        context.roundRect(px + sp, py + sy, W - sp * 2, sh, sr);
        context.fill();
        context.globalAlpha = 1;
        context.beginPath();
        context.roundRect(px + sp, py + sy, W - sp * 2, sh, sr);
        context.stroke();

        // ── speaker notch (top centre) ────────────────────────────────────────
        const nw = W * 0.28, nh = H * 0.022;
        const nx = px + W / 2 - nw / 2, ny = py + H * 0.06;
        context.beginPath();
        context.roundRect(nx, ny, nw, nh, nh / 2);
        context.stroke();

        // ── home button (bottom centre) ───────────────────────────────────────
        const br = W * 0.09;
        const bx = px + W / 2, by2 = py + H - H * 0.055;
        context.beginPath();
        context.arc(bx, by2, br, 0, Math.PI * 2);
        context.stroke();

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const phone = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasPhoneDrawer);
    self.width  = 60;
    self.height = 110;
    self.type   = "phone";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {phone};
