/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasCrossDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        const x1 = w / 3, x2 = w * 2 / 3;
        const y1 = h / 3, y2 = h * 2 / 3;
        return [
            [px + x1, py],
            [px + x2, py],
            [px + x2, py + y1],
            [px + w,  py + y1],
            [px + w,  py + y2],
            [px + x2, py + y2],
            [px + x2, py + h],
            [px + x1, py + h],
            [px + x1, py + y2],
            [px,      py + y2],
            [px,      py + y1],
            [px + x1, py + y1],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const cross = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasCrossDrawer);
    self.width = 90;
    self.height = 90;
    self.type = "cross";
    self.text = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {cross};
