/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa.commands;

import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;

import java.util.List;
import java.util.Map;

/**
 * 手写点的命令
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public class AddFreeLinePointCommand extends ActionCommand<List<Map<String, Integer>>> {
    public AddFreeLinePointCommand(ElsaTopic<List<Map<String, Integer>>> topic) {
        super(topic.getFrom(), topic);
    }
}
