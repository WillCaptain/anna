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
import modelengine.elsa.collaboration.interfaces.LocalUpdator;
import modelengine.elsa.entities.Page;
import modelengine.elsa.entities.Shape;
import modelengine.elsa.entities.ShapeProperties;

import java.util.ArrayList;
import java.util.Map;

/**
 * 修改页面数据的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class PageDataChangeCommand extends AbstractCommand<ElsaTopic<ShapeProperties[]>, ElsaSession, ElsaBroadcaster> {
    private static final String SHAPE_PROPERTY_SHARED = "shared";

    private final ElsaSharedPool sharedPool;
    private final LocalUpdator local;

    public PageDataChangeCommand(ElsaTopic<ShapeProperties[]> topic, ElsaSharedPool sharedPool, LocalUpdator local) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("page_shape_data_changed");
        this.sharedPool = sharedPool;
        this.local = local;
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) throws Exception {
        Page page = session.getSnapshot().getPage(this.getTopic().getPage());
        if (page == null) {
            return;
        }
        for (int i = 0; i < this.getTopic().getValue().length; i++) {
            ShapeProperties shapeProperties = this.getTopic().getValue()[i];
            if (shapeProperties.getShape().equals(page.getId())) {
                shapeProperties.getProperties().keySet().forEach(k -> {
                    page.set(k, shapeProperties.getProperties().get(k));
                    if (k.equals(SHAPE_PROPERTY_SHARED)) {
                        if ((Boolean) page.get(SHAPE_PROPERTY_SHARED)) {
                            this.sharedPool.add(page.get("id").toString(), page.getId(), session.getSnapshot().getId(),
                                    session.getId());
                        } else {
                            this.sharedPool.remove(page.get("id").toString(), page.getId(),
                                    session.getSnapshot().getId(), session.getId());
                        }
                    }
                });
            } else {
                Shape shape = page.getShape(shapeProperties.getShape());
                shapeProperties.getProperties().keySet().forEach(k -> {
                    shape.set(k, shapeProperties.getProperties().get(k));
                    if(k.equals("local")){
                        this.local.handle(shape,(Map<String, Object>)shapeProperties.getProperties().get(k));
                    }
                    //                    if (k.equals(SHAPE_PROPERTY_SHARED)) {
                    //                        if ((Boolean) shape.get(SHAPE_PROPERTY_SHARED)) {
                    //                            this.sharedPool.add(shape.get("id").toString(), page.getId(), session.getSnapshot().getId(),
                    //                                session.getId());
                    //                        } else {
                    //                            this.sharedPool.remove(shape.get("id").toString(), page.getId(),
                    //                                session.getSnapshot().getId(), session.getId());
                    //                        }
                    //                    }
                });

                if (shape.get(SHAPE_PROPERTY_SHARED)!=null && (Boolean) shape.get(SHAPE_PROPERTY_SHARED) && !shape.get("container").equals("")) {
                    this.sharedPool.add(shape.get("id").toString(), page.getId(), session.getSnapshot().getId(),
                            session.getId());
                } else {
                    this.sharedPool.remove(shape.get("id").toString(), page.getId(),
                            session.getSnapshot().getId(), session.getId());
                }
            }
        }
    }
}
