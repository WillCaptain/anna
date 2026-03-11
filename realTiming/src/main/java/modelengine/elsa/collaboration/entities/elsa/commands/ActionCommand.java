/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa.commands;

import modelengine.elsa.collaboration.entities.base.AbstractCommand;
import modelengine.elsa.collaboration.entities.elsa.ElsaBroadcaster;
import modelengine.elsa.collaboration.entities.elsa.ElsaSession;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;

import java.util.ArrayList;

/**
 * 指令型command
 * 该command的重点是action，elsa graph接收到command，根据action做不同的操作,比如翻页
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public abstract class ActionCommand<T> extends AbstractCommand<ElsaTopic<T>, ElsaSession, ElsaBroadcaster> {
    public ActionCommand(String from, ElsaTopic<T> topic) {
        super(from, topic, new ArrayList<>());
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
    }
}
