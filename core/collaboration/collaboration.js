/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {PAGE_MODE} from "../../common/const.js";
import {sleep} from "../../common/util.js";
import {ajax} from "../../common/ajax.js";
import {ANNA} from "../entry/annaEntry.js";

/**
 * collaboration — 协同服务客户端。
 *
 * 封装与协同服务器的通信，支持两种传输模式：
 *   'push'（默认）：WebSocket 长连接，服务端主动推送消息（低延迟）
 *   'pull'        ：HTTP 轮询（每秒一次），适用于不支持 WebSocket 的环境
 *
 * 消息过滤规则（onMessage）：
 *   只处理以下消息：
 *     1. topic 在 whiteTopics 白名单中（特殊消息，如演示步骤切换）
 *     2. message.session === graph.collaborationSession
 *        AND message.from !== graph.cookie（非自己发出的消息）
 *
 * @param {Graph}  graph  所属 Graph 对象
 * @param {string} url    协同服务基础 URL（HTTP）
 */
const collaboration = (graph, url) => {
    const COLLABORATION_STATUS = {RUNNING: "running", CLOSE: "close"};
    const self = {graph};
    // connectMode：'push'（WebSocket）或 'pull'（HTTP 轮询）
    self.connectMode = 'push';
    // pullingSequence：HTTP 轮询模式下的消息序列号，用于增量拉取（避免重复处理旧消息）
    self.pullingSequence = 0;
    // whiteTopics：白名单 topic 列表，即使 session 不匹配也会处理（如跨 session 的演示同步）
    self.whiteTopics = [];
    self.communicator = ((session, url) => {
        let webSocket = null;

        const com = {};

        /**
         * 向服务端发送 HTTP POST 请求。
         * 若 method 为 'load_graph'，额外从响应中读取 sequence 号，
         * 用于后续 HTTP 轮询时的增量拉取起点。
         */
        com.send = async (args, callback) => {
            const result = await ajax.post(encodeURI(url + "/" + args.method), args, callback);
            const data = result.data;
            if (args.method === 'load_graph') {
                if (data) {
                    self.pullingSequence = data.sequence + 1;
                } else {
                    self.pullingSequence = 0;
                }
            }
            return data;
        }

        /**
         * 接收并过滤服务端推送的消息。
         * 过滤掉：
         *   - 不属于本 collaborationSession 的消息
         *   - 本客户端自己发出的消息（cookie 匹配）
         * 通过后调用 graph.publish(message) 分发给 graph.subscriptions 处理。
         */
        com.onMessage = message => {
            if (!self.whiteTopics.contains(t => t === message.topic)
                && (message.session !== self.graph.collaborationSession || message.from === self.graph.cookie)) {
                return;
            }
            self.graph.publish(message);
        };

        /**
         * 心跳检测循环：WebSocket 模式下每秒 ping 一次协同服务，
         * 获取当前 session 中所有在线用户列表，更新到对应 page/shape 的 editBy 属性。
         * editBy 用于 UI 显示"谁正在编辑此页面/形状"。
         */
        const checkConnection = async (com) => {
            while (com.status === COLLABORATION_STATUS.RUNNING) {
                await sleep(1000);
                self.invoke({method: "ping"}).then(users=>{
                    if (!users) {
                        return;
                    }
                    const pages = {};
                    const shapes = {};
                    users.forEach(user=>{
                        !pages[user.page] && (pages[user.page] = []);
                        pages[user.page].push({id: user.id, name: user.name});
                        if (!user.shape) {
                            return;
                        }

                        !shapes[user.shape] && (shapes[user.shape] = []);
                        shapes[user.shape].push({id: user.id, name: user.name});
                    });
                    graph.pages.forEach(p=>{
                        p.editBy = pages[p.id];
                        (graph.activePage) && (p.id === graph.activePage.id) && (graph.activePage.editBy = p.editBy);
                        if (!p.editBy) {
                            return;
                        }
                        p.shapes.forEach(s=>{
                            s.editBy = shapes[s.id];
                        })
                        if (graph.activePage && p.id === graph.activePage.id) {
                            graph.activePage.sm.getShapes().forEach(s => {
                                s.editBy = shapes[s.id];
                            })
                        }
                    })
                })
            }
        };

        function openWebsocket() {
            com.status = COLLABORATION_STATUS.RUNNING;
            let baseDomain = url.split("//")[1];

            // 当使用https协议时，websocket使用wss协议.
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            webSocket = new WebSocket(protocol + "://" + baseDomain + "/annaData?" + "session=" + self.graph.session.id + "&collaborationSession=" + self.graph.collaborationSession + "&cookie=" + self.graph.cookie);
            webSocket.onmessage = msg => {
                let message = JSON.parse(msg.data);
                com.onMessage(message);
            }
            checkConnection(com);
        }

        let reViewGraphCount = 6;

        function reViewGraph() {
            ANNA.viewGraph(graph.collaborationSession, graph.type, graph.div, () => {
                if (reViewGraphCount-- > 0) {
                    setTimeout(reViewGraph, (3 + Math.round(Math.random() * 10)) * 1000);
                }
            });
        }

        /**
         * HTTP 轮询模式的单次拉取逻辑。
         * 通过 pullingSequence 增量拉取，避免重复处理历史消息。
         * 若服务端返回 code === 3000，表示会话已过期：
         *   - 关闭连接
         *   - VIEW 模式下随机延迟后重新加入（防止大量客户端同时重连造成雪崩）
         */
        function httpPull() {
            if (self.mute) {
                return;
            }
            ajax.get(encodeURI(url + "/" + 'get_topics?' + 'session=' + self.graph.collaborationSession + '&sequence=' + self.pullingSequence), data => {
                const result = JSON.parse(data);
                if (result.code === 3000) {
                    com.close();
                    if (graph.getMode() === PAGE_MODE.VIEW) {
                        setTimeout(reViewGraph, (3 + Math.round(Math.random() * 10)) * 1000);
                    }
                    return;
                }
                const topics = result.data;

                topics && topics.forEach(topic => {
                    self.pullingSequence = topic.sequence + 1;
                    com.onMessage(topic);
                });
            });
        }

        function openHttpPulling() {
            self.pullingInterval = setInterval(httpPull, 1000);
        }

        function closeHttpPulling() {
            clearInterval(self.pullingInterval);
        }

        com.connect = () => {
            if (self.connectMode === 'push') {
                setTimeout(() => {
                    openWebsocket();
                });
            } else {
                openHttpPulling();
            }
        };

        com.close = () => {
            com.status = COLLABORATION_STATUS.CLOSE;
            if (self.connectMode === 'push') {
                webSocket && webSocket.close();
            } else {
                closeHttpPulling();
            }
        };

        return com;
    })(graph.collaborationSession, url);

    const TOPIC_MAP = {
        "new_page": "page_added",
        "new_shape": "shape_added",
        "change_shape_index": "shape_index_changed",
        "change_page_shape_data": "page_shape_data_changed",
        "publish_comment": "comment",
        "add_freeline_point": "add_freeline_point",
        "freeline_done": "freeline_done"
    }

    /**
     * invoke — 向协同服务发送操作指令，同时本地即时同步渲染层。
     *
     * 处理流程：
     *   1. inMessaging（正在处理服务端消息中）→ 返回 undefined，防止循环广播
     *   2. mode === DISPLAY → 返回 undefined，展示模式不向服务端发送操作
     *   3. args.page 存在 → 构造本地消息，立即调用 syncSubscribedPage 更新渲染
     *   4. mute === true → 返回 undefined，静默模式不发送网络请求
     *   5. 填充 session/from/tenant/graph 元信息，通过 communicator.send 发送 HTTP POST
     */
    self.invoke = async (args, callback) => {
        if (self.communicator.inMessaging) {
          return undefined;
        }
        if (args.mode === PAGE_MODE.DISPLAY) {
          return undefined;
        }
        if (args.page) {
            // 本地即时同步：构造与服务端广播同格式的消息，立即通知所有订阅此页的运行时对象更新渲染
            const message = {
                topic: TOPIC_MAP[args.method],
                page: args.page,
                shape: args.shape,
                value: args.value,
                from: graph.session.id
            };
            message && graph.syncSubscribedPage(message, true);
        }

        if (self.mute) {
          return undefined;
        }
        args.session = graph.collaborationSession;
        // from 填入 cookie（非 session.id），服务端广播时接收方通过 cookie 过滤掉自己发出的消息
        args.from = graph.cookie;
        args.tenant = graph.tenant;
        args.graph = graph.id;
        args.fromSession = graph.session;
        if (args.mode === undefined) {
            args.mode = PAGE_MODE.CONFIGURATION;
        }
        if (self.tag !== undefined) {
            args.tag = self.tag;
            delete self.tag;
        }
        if (callback === undefined) {
            return await self.communicator.send(args);
        } else {
            self.communicator.send(args, callback);
          return undefined;
        }
    };

    // mute：静默模式，invoke 不发送网络请求，本地同步仍然执行
    self.mute = false;

    self.connect = () => self.communicator.connect();
    self.close = () => {
        self.communicator.close();
        self.graph = null;
    }
    self.getStatus = () => self.communicator.status;

    return self;
};

export {collaboration};
