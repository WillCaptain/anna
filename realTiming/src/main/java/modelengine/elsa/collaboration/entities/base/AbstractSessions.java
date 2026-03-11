/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import modelengine.elsa.collaboration.entities.common.SessionMode;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * sessions基本实现，不应作为变量类型，变量类型应该是具体实现类或者Sessions<I,T,C>
 * 实际创建session放到具体实现类里
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public abstract class AbstractSessions<S extends Session> implements Sessions<S> {
    private static final String DEFAULT_TENANT = "default";

    protected Map<String, S> sessions = new HashMap<>();

    protected SessionRepo repo;

    protected Broadcaster broadcaster;

    public AbstractSessions(SessionRepo repo, Broadcaster broadcaster) {
        this.repo = repo;
        this.broadcaster = broadcaster;
    }

    @Override
    public S create(String id, SessionMode sessionMode) {
        return this.create(id, sessionMode, DEFAULT_TENANT);
    }

    @Override
    public S create(String id, SessionMode sessionMode, String tenant) {
        //only keep the latest version
        S session = this.newSession(id, tenant, sessionMode, this, broadcaster);
        this.sessions.put(id, session);
        this.repo.save(session);
        return session;
    }

    protected abstract S newSession(String id, String tenant, SessionMode sessionMode, Sessions<S> sessions,
            Broadcaster broadcaster);

    @Override
    public S get(String id) {
        return this.sessions.get(id);
    }

    @Override
    public List<S> getAll() {
        return new ArrayList<>(this.sessions.values());
    }

    @Override
    public boolean close(String id) {
        S session = this.get(id);
        if (session == null) {
            return false;
        }
        sessions.remove(id);
        this.repo.save(session);
        return true;
    }

    public abstract <T> T find(Function<Stream<S>, T> func);
}
