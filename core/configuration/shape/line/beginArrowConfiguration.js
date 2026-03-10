/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 线段起点的类型（beginArrow）配置.
 */
export const beginArrowConfiguration = (target) => {
    const self = fieldConfiguration(target, "beginArrow");
    self.type = "string";
    self.title = "起点";
    self.index = 3;
    self.group.push({type: "line", name: "线条选项", index: 3});
    self.options = [];
    self.options.push({key: "beginArrow.none", value: 'none'});
    self.options.push({key: "beginArrow.defaultArrow", value: 'defaultArrow'});

    /**
     * @inheritDoc
     * @override
     */
    const action = self.action;
    self.action = (value) => {
        action.apply(self, [value !== "none"]);
    }

    /**
     * 重写getValue方法.
     * 属性beginArrow为true,返回"defaultArrow".
     * 属性beginArrow为false,返回"none".
     *
     * @override
     */
    const getValue = self.getValue;
    self.getValue = () => {
        const value = getValue.apply(self);
        return value ? "defaultArrow" : "none";
    }

    return self;
}