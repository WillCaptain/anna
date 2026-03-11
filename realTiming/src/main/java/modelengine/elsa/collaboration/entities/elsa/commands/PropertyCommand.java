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
import modelengine.elsa.entities.Shape;
import modelengine.elsa.entities.ShapeProperties;

import java.util.ArrayList;

/**
 * 属性command，该command为是shape的某属性赋值
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class PropertyCommand extends AbstractCommand<ElsaTopic<ShapeProperties[]>, ElsaSession, ElsaBroadcaster> {
    public PropertyCommand(ElsaTopic<ShapeProperties[]> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
    }

    @Override
    public void updateSnapShotData(ElsaSession session) {
        Page page = session.getSnapshot().getPage(this.getTopic().getPage());
        for (int i = 0; i < this.getTopic().getValue().length; i++) {
            ShapeProperties shapeProperties = this.getTopic().getValue()[i];
            Shape shape = page.getShape(shapeProperties.getShape());
            shapeProperties.getProperties().keySet().forEach(k -> {
                shape.set(k, shapeProperties.getProperties().get(k));
            });
        }
    }

}
