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

/**
 * 删除 Page 对象相关指令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class RemovePageCommand extends AbstractCommand<ElsaTopic<String>, ElsaSession, ElsaBroadcaster<String>> {
    public RemovePageCommand(ElsaTopic<String> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("page_removed");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) {
        ElsaTopic<String> topic = this.getTopic();
        String pageId = topic.getValue();
        if (pageId == null) {
            throw new IllegalArgumentException("remove pageId is required.");
        }
        Graph graph = session.getSnapshot();
        // int index = graph.indexOfPage(pageId);
        // if (index == -1) {
        //     throw new IllegalArgumentException("page[" + pageId + "] is removed.");
        // }

        graph.removePageById(pageId);
    }
}
