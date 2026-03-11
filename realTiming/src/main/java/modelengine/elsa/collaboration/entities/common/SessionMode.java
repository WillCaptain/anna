/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.common;

import lombok.Getter;

/**
 * session模式 分两种： 协作编辑，没有主次，所有人可以同等编辑 演示：有主次，播放人控制，所有人只能得到播放结果
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public enum SessionMode {
    COLLABORATION("协同编辑"), PRESENTATION("协同展示");

    @Getter
    private final String desc;

    SessionMode(String desc) {
        this.desc = desc;
    }
}
