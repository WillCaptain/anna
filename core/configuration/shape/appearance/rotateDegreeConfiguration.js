/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 旋转角度（rotateDegree）配置.
 */
export const rotateDegreeConfiguration = (target) => {
    const self = fieldConfiguration(target, "rotateDegree");
    self.type = "number";
    self.title = "旋转角度";
    self.range = [-360, 360];
    self.index = 2;
    self.group.push({type: "appearance", name: "形状选项", index: 2});
    return self;
}