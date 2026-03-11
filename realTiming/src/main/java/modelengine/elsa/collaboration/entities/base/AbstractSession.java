/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.entities.base;

import lombok.Getter;
import modelengine.elsa.collaboration.entities.common.CommandStatus;
import modelengine.elsa.collaboration.entities.common.SessionMode;
import modelengine.elsa.collaboration.entities.common.SessionStatus;
import modelengine.elsa.collaboration.entities.users.LoginSession;
import modelengine.elsa.collaboration.exceptions.SequenceInvalidException;
import modelengine.elsa.entities.CommandTarget;
import modelengine.elsa.entities.Snapshot;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;

/**
 * Command的基本实现，该类不会实例化，为过渡类型
 * 该类不应该成为变量类型，任何对该类型的引用都应该转变为对Command的引用
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
public abstract class AbstractSession<I, T extends CommandTarget, S extends Snapshot<I, T>, C extends Command, U extends LoginSession>
        implements Session<I, T, S, C,U> {
    private static final int LOGIN_EXPIRE_TIME = 2000;
    private final Sessions<Session<I, T, S, C,U>> sessions;

    @Getter
    private final String id;

    @Getter
    private final SessionMode mode;

    private volatile S snapshot = null;

    @Getter
    private final List<C> commands = new ArrayList<>();

    private final Broadcaster broadcaster;

    protected final Map<String,U> loginSessions = new HashMap<>();

    @Getter
    private final String tenant;

    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    public AbstractSession(String id, String tenant, SessionMode sessionMode, Sessions sessions,
            Broadcaster broadcaster) {
        this.id = id;
        this.tenant = tenant;
        this.sessions = sessions;
        this.broadcaster = broadcaster;
        this.mode = sessionMode;
    }



    @Override
    public List<U> getLoginSessions() {
        long now = System.currentTimeMillis();
        List<String> expired = new ArrayList<>();
        this.loginSessions.forEach((key,session) -> {
            if ((now - session.getLoginTime().getTime()) > LOGIN_EXPIRE_TIME) {
                expired.add(key);
            }
        });
        expired.forEach(this.loginSessions::remove);
        return new ArrayList<>(this.loginSessions.values());
    }

    @Override
    public U getLoginSession(String id) {
        return this.loginSessions.get(id);
    }

    @Override
    public SessionStatus getStatus() {
        return this.sessions.get(this.getId()) == null
                ? SessionStatus.STOP
                : (snapshot == null ? SessionStatus.IDLE : SessionStatus.RUN);
    }

    @Override
    public void initialize(S snapshot) {
        this.snapshot = snapshot;
    }

    @Override
    public S getSnapshot() {
        return readLockAction(() -> {
            this.snapshot.setSequence(this.commands.size() - 1);
            return this.snapshot;
        });
    }

    @Override
    public <R> R getSnapshot(Function<S, R> resultHandler) {
        return readLockAction(() -> {
            this.snapshot.setSequence(this.commands.size() - 1);
            return resultHandler.apply(this.snapshot);
        });
    }

    private <R> R readLockAction(Supplier<R> action) {
        Lock readLock = this.lock.readLock();
        readLock.lock();
        try {
            return action.get();
        } finally {
            readLock.unlock();
        }
    }

    /**
     * 获取sequence之后所有的命令
     *
     * @param sequence 时序索引
     * @return 命令列表
     */
    public List<C> getCommands(int sequence) {
        if (this.commands.size() < sequence) {
            throw new SequenceInvalidException();
        }
        return readLockAction(() -> {
            List<C> elements = this.commands.subList(sequence, this.commands.size());
            return elements.stream().limit(100).collect(Collectors.toList());
        });
    }

    @Override
    public void acceptCommand(C command) {
        Lock writeLock = this.lock.writeLock();
        writeLock.lock();
        try {
            if (this.getStatus() != SessionStatus.RUN) {
                throw new IllegalStateException("session is not in a running state");
            }
            if (command.getStatus() != CommandStatus.CREATED) {
                throw new IllegalStateException("the command " + command.getId() + " has been consumed");
            }
            command.getTopic().setSession(this.getId());
            command.getTopic().setSequence(this.commands.size());
            this.commands.add(command);
            command.updateSnapshot(this);
            if (command.getStatus() == CommandStatus.UPDATED) {
                command.publish(this.broadcaster);
            }
        } finally {
            writeLock.unlock();
        }
    }

}
