/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.elsa;

import modelengine.elsa.collaboration.entities.base.AbstractSessions;
import modelengine.elsa.collaboration.entities.base.Broadcaster;
import modelengine.elsa.collaboration.entities.base.SessionRepo;
import modelengine.elsa.collaboration.entities.base.Sessions;
import modelengine.elsa.collaboration.entities.common.SessionMode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.function.Function;
import java.util.stream.Stream;

/**
 * 协同编辑session管理器，该协同为“编辑”模式
 *
 * @author 陈镕希
 * @since 2025-07-26
 */
@Component
public class ElsaSessions extends AbstractSessions<ElsaSession> {
    @Autowired
    public ElsaSessions(SessionRepo repo, Broadcaster broadcaster) {
        super(repo, broadcaster);
    }

    @Override
    protected ElsaSession newSession(String id, String tenant, SessionMode sessionMode, Sessions<ElsaSession> sessions,
            Broadcaster broadcaster) {
        return new ElsaSession(id, tenant, sessionMode, sessions, broadcaster);
    }

    @Override
    public <T> T find(Function<Stream<ElsaSession>, T> func) {
        return func.apply(this.sessions.values().stream());
    }
}
