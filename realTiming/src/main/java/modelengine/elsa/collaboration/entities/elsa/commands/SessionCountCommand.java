/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa.commands;

import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;

/**
 * 在线人数统计命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class SessionCountCommand extends ActionCommand<Integer> {
    public SessionCountCommand(ElsaTopic<Integer> topic) {
        super("system", topic);
    }
}
