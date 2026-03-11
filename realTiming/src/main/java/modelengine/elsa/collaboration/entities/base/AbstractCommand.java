/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.common.CommandStatus;

import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Command的基本实现，该类不会实例化，为过渡类型
 * 该类不应该成为变量类型，任何对该类型的引用都应该转变为对Command的引用
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public abstract class AbstractCommand<T extends Topic, S extends Session, B extends Broadcaster>
        implements Command<T, S, B> {
    private final UUID id;

    @Getter
    private final List<String> acceptors;

    @Getter
    private T topic;

    @Getter
    private CommandStatus status;

    @Getter
    private Date time;

    @Getter
    private String from;

    public AbstractCommand(String from, T topic, List<String> acceptors) {
        this.acceptors = acceptors;
        this.from = from;
        this.status = CommandStatus.CREATED;
        this.time = new Date();
        this.id = UUID.randomUUID();
        this.topic = topic;
    }

    @Override
    public String getAction() {
        return this.topic.getTopic();
    }

    @Override
    public String getId() {
        return this.id.toString();
    }

    @Override
    public void updateSnapshot(S session) {
        try {
            this.updateSnapShotData(session);
            this.status = CommandStatus.UPDATED;
        } catch (Exception e) {
            this.status = CommandStatus.ABANDONED;
            e.printStackTrace();
        }
    }

    protected abstract void updateSnapShotData(S session) throws Exception;

    @Override
    public void publish(B broadcaster) {
        broadcaster.broadcast(this.topic);
        this.status = CommandStatus.SENT;
    }
}
