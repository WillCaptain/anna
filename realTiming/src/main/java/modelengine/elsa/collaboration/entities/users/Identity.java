/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.users;

/**
 * user体系中基本id结构
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Identity {
    String getId();

    String getName();

    String getDescription();
}
