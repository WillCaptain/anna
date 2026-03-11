/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

/**
 * 广播
 * 实现默认使用websocket广播command转换后的topic信息
 *
 * @param <T> 消息体值类型
 * @param <U> 消息体类型
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Broadcaster<T, U extends Topic<T>> {
    /**
     * 广播topic
     */
    void broadcast(U topic);
}