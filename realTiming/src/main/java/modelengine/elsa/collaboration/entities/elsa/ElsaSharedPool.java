/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 共享图形池
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Component
public class ElsaSharedPool {
    private final Map<String, List<Map<String, String>>> shapes = new HashMap<>();

    public boolean add(String shapeId, String pageId, String graphId, String sessionId) {
        boolean isNewShared = false;
        List<Map<String, String>> pages = this.shapes.get(shapeId);
        if (pages == null) {
            pages = new ArrayList<>();
            this.shapes.put(shapeId, pages);
            isNewShared = true;
        }
        if (pages.stream().noneMatch(p1 -> p1.get("session").equals(sessionId) && p1.get("page").equals(pageId))) {
            Map<String, String> p = new HashMap<>();
            p.put("page", pageId);
            p.put("graph", graphId);
            p.put("session", sessionId);
            pages.add(p);//don't repeat adding same session
        }
        return isNewShared;
    }
    public void remove(String shapeId, String pageId, String graphId, String sessionId) {
        List<Map<String, String>> pages = this.shapes.get(shapeId);
        if(pages==null) return;
        pages.removeIf(p->p.get("page").equals(pageId) && p.get("graph").equals(graphId)&& p.get("session").equals(sessionId));
    }

    public List<Map<String, String>> getSharedSessions(String shapeId) {
        return this.shapes.get(shapeId);
    }

    public List<Map<String, String>> get(String shapeId) {
        return this.shapes.get(shapeId);
    }
}
