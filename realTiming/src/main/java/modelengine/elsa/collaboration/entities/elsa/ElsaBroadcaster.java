/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import modelengine.elsa.collaboration.entities.base.Broadcaster;
import modelengine.elsa.collaboration.interfaces.DataExchanger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 广播用户动作
 *
 * @param <T> 消息体值类型
 * @author 陈镕希
 * @since 2025-07-28
 */
@Component
public class ElsaBroadcaster<T> implements Broadcaster<T, ElsaTopic<T>> {
    @Autowired
    private DataExchanger dataExchanger;

    @Override
    public void broadcast(ElsaTopic<T> topic) {
        this.dataExchanger.dispatch(topic);
    }
}
