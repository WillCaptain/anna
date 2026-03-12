/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  Mock 数据 API — 供 Anna 白板图表演示使用。
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  端点 → 适用图表 → 返回格式（精确匹配 drawer 期望）                      │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │  GET /mock/bar      柱状图        { labels, values, max }               │
 *  │  GET /mock/line     折线图        { series:[{data}], max }               │
 *  │  GET /mock/area     面积图        { series:[{data}], max }               │
 *  │  GET /mock/stacked  堆叠柱状图    { groups, series:[{label,values}],max }│
 *  │  GET /mock/hbar     水平柱状图    { items:[{label,value}], max }         │
 *  │  GET /mock/pie      饼图          { slices:[{label,value}] }             │
 *  │  GET /mock/donut    环形图        { segments:[{label,value}] }           │
 *  │  GET /mock/funnel   漏斗图        { stages:[{label,value}] }             │
 *  │  GET /mock/gauge    仪表盘        { value:0~1 }                          │
 *  │  GET /mock/radar    雷达图        { axes:[…], series:[{values:[0~1]}] }  │
 *  │  GET /mock/scatter  散点图        { series:[{points:[[x,y]]}] }          │
 *  │  GET /mock/table    表格          { cols:[…], rows:[[…]] }               │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 *  所有端点每次请求均在基准数据上叠加微量随机噪声，以模拟"实时"效果。
 *  响应统一包裹：{ "success": true, "data": <payload> }
 *  → Anna 属性面板「路径」字段填 "data" 即可提取有效载荷。
 *
 *  CORS 由 modelengine.elsa.collaboration.configurations.Cors 全局配置，此处无需重复设置。
 *--------------------------------------------------------------------------------------------*/

package modelengine.elsa.collaboration.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/mock")
public class MockDataController {

    private static final Random RNG = new Random();

    // ── 内部工具 ──────────────────────────────────────────────────────────────

    /** 在整数基准值上叠加 ±noise 的随机偏差 */
    private static int ji(int base, int noise) {
        return Math.max(0, base + RNG.nextInt(noise * 2 + 1) - noise);
    }

    /** 在浮点基准值上叠加 ±noise 的随机偏差（保留 3 位小数） */
    private static double jd(double base, double noise) {
        double v = base + (RNG.nextDouble() * 2 - 1) * noise;
        return Math.round(v * 1000.0) / 1000.0;
    }

    /** 将值裁剪到 [0, 1] 区间（用于归一化数值） */
    private static double clamp01(double v) {
        return Math.max(0.0, Math.min(1.0, v));
    }

    /** 统一响应包裹。Anna 属性面板「路径」填 "data" 即可取出载荷 */
    private static Map<String, Object> wrap(Object data) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("data", data);
        return resp;
    }

    // ── /mock/bar  →  柱状图 ─────────────────────────────────────────────────
    //
    //  期望格式（与 barChart.js DEFAULT 完全一致）：
    //  { "labels": [...], "values": [...], "max": 100 }

    @GetMapping("/bar")
    public Mono<Map<String, Object>> bar() {
        String[] labels = {"1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"};
        int[]    base   = {42,   38,   51,   49,   62,   58,   70,   73,   68,   76,   82,   95};

        List<Integer> values = new ArrayList<>();
        for (int b : base) values.add(ji(b, 5));

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("labels", List.of(labels));
        p.put("values", values);
        p.put("max", 100);
        return Mono.just(wrap(p));
    }

    // ── /mock/line  →  折线图 ─────────────────────────────────────────────────
    //
    //  期望格式（与 lineChart.js DEFAULT 完全一致）：
    //  { "series": [{ "data": [...] }, ...], "max": 100 }

    @GetMapping("/line")
    public Mono<Map<String, Object>> line() {
        int[] s1b = {30, 55, 42, 68, 52, 74, 60};
        int[] s2b = {50, 35, 62, 48, 70, 55, 82};

        List<Integer> s1 = new ArrayList<>(), s2 = new ArrayList<>();
        for (int v : s1b) s1.add(ji(v, 6));
        for (int v : s2b) s2.add(ji(v, 6));

        Map<String, Object> ser1 = new LinkedHashMap<>(); ser1.put("data", s1);
        Map<String, Object> ser2 = new LinkedHashMap<>(); ser2.put("data", s2);

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("series", List.of(ser1, ser2));
        p.put("max", 100);
        return Mono.just(wrap(p));
    }

    // ── /mock/area  →  面积图 ─────────────────────────────────────────────────
    //
    //  期望格式（与 areaChart.js DEFAULT 完全一致）：
    //  { "series": [{ "data": [...] }, ...], "max": 100 }

    @GetMapping("/area")
    public Mono<Map<String, Object>> area() {
        int[] s1b = {20, 45, 38, 62, 55, 78, 70, 88};
        int[] s2b = {35, 28, 50, 40, 65, 48, 72, 60};

        List<Integer> s1 = new ArrayList<>(), s2 = new ArrayList<>();
        for (int v : s1b) s1.add(ji(v, 7));
        for (int v : s2b) s2.add(ji(v, 7));

        Map<String, Object> ser1 = new LinkedHashMap<>(); ser1.put("data", s1);
        Map<String, Object> ser2 = new LinkedHashMap<>(); ser2.put("data", s2);

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("series", List.of(ser1, ser2));
        p.put("max", 100);
        return Mono.just(wrap(p));
    }

    // ── /mock/stacked  →  堆叠柱状图 ─────────────────────────────────────────
    //
    //  期望格式（与 stackedBarChart.js DEFAULT 完全一致）：
    //  { "groups": [...], "series": [{ "label": "...", "values": [...] }], "max": 100 }

    @GetMapping("/stacked")
    public Mono<Map<String, Object>> stacked() {
        String[] groups = {"Q1","Q2","Q3","Q4"};
        int[][] bases   = {{30,40,25,35}, {25,20,35,28}, {15,22,18,20}};
        String[] names  = {"产品线 A","产品线 B","产品线 C"};

        List<Map<String, Object>> series = new ArrayList<>();
        for (int i = 0; i < bases.length; i++) {
            List<Integer> vals = new ArrayList<>();
            for (int v : bases[i]) vals.add(ji(v, 4));
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("label", names[i]);
            s.put("values", vals);
            series.add(s);
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("groups", List.of(groups));
        p.put("series", series);
        p.put("max", 100);
        return Mono.just(wrap(p));
    }

    // ── /mock/hbar  →  水平柱状图 ────────────────────────────────────────────
    //
    //  期望格式（与 hbarChart.js DEFAULT 完全一致）：
    //  { "items": [{ "label": "...", "value": N }], "max": 100 }

    @GetMapping("/hbar")
    public Mono<Map<String, Object>> hbar() {
        String[] labels = {"北京","上海","广州","成都","武汉","杭州","西安"};
        int[]    base   = {88, 75, 63, 54, 42, 38, 31};

        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("label", labels[i]);
            item.put("value", ji(base[i], 5));
            items.add(item);
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("items", items);
        p.put("max", 100);
        return Mono.just(wrap(p));
    }

    // ── /mock/pie  →  饼图 ───────────────────────────────────────────────────
    //
    //  期望格式（与 pieChart.js DEFAULT 完全一致）：
    //  { "slices": [{ "label": "...", "value": N }] }

    @GetMapping("/pie")
    public Mono<Map<String, Object>> pie() {
        String[] labels = {"自然搜索","社交媒体","直接访问","邮件营销","付费广告","其他"};
        int[]    base   = {35, 22, 18, 12, 9, 4};

        List<Map<String, Object>> slices = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("label", labels[i]);
            s.put("value", ji(base[i], 2));
            slices.add(s);
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("slices", slices);
        return Mono.just(wrap(p));
    }

    // ── /mock/donut  →  环形图 ───────────────────────────────────────────────
    //
    //  期望格式（与 donutChart.js DEFAULT 完全一致）：
    //  { "segments": [{ "label": "...", "value": N }] }

    @GetMapping("/donut")
    public Mono<Map<String, Object>> donut() {
        String[] labels = {"渠道 A","渠道 B","渠道 C","渠道 D"};
        int[]    base   = {38, 27, 20, 15};

        List<Map<String, Object>> segs = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("label", labels[i]);
            s.put("value", ji(base[i], 3));
            segs.add(s);
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("segments", segs);
        return Mono.just(wrap(p));
    }

    // ── /mock/funnel  →  漏斗图 ──────────────────────────────────────────────
    //
    //  期望格式（与 funnelChart.js DEFAULT 完全一致）：
    //  { "stages": [{ "label": "...", "value": N }] }

    @GetMapping("/funnel")
    public Mono<Map<String, Object>> funnel() {
        String[] labels = {"曝光","点击","加购","结算","支付"};
        int[]    base   = {100, 68, 42, 22, 10};

        List<Map<String, Object>> stages = new ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("label", labels[i]);
            s.put("value", ji(base[i], (int) Math.max(1, base[i] * 0.04)));
            stages.add(s);
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("stages", stages);
        return Mono.just(wrap(p));
    }

    // ── /mock/gauge  →  仪表盘 ───────────────────────────────────────────────
    //
    //  期望格式（与 gaugeChart.js DEFAULT 完全一致）：
    //  { "value": 0~1 }（归一化浮点，0.0 = 最小，1.0 = 最大）

    @GetMapping("/gauge")
    public Mono<Map<String, Object>> gauge() {
        double value = clamp01(jd(0.72, 0.08));

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("value", value);
        return Mono.just(wrap(p));
    }

    // ── /mock/radar  →  雷达图 ───────────────────────────────────────────────
    //
    //  期望格式（与 radarChart.js DEFAULT 完全一致）：
    //  { "axes": [...], "series": [{ "values": [0~1, …] }] }
    //  注意：values 为 0~1 归一化浮点

    @GetMapping("/radar")
    public Mono<Map<String, Object>> radar() {
        String[] axes  = {"速度","精度","稳定","创新","效率","质量"};
        double[] s1b   = {0.80, 0.65, 0.90, 0.70, 0.85, 0.75};
        double[] s2b   = {0.60, 0.80, 0.55, 0.90, 0.65, 0.88};

        List<Double> v1 = new ArrayList<>(), v2 = new ArrayList<>();
        for (double v : s1b) v1.add(clamp01(jd(v, 0.05)));
        for (double v : s2b) v2.add(clamp01(jd(v, 0.05)));

        Map<String, Object> ser1 = new LinkedHashMap<>(); ser1.put("values", v1);
        Map<String, Object> ser2 = new LinkedHashMap<>(); ser2.put("values", v2);

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("axes", List.of(axes));
        p.put("series", List.of(ser1, ser2));
        return Mono.just(wrap(p));
    }

    // ── /mock/scatter  →  散点图 ─────────────────────────────────────────────
    //
    //  期望格式（与 scatterChart.js DEFAULT 完全一致）：
    //  { "series": [{ "points": [[x, y], ...] }] }

    @GetMapping("/scatter")
    public Mono<Map<String, Object>> scatter() {
        int[][] pts1b = {{15,72},{24,55},{32,80},{40,65},{52,70},{60,82},{70,60},{80,75},{88,55},{44,88}};
        int[][] pts2b = {{10,40},{22,30},{35,50},{48,42},{55,60},{65,38},{72,52},{84,44},{90,35},{30,65}};

        List<List<Integer>> pts1 = new ArrayList<>(), pts2 = new ArrayList<>();
        for (int[] p : pts1b) pts1.add(List.of(ji(p[0],3), ji(p[1],5)));
        for (int[] p : pts2b) pts2.add(List.of(ji(p[0],3), ji(p[1],5)));

        Map<String, Object> s1 = new LinkedHashMap<>(); s1.put("points", pts1);
        Map<String, Object> s2 = new LinkedHashMap<>(); s2.put("points", pts2);

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("series", List.of(s1, s2));
        return Mono.just(wrap(p));
    }

    // ── /mock/table  →  表格 ─────────────────────────────────────────────────
    //
    //  期望格式（与 table.js DEFAULT 完全一致）：
    //  { "cols": [...], "rows": [[...], ...] }

    @GetMapping("/table")
    public Mono<Map<String, Object>> table() {
        List<String> cols = List.of("季度", "销售额(万)", "利润(万)", "增长率", "完成率");

        int[][] base = {{1280,380,12,96},{1450,420,13,102},{1620,490,12,98},{1830,560,13,105}};
        String[] q   = {"Q1","Q2","Q3","Q4"};

        List<List<Object>> rows = new ArrayList<>();
        for (int i = 0; i < base.length; i++) {
            rows.add(List.of(
                q[i],
                ji(base[i][0], 30),
                ji(base[i][1], 15),
                ji(base[i][2], 1) + "%",
                ji(base[i][3], 2) + "%"
            ));
        }

        Map<String, Object> p = new LinkedHashMap<>();
        p.put("cols", cols);
        p.put("rows", rows);
        return Mono.just(wrap(p));
    }
}
