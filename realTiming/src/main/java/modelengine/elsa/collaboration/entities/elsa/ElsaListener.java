/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import modelengine.elsa.collaboration.entities.base.CommandListener;
import modelengine.elsa.collaboration.entities.base.Session;
import modelengine.elsa.collaboration.entities.base.Sessions;
import modelengine.elsa.collaboration.entities.common.SessionMode;

import net.sf.json.JSONObject;

import java.util.HashMap;
import java.util.function.Consumer;

/**
 * 侦听ELSA体系的所有协同事件
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class ElsaListener implements CommandListener {
    private final HashMap<String, Consumer<JSONObject>> methods;
    private final Sessions<ElsaSession> sessions;

    public ElsaListener(Sessions<ElsaSession> sessions) {
        this.sessions = sessions;
        this.methods = new HashMap<>();
        //某graph进入编辑模式时，将数据传送到服务器
        this.methods.put("create_collaboration_session", data -> {
            //            ElsaSnapshot snapshot = createSnapshot(data);
            //            createCollaborationSession(snapshot);
        });
    }

    private Session createCollaborationSession(ElsaSnapshot snapshot) {
        //创建的session id就等于snapshot的graph id
        return this.sessions.create(snapshot.getId(), SessionMode.COLLABORATION);
    }

    //    private ElsaSnapshot createSnapshot(JSONObject data) {
    //        String graphId = data.getString("id");//graph.id
    //        Map<String, Object> settings = new HashMap<>();//graph.settings
    //        JSONObject jSettings = data.getJSONObject("setting");
    //        jSettings.keys().forEachRemaining(key -> settings.put(key.toString(), jSettings.get(key)));
    //
    //        //create graph
    //        ElsaSnapshot snapshot = new ElsaSnapshot(new Graph(graphId, settings));
    //        Graph graph = snapshot.getGraph();
    //
    //        //create pages
    //        JSONArray pages = data.getJSONArray("pages");
    //        for (int i = 0; i < pages.size(); i++) {
    //            JSONObject p = pages.getJSONObject(i);
    //            //create page
    //            Page page = graph.addPage(p.getString("id"));
    //            p.keys().forEachRemaining(key -> {
    //                if (key.equals("shapes") || key.equals("id")) return;
    //                page.set(key.toString(), p.get(key));
    //            });
    //            //create shapes
    //            JSONArray shapes = p.getJSONArray("shapes");
    //            for (int j = 0; i < shapes.size(); j++) {
    //                JSONObject s = shapes.getJSONObject(i);
    //                //create shape
    //                Shape shape = page.newShape(s.getString("id"));
    //                s.keys().forEachRemaining(key -> {
    //                    if (key.equals("id")) return;
    //                    shape.set(key.toString(), s.get(key));
    //                });
    //            }
    //
    //        }
    //        return snapshot;
    //    }

    @Override
    public Object onMessage(String name, String message) {
        JSONObject data = JSONObject.fromObject(message);
        this.methods.get(name).accept(data);
        return null;
    }
}
