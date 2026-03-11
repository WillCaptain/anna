/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import modelengine.elsa.collaboration.entities.common.SessionMode;

import java.util.List;

/**
 * session管理器
 * 存储了该机器所有的session
 * 负责创建和停止session
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Sessions<S extends Session> {
    S create(String id, SessionMode sessionMode);

    S create(String id, SessionMode sessionMode, String tenant);

    S get(String id);

    List<S> getAll();

    boolean close(String id);
}
