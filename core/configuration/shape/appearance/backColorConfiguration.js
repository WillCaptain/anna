/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {fieldConfiguration} from "../../fieldConfiguration.js";

/**
 * 背景颜色（backColor）配置.
 */
export const backColorConfiguration = (target) => {
    const self = fieldConfiguration(target, "backColor");
    self.type = "string";
    self.title = "填充";
    self.index = 5;
    self.group.push({type: "appearance", name: "形状选项", index: 2});

    /**
     * 在修改背景色时，需要同时修改mouseInBackColor和focusBackColor.
     *
     * @override
     */
    const getChangedData = self.getChangedData;
    self.getChangedData = (value) => {
        const changeDataArray = getChangedData.apply(self, [value]);
        changeDataArray[0].mouseInBackColor = value;
        changeDataArray[0].focusBackColor = value;
        return changeDataArray;
    }

    /**
     * 是否只读.
     *
     * 配置面板选项中默认为不禁用
     */
    self.isReadOnly = (focusedShapes) => {
        return false;
    }

    return self;
}