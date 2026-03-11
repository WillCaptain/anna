/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import lombok.Getter;
import lombok.Setter;
import modelengine.elsa.collaboration.entities.base.Topic;

/**
 * elsa的消息体
 *
 * @param <T> 消息体值类型
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class ElsaTopic<T> implements Topic<T> {
    @Getter
    private final String page;
    @Getter
    private final String shape;
    @Getter
    private final String from;
    @Getter
    @Setter
    private String topic;
    @Getter
    private final T Value;
    @Getter
    @Setter
    private String session;
    @Getter
    @Setter
    private int sequence;

    public ElsaTopic(String topic, String page, String shape, T value, String from) {
        this.page = page;
        this.shape = shape;
        this.topic = topic;
        this.Value = value;
        this.from = from;
    }
}
