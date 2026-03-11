/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {rectangle} from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";

const canvasCheckmarkDrawer = (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder = () => {};
    self.backgroundRefresh = () => {};

    self.getPoints = (px, py) => {
        const w = shape.width, h = shape.height;
        return [
            [px,             py + h * 0.55],
            [px + w * 0.30,  py + h],
            [px + w,         py + h * 0.10],
            [px + w,         py + h * 0.36],
            [px + w * 0.30,  py + h * 0.75],
            [px + w * 0.14,  py + h * 0.55],
        ];
    };

    self.requireMoveToStart = () => true;
    return self;
};

const checkmark = (id, x, y, width, height, parent) => {
    let self = rectangle(id, x, y, width, height, parent, canvasCheckmarkDrawer);
    self.width  = 80;
    self.height = 80;
    self.type   = "checkmark";
    self.text   = "";

    const getConfigurations = self.getConfigurations;
    self.getConfigurations = () => {
        const configurations = getConfigurations.apply(self);
        configurations.remove(c => c.field === "cornerRadius");
        return configurations;
    };
    return self;
};

export {checkmark};
