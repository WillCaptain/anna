/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import lombok.Getter;

import java.util.Date;

/**
 * 登录信息
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class LoginInfo {
    @Getter
    private String user;
    @Getter
    private Date loginTime;

    public LoginInfo(String user, Date loginTime) {
        this.user = user;
        this.loginTime = loginTime;
    }
}
