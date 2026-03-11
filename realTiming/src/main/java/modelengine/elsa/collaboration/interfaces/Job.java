/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import lombok.Data;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;
import reactor.core.publisher.FluxSink;

import org.springframework.web.reactive.socket.CloseStatus;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ScheduledFuture;

/**
 * websocket的分发任务，一个job对象负责一个接入方的分发。
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Slf4j
@Data
class Job {
    private final ConcurrentLinkedQueue<ElsaTopic> queue;

    private String session;

    private Sender sender;

    private volatile Status status = Status.INIT;

    private int nextIndex = 0;

    ScheduledFuture<?> future;

    public Job(String session, Sender sender) {
        this.sender = sender;
        this.session = session;
        this.queue = new ConcurrentLinkedQueue<>();
    }

    public void stop() {
        this.status = Status.STOP;
        this.future.cancel(false);
        if (this.sender != null && !this.sender.isClosed()) {
            this.sender.stop();
        }
    }


    @Getter
    static class Sender {
        public static CloseStatus CLOSE_STATUS_SERVER_TERMINAL = new CloseStatus(3010, "server terminal.");

        private WebSocketSession session;

        private FluxSink<WebSocketMessage> sink;

        public Sender(WebSocketSession session, FluxSink<WebSocketMessage> sink) {
            this.session = session;
            this.sink = sink;
        }

        public void sendData(String msg) {
            sink.next(session.textMessage(msg));
        }

        public boolean isClosed() {
            return !session.isOpen();
        }

        public void stop() {
            session.close(CLOSE_STATUS_SERVER_TERMINAL).subscribe(unused -> {});
        }
    }


    enum Status {
        INIT,
        READY,
        WORKING,
        STOP
    }
}
