/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.common.CommentType;

import java.util.Date;

/**
 * 评论实体类。
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class Comment {
    @Getter
    private final Date time;
    @Getter
    private String pageId;
    @Getter
    private String shapeId;
    @Getter
    private String comment;
    @Getter
    private CommentType commentType;
    @Getter
    private String sessionId;
    @Getter
    private String from;

    public Comment(String pageId, String shapeId, String comment, CommentType commentType, String sessionId,
            String from) {
        this.pageId = pageId;
        this.shapeId = shapeId;
        this.comment = comment;
        this.commentType = commentType;
        this.sessionId = sessionId;
        this.from = from;
        this.time = new Date();
    }
}
