/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

/**
 * 侦听客户端的指令
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface CommandListener {
    Object onMessage(String name, String message);
}
