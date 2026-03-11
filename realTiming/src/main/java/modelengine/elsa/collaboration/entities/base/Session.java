/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import modelengine.elsa.collaboration.entities.common.SessionMode;
import modelengine.elsa.collaboration.entities.common.SessionStatus;
import modelengine.elsa.collaboration.entities.users.LoginSession;
import modelengine.elsa.entities.CommandTarget;
import modelengine.elsa.entities.Snapshot;

import java.util.List;
import java.util.function.Function;

/**
 * 一次协作session
 * 如果操作注册到一个同一个session，这个session所有的变动都会广播到注册端
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public interface Session<I, T extends CommandTarget, S extends Snapshot<I, T>, C extends Command, U extends LoginSession> {
    /**
     * 每个session都应该有一个唯一的id
     */
    String getId();

    /**
     * 取得当前session的状态
     */
    SessionStatus getStatus();

    /**
     * 取得当前session的运行模式
     */
    SessionMode getMode();

    /**
     * session生效需要初始化数据snapshot
     * snapshot会根据command进行变更
     */
    void initialize(S snapshot);

    /**
     * 得到当前session的实施snapshot数据
     */
    S getSnapshot();

    /**
     * 得到当前session的实施snapshot数据
     * @param resultHandler 返回值的处理器
     * @param <R> 返回值类型
     * @return 返回值
     */
    <R> R getSnapshot(Function<S, R> resultHandler);

    /**
     * 接收命令，进行数据变更和广播
     */
    void acceptCommand(C command);

    /**
     * 得到所有接收到的command列表
     */
    List<C> getCommands();


    /**
     * session所属租户
     */
    String getTenant();

    /**
     * update login information
     */
    U ping(String userId);

    List<U> getLoginSessions();

    U getLoginSession(String id);
}
