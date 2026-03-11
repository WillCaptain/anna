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
import java.util.Map;

/**
 * 点赞的命令
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public class AppreciateCommand extends AbstractCommand<ElsaTopic<Map<String,Object>>, ElsaSession, ElsaBroadcaster> {
    public AppreciateCommand(ElsaTopic<Map<String,Object>> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("procons");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
        ElsaTopic<Map<String,Object>> topic = this.getTopic();
        if (topic.getValue().get("procons").equals("pros")) {
            session.addPros(topic.getPage());
        } else {
            session.addCons(topic.getPage());
        }
        topic.getValue().put("pros", session.getPros(topic.getPage()));
        topic.getValue().put("cons", session.getCons(topic.getPage()));
    }
}
