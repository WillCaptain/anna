/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import modelengine.elsa.collaboration.entities.common.CommandStatus;

import java.util.Date;
import java.util.List;

/**
 * 协同时的一个协同命令
 * 一个命令中含有要协作的目标，目标属性，和属性值
 * 命令抽象为id和简单object value表示，以适配不同的协作要求
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Command<T extends Topic, S extends Session, B extends Broadcaster> {
    /**
     * command id
     * 该id在客户端进行解析，并调用想用的parser转换value
     */
    String getId();

    /**
     * 标识command的动作特征
     */
    String getAction();

    /**
     * 该command属于哪个session
     */
    //    String getSession();

    /**
     * 协作目标ID
     */
    //    I getTargetId();

    /**
     * 要协作的内容
     *
     * @return
     */
    // T getContent();

    /**
     * 该command对应的CommandParser,这个parser转换value到CommandTarget
     */
    // CommandValueParser getCommandValueParser();

    void updateSnapshot(S session);

    void publish(B broadcaster);

    T getTopic();

    /**
     * command的创建者
     */
    String getFrom();

    /**
     * command的接收方
     */
    List<String> getAcceptors();

    /**
     * command当前状态
     */
    CommandStatus getStatus();

    /**
     * command创建时间
     *
     * @return
     */
    Date getTime();
}
