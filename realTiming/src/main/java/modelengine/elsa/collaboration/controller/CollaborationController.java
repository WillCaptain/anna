/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.serializer.SerializerFeature;

import lombok.Data;
import modelengine.elsa.collaboration.aop.annotations.TokenLimiter;
import modelengine.elsa.collaboration.aop.aspect.LimiterAop;
import modelengine.elsa.collaboration.entities.base.Command;
import modelengine.elsa.collaboration.entities.base.Topic;
import modelengine.elsa.collaboration.entities.elsa.ElsaSession;
import modelengine.elsa.collaboration.entities.elsa.ElsaSessions;
import modelengine.elsa.collaboration.entities.elsa.ElsaSharedPool;
import modelengine.elsa.collaboration.interfaces.Args;
import modelengine.elsa.collaboration.interfaces.Collaboration;
import modelengine.elsa.collaboration.interfaces.MonoUtil;
import modelengine.elsa.collaboration.interfaces.Result;
import modelengine.elsa.entities.Graph;
import modelengine.elsa.entities.Page;
import modelengine.elsa.entities.ShapeProperties;
import reactor.core.publisher.Mono;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ServerWebExchange;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 处理页面的http请求
 *
 * @author 陈镕希
 * @since 2025-07-29
 */
@Controller
@RequestMapping(value = "/collaboration")
public class CollaborationController {
    private static final String NEW_PAGE = "/new_page";

    private static final String REMOVE_PAGE = "/remove_page";

    private static final String REGISTER_GRAPH = "/register_graph";//启动协同编辑，上传初始graph

    private static final String REGISTER_OFFICE = "/register_office";//启动协同编辑，读office文件

    public static final String LOAD_GRAPH = "/load_graph";

    private static final String CHANGE_PAGE_SHAPE_DATA = "/change_page_shape_data";

    private static final String NEW_SHAPE = "/new_shape";

    private static final String CHANGE_PAGE_INDEX = "/change_page_index";

    private static final String CHANGE_SHAPE_INDEX = "/change_shape_index";

    private static final String MOVE_PAGE_STEP = "/move_page_step";

    private static final String GET_PRESENT_PAGE_INDEX = "/get_present_page_index";

    private static final String PING = "/ping";

    private static final String PUBLISH_COMMENT = "/publish_comment";

    private static final String APPRECIATE = "/appreciate";

    private static final String ADD_FREE_LINE_POINT = "/add_freeline_point";

    private static final String FREE_LINE_DONE = "/freeline_done";

    private static final String GET_SESSIONS = "/get_sessions";

    private static final String GET_TOPICS = "/get_topics";

    private static final String GET_APPRECIATIONS = "/get_appreciations";

    private static final String CHANGE_GRAPH_DATA = "/change_graph_data";

    private final ElsaSessions sessions;

    private final ElsaSharedPool sharedShapes;

    private final Collaboration collaboration;

    private final LimiterAop limiterAop;

    private final Map<String, Long> ips = new ConcurrentHashMap<>(1024);

    private Map<String, GraphCache> cacheMap = new ConcurrentHashMap<>();

    @Autowired
    public CollaborationController(ElsaSessions sessions, ElsaSharedPool sharedShapes, Collaboration collaboration,
            LimiterAop limiterAop) {
        this.sessions = sessions;
        this.sharedShapes = sharedShapes;
        this.collaboration = collaboration;
        this.limiterAop = limiterAop;
    }

    /**
     * 启动协同编辑，上传初始graph
     *
     * @param args 参数
     * @return 启动协同编辑结果
     */
    @PostMapping(REGISTER_GRAPH)
    @ResponseBody
    public Mono<Result<String>> registerGraph(@RequestBody Args<Map<String, Object>> args) {
        ElsaSession session = collaboration.registerElsaSession(args);
        this.cacheMap.remove(args.getSession());
        return MonoUtil.toMono(() -> new Result<>(session.getId()));
    }

    @PostMapping(REGISTER_OFFICE)
    @ResponseBody
    public Mono<String> loadOffice(@RequestBody Args<String> args) throws Exception {
        ElsaSession session = collaboration.registerElsaSessionFromOfficeFile(args);
        this.cacheMap.remove(args.getSession());
        Args<String> l_args = new Args<>(args.getMethod(),args.getSession(),args.getFrom(),args.getTenant(),args.getSession(),args.getPage(),args.getShape(),args.getSession(), args.getFromSession());
        return this.loadGraph(l_args);
    }

    /**
     * 加载graph
     *
     * @param args 参数表
     * @return graph加载结果
     */
    @PostMapping(LOAD_GRAPH)
    @ResponseBody
    @TokenLimiter(id = LOAD_GRAPH, permitsPerSecond = 50, timeout = 0)
    public Mono<String> loadGraph(@RequestBody Args<String> args) {
        String session = args.getValue();
        return collaboration.loadSessionGraph(session, graph -> {
            if (graph == null) {
                return MonoUtil.toMono(() -> JSON.toJSONString(new Result<>(null)));
            }
            graph.refreshPageIndex();
            GraphCache graphCache = this.cacheMap.get(session);
            if (graphCache != null && graphCache.getSequence() == graph.getSequence()) {
                System.out.println("load graph by cache.");
                return MonoUtil.toMono(graphCache::getData);
            }
            String data = JSON.toJSONString(new Result<>(graph), SerializerFeature.DisableCircularReferenceDetect);
            this.cacheMap.put(session, new GraphCache(graph.getSequence(), data));
            return MonoUtil.toMono(() -> data);
        });
    }

    @Data
    private class GraphCache {
        private int sequence;

        private String data;

        public GraphCache(int sequence, String data) {
            this.sequence = sequence;
            this.data = data;
        }
    }

    /**
     * 更新页面shape数据
     *
     * @param args 参数表
     * @return 更新结果
     */
    @PostMapping(CHANGE_PAGE_SHAPE_DATA)
    @ResponseBody
    public Mono<Result<Graph>> changePageShapeData(@RequestBody Args<ShapeProperties[]> args) {
        if (collaboration.updateSessionData(args)) {
            System.out.println("graph " + args.getSession() + " data is updated");
        } else {
            System.out.println("graph " + args.getSession() + " is not found in updating graph data");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 新增页面
     *
     * @param args 参数表
     * @return 新增结果
     */
    @PostMapping(NEW_PAGE)
    @ResponseBody
    public Mono<Result> newPage(@RequestBody Args<Map<String, Object>> args) {
        if (collaboration.createGraphPage(args)) {
            System.out.println("page " + args.getPage() + " is created.....");
        } else {
            System.out.println("session is not found in creating new graph page");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 删除 {@link Page} 数据.
     *
     * @param args 参数表
     * @return 删除结果.
     */
    @PostMapping(REMOVE_PAGE)
    @ResponseBody
    public Mono<Result<Boolean>> removePage(@RequestBody Args<String> args) {
        if (collaboration.removePage(args)) {
            System.out.println("page " + args.getPage() + " is removed.....");
        } else {
            System.out.println("session is not found in remove page");
        }
        return MonoUtil.toMono(() -> new Result<>(true));
    }

    /**
     * 创建新shape
     *
     * @param args 参数表
     * @return 新增结果
     */
    @PostMapping(NEW_SHAPE)
    @ResponseBody
    public Mono<Result> newShape(@RequestBody Args<Map<String, Object>> args) {
        if (collaboration.createPageShape(args)) {
            System.out.println("shape " + args.getShape() + " is created, the type is:"+args.getValue().get("type"));
        } else {
            System.out.println("session is not found in creating new page shape");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 更改page索引
     *
     * @param args 参数表
     * @return 更改结果
     */
    @PostMapping(CHANGE_PAGE_INDEX)
    @ResponseBody
    public Mono<Result> changePageIndex(@RequestBody Args<Map<String, Integer>> args) {
        if (collaboration.changeGraphPageIndex(args)) {
            System.out.println("the index of page " + args.getPage() + " is updated");
        } else {
            System.out.println("session is not found in changing page index");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 更改shape索引
     *
     * @param args 参数表
     * @return graph加载结果
     */
    @PostMapping(CHANGE_SHAPE_INDEX)
    @ResponseBody
    public Mono<Result> changeShapeIndex(@RequestBody Args<Map<String, Integer>> args) {
        if (collaboration.changePageShapeIndex(args)) {
            System.out.println("the index of shape " + args.getShape() + " is updated");
        } else {
            System.out.println("session is not found in changing shape index");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 移动page一步
     *
     * @param args 参数表
     * @return 移动结果
     */
    @PostMapping(MOVE_PAGE_STEP)
    @ResponseBody
    public Mono<Result> movePageStep(@RequestBody Args<Integer> args) {
        if (collaboration.movePresentedPageStep(args)) {
            System.out.println("presented page step " + args.getPage() + " is moved");
        } else {
            System.out.println("session is not found in moving page step");
        }
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 获取当前page索引
     *
     * @param args 参数表
     * @return 获取内容
     */
    @PostMapping(GET_PRESENT_PAGE_INDEX)
    @ResponseBody
    @TokenLimiter(id = GET_PRESENT_PAGE_INDEX, permitsPerSecond = 1500, timeout = 0)
    public Mono<Result<Map<String, Object>>> getPresentPageIndex(@RequestBody Args<String> args) {
        ElsaSession session = collaboration.getSession(args.getSession());
        if (session == null) {
            return MonoUtil.toMono(Result::new);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("page", session.getCurrentPage());
        result.put("value", session.getCurrentStep());

        return MonoUtil.toMono(() -> new Result<>(result));
    }

    /**
     * 客户端每隔一段时间调用此接口，用于判断当前协session是否存活（并实时更新此Session的在线人数）
     *
     * @param args 参数表
     * @return 判断结果
     */
    @PostMapping(PING)
    @ResponseBody
    public Mono<Result<List<Map<String,Object>>>> ping(@RequestBody Args args) {
        //ping should be triggered in websocket
        List<Map<String, Object>> result =collaboration.ping(args.getSession(), args);
        return MonoUtil.toMono(() -> new Result<>(result));
    }

    /**
     * 发表评论
     *
     * @param args 参数表
     * @return 发布结果
     */
    @PostMapping(PUBLISH_COMMENT)
    @ResponseBody
    @TokenLimiter(id = PUBLISH_COMMENT, permitsPerSecond = 10, timeout = 0)
    public Mono<Result> publishComment(@RequestBody Args<String> args) {
        if (!collaboration.commentOnShape(args)) {
            System.out.println("session is not found in publishing comment");
        }
        return MonoUtil.toMono(Result::new);
    }

    @RequestMapping("/control")
    @ResponseBody
    public Mono<Result> control(@RequestParam(required = false) Integer comment,
            @RequestParam(required = false) Integer appreciate,
            @RequestParam(required = false) Integer graph,
            @RequestParam(required = false) Integer topic) {
        updateLimiter(PUBLISH_COMMENT, comment);
        updateLimiter(APPRECIATE, appreciate);
        updateLimiter(GET_TOPICS, topic);
        updateLimiter(LOAD_GRAPH, graph);
        return MonoUtil.toMono(Result::new);
    }

    private void updateLimiter(String key, Integer limit) {
        Optional.ofNullable(limit).ifPresent(value -> this.limiterAop.updateLimit(key, value <=0 ? 0.0001 : value));
    }

    /**
     * 点赞
     *
     * @param args 参数表
     * @return 点赞结果
     */
    @PostMapping(APPRECIATE)
    @ResponseBody
    @TokenLimiter(id = APPRECIATE, permitsPerSecond = 100, timeout = 0)
    public Mono<Result> appreciate(@RequestBody Args<Map<String,Object>> args) {
        if (!collaboration.appreciateOnPage(args)) {
            System.out.println("session is not found in appreciating");
        }
        return MonoUtil.toMono(Result::new);
    }

    @PostMapping(ADD_FREE_LINE_POINT)
    @ResponseBody
    public Mono<Result<List<Map<String, Integer>>>> addFreeLinePoint(@RequestBody Args<List<Map<String, Integer>>> args) {
        if (!collaboration.addFreeLinePointToPage(args)) {
            System.out.println("session is not found in adding freeline");
        }
        return MonoUtil.toMono(Result::new);
    }

    @PostMapping(FREE_LINE_DONE)
    @ResponseBody
    public Mono<Result> freeLineDone(@RequestBody Args<Object> args) {
        if (!collaboration.markFreeLineDone(args)) {
            System.out.println("session is not found in free line done");
        }
        return MonoUtil.toMono(Result::new);
    }

    @PostMapping(GET_APPRECIATIONS)
    @ResponseBody
    @TokenLimiter(id = GET_APPRECIATIONS, permitsPerSecond = 1500, timeout = 0)
    public Mono<Result<int[]>> getAppreciations(@RequestBody Args<String> args) {
        return MonoUtil.toMono(
                () -> new Result<>(this.collaboration.getPageProCons(args.getSession(), args.getValue())));
    }

    @PostMapping(CHANGE_GRAPH_DATA)
    @ResponseBody
    public Mono<Result> changeGraphData(@RequestBody Args<Map<String,Object>> args) {
        this.collaboration.changeGraphData(args);
        return MonoUtil.toMono(Result::new);
    }

    /**
     * 获取所有session
     *
     * @return 获取内容
     */
    @GetMapping(GET_SESSIONS)
    @ResponseBody
    @TokenLimiter(id = "getSession", permitsPerSecond = 5, timeout = 0)
    public Mono<Result<List<String>>> getSessions() {
        List<String> ss = collaboration.getSessionsBrief();
        return MonoUtil.toMono(() -> new Result<>(ss));
    }

    /**
     * 获取topic
     *
     * @param session  session
     * @param sequence 序列
     * @return 获取内容
     */
    @GetMapping(GET_TOPICS)
    @ResponseBody
    @TokenLimiter(id = GET_TOPICS, permitsPerSecond = 1000, timeout = 0)
    public Mono<Result<List<Topic>>> getTopics(@RequestParam String session, @RequestParam Integer sequence, ServerWebExchange serverWebExchange) {
        recordIp(serverWebExchange);
        Result<List<Topic>> result = new Result<>();
        ElsaSession elsaSession = this.sessions.get(session);
        if (elsaSession == null) {
            result.setSuccess(false);
            result.setCode(1000);
            result.setMessage("session not found");
            return MonoUtil.toMono(() -> result);
        }
        try {
            List<Topic> collect = elsaSession.getCommands(sequence)
                    .stream()
                    .map(Command::getTopic)
                    .collect(Collectors.toList());
            result.setData(collect);
        } catch (Exception e) {
            result.setCode(3000);
        }
        return MonoUtil.toMono(() -> result);
    }

    private void recordIp(ServerWebExchange serverWebExchange) {
        try {
            ServerHttpRequest request = serverWebExchange.getRequest();
            HttpHeaders headers = request.getHeaders();
            String ip = headers.getFirst("x-forwarded-for");
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = headers.getFirst("Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = headers.getFirst("WL-Proxy-Client-IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = headers.getFirst("HTTP_CLIENT_IP");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = headers.getFirst("HTTP_X_FORWARDED_FOR");
            }
            if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
                ip = Optional.ofNullable(serverWebExchange.getRequest().getRemoteAddress())
                        .map(address -> address.getAddress().getHostAddress())
                        .orElse("--");
            }
            ips.put(ip, System.currentTimeMillis());
        } catch (Exception e) {
            // do nothing
        }
    }

    @GetMapping("/count")
    @ResponseBody
    public Mono<Result<Object>> getViewerCount(@RequestParam(required = false) Boolean detail,
            @RequestParam(required = false) Long liveTime) {
        if (Boolean.TRUE.equals(detail)) {
            return MonoUtil.toMono(() -> new Result<>(ips));
        } else {
            long diff = Optional.ofNullable(liveTime).orElse(10000L);
            long current = System.currentTimeMillis();
            Map<String, Object> countMap = new HashMap<>();
            countMap.put("all", ips.size());
            countMap.put("live", ips.values().stream().filter(time -> current - time < diff).count());
            return MonoUtil.toMono(() -> new Result<>(countMap));
        }
    }

    @GetMapping("/clear")
    @ResponseBody
    public Mono<Result> clear(@RequestParam String sessionId) {
        if (StringUtils.isBlank(sessionId)) {
            this.sessions.getAll().forEach(s -> this.sessions.close(s.getId()));
            System.out.println("Clear all sessions.");
        } else {
            this.sessions.close(sessionId);
            System.out.println("clear session[" + sessionId + "].");
        }
        ips.clear();
        return MonoUtil.toMono(Result::new);
    }
}
