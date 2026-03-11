/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import lombok.Getter;

/**
 * 图会话。
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class GraphSession {
    @Getter
    private final String id;
    @Getter
    private final String name;
    @Getter
    private final String page;
    @Getter
    private final String shape;

    public GraphSession(String id, String name, String page, String shape) {
        this.id = id;
        this.name = name;
        this.page = page;
        this.shape = shape;
    }
}
