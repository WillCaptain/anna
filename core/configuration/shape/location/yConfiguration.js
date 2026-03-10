/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";
import {positionCommand} from "../../../history/commands.js";

/**
 * 纵坐标（y）配置.
 */
export const yConfiguration = (target) => {
    const self = fieldConfiguration(target, "y");
    self.type = "number";
    self.title = "纵坐标";
    self.index = 1;
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
        dirty.x.preValue = dirty.x.value = shape.x;
        dirty.y.preValue = shape.y;
        dirty.y.value = value;
        return [dirty];
    }

    return self;
}