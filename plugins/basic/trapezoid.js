/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasTrapezoidDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        const inset = w / 5;
        return [
            [px + inset,     py],
            [px + w - inset, py],
            [px + w,         py + h],
            [px,             py + h],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const trapezoid = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasTrapezoidDrawer);
    self.width = 120;
    self.height = 80;
    self.type = "trapezoid";
    self.text = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {trapezoid};
