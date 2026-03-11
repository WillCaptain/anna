/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasChevronDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        const notch = Math.min(w * 0.25, h * 0.5);
        return [
            [px,             py],
            [px + w - notch, py],
            [px + w,         py + h / 2],
            [px + w - notch, py + h],
            [px,             py + h],
            [px + notch,     py + h / 2],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const chevron = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasChevronDrawer);
    self.width = 120;
    self.height = 60;
    self.type = "chevron";
    self.text = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {chevron};
