/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.users;

import modelengine.elsa.collaboration.entities.common.LoginStatus;

import java.util.Date;
import java.util.Map;

import javax.security.auth.login.AccountExpiredException;
import javax.security.auth.login.FailedLoginException;

/**
 * login管理接口
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface LoginSession {
    String getId();

    String getLoginId();

    void login();

    void logout();

    void checkIn() throws AccountExpiredException, FailedLoginException;

    LoginStatus getStatus();

    Date getLoginTime();

    Map<String, Object> getContext();
}
