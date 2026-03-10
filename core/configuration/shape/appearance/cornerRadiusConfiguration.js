/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 角半径（cornerRadius）配置.
 */
export const cornerRadiusConfiguration = (target) => {
    const self = fieldConfiguration(target, "cornerRadius");
    self.type = "number";
    self.title = "圆角";
    self.range = [0, Math.floor(Math.min(target.width, target.height) / 2)];
    self.index = 3;
    self.group.push({type: "appearance", name: "形状选项", index: 2});
    return self;
}