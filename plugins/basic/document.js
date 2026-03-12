/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasDocumentDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        if (W < 4 || H < 4) return;
        const bw = shape.borderWidth || 1.5;
        const fold = Math.min(W, H) * 0.22;   // folded corner size
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        // ── document body (rect with top-right folded corner) ─────────────────
        context.beginPath();
        context.moveTo(px,          py);
        context.lineTo(px + W - fold, py);
        context.lineTo(px + W,        py + fold);
        context.lineTo(px + W,        py + H);
        context.lineTo(px,            py + H);
        context.closePath();
        context.fill();
        context.stroke();

        // ── folded corner triangle (shaded) ───────────────────────────────────
        context.fillStyle = stroke;
        context.globalAlpha = 0.15;
        context.beginPath();
        context.moveTo(px + W - fold, py);
        context.lineTo(px + W,        py + fold);
        context.lineTo(px + W - fold, py + fold);
        context.closePath();
        context.fill();
        context.globalAlpha = 1;

        context.beginPath();
        context.moveTo(px + W - fold, py);
        context.lineTo(px + W - fold, py + fold);
        context.lineTo(px + W,        py + fold);
        context.stroke();

        // ── text lines ────────────────────────────────────────────────────────
        const lp  = W * 0.12;
        const ly  = py + fold + H * 0.12;
        const lgap = H * 0.11;
        const lineWidths = [0.72, 0.64, 0.72, 0.50];

        context.globalAlpha = 0.35;
        lineWidths.forEach((ratio, i) => {
            context.beginPath();
            context.moveTo(px + lp,           ly + i * lgap);
            context.lineTo(px + lp + (W - lp * 2) * ratio, ly + i * lgap);
            context.stroke();
        });
        context.globalAlpha = 1;

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

const document_ = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasDocumentDrawer);
    self.width  = 80;
    self.height = 100;
    self.type   = "document";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {document_};
