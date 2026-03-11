/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.users;

import lombok.Getter;

/**
 * 租户信息 协同是基于租户隔离
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class Tenant implements Identity {
    @Getter
    private final String id;

    @Getter
    private final String name;

    @Getter
    private final String description;

    public Tenant(String id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
