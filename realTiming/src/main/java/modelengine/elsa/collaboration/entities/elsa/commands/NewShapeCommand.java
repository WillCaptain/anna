/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa.commands;

import modelengine.elsa.collaboration.entities.base.AbstractCommand;
import modelengine.elsa.collaboration.entities.elsa.ElsaBroadcaster;
import modelengine.elsa.collaboration.entities.elsa.ElsaSession;
import modelengine.elsa.collaboration.entities.elsa.ElsaSharedPool;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;
import modelengine.elsa.entities.Page;
import modelengine.elsa.entities.Shape;

import java.util.ArrayList;
import java.util.Map;

/**
 * 新增一个图形的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class NewShapeCommand extends AbstractCommand<ElsaTopic<Map<String, Object>>, ElsaSession, ElsaBroadcaster> {
    private static final String SHAPE_PROPERTY_SHARED = "shared";
    private final ElsaSharedPool sharedPool;

    public NewShapeCommand(ElsaTopic<Map<String, Object>> topic, ElsaSharedPool sharedPool) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("shape_added");
        this.sharedPool = sharedPool;
    }

    @Override
    public void updateSnapShotData(ElsaSession session) {
        Page page = session.getSnapshot().getPage(this.getTopic().getPage());

        // 有可能因为时序问题，对shape的修改先执行了，导致shape已经被创建.
        Shape shape = page.getShape(this.getTopic().getShape());
        this.getTopic().getValue().keySet().forEach(k -> {
            shape.set(k, this.getTopic().getValue().get(k));
        });

        Boolean shared =shape.get(SHAPE_PROPERTY_SHARED)!=null && (Boolean)shape.get(SHAPE_PROPERTY_SHARED);
        if (shared) {
            this.sharedPool.add(shape.getId(), page.getId(), page.getGraphId(), session.getId());
        }
    }
}
