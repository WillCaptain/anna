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
import modelengine.elsa.entities.Page;

import java.util.ArrayList;
import java.util.Map;

/**
 * 修改图形层级的命令
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
public class ChangeShapeIndexCommand
        extends AbstractCommand<ElsaTopic<Map<String, Integer>>, ElsaSession, ElsaBroadcaster> {
    public ChangeShapeIndexCommand(ElsaTopic<Map<String, Integer>> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("shape_index_changed");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) {
        Page page = session.getSnapshot().getPage(this.getTopic().getPage());
        page.changeShapeIndex(this.getTopic().getShape(), this.getTopic().getValue().get("fromIndex"), this.getTopic().getValue().get("toIndex"));
    }
}
