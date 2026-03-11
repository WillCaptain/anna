/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.TypeReference;
import com.google.common.base.Splitter;

import lombok.extern.slf4j.Slf4j;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;
import modelengine.elsa.entities.ShapeProperties;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.HandshakeInfo;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;

import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Vector;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;

/**
 * 支持websocket推送协作消息
 *
 * @author 陈镕希
 * @since 2025-07-28
 */
@Slf4j
@Component
public class DataExchanger implements WebSocketHandler {
    ExecutorService initExecutorService = Executors.newCachedThreadPool();

    ScheduledExecutorService dispatchService = Executors.newSingleThreadScheduledExecutor();

    ScheduledExecutorService pingService = Executors.newSingleThreadScheduledExecutor();

    ScheduledExecutorService sesPool = Executors.newScheduledThreadPool(100);

    private final Queue<ElsaTopic> dispatchQueue = new ConcurrentLinkedQueue<>();

    private final Map<String, Job> jobMap = new ConcurrentHashMap<>();

    private final List<Args<ShapeProperties[]>> allMessages = new Vector<>(1024 * 1024);

    @PostConstruct
    public void init() {
        createFixJob();
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        HandshakeInfo handshakeInfo = session.getHandshakeInfo();
        String query = handshakeInfo.getUri().getQuery();
        Map<String, String> split = Splitter.on("&").withKeyValueSeparator("=").split(query);
        // 端的session id
        String clientSessionId = split.get("session") + "-" + split.get("cookie");
        // todo 协作的session
        String collaborationSession = split.get("collaborationSession");
        log.warn("handle clientSessionId:" + clientSessionId);

        Mono<Void> input = session.receive().map(WebSocketMessage::getPayloadAsText).doOnNext(data -> {
            Args<ShapeProperties[]> message = JSONObject.parseObject(data,
                    new TypeReference<Args<ShapeProperties[]>>() {
                    });
            printLog(clientSessionId, "input." + JSONObject.toJSONString(message), "");
            handleChangeData(message);
        }).then();

        Mono<Void> output = session.send(Flux.create(sink -> {
            Job.Sender sender = new Job.Sender(session, sink);
            Job job = new Job(clientSessionId, sender);
            Job oldJob = jobMap.get(clientSessionId);
            if (oldJob != null) {
                oldJob.stop();
            }
            jobMap.put(clientSessionId, job);
            job.setStatus(Job.Status.READY);
            createSendJob(job);
        }));

        return Mono.zip(input, output).then();
    }

    public void dispatch(ElsaTopic topic) {
        dispatchQueue.offer(topic);
    }

    private boolean handleChangeData(Args<ShapeProperties[]> args) {
        // 暂时无接收数据
        return true;
    }

    public void createFixJob() {
        dispatchService.scheduleAtFixedRate(() -> {
            while (!this.dispatchQueue.isEmpty()) {
                ElsaTopic elsaMessage = this.dispatchQueue.poll();
                dispatchMessageBySession(elsaMessage);
            }
        }, 0, 10, TimeUnit.MILLISECONDS);
    }

    private void dispatchMessageBySession(ElsaTopic elsaMessage) {
        jobMap.forEach((session, job) -> dispatchMessage(elsaMessage, job));
    }

    private void dispatchMessage(ElsaTopic elsaMessage, Job job) {
        try {
            if (job == null) {
                return;
            }
            job.getQueue().offer(elsaMessage);
        } catch (Exception e) {
            log.error("dispatch message error. job:" + job.getSession(), e);
        }
    }

    public void createSendJob(Job job) {
        ScheduledFuture<?> scheduledFuture = sesPool.scheduleAtFixedRate(() -> {
            while (job.getStatus() != Job.Status.STOP && !job.getQueue().isEmpty()) {
                ElsaTopic elsaTopic = job.getQueue().poll();
                Job.Sender sender = job.getSender();
                if (sender.isClosed()) {
                    job.stop();
                    jobMap.remove(job.getSession());
                    return;
                }
                printLog(job.getSession(), "send." + JSONObject.toJSONString(elsaTopic), null);
                sender.sendData(JSONObject.toJSONString(elsaTopic));
            }
        }, 1000, 20, TimeUnit.MILLISECONDS);
        job.setFuture(scheduledFuture);
    }

    public static void printLog(String session, String logInfo, String socketId) {
        log.warn(socketId + ", " + session + ": " + logInfo);
    }
}
