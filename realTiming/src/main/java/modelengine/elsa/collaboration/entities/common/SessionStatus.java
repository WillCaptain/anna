/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.common;

/**
 * session状态 新建时为idle 当snapshot初始化后变为run sessions.stop将session状态变为stop
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public enum SessionStatus {
    STOP, IDLE, RUN
}
