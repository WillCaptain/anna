/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import modelengine.elsa.collaboration.entities.base.CommandValueParser;
import modelengine.elsa.collaboration.entities.elsa.commands.ActionCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.PropertyCommand;
import modelengine.elsa.entities.ShapeIdentity;

import java.rmi.NoSuchObjectException;
import java.util.List;

/**
 * command 制造工厂
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public interface CommandFactory {
    PropertyCommand create(ShapeIdentity targetId, List<Pair<String, Object>> content, String session,
            CommandValueParser commandValueParser, String sender) throws NoSuchObjectException;

    PropertyCommand createSetCommand(ShapeIdentity targetId, List<Pair<String, Object>> content, String session,
            String sender) throws NoSuchObjectException;

    PropertyCommand createIncrementalCommand(ShapeIdentity targetId, List<Pair<String, Object>> content, String session,
            String sender) throws NoSuchObjectException;


    ActionCommand createActionCommand(ShapeIdentity targetId, String action, String sessionId, String sender)
            throws NoSuchObjectException;

    ActionCommand createActionCommand(String action, String sessionId, String sender) throws NoSuchObjectException;
}
