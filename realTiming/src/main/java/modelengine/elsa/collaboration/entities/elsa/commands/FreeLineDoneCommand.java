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
import java.util.List;
import java.util.Map;

/**
 * 手写完成命令
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public class FreeLineDoneCommand extends AbstractCommand<ElsaTopic<Object>, ElsaSession, ElsaBroadcaster> {
    public FreeLineDoneCommand(ElsaTopic<Object> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
        ElsaTopic<Object> topic = this.getTopic();
        Map<String,Object> value = (Map<String,Object>)topic.getValue();
        String shapeId = value.get("to").toString();
        //        session.getSnapshot().getPage(topic.getPage()).getShape(topic.getShape()).set("lines", topic.getValue());
        List lines = (List)session.getSnapshot().getPage(topic.getPage()).getShape(shapeId).get("lines");
        if(lines==null){
            lines = new ArrayList();
            session.getSnapshot().getPage(topic.getPage()).getShape(shapeId).set("lines", lines);
        }

        lines.addAll((List)value.get("lines"));
        //        lines.add(value.get("line"));

    }
}
