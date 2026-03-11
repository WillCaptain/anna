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
import modelengine.elsa.entities.Graph;

import java.util.ArrayList;
import java.util.Map;

/**
 * 图数据变化的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class GraphDataChangeCommand extends
        AbstractCommand<ElsaTopic<Map<String,Object>>, ElsaSession, ElsaBroadcaster> {
    public GraphDataChangeCommand(ElsaTopic<Map<String,Object>> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("graph_data_changed");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
        Graph graph = session.getSnapshot();
        String field = this.getTopic().getValue().get("field").toString();
        Object value = this.getTopic().getValue().get("value");
        if(graph.getProperties().get(field)!=null){//graph property
            graph.getProperties().put(field,value);
        }else{//graph.setting property
            ((Map<String,Object>)graph.getProperties().get("setting")).put(field,value);
        }
    }
}
