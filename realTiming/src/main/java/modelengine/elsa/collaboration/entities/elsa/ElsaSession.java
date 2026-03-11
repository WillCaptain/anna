/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.base.AbstractSession;
import modelengine.elsa.collaboration.entities.base.Broadcaster;
import modelengine.elsa.collaboration.entities.base.Command;
import modelengine.elsa.collaboration.entities.base.Sessions;
import modelengine.elsa.collaboration.entities.common.CommentType;
import modelengine.elsa.collaboration.entities.common.SessionMode;
import modelengine.elsa.collaboration.entities.users.User;
import modelengine.elsa.entities.Graph;
import modelengine.elsa.entities.Shape;
import modelengine.elsa.entities.ShapeIdentity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * session在elsa中的具像类
 * elsa session中只对shape类型进行同步
 * elsa session中只对shape identity的command做管理
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class ElsaSession extends AbstractSession<ShapeIdentity, Shape, Graph, Command, User> {
    @Getter
    private String currentPage;
    @Getter
    private Integer currentStep;
    @Getter
    private List<Comment> comments = new ArrayList<>();
    private Map<String, Integer> pros = new HashMap<>();
    private Map<String, Integer> cons = new HashMap<>();

    public ElsaSession(String id, String tenant, SessionMode sessionMode, Sessions sessions, Broadcaster broadcaster) {
        super(id, tenant, sessionMode, sessions, broadcaster);
    }

    @Override
    public User ping(String userId) {
        return this.ping(userId,"","");
    }

    public User ping(String userId,String name,String description){
        //todo: update websocket information
        User userSession = this.loginSessions.get(userId);
        if(userSession==null){
            userSession = new User(userId,name,description);
            this.loginSessions.put(userId,userSession);
        }
        try {
            userSession.checkIn();
        }catch(Exception e){
            //simply login again,the logic here should me more complicated
            userSession.login();
        }
        return userSession;
    }

    public ElsaSession setCurrentPage(String pageId) {
        this.currentPage = pageId;
        return this;
    }

    public ElsaSession setCurrentStep(Integer step) {
        this.currentStep = step;
        return this;
    }

    public void addComment(String pageId, String shapeId, String commentContent, String from) {
        String flag = commentContent.substring(commentContent.length() - 1);
        CommentType commentType = CommentType.COMMENT;
        if ("!".equals(flag) || "！".equals(flag)) {
            commentType = CommentType.TASK;
        }
        if ("?".equals(flag) || "？".equals(flag)) {
            commentType = CommentType.QUESTION;
        }
        Comment comment = new Comment(pageId, shapeId, commentContent, commentType, this.getId(), from);
        this.comments.add(comment);
    }

    public void addPros(String pageId) {
        pros.put(pageId, pros.getOrDefault(pageId, 0) + 1);
    }

    public void addCons(String pageId) {
        cons.put(pageId, cons.getOrDefault(pageId, 0) + 1);
    }

    public Integer getPros(String pageId) {
        return pros.getOrDefault(pageId, 0);
    }

    public Integer getCons(String pageId) {
        return this.cons.getOrDefault(pageId, 0);
    }
}
