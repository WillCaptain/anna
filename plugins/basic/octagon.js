/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasOctagonDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        return [
            [px + w / 3,       py],
            [px + w * 2 / 3,   py],
            [px + w,           py + h / 3],
            [px + w,           py + h * 2 / 3],
            [px + w * 2 / 3,   py + h],
            [px + w / 3,       py + h],
            [px,               py + h * 2 / 3],
            [px,               py + h / 3],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const octagon = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasOctagonDrawer);
    self.width = 100;
    self.height = 100;
    self.type = "octagon";
    self.text = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {octagon};
