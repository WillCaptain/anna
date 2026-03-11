/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;

/**
 * elsa与collaboration交互通用参数
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class Args<T> {
    @Getter
    private String method;
    @Getter
    private String session;
    @Getter
    private String from;
    @Getter
    private String tenant;
    @Getter
    private String graph;
    @Getter
    private String page;
    @Getter
    private String shape;
    @Getter
    private T value;
    @Getter
    private GraphSession fromSession;

    public Args(String method, String session, String from, String tenant, String graph, String page, String shape,
            T value, GraphSession fromSession) {
        this.method = method;
        this.session = session;
        this.from = from;
        this.tenant = tenant;
        this.graph = graph;
        this.page = page;
        this.shape = shape;
        this.value = value;
        this.fromSession = fromSession;
    }

    public ElsaTopic<T> toTopic() {
        return new ElsaTopic<>(this.method, this.page, this.shape, this.value, this.from);
    }
}
