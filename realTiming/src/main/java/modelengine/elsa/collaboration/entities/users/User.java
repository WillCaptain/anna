/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.users;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.common.LoginStatus;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.security.auth.login.AccountExpiredException;
import javax.security.auth.login.FailedLoginException;

/**
 * 协作登录用户管理
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public class User implements Identity, LoginSession {
    @Getter
    private final String loginId;
    @Getter
    private final String id;
    @Getter
    private final String name;
    @Getter
    private final String description;
    private final int expireTime;
    @Getter
    private Date loginTime;
    private LoginStatus status;
    private Map<String, Object> context = new HashMap<>();

    public User(String id, String name, String description, int expireTime) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = LoginStatus.INVALID;
        this.loginId = UUID.randomUUID().toString();
        this.loginTime = new Date();
        this.expireTime = expireTime;
    }

    public User(String id, String name, String description) {
        this(id, name, description, 1000 * 10);
    }

    @Override
    public void login() {
        //check validation....to fengyi
        this.loginTime = new Date();
        this.status = LoginStatus.VALID;
    }

    @Override
    public void logout() {
        // TODO 假设User持有session的信息，他就能够更新在线用户数量
        // todo 是否需要在这里更新用户登录数，如果此用户属于某个正在协作的session，登出将会影响session的在线用户数
        // 如何通过sessionId找到session
        this.status = LoginStatus.INVALID;
    }

    @Override
    public void checkIn() throws AccountExpiredException, FailedLoginException {
        this.updateStatus();//update the status first;
        if (this.status == LoginStatus.EXPIRED) {
            throw new AccountExpiredException();
        }
        if (this.status == LoginStatus.INVALID) {
            throw new FailedLoginException();
        }
        this.loginTime = new Date();
    }

    @Override
    public LoginStatus getStatus() {
        this.updateStatus();
        return this.status;
    }

    @Override
    public Map<String, Object> getContext() {
        return this.context;
    }

    public void setWorkOnPage(String page) {
        this.context.put("page", page);
    }

    public String getWorkOnPage() {
        return this.context.get("page")==null?null:this.context.get("page").toString();
    }

    public void setWorkOnShape(String shape) {
        this.context.put("shape", shape);
    }

    public String getWorkOnShape() {
        return this.context.get("shape")==null?null:this.context.get("shape").toString();
    }

    private void updateStatus() {
        if (System.currentTimeMillis() - this.loginTime.getTime() > this.expireTime) {
            this.status = LoginStatus.EXPIRED;
        }
    }
}
