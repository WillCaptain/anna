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

import java.util.ArrayList;

/**
 * 发布评论的命令
 *
 * @author 陈镕希
 * @since 2025-07-27
 */
public class PublishCommentCommand extends AbstractCommand<ElsaTopic<String>, ElsaSession, ElsaBroadcaster> {
    // todo 临时问题.
    private static final int MAX_COMMENT_LENGTH = 25;

    public PublishCommentCommand(ElsaTopic<String> topic) {
        super(topic.getFrom(), topic, new ArrayList<>());
        topic.setTopic("comment");
    }

    @Override
    protected void updateSnapShotData(ElsaSession session) {
        ElsaTopic<String> topic = this.getTopic();
        String comment = topic.getValue();
        if (comment.length() > MAX_COMMENT_LENGTH) {
            comment = comment.substring(0, MAX_COMMENT_LENGTH);
        }
        session.addComment(topic.getPage(), topic.getShape(), comment, this.getFrom());
    }
}
