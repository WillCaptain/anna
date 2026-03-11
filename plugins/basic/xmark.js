/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasXmarkDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    // 12-point X polygon (clockwise winding in screen coords)
    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        const t = 0.22;
        return [
            [px + w * t,         py],
            [px + w * 0.5,       py + h * (0.5 - t)],
            [px + w * (1 - t),   py],
            [px + w,             py + h * t],
            [px + w * (0.5 + t), py + h * 0.5],
            [px + w,             py + h * (1 - t)],
            [px + w * (1 - t),   py + h],
            [px + w * 0.5,       py + h * (0.5 + t)],
            [px + w * t,         py + h],
            [px,                 py + h * (1 - t)],
            [px + w * (0.5 - t), py + h * 0.5],
            [px,                 py + h * t],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const xmark = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasXmarkDrawer);
    self.width  = 80;
    self.height = 80;
    self.type   = "xmark";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {xmark};
