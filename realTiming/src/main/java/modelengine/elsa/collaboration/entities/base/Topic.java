/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

/**
 * 消息
 *
 * @param <T> 消息体值类型
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Topic<T> {
    String getSession();

    void setSession(String session);

    String getTopic();

    void setTopic(String topic);

    T getValue();

    int getSequence();

    void setSequence(int sequence);
}
