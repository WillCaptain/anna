/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 标签（tag）配置.
 */
export const tagConfiguration = (target) => {
    const self = fieldConfiguration(target, "tag");
    self.type = "string";
    self.title = "标签";
    self.index = 0;
    self.width = 200;
    self.group.push({type: "other", name: "其他", index: 4});
    return self;
}