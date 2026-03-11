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
 * 修改页面顺序的命令
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public class ChangePageIndexCommand
        extends AbstractCommand<ElsaTopic<Map<String, Integer>>, ElsaSession, ElsaBroadcaster> {
    public ChangePageIndexCommand(ElsaTopic<Map<String, Integer>> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("page_index_changed");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) {
        Graph graph = session.getSnapshot();
        graph.changePageIndex(this.getTopic().getValue().get("fromIndex"), this.getTopic().getValue().get("toIndex"));
    }
}
