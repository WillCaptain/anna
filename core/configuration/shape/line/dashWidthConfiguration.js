/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 边框类型（dashWidth）配置.
 */
export const dashWidthConfiguration = (target) => {
    const self = fieldConfiguration(target, "dashWidth");
    self.type = "number";
    self.title = "类型";
    self.index = 2;
    self.group.push({type: "line", name: "线条选项", index: 3});
    self.options = [];
    self.options.push({key: "dashWidth.solid", value: 0});
    self.options.push({key: "dashWidth.dotted", value: 3});
    self.options.push({key: "dashWidth.dashed", value: 5});
    return self;
}