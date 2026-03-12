/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  数据可视化图表基础工具
 *  所有图表分类文件均从此导入 makeChartDrawer / makeChart / PALETTE
 *--------------------------------------------------------------------------------------------*/

import {rectangle}            from "@anna/core/shapes/rectangle.js";
import {canvasGeometryDrawer} from "@anna/core/drawers/canvasGeometryDrawer.js";
import {tabField, textareaField, selectField, inputField, actionField}
                              from "@anna/core/properties/fieldDef.js";
import {baseDisplayFields}    from "@anna/core/properties/shapeDisplayFields.js";
import {fetchDataSource, loadCachedData, getCacheAge}
                              from "./_dataSource.js";

/** 8-色分类调色板，用于数据系列着色 */
export const PALETTE = [
    '#7c6ff7', // purple
    '#4fc3f7', // sky blue
    '#81c784', // sage green
    '#ffb74d', // warm orange
    '#f06292', // rose pink
    '#64b5f6', // cornflower blue
    '#a5d6a7', // mint
    '#ffd54f', // amber
];

/**
 * 创建图表 drawer 工厂。
 *
 * drawFn 签名：(context, px, py, W, H, fill, stroke, bw, shape) => void
 *   px, py  — 有效区域原点（≈ shape.margin = 1）
 *   W, H    — 有效绘制尺寸（width-2, height-2）
 *   fill    — shape.getBackColor()
 *   stroke  — shape.getBorderColor()
 *   bw      — shape.borderWidth
 *   shape   — shape 本身（可调用 parseChartData 读取数据）
 */
export const makeChartDrawer = (drawFn) => (shape, div, x, y) => {
    const self = canvasGeometryDrawer(shape, div, x, y);
    self.drawBorder      = () => {};
    self.backgroundRefresh = () => {};

    self.drawStatic = (context, px, py) => {
        const W  = shape.width  - 2;
        const H  = shape.height - 2;
        if (W <= 0 || H <= 0) return;

        const bw     = shape.borderWidth || 1.5;
        const fill   = shape.getBackColor();
        const stroke = shape.getBorderColor();

        context.save();
        context.lineWidth   = bw;
        context.lineCap     = 'round';
        context.lineJoin    = 'round';
        context.strokeStyle = stroke;
        context.fillStyle   = fill;

        drawFn(context, px, py, W, H, fill, stroke, bw, shape);

        context.restore();
    };

    self.getPoints = () => [];
    return self;
};

// ── Tab 图标 SVG ─────────────────────────────────────────────────────────────

const DATA_TAB_ICON = `<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
    <rect x="2" y="2" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.3"/>
    <rect x="2" y="7" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1.3"/>
    <rect x="2" y="12" width="7"  height="3" rx="1" stroke="currentColor" stroke-width="1.3"/>
</svg>`;

// ── API 配置字段 (visibleWhen: dataSourceType === 'api') ───────────────────────

const API_WHEN = { key: 'dataSourceType', value: 'api' };
const MAN_WHEN = { key: 'dataSourceType', value: 'manual' };

function buildDataFields(defaultData, shape) {
    const placeholder = defaultData
        ? JSON.stringify(defaultData, null, 2)
        : '// JSON 格式，留空则使用内置演示数据';

    return [
        // ── 数据源类型切换 ──────────────────────────────────────────────
        selectField('dataSourceType', '数据源',
            [{ value: 'manual', label: '手动' }, { value: 'api', label: 'API' }],
            {
                style: 'buttons',
                order: 0,
                onChange: (shapes, value) => { shapes.forEach(s => { s.dataSourceType = value; }); },
            }),

        // ── 手动模式：JSON 编辑区 ────────────────────────────────────────
        textareaField('chartData', '', {
            rows: 7,
            placeholder,
            order: 1,
            visibleWhen: MAN_WHEN,
            onChange: (shapes, value) => { shapes.forEach(s => { s.chartData = value; }); },
        }),

        // ── API 模式：配置字段 ────────────────────────────────────────────
        inputField('dataSourceUrl', 'URL', {
            order: 2,
            placeholder: 'http://localhost:8080/mock/sales',
            visibleWhen: API_WHEN,
            onChange: (shapes, value) => { shapes.forEach(s => { s.dataSourceUrl = value; }); },
        }),
        selectField('dataSourceMethod', '方法',
            [{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }],
            {
                style: 'buttons',
                order: 3,
                visibleWhen: API_WHEN,
                onChange: (shapes, value) => { shapes.forEach(s => { s.dataSourceMethod = value; }); },
            }),
        inputField('dataSourcePath', '路径', {
            order: 4,
            placeholder: 'data（留空则用整个响应）',
            visibleWhen: API_WHEN,
            onChange: (shapes, value) => { shapes.forEach(s => { s.dataSourcePath = value; }); },
        }),
        textareaField('dataSourceHeaders', '认证', {
            rows: 2,
            placeholder: '{"Authorization": "Bearer {{SECRET:TOKEN}}"}',
            order: 5,
            visibleWhen: API_WHEN,
            onChange: (shapes, value) => { shapes.forEach(s => { s.dataSourceHeaders = value; }); },
        }),

        // ── API 模式：立即获取按钮 + 状态 ───────────────────────────────
        actionField('_dsFetch', '', {
            btnLabel: '⟳ 立即获取',
            statusKey: '_dsStatus',
            order: 6,
            visibleWhen: API_WHEN,
            onClick: async (shapes, graph) => {
                for (const s of shapes) {
                    const result = await fetchDataSource(s);
                    const age    = result.ok ? getCacheAge(s.id) : null;
                    s._dsStatus  = result.ok ? `✓ ${age || '刚刚'}` : `✗ ${result.error}`;
                    if (result.ok && graph) {
                        graph.change(() => { s.invalidate?.(); });
                    }
                }
            },
        }),
    ];
}

/**
 * 创建图表 shape 工厂。
 *
 * 每个图表 shape 具备：
 *   - chartData: string         — 手动 JSON 数据（manual 模式）
 *   - dataSourceType: string    — 'manual' | 'api'
 *   - dataSourceUrl/Method/Path/Headers — API 配置（随白板序列化）
 *   - _dsStatus: string         — 运行时状态文字（不序列化）
 *   - getDisplayFields()        — 标准3 Tab + 数据 Tab（含 API 配置区）
 *
 * @param {string}   typeName   shape.type 唯一字符串
 * @param {number}   defaultW   默认宽度
 * @param {number}   defaultH   默认高度
 * @param {Function} drawerFn   由 makeChartDrawer() 返回的 drawer 工厂
 * @param {object}   defaultData 演示数据（JSON placeholder）
 */
export const makeChart = (typeName, defaultW, defaultH, drawerFn, defaultData = null) => {
    return (id, x, y, width, height, parent) => {
        let self = rectangle(id, x, y, width, height, parent, drawerFn);
        self.width  = defaultW;
        self.height = defaultH;
        self.type   = typeName;
        self.text   = "";

        // ── 手动数据 ──────────────────────────────────────────────────────
        self.chartData = "";

        // ── API 数据源（随白板保存；认证令牌值通过 {{SECRET:NAME}} 占位符隔离）──
        self.dataSourceType    = 'manual';  // 'manual' | 'api'
        self.dataSourceUrl     = '';
        self.dataSourceMethod  = 'GET';
        self.dataSourcePath    = '';
        self.dataSourceHeaders = '';        // JSON 模板，不含实际令牌值

        // ── 运行时状态（不序列化）────────────────────────────────────────
        self._dsStatus = null;

        const getConfigurations = self.getConfigurations;
        self.getConfigurations = () => {
            const cfg = getConfigurations.apply(self);
            cfg.remove(c => c.field === 'cornerRadius');
            return cfg;
        };

        // ── 属性面板：3 标准 Tab + 数据 Tab ─────────────────────────────
        self.getDisplayFields = () => {
            const base = baseDisplayFields();
            const styleTab = base.find(t => t.id === 'style');
            if (styleTab) {
                styleTab.fields = styleTab.fields.filter(f => f.key !== 'cornerRadius');
            }
            base.push(tabField('data', '数据',
                buildDataFields(defaultData, self),
                { order: 4, icon: DATA_TAB_ICON }
            ));
            return base;
        };

        return self;
    };
};

/**
 * 从 shape 获取有效图表数据：
 *   - API 模式 → localStorage 缓存（失败时回退 defaultData）
 *   - 手动模式 → chartData JSON（失败时回退 defaultData）
 *
 * 所有图表 drawFn 应改用此函数替代原 parseChartData。
 *
 * @param {Shape}  shape
 * @param {object} defaultData 内置演示数据
 */
export const parseChartData = (shape, defaultData) => {
    if (shape.dataSourceType === 'api') {
        return loadCachedData(shape.id) ?? defaultData;
    }
    const raw = (shape.chartData || '').trim();
    if (!raw) return defaultData;
    try { return JSON.parse(raw); } catch { return defaultData; }
};

/** 绘制圆角矩形卡片底板 */
export function drawCard(context, px, py, W, H, fill, stroke, bw, r = 6) {
    context.beginPath();
    context.roundRect(px, py, W, H, r);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = bw;
    context.stroke();
}

/** 将 hex 颜色转为带透明度的 rgba 字符串 */
export function hexAlpha(hex, alpha) {
    const h  = hex.replace('#', '');
    const r  = parseInt(h.slice(0, 2), 16);
    const g  = parseInt(h.slice(2, 4), 16);
    const b  = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
