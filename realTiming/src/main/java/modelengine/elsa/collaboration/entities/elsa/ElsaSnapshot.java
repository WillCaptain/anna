/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import lombok.Getter;
import lombok.Setter;
import modelengine.elsa.entities.Graph;
import modelengine.elsa.entities.Page;
import modelengine.elsa.entities.Shape;
import modelengine.elsa.entities.ShapeIdentity;
import modelengine.elsa.entities.Snapshot;

import java.rmi.NoSuchObjectException;

/**
 * elsa的快照
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class ElsaSnapshot implements Snapshot<ShapeIdentity, Shape> {
    @Getter
    private final Graph graph;
    @Getter
    @Setter
    private volatile int sequence;

    public ElsaSnapshot(Graph graph) {
        this.graph = graph;
    }

    private Page loadPage(String id) throws NoSuchObjectException {
        Page p = this.graph.getPage(id);
        if (p == null) {
            p = this.graph.newPage(id);
        }
        return p;
    }

    @Override
    public Shape get(ShapeIdentity id) {
        try {
            Page p = this.loadPage(id.getPage());
            return p.getShape(id.getShape());
        } catch (NoSuchObjectException e) {
            return null;
        }
    }

    //    public void addPage(Page target){
    //        Page page = this.graph.addPage(target.getId());
    //        page.getProperties().forEach(sid -> {
    //            page.set(sid, target.get(sid));
    //        });
    //    }
    //    public void addShape(String pageId, Shape target) throws NoSuchObjectException {
    //        Page p = this.loadPage(pageId);
    //        final Shape shape = p.getShape(target.getId());
    //        if (shape == null) {//如果没有shape，则引入该shape
    //            p.addShape(target);
    //        } else {//如果有shape，则更新这个shape的属性
    //            target.getProperties().forEach(sid -> {
    //                shape.set(sid, target.get(sid));
    //            });
    //        }
    //    }

    @Override
    public String getId() {
        return this.graph.getId();
    }
}
