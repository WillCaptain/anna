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
import modelengine.elsa.entities.Page;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

/**
 * 新建一页的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class NewPageCommand
        extends AbstractCommand<ElsaTopic<Map<String, Object>>, ElsaSession, ElsaBroadcaster<Map<String, Object>>> {
    public NewPageCommand(ElsaTopic<Map<String, Object>> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("page_added");
    }

    @Override
    public void updateSnapShotData(ElsaSession session) {
        Graph graph = session.getSnapshot();
        ElsaTopic<Map<String, Object>> topic = this.getTopic();
        Map<String, Object> attributes = topic.getValue();
        Integer index = Optional.ofNullable(attributes.get("index"))
                .map(Integer.class::cast)
                .orElseGet(() -> graph.getPages().size() - 1);
        Page page = graph.newPage(topic.getPage(), index);
        page.deserialize(attributes);

    }
}
