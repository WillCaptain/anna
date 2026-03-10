/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";
import {positionCommand} from "../../../history/commands.js";

/**
 * 横坐标（x）配置.
 */
export const xConfiguration = (target) => {
    const self = fieldConfiguration(target, "x");
    self.type = "number";
    self.title = "横坐标";
    self.index = 0;
    self.group.push({type: "location", name: "位置选项", index: 1});

    /**
     * @inheritDoc
     * @override
     */
    self.doCommand = (changedData) => {
        positionCommand(target.page, changedData).execute();
    }

    /**
     * 构造positionCommand中execute需要的数据, 具体参考 {@link shape#dragTo}
     *
     * @inheritDoc
     * @override
     */
    self.getChangedData = (value) => {
        const shape = target;
        const dirty = {shape, x: {}, y: {}, container: {}};
        dirty.x.preValue = shape.x;
        dirty.y.preValue = dirty.y.value = shape.y;
        dirty.x.value = value;
        return [dirty];
    }

    return self;
}