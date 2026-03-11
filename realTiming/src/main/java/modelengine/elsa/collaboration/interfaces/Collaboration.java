/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.interfaces;

import modelengine.elsa.collaboration.entities.common.SessionMode;
import modelengine.elsa.collaboration.entities.elsa.ElsaSession;
import modelengine.elsa.collaboration.entities.elsa.ElsaSessions;
import modelengine.elsa.collaboration.entities.elsa.ElsaSharedPool;
import modelengine.elsa.collaboration.entities.elsa.ElsaTopic;
import modelengine.elsa.collaboration.entities.users.User;
import modelengine.elsa.entities.Graph;
import modelengine.elsa.entities.Page;
import modelengine.elsa.entities.Shape;
import modelengine.elsa.entities.ShapeProperties;
import modelengine.elsa.collaboration.entities.elsa.commands.AddFreeLinePointCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.AppreciateCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.ChangePageIndexCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.ChangeShapeIndexCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.FreeLineDoneCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.GraphDataChangeCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.MovePageStepCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.NewPageCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.NewShapeCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.PageDataChangeCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.PublishCommentCommand;
import modelengine.elsa.collaboration.entities.elsa.commands.RemovePageCommand;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 协作的内部处理类
 *
 * @author 陈镕希
 * @since 2025-07-25
 */
@Component
public class Collaboration {
    public static final String NO_IN_SHARE = "";

    private static final String SHAPE_PROPERTY_SHARED = "shared";

    private static final String SHAPE_PROPERTY_PRE_IN_SHARED = "preInShared";

    private static final String SHAPE_PROPERTY_IN_SHARED = "inShared";

    private static final String SHAPE_PROPERTY_SESSION = "session";

    private static final String SHAPE_PROPERTY_PAGE = "page";

    private static final String SHAPE_PROPERTY_X = "x";

    private static final String SHAPE_PROPERTY_Y = "y";

    /**
     * 这里是collaborationSession
     */
    private final ElsaSessions sessions;

    private final ElsaSharedPool sharedPool;
    private final LocalUpdator local;

    //    private OfficeElsaParser officeParser;


    @Autowired
    //    public Collaboration(ElsaSessions sessions, ElsaSharedPool sharedPool, LocalUpdator local, OfficeElsaParser officeParser) {
    public Collaboration(ElsaSessions sessions, ElsaSharedPool sharedPool, LocalUpdator local) {
        this.sessions = sessions;
        this.sharedPool = sharedPool;
        this.local = local;
        //        this.officeParser = officeParser;
    }

    public ElsaSession registerElsaSession(Args<Map<String, Object>> args) {
        String sessionId = args.getSession();
        sessions.close(sessionId);
        SessionMode mode = sessionId.equals(args.getGraph()) ? SessionMode.COLLABORATION : SessionMode.PRESENTATION;
        ElsaSession session = sessions.create(sessionId, mode, args.getTenant());
        final Graph graph = convertGraph(args, session);

        session.initialize(graph);
        System.out.println("new graph " + session.getSnapshot().getId() + " is uploaded by " + args.getFrom());
        return session;
    }

    public ElsaSession registerElsaSessionFromOfficeFile(Args<String> args) throws Exception {

        String sessionId = args.getSession();
        sessions.close(sessionId);
        SessionMode mode = sessionId.equals(args.getGraph()) ? SessionMode.COLLABORATION : SessionMode.PRESENTATION;
        ElsaSession session = sessions.create(sessionId, mode, args.getTenant());
        final Graph graph = null;//todo:this.officeParser.toElsaFromFile("d:\\"+sessionId);
        session.initialize(graph);
        System.out.println("new graph " + session.getSnapshot().getId() + " is uploaded by from local file" + sessionId);
        return session;
    }

    private Graph convertGraph(@RequestBody Args<Map<String, Object>> args, ElsaSession session) {
        final Graph graph = new Graph(args.getGraph());
        args.getValue().keySet().forEach(k -> {
            switch (k) {
                case "pages":
                    convertPage(graph, (List<Map<String, Object>>) args.getValue().get("pages"), session);
                    break;
                default:
                    graph.getProperties().put(k, args.getValue().get(k));
                    break;

            }
        });
        return graph;
    }

    private void convertPage(Graph graph, List<Map<String, Object>> pages, ElsaSession session) {
        pages.forEach(p -> {
            final Page page = graph.newPage(p.get("id").toString());
            p.keySet().forEach(k1 -> {
                switch (k1) {
                    case "shapes":
                        convertShape(page, (List<Map<String, Object>>) p.get("shapes"), session);
                        break;
                    default:
                        Object value = p.get(k1);
                        page.getProperties().put(k1, value);
                        if (k1.equals(SHAPE_PROPERTY_SHARED) && (Boolean) value) {
                            this.sharedPool.add(page.get("id").toString(), page.getId(), graph.getId(),
                                    session.getId());
                        }
                        break;
                }
            });
        });
    }

    private void convertShape(Page page, List<Map<String, Object>> shapes, ElsaSession session) {
        shapes.forEach(s -> {
            Shape shape = page.newShape(s.get("id").toString());
            s.keySet().forEach(k2 -> {
                Object value = s.get(k2);
                shape.getProperties().put(k2, value);
                //if the shape is shared, put the shape into shared shapes
                if (k2.equals(SHAPE_PROPERTY_SHARED) && (Boolean) value && !s.get("container").equals("")) {
                    this.sharedPool.add(s.get("id").toString(), page.getId(), page.getGraphId(), session.getId());
                }
            });

        });
    }

    public Graph loadSessionGraph(String sessionId) {
        ElsaSession session = sessions.get(sessionId);
        return session == null ? null : session.getSnapshot();
    }

    public <T> T loadSessionGraph(String sessionId, Function<Graph, T> resultHandler) {
        ElsaSession session = sessions.get(sessionId);
        return session == null ? resultHandler.apply(null) : session.getSnapshot(resultHandler);
    }

    public boolean updateSessionData(Args<ShapeProperties[]> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<ShapeProperties[]> topic = args.toTopic();
        PageDataChangeCommand command = new PageDataChangeCommand(topic, this.sharedPool,this.local);
        session.acceptCommand(command);
        //find shared shape and set shape to share pool
        for (ShapeProperties sp : args.getValue()) {
            Boolean shared = false;
            Page page = session.getSnapshot().getPage(args.getPage());
            if (page != null) {
                if (args.getPage().equals(sp.getShape())) {
                    //先处理是不是page.shared
                    shared = page.get(SHAPE_PROPERTY_SHARED)!=null && (Boolean) page.get(SHAPE_PROPERTY_SHARED);
                } else {
                    //如果该shape是被共享的shape
                    Shape shape = page.getShape(sp.getShape());
                    shared =shape.get(SHAPE_PROPERTY_SHARED)!=null && (Boolean)shape.get(SHAPE_PROPERTY_SHARED) && !shape.get("container").equals("");
                }
            }
            //            if (shared != null && (Boolean) shared) {
            if (shared) {
                Args<ShapeProperties> arg = new Args<>("", args.getSession(), args.getFrom(), args.getTenant(),
                        args.getGraph(), args.getPage(), sp.getShape(), sp, args.getFromSession());
                ifShapeShared(arg, session);
            }
            if (args.getPage().equals(sp.getShape())) {
                continue;//page will not be in shared
            }

            //如果该shape是共享shape里的子shape
            if (page != null) {
                Shape shape = page.getShape(sp.getShape());
                String inShared = shape.get(SHAPE_PROPERTY_IN_SHARED).toString();
                if(page.containsShape(inShared)){
                    Shape parent = page.getShape(inShared);
                    if(parent.get(SHAPE_PROPERTY_SHARED)==null || !(Boolean)parent.get(SHAPE_PROPERTY_SHARED)){
                        inShared = NO_IN_SHARE;
                        shape.set(SHAPE_PROPERTY_IN_SHARED,NO_IN_SHARE);
                    }
                }
                String preInShared = NO_IN_SHARE;
                if (shape.contains(SHAPE_PROPERTY_PRE_IN_SHARED)) {
                    preInShared = shape.get(SHAPE_PROPERTY_PRE_IN_SHARED).toString();
                }
                shape.set(SHAPE_PROPERTY_PRE_IN_SHARED, inShared);//cache the in shared
                if (!inShared.equals(NO_IN_SHARE)){// || (!preInShared.equals(NO_IN_SHARE))) {//now is in share or pre in share all need share collaboration
                    Args<ShapeProperties> arg = new Args<>("", args.getSession(), args.getFrom(), args.getTenant(),
                            args.getGraph(), args.getPage(), sp.getShape(), sp, args.getFromSession());
                    ifShapeInShared(arg, session, inShared, preInShared);
                }
            }
        }
        return true;
    }

    private void ifShapeShared(Args<ShapeProperties> args, ElsaSession fromSession) {
        //register the shared shape
        //        if (this.sharedPool.add(args.getShape(), args.getPage(), args.getGraph(), fromSession.getId())) {
        //            //this is the first share
        //            //looking for existing sessions, add the session into shared shapes pool
        //            sessions.getAll().forEach(s -> {
        //                if (s.getId().equals(fromSession.getId())) {
        //                    return;
        //                }
        //                for (Page page : s.getSnapshot().getPages()) {
        //                    Shape shape = page.getSharedShape(args.getShape());
        //                    if (!shape.contains(SHAPE_PROPERTY_X) || shape.get(SHAPE_PROPERTY_X) == null) {
        //                        continue;//not shared in this page
        //                    }
        //                    sharedPool.add(shape.getId(), page.getId(), s.getSnapshot().getId(), s.getId());
        //                }
        //            });
        //        }
        //simulate property change topic to broadcast all client to update shared property;
        ShapeProperties sp = args.getValue();
        //ignore below properties change in shared shape
        Map<String, Object> ps = new HashMap<>();
        List<String> excluded = new ArrayList<>();
        excluded.add(SHAPE_PROPERTY_X);
        excluded.add(SHAPE_PROPERTY_Y);
        excluded.add("rotateDegree");
        excluded.add("container");
        excluded.add("width");
        excluded.add("height");
        excluded.add("borderColor");
        excluded.add("backColor");
        sp.getProperties().keySet().forEach(k -> {
            if (excluded.contains(k)) {
                return;
            }
            ps.put(k, sp.getProperties().get(k));
        });
        ShapeProperties properties = new ShapeProperties(sp.getShape(), ps);
        ShapeProperties[] sps = new ShapeProperties[1];
        sps[0] = properties;
        sharedPool.get(properties.getShape()).forEach(p -> {
            if (p.get(SHAPE_PROPERTY_SESSION).equals(fromSession.getId())) {
                return;
            }
            ElsaTopic<ShapeProperties[]> topic = new ElsaTopic<>("", p.get(SHAPE_PROPERTY_PAGE), properties.getShape(),
                    sps, args.getFrom());
            PageDataChangeCommand command = new PageDataChangeCommand(topic, this.sharedPool, this.local);
            sessions.get(p.get(SHAPE_PROPERTY_SESSION)).acceptCommand(command);
        });
    }

    private void ifShapeInShared(Args<ShapeProperties> args, ElsaSession fromSession, String inShared,
            String preInShared) {
        if (!inShared.equals(NO_IN_SHARE)) {
            Shape fromShared = fromSession.getSnapshot()
                    .getPage(args.getPage())
                    .getSharedShape(inShared);//find the shared parent
            sharedPool.get(inShared).forEach(p -> {
                if (p.get(SHAPE_PROPERTY_SESSION).equals(fromSession.getId())) {
                    return;
                }
                ElsaSession session = sessions.get(p.get(SHAPE_PROPERTY_SESSION));
                Page toPage = session.getSnapshot().getPage(p.get(SHAPE_PROPERTY_PAGE));
                //if(!toPage.containsShape(inShared)) return;//not in shared in this session
                Shape toShared = toPage.getSharedShape(inShared);
                if (!toShared.contains(SHAPE_PROPERTY_X) || toShared.get(SHAPE_PROPERTY_X) == null) {
                    return;
                }

                Shape fromShape = fromSession.getSnapshot()
                        .getPage(args.getPage())
                        .getShape(args.getValue().getShape());
                if (toPage.containsShape(args.getValue().getShape())) {//如果同步的页面里有这个shape，那么只需要同步改动的属性
                    ShapeProperties sp = args.getValue();
                    Map<String, Object> origin = sp.getProperties();
                    if (origin.get("container") != null && origin.get("deleteFromShare") != null && origin.get(
                            "container").equals("") && (boolean) origin.get("deleteFromShare")) {
                        return;
                    }
                    Map<String, Object> ps
                            = new HashMap<>();//create new properties, change x,y from dx, dy;shared shapes could have
                    // different positions
                    origin.keySet().forEach(k -> ps.put(k, sp.getProperties().get(k)));
                    ShapeProperties properties = new ShapeProperties(sp.getShape(), ps);
                    ShapeProperties[] sps = new ShapeProperties[1];
                    sps[0] = properties;
                    if (ps.containsKey("dx")) {
                        ps.put(SHAPE_PROPERTY_X,
                                ((Number) toShared.get(SHAPE_PROPERTY_X)).floatValue() + ((Number) ps.get(
                                        "dx")).floatValue());
                    }
                    if (ps.containsKey("dy")) {
                        ps.put(SHAPE_PROPERTY_Y,
                                ((Number) toShared.get(SHAPE_PROPERTY_Y)).floatValue() + ((Number) ps.get(
                                        "dy")).floatValue());
                    }
                    String container = fromShape.get("container").toString();
                    ps.put("container", container);//this is a workaround to recover the container
                    //check if the container exists in toPage, then delete the shape
                    if (!toPage.containsShape(container) && !toPage.getId().equals(container)) {
                        ps.put("container", "");
                    }
                    //inshared 形状随着parent一起被删除，该shape不应该被其他共享的地方删除
                    if(container.equals("") && fromShared.getId().equals(ps.get("inShared")) && fromShared.get("container").equals("")){
                        ps.put("container",fromShared.getId());
                    }
                    ElsaTopic<ShapeProperties[]> topic = new ElsaTopic<>("", p.get(SHAPE_PROPERTY_PAGE),
                            properties.getShape(), sps, args.getFrom());
                    PageDataChangeCommand command = new PageDataChangeCommand(topic, this.sharedPool, this.local);
                    sessions.get(p.get(SHAPE_PROPERTY_SESSION)).acceptCommand(command);
                } else {//否则把这个shape完全拷贝一份到目标session
                    Map<String, Object> toProperties = new HashMap<>();
                    Map<String, Object> fromProperties = fromShape.getProperties();
                    fromProperties.keySet().forEach(k -> {
                        if (k.equals(SHAPE_PROPERTY_X) || k.equals(SHAPE_PROPERTY_Y)) {
                            toProperties.put(k,
                                    ((Number) fromProperties.get(k)).floatValue() - ((Number) fromShared.get(
                                            k)).floatValue() + ((Number) toShared.get(k)).floatValue());
                        } else {
                            toProperties.put(k, fromProperties.get(k));
                        }
                    });
                    ElsaTopic<Map<String, Object>> topic = new ElsaTopic<>("", toPage.getId(), fromShape.getId(),
                            toProperties, args.getFrom());
                    NewShapeCommand command = new NewShapeCommand(topic, this.sharedPool);
                    session.acceptCommand(command);
                }
            });
        } else {
            //moved out or deleted
            //create new properties, change x,y from dx, dy;shared shapes could have different
            Map<String, Object> ps = new HashMap<>();
            // positions
            ps.put("container", "");
            ShapeProperties properties = new ShapeProperties(args.getValue().getShape(), ps);
            ShapeProperties[] sps = new ShapeProperties[1];
            sps[0] = properties;
            sharedPool.get(preInShared).forEach(p -> {
                if (p.get(SHAPE_PROPERTY_SESSION).equals(fromSession.getId())) {
                    return;
                }
                ElsaTopic<ShapeProperties[]> topic = new ElsaTopic<>("", p.get(SHAPE_PROPERTY_PAGE),
                        properties.getShape(), sps, args.getFrom());
                PageDataChangeCommand command = new PageDataChangeCommand(topic, this.sharedPool, this.local);
                sessions.get(p.get(SHAPE_PROPERTY_SESSION)).acceptCommand(command);
            });
        }
    }

    public boolean createGraphPage(Args<Map<String, Object>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<Map<String, Object>> topic = args.toTopic();
        NewPageCommand command = new NewPageCommand(topic);
        session.acceptCommand(command);
        return true;
    }

    public boolean createPageShape(Args<Map<String, Object>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<Map<String, Object>> topic = args.toTopic();
        NewShapeCommand command = new NewShapeCommand(topic,this.sharedPool);
        session.acceptCommand(command);

        return true;
    }

    public boolean removePage(Args<String> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<String> topic = args.toTopic();
        RemovePageCommand command = new RemovePageCommand(topic);
        session.acceptCommand(command);
        return true;
    }

    public boolean changeGraphPageIndex(Args<Map<String, Integer>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<Map<String, Integer>> topic = args.toTopic();
        ChangePageIndexCommand command = new ChangePageIndexCommand(topic);
        session.acceptCommand(command);
        return true;
    }

    public boolean changePageShapeIndex(Args<Map<String, Integer>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<Map<String, Integer>> topic = args.toTopic();
        ChangeShapeIndexCommand command = new ChangeShapeIndexCommand(topic);
        session.acceptCommand(command);
        return true;
    }

    public boolean movePresentedPageStep(Args<Integer> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        ElsaTopic<Integer> topic = args.toTopic();
        MovePageStepCommand command = new MovePageStepCommand(topic);
        session.acceptCommand(command);
        return true;
    }

    public ElsaSession getSession(String sessionId) {
        return sessions.get(sessionId);
    }

    public List<Map<String,Object>> ping(String sessionId, Args from) {
        ElsaSession session = sessions.get(sessionId);
        if (session == null) return null;
        GraphSession fromSession = from.getFromSession();
        User user = session.ping(fromSession.getId(),fromSession.getName(),"");
        if(user==null) return null;
        user.setWorkOnPage(fromSession.getPage());
        user.setWorkOnShape(fromSession.getShape());
        List<Map<String,Object>> sessionsInfo = new ArrayList<>();
        session.getLoginSessions().forEach(s->{
            Map<String,Object> sessionInfo = new HashMap<>();
            sessionInfo.put("page",s.getWorkOnPage());
            sessionInfo.put("shape",s.getWorkOnShape());
            sessionInfo.put("id",s.getId());
            sessionInfo.put("name",s.getName());
            sessionsInfo.add(sessionInfo);
        });
        return sessionsInfo;
    }

    public boolean commentOnShape(Args<String> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        PublishCommentCommand command = new PublishCommentCommand(args.toTopic());
        session.acceptCommand(command);
        return true;
    }

    public boolean appreciateOnPage(Args<Map<String, Object>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        AppreciateCommand command = new AppreciateCommand(args.toTopic());
        session.acceptCommand(command);
        return true;
    }

    public boolean addFreeLinePointToPage(Args<List<Map<String, Integer>>> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        AddFreeLinePointCommand command = new AddFreeLinePointCommand(args.toTopic());
        session.acceptCommand(command);
        return true;
    }

    public boolean markFreeLineDone(Args<Object> args) {
        ElsaSession session = sessions.get(args.getSession());
        if (session == null) {
            return false;
        }
        FreeLineDoneCommand command = new FreeLineDoneCommand(args.toTopic());
        session.acceptCommand(command);
        return true;
    }

    public List<String> getSessionsBrief() {
        return sessions.getAll()
                .stream()
                .map(s -> "session id: " + s.getId() + " graph id:" + s.getSnapshot().getId())
                .collect(Collectors.toList());
    }

    public int[] getPageProCons(String session, String page) {
        ElsaSession elsaSession = sessions.get(session);
        return Optional.ofNullable(elsaSession)
                .map(s -> new int[] {elsaSession.getPros(page), elsaSession.getCons(page)})
                .orElseGet(() -> new int[] {0, 0});
    }

    public void changeGraphData(Args<Map<String, Object>> args) {
        ElsaSession session = sessions.get(args.getSession());
        GraphDataChangeCommand command = new GraphDataChangeCommand(args.toTopic());
        session.acceptCommand(command);
    }
}
