/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Anna Whiteboard — 白板绘制工作区
 * 初始化 Anna 引擎，挂载画布，绑定工具栏交互
 */

import {graph} from '@anna/core/base/graph.js';
import {EVENT_TYPE, PAGE_OPERATION_MODE} from '@anna/common/const.js';
import {t, isZh} from './i18n.js';
import {initPropertiesPanel, syncPanelFromShapes} from './propertiesPanel.js';
import {iconTheme} from '@anna/plugins/icons/iconTheme.js';
import {contextMenu} from '@anna/core/contextToolbar/popupMenu.js';

// ─── 主题配色方案 ─────────────────────────────────────────────────────────────
const CANVAS_THEMES = [
    {
        id:               'light',
        label:            '浅色',
        iconMode:         'flat',
        canvasBg:         '#c8c5c0',
        wrapperBg:        '#a8a5a0',
        wrapperDot:       'rgba(0,0,0,0.14)',
        shapeBackColor:   '#ffffff',
        shapeBorderColor: '#a8b2c4',
        shapeFontColor:   '#1a1d2e',
    },
    {
        id:               'dark',
        label:            '深色',
        iconMode:         'flat',
        canvasBg:         '#1e2030',
        wrapperBg:        '#111420',
        wrapperDot:       'rgba(255,255,255,0.06)',
        shapeBackColor:   '#2e3350',
        shapeBorderColor: '#8892c0',
        shapeFontColor:   '#d8ddf0',
    },
    {
        id:               'warm',
        label:            '暖白',
        iconMode:         'flat',
        canvasBg:         '#f0ece6',
        wrapperBg:        '#d8d0c4',
        wrapperDot:       'rgba(80,60,40,0.12)',
        shapeBackColor:   '#ffffff',
        shapeBorderColor: '#b8a898',
        shapeFontColor:   '#2a1e0e',
    },
    {
        id:               'colorful',
        label:            '彩色',
        iconMode:         'colorful',
        canvasBg:         '#e4ecf8',
        wrapperBg:        '#c8d4e8',
        wrapperDot:       'rgba(60,100,200,0.10)',
        shapeBackColor:   '#dbeafe',
        shapeBorderColor: '#3b82f6',
        shapeFontColor:   '#1e2a5a',
    },
    {
        id:               'skeuomorphic',
        label:            '拟物',
        iconMode:         'skeuomorphic',
        canvasBg:         '#b8a990',
        wrapperBg:        '#9a8870',
        wrapperDot:       'rgba(50,30,10,0.12)',
        shapeBackColor:   '#f0e8d8',
        shapeBorderColor: '#7c6a52',
        shapeFontColor:   '#3a2a14',
    },
];

let currentThemeIndex = 1;

const THEME = {
    get canvasBg()         { return CANVAS_THEMES[currentThemeIndex].canvasBg; },
    get shapeBackColor()   { return CANVAS_THEMES[currentThemeIndex].shapeBackColor; },
    get shapeBorderColor() { return CANVAS_THEMES[currentThemeIndex].shapeBorderColor; },
    get shapeFontColor()   { return CANVAS_THEMES[currentThemeIndex].shapeFontColor; },
    shapeBorderWidth: 1.5,
    penColor:         '#7a8499',
    penWidth:         2,
};

// ─── 形状模块（静态导入，避免动态路径问题）───────────────────────────────────
import * as connectorMod         from '@anna/core/interaction/connector.js';
import * as containerMod         from '@anna/core/base/container.js';
import * as rectangleMod         from '@anna/core/shapes/rectangle.js';
import * as ellipseMod           from '@anna/core/shapes/ellipse.js';
import * as lineMod              from '@anna/core/shapes/line.js';
import * as freeLineMod          from '@anna/core/shapes/freeLine.js';
import * as groupMod             from '@anna/core/shapes/group.js';
import * as triangleMod          from '@anna/core/shapes/geometry/triangle.js';
import * as diamondMod           from '@anna/core/shapes/geometry/diamond.js';
import * as parallelogramMod     from '@anna/core/shapes/geometry/parallelogram.js';
import * as pentagramMod         from '@anna/core/shapes/geometry/pentagram.js';
import * as regularPentMod       from '@anna/core/shapes/geometry/regularPentagonal.js';
import * as roundedCalloutMod    from '@anna/core/shapes/geometry/roundedRectangleCallout.js';
import * as rightArrowMod        from '@anna/core/shapes/arrows/rightArrow.js';
import * as bottomArrowMod       from '@anna/core/shapes/arrows/bottomArrow.js';
import * as dovetailArrowMod     from '@anna/core/shapes/arrows/dovetailArrow.js';
import * as leftAndRightArrowMod from '@anna/core/shapes/arrows/leftAndRightArrow.js';
// plugin shapes — basic
import * as frameMod             from '@anna/plugins/basic/frame.js';
import * as hexagonMod           from '@anna/plugins/basic/hexagon.js';
import * as octagonMod           from '@anna/plugins/basic/octagon.js';
import * as crossMod             from '@anna/plugins/basic/cross.js';
import * as trapezoidMod         from '@anna/plugins/basic/trapezoid.js';
import * as chevronMod           from '@anna/plugins/basic/chevron.js';
// icon library
import * as securityMod          from '@anna/plugins/icons/security.js';
import * as symbolsMod           from '@anna/plugins/icons/symbols.js';
import * as vehiclesMod          from '@anna/plugins/icons/vehicles.js';
import * as insectsMod           from '@anna/plugins/icons/insects.js';
// plugin shapes — icons
import * as checkmarkMod         from '@anna/plugins/basic/checkmark.js';
import * as xmarkMod             from '@anna/plugins/basic/xmark.js';
import * as databaseMod          from '@anna/plugins/basic/database.js';
import * as phoneMod             from '@anna/plugins/basic/phone.js';
import * as monitorMod           from '@anna/plugins/basic/monitor.js';
import * as tabletMod            from '@anna/plugins/basic/tablet.js';
import * as documentMod          from '@anna/plugins/basic/document.js';
import * as treeMod              from '@anna/plugins/basic/tree.js';
// data source utilities
import {fetchDataSource, getCacheAge} from '@anna/plugins/data/_dataSource.js';
// plugin shapes — data
import * as tableMod            from '@anna/plugins/data/table.js';
import * as barChartMod         from '@anna/plugins/data/barChart.js';
import * as lineChartMod        from '@anna/plugins/data/lineChart.js';
import * as pieChartMod         from '@anna/plugins/data/pieChart.js';
import * as areaChartMod        from '@anna/plugins/data/areaChart.js';
import * as donutChartMod       from '@anna/plugins/data/donutChart.js';
import * as scatterChartMod     from '@anna/plugins/data/scatterChart.js';
import * as radarChartMod       from '@anna/plugins/data/radarChart.js';
import * as funnelChartMod      from '@anna/plugins/data/funnelChart.js';
import * as gaugeChartMod       from '@anna/plugins/data/gaugeChart.js';
import * as stackedBarChartMod  from '@anna/plugins/data/stackedBarChart.js';
import * as hbarChartMod        from '@anna/plugins/data/hbarChart.js';
// reference / svg / vector
import * as referenceMod        from '@anna/core/shapes/reference.js';
import * as svgMod              from '@anna/core/shapes/svg.js';
// mind map
import * as mindMod             from '@anna/plugins/mind/mind.js';
import * as topicMod            from '@anna/plugins/mind/topic.js';
import * as subTopicMod         from '@anna/plugins/mind/subTopic.js';

const SHAPE_MODULES = [
    connectorMod, containerMod, rectangleMod, ellipseMod, lineMod,
    freeLineMod, groupMod, frameMod, triangleMod, diamondMod, parallelogramMod,
    pentagramMod, regularPentMod, roundedCalloutMod,
    rightArrowMod, bottomArrowMod, dovetailArrowMod, leftAndRightArrowMod,
    hexagonMod, octagonMod, crossMod, trapezoidMod, chevronMod,
    checkmarkMod, xmarkMod, databaseMod, phoneMod, monitorMod,
    tabletMod, documentMod, treeMod,
    securityMod, symbolsMod, vehiclesMod, insectsMod,
    tableMod, barChartMod, lineChartMod, pieChartMod, areaChartMod,
    donutChartMod, scatterChartMod, radarChartMod, funnelChartMod,
    gaugeChartMod, stackedBarChartMod, hbarChartMod,
    svgMod, referenceMod,
    mindMod, topicMod, subTopicMod,
];

const TOOL_TYPE_MAP = {
    frame:              'frame',
    rectangle:          'rectangle',
    ellipse:            'ellipse',
    triangle:           'triangle',
    diamond:            'diamond',
    parallelogram:      'parallelogram',
    pentagram:          'pentagram',
    roundedCallout:     'roundedRectangleCallout',
    regularPentagonal:  'regularPentagonal',
    line:               'line',
    freeLine:           'freeLine',
    rightArrow:         'rightArrow',
    bottomArrow:        'bottomArrow',
    dovetailArrow:      'dovetailArrow',
    leftAndRightArrow:  'leftAndRightArrow',
    hexagon:            'hexagon',
    octagon:            'octagon',
    cross:              'cross',
    trapezoid:          'trapezoid',
    chevron:            'chevron',
    checkmark:          'checkmark',
    xmark:              'xmark',
    database:           'database',
    phone:              'phone',
    monitor:            'monitor',
    tablet:             'tablet',
    document:           'document',
    tree:               'tree',
    svg:                'svg',
    // data — table & charts
    table:              'table',
    barChart:           'barChart',
    lineChart:          'lineChart',
    pieChart:           'pieChart',
    areaChart:          'areaChart',
    donutChart:         'donutChart',
    scatterChart:       'scatterChart',
    radarChart:         'radarChart',
    funnelChart:        'funnelChart',
    gaugeChart:         'gaugeChart',
    stackedBarChart:    'stackedBarChart',
    hbarChart:          'hbarChart',
    // mind map — only the container is user-placed; topic/subTopic are keyboard-driven
    mind:               'mind',
    // icons — security
    key:                'key',
    padlock:            'padlock',
    padlockOpen:        'padlockOpen',
    vault:              'vault',
    shield:             'shield',
    gavel:              'gavel',
    scales:             'scales',
    handcuffs:          'handcuffs',
    prisonBars:         'prisonBars',
    policeLamp:         'policeLamp',
    fingerprint:        'fingerprint',
    badge:              'badge',
    camera:             'camera',
    cctv:               'cctv',
    streetLight:        'streetLight',
    alarm:              'alarm',
    // icons — symbols
    symbolMale:         'symbolMale',
    symbolFemale:       'symbolFemale',
    droplet:            'droplet',
    heart:              'heart',
    thumbsUp:           'thumbsUp',
    thumbsDown:         'thumbsDown',
    cursorPointer:      'cursorPointer',
    info:               'info',
    warning:            'warning',
    error:              'error',
    question:           'question',
    forbidden:          'forbidden',
    sparkle:            'sparkle',
    radioactive:        'radioactive',
    recycle:            'recycle',
    infinity:           'infinity',
    questionMark:       'questionMark',
    exclamation:        'exclamation',
    checkCircle:        'checkCircle',
    xCircle:            'xCircle',
    star:               'star',
    wifi:               'wifi',
    bluetooth:          'bluetooth',
    copyright:          'copyright',
    trademark:          'trademark',
    registered:         'registered',
    biohazard:          'biohazard',
    peace:              'peace',
    // icons — vehicles
    car:                'car',
    truck:              'truck',
    bus:                'bus',
    bicycle:            'bicycle',
    motorcycle:         'motorcycle',
    airplane:           'airplane',
    helicopter:         'helicopter',
    ship:               'ship',
    train:              'train',
    rocket:             'rocket',
    submarine:          'submarine',
    ambulance:          'ambulance',
    fireEngine:         'fireEngine',
    tractor:            'tractor',
    sailboat:           'sailboat',
    taxi:               'taxi',
    scooter:            'scooter',
    drone:              'drone',
    forklift:           'forklift',
    tank:               'tank',
    // insects
    butterfly:          'butterfly',
    bee:                'bee',
    ant:                'ant',
    beetle:             'beetle',
    ladybug:            'ladybug',
    spider:             'spider',
    dragonfly:          'dragonfly',
    mosquito:           'mosquito',
    caterpillar:        'caterpillar',
    snail:              'snail',
};

// ─── 应用状态 ─────────────────────────────────────────────────────────────────
let annPage      = null;
let annGraph     = null;
let currentTool  = 'select';
let currentZoom  = 1;
const ZOOM_STEP  = 0.1;
const ZOOM_MIN   = 0.2;
const ZOOM_MAX   = 4;

// ─── DOM 引用（均在 #whiteboard-view 内） ─────────────────────────────────────
const $ = id => document.getElementById(id);
const canvasDiv      = $('anna-canvas');
const loadingOverlay = $('loading-overlay');
const toolGroup      = $('tool-group');
const btnUndo        = $('btn-undo');
const btnRedo        = $('btn-redo');
const btnDelete      = $('btn-delete');
const btnZoomIn      = $('btn-zoom-in');
const btnZoomOut     = $('btn-zoom-out');
const btnZoomFit     = $('btn-zoom-fit');
const btnTheme       = $('btn-theme');
const btnSave        = $('btn-save');
const btnSaveDropdown = $('btn-save-dropdown');
const saveDropdown   = $('save-dropdown');
const saveGroup      = $('save-group');
const zoomLabel      = $('zoom-label');
const zoomBadge      = $('zoom-badge');
const statusTool     = $('status-tool');
const statusShapes   = $('status-shapes');
const statusSelected = $('status-selected');
const propsPanel     = $('properties-panel');

// ─── 引擎初始化 ───────────────────────────────────────────────────────────────

async function initEngine() {
    const g = graph(canvasDiv, 'Anna Whiteboard');
    annGraph = g;

    g.login({name: 'User', id: 'anna-user'});
    g.collaboration.mute = true;

    for (const mod of SHAPE_MODULES) {
        await g.dynamicImportStatement(() => Promise.resolve(mod));
    }

    if (g.loadConfig) g.loadConfig();

    annPage = g.addPage('Page 1', undefined, canvasDiv);
    // 引擎创建页面后立即设置页面背景色（否则 page.backColor 默认 'white'）
    annPage.backColor = CANVAS_THEMES[currentThemeIndex].canvasBg;
    // 单选框颜色与多选框（groupBox）保持一致，使用紫色强调色
    annPage.focusFrameColor = '#7c6ff7';

    // 白板就绪后自动拉取所有 API 数据源（fire-and-forget）
    fetchAllDataSources(g, annPage);

    return {g, page: annPage};
}

/**
 * 遍历当前页面所有 API 模式的图表 shape，逐个拉取远端数据并触发重绘。
 * 成功时更新 localStorage 缓存；失败时保留上次缓存数据（shape 继续渲染旧数据）。
 */
async function fetchAllDataSources(graph, page) {
    if (!page) return;
    const shapes = page.sm.shapes.filter(
        s => s.dataSourceType === 'api' && (s.dataSourceUrl || '').trim()
    );
    for (const s of shapes) {
        const result = await fetchDataSource(s);
        const age    = result.ok ? getCacheAge(s.id) : null;
        s._dsStatus  = result.ok ? `✓ ${age || '刚刚'}` : `✗ ${result.error}`;
        if (result.ok && graph) {
            graph.change(() => { s.invalidate?.(); });
        }
    }
}

// ─── 工具切换 ─────────────────────────────────────────────────────────────────

function setTool(tool) {
    currentTool = tool;

    toolGroup.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    document.querySelectorAll('.shape-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const wrapper = $('canvas-wrapper');
    if (wrapper) {
        wrapper.dataset.cursor = (tool === 'select') ? 'default' : 'crosshair';
    }

    if (annPage) {
        if (tool === 'select') {
            annPage.wantedShape && annPage.wantedShape.clear();
        } else if (TOOL_TYPE_MAP[tool]) {
            annPage.want(TOOL_TYPE_MAP[tool], getDefaultProperties(TOOL_TYPE_MAP[tool]));
        }
    }

    updateStatusBar();
}

/**
 * 返回指定形状类型在**首次创建**时使用的初始属性（尺寸、颜色等）。
 *
 * 职责与 shape.getDisplayFields() 完全不同：
 *   - getDisplayFields()  → 描述"已存在的 shape"在属性面板里如何显示和编辑（运行时多态）
 *   - getDefaultProperties() → 描述"即将创建的 shape"应该初始化成什么尺寸/外观（创建时配置）
 *
 * 这里用 if-type 是**有意为之**的数据配置，而非需要消除的分支逻辑：
 *   每种形状有其视觉上最合理的默认比例（如 phone 是竖长方形，ellipse 是正圆），
 *   这些是静态配置数据，无需多态。未来如需让 shape 类自带默认尺寸，
 *   可在各 shape 模块里添加 static defaultSize = [w, h]，在此统一查表。
 *
 * 调用方：setTool() → annPage.want(type, props)
 */
function getDefaultProperties(type) {
    const base = {
        width: 120, height: 80,
        backColor:    THEME.shapeBackColor,
        borderColor:  THEME.shapeBorderColor,
        borderWidth:  THEME.shapeBorderWidth,
        fontColor:    THEME.shapeFontColor,
        cornerRadius: 8,
        globalAlpha:  1,
    };
    if (type === 'ellipse')                   return {...base, width: 100, height: 100};
    if (type === 'triangle')                  return {...base, width: 100, height: 90};
    if (type === 'diamond')                   return {...base, width: 100, height: 100};
    if (type === 'parallelogram')             return {...base, width: 110, height: 70};
    if (type === 'pentagram')                 return {...base, width: 90, height: 90};
    if (type === 'roundedRectangleCallout')   return {...base, width: 140, height: 90};
    if (type === 'regularPentagonal')         return {...base, width: 90, height: 90};
    if (type === 'rightArrow')                return {...base, width: 120, height: 60};
    if (type === 'bottomArrow')               return {...base, width: 60, height: 120};
    if (type === 'dovetailArrow')             return {...base, width: 110, height: 70};
    if (type === 'leftAndRightArrow')         return {...base, width: 130, height: 50};
    if (type === 'hexagon')                   return {...base, width: 100, height: 100};
    if (type === 'octagon')                   return {...base, width: 100, height: 100};
    if (type === 'cross')                     return {...base, width: 90,  height: 90};
    if (type === 'trapezoid')                 return {...base, width: 120, height: 80};
    if (type === 'chevron')                   return {...base, width: 120, height: 60};
    if (type === 'checkmark')                 return {...base, width: 80,  height: 80};
    if (type === 'xmark')                     return {...base, width: 80,  height: 80};
    if (type === 'database')                  return {...base, width: 90,  height: 110};
    if (type === 'phone')                     return {...base, width: 60,  height: 110};
    if (type === 'monitor')                   return {...base, width: 130, height: 100};
    if (type === 'tablet')                    return {...base, width: 80,  height: 110};
    if (type === 'document')                  return {...base, width: 80,  height: 100};
    if (type === 'tree')                      return {...base, width: 90,  height: 110};
    if (type === 'key')                       return {...base, width: 100, height: 80};
    if (type === 'padlock')                   return {...base, width: 80,  height: 100};
    if (type === 'padlockOpen')               return {...base, width: 80,  height: 100};
    if (type === 'vault')                     return {...base, width: 110, height: 100};
    if (type === 'shield')                    return {...base, width: 90,  height: 100};
    if (type === 'gavel')                     return {...base, width: 100, height: 100};
    if (type === 'scales')                    return {...base, width: 110, height: 100};
    if (type === 'handcuffs')                 return {...base, width: 120, height: 80};
    if (type === 'prisonBars')                return {...base, width: 100, height: 100};
    if (type === 'policeLamp')                return {...base, width: 90,  height: 100};
    if (type === 'fingerprint')               return {...base, width: 90,  height: 90};
    if (type === 'badge')                     return {...base, width: 90,  height: 90};
    if (type === 'camera')                    return {...base, width: 110, height: 90};
    if (type === 'cctv')                      return {...base, width: 90,  height: 110};
    if (type === 'streetLight')               return {...base, width: 90,  height: 130};
    if (type === 'alarm')                     return {...base, width: 90,  height: 100};
    // symbols
    if (type === 'symbolMale')                return {...base, width: 90,  height: 90};
    if (type === 'symbolFemale')              return {...base, width: 80,  height: 100};
    if (type === 'droplet')                   return {...base, width: 80,  height: 100};
    if (type === 'heart')                     return {...base, width: 90,  height: 90};
    if (type === 'thumbsUp')                  return {...base, width: 80,  height: 90};
    if (type === 'thumbsDown')                return {...base, width: 80,  height: 90};
    if (type === 'cursorPointer')             return {...base, width: 80,  height: 100};
    if (type === 'info')                      return {...base, width: 90,  height: 90};
    if (type === 'warning')                   return {...base, width: 100, height: 90};
    if (type === 'error')                     return {...base, width: 90,  height: 90};
    if (type === 'question')                  return {...base, width: 90,  height: 90};
    if (type === 'forbidden')                 return {...base, width: 90,  height: 90};
    if (type === 'sparkle')                   return {...base, width: 90,  height: 90};
    if (type === 'radioactive')               return {...base, width: 90,  height: 90};
    if (type === 'recycle')                   return {...base, width: 90,  height: 90};
    if (type === 'infinity')                  return {...base, width: 110, height: 80};
    if (type === 'questionMark')              return {...base, width: 70,  height: 100};
    if (type === 'exclamation')               return {...base, width: 50,  height: 100};
    if (type === 'checkCircle')               return {...base, width: 90,  height: 90};
    if (type === 'xCircle')                   return {...base, width: 90,  height: 90};
    if (type === 'star')                      return {...base, width: 90,  height: 90};
    if (type === 'wifi')                      return {...base, width: 90,  height: 90};
    if (type === 'bluetooth')                 return {...base, width: 70,  height: 100};
    if (type === 'copyright')                 return {...base, width: 90,  height: 90};
    if (type === 'trademark')                 return {...base, width: 90,  height: 80};
    if (type === 'registered')                return {...base, width: 90,  height: 90};
    if (type === 'biohazard')                 return {...base, width: 90,  height: 90};
    if (type === 'peace')                     return {...base, width: 90,  height: 90};
    // data — table & charts
    if (type === 'table')                     return {...base, width: 210, height: 130};
    if (type === 'barChart')                  return {...base, width: 220, height: 150};
    if (type === 'lineChart')                 return {...base, width: 220, height: 150};
    if (type === 'pieChart')                  return {...base, width: 200, height: 150};
    if (type === 'areaChart')                 return {...base, width: 220, height: 150};
    if (type === 'donutChart')                return {...base, width: 200, height: 150};
    if (type === 'scatterChart')              return {...base, width: 220, height: 150};
    if (type === 'radarChart')                return {...base, width: 200, height: 180};
    if (type === 'funnelChart')               return {...base, width: 160, height: 200};
    if (type === 'gaugeChart')                return {...base, width: 220, height: 150};
    if (type === 'stackedBarChart')           return {...base, width: 220, height: 160};
    if (type === 'hbarChart')                 return {...base, width: 220, height: 150};
    if (type === 'svg')                       return {width: 200, height: 200, backColor: 'transparent', borderWidth: 0};
    if (type === 'mind')                      return {...base, width: 200, height: 100};
    if (type === 'frame')                     return {
        width: 300, height: 200,
        backColor:    'rgba(124,111,247,0.06)',
        borderColor:  THEME.shapeBorderColor,
        borderWidth:  1.5,
        cornerRadius: 8,
        globalAlpha:  1,
    };
    if (type === 'line')                      return {};
    if (type === 'freeLine')                  return {borderColor: THEME.penColor, borderWidth: THEME.penWidth};
    return base;
}

// ─── 操作：撤销 / 重做 / 删除 ────────────────────────────────────────────────

function undo() {
    if (!annGraph) return;
    const h = annGraph.getHistory();
    if (h && h.canUndo()) { h.undo(); updateHistoryBtns(); updateStatusBar(); }
}

function redo() {
    if (!annGraph) return;
    const h = annGraph.getHistory();
    if (h && h.canRedo()) { h.redo(); updateHistoryBtns(); updateStatusBar(); }
}

function deleteSelected() {
    if (!annPage) return;
    const focused = annPage.getFocusedShapes();
    if (!focused || focused.length === 0) return;
    focused.forEach(s => s.remove && s.remove(true));
    updateHistoryBtns();
    updateStatusBar();
}

function updateHistoryBtns() {
    if (!annGraph) return;
    const h = annGraph.getHistory();
    btnUndo.disabled = !h || !h.canUndo();
    btnRedo.disabled = !h || !h.canRedo();
}

// ─── 缩放 ─────────────────────────────────────────────────────────────────────

function syncZoomDisplay(zoom) {
    const pct = Math.round(zoom * 100);
    zoomLabel.textContent = pct + '%';
    // #region agent log
    console.log('[DBG-3a0def][H-D]',JSON.stringify({loc:'whiteboard.js:syncZoom',pct,zoomBadgeNull:zoomBadge===null,badgeId:zoomBadge?.id,cls:zoomBadge?.className}));
    // #endregion
    if (!zoomBadge) return;
    if (pct === 100) {
        zoomBadge.classList.remove('visible');
    } else {
        zoomBadge.textContent = pct + '%';
        zoomBadge.classList.add('visible');
    }
}

function setZoom(rate) {
    if (!annPage) return;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, currentZoom + rate));
    const delta   = newZoom - currentZoom;
    currentZoom   = newZoom;
    annPage.zoom(delta);
    syncZoomDisplay(currentZoom);
    minimapMarkDirty();
}

function fitScreen() {
    if (!annPage) return;
    annPage.fillScreen(true);
    currentZoom = annPage.scaleX || 1;
    syncZoomDisplay(currentZoom);
    minimapMarkDirty();
}

// ─── 属性面板（由 propertiesPanel.js 动态渲染，无需在此写 sync 函数）────────

// ─── 状态栏 ───────────────────────────────────────────────────────────────────

function updateStatusBar() {
    const toolName = t('tool.' + currentTool) || currentTool;
    statusTool.textContent = t('status.tool') + ': ' + toolName;

    if (annPage) {
        const shapeCount = annPage.sm?.getShapeCount() ?? 0;
        const focused    = annPage.getFocusedShapes() || [];
        statusShapes.textContent   = shapeCount + ' ' + t('status.shapes');
        statusSelected.textContent = focused.length
            ? t('status.selected') + ' ' + focused.length + (t('status.selUnit') ? ' ' + t('status.selUnit') : '')
            : t('status.none');
        btnDelete.disabled = focused.length === 0;
    }
}

// ─── 主题选择器 ───────────────────────────────────────────────────────────────

const themeDropdown  = $('theme-dropdown');
const themePicker    = $('theme-picker');

/** 将 CANVAS_THEMES 渲染为下拉选项（初始化时调用一次） */
function buildThemeDropdown() {
    if (!themeDropdown) return;
    themeDropdown.innerHTML = '';
    CANVAS_THEMES.forEach((theme, idx) => {
        const btn = document.createElement('button');
        btn.className  = 'theme-option';
        btn.dataset.idx = idx;
        btn.setAttribute('role', 'option');
        btn.innerHTML = `
            <span class="theme-swatch" style="background:${theme.canvasBg}"></span>
            <span class="theme-opt-label">${t('theme.' + theme.id)}</span>
            <svg class="theme-opt-check" viewBox="0 0 12 10" fill="none">
                <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        btn.addEventListener('click', () => applyTheme(idx));
        themeDropdown.appendChild(btn);
    });
}

/** 更新下拉选项的激活状态 */
function syncDropdownActive() {
    if (!themeDropdown) return;
    themeDropdown.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.idx) === currentThemeIndex);
    });
}

/** 打开 / 关闭主题下拉 */
function toggleThemeDropdown(e) {
    e.stopPropagation();
    if (!themeDropdown) return;
    const isOpen = !themeDropdown.classList.contains('hidden');
    if (isOpen) {
        closeThemeDropdown();
    } else {
        themeDropdown.classList.remove('hidden');
        themePicker && themePicker.classList.add('open');
        syncDropdownActive();
    }
}

function closeThemeDropdown() {
    themeDropdown && themeDropdown.classList.add('hidden');
    themePicker && themePicker.classList.remove('open');
}

/** 应用指定索引的主题 */
function applyTheme(idx) {
    currentThemeIndex = idx;
    applyCanvasTheme();
    applyColorsToAllShapes();
    closeThemeDropdown();
}

/** 将所有用户形状的颜色同步到当前主题（非图标形状立即可见改变） */
function applyColorsToAllShapes() {
    if (!annPage || !annGraph) return;
    const theme = CANVAS_THEMES[currentThemeIndex];
    annGraph.change(() => {
        annPage.sm.shapes.forEach(s => {
            if (s.type === 'freeLine') {
                s.borderColor = THEME.penColor;
            } else if (s.type === 'line' || s.type === 'connector') {
                s.borderColor = theme.shapeBorderColor;
            } else if (s.type === 'svg') {
                // SVG 形状颜色由内容决定，不干预
            } else {
                s.backColor   = theme.shapeBackColor;
                s.borderColor = theme.shapeBorderColor;
                s.fontColor   = theme.shapeFontColor;
            }
            s.invalidate && s.invalidate();
        });
    });
}

/** 触发所有形状重绘，使图标主题立即生效 */
function invalidateAllShapes() {
    if (!annPage) return;
    annPage.sm.getShapes().forEach(s => s.invalidate && s.invalidate());
}

function applyCanvasTheme() {
    const theme = CANVAS_THEMES[currentThemeIndex];

    // ── 引擎页面背景色（真正的 page.backColor，影响展示/导出）──
    // annPage 在 initEngine 之前为 null；initEngine 内会直接赋值，此处仅在已就绪时更新
    if (annPage) annPage.backColor = theme.canvasBg;

    // ── 画布容器 CSS 兜底（万一引擎未渲染时露出的底色）──
    canvasDiv.style.background = theme.canvasBg;

    // ── 外框背景色 + 点阵颜色（通过 CSS 变量控制）──
    const root = document.documentElement;
    root.style.setProperty('--canvas-wrapper-bg',  theme.wrapperBg  || '#111420');
    root.style.setProperty('--canvas-dot-color',   theme.wrapperDot || 'rgba(255,255,255,0.06)');

    // ── 图标渲染模式 ──
    iconTheme.mode = theme.iconMode || 'flat';

    // ── 主题 chip 标签 ──
    const chip = document.getElementById('theme-chip');
    const themeLabel = t('theme.' + theme.id);
    if (chip) {
        chip.textContent   = themeLabel;
        chip.dataset.theme = theme.id;
    }
    if (btnTheme) btnTheme.title = t('tooltip.theme') + ' (' + themeLabel + ')';
}

// ─── 存图（Save PNG） ─────────────────────────────────────────────────────────

let _saveWithBg = false;  // 默认透明背景

/** 同步下拉选项 active 状态 */
function syncSaveDropdown() {
    if (!saveDropdown) return;
    saveDropdown.querySelectorAll('.save-opt').forEach(btn => {
        const wantsBg = btn.dataset.bg === 'fill';
        btn.classList.toggle('active', wantsBg === _saveWithBg);
    });
}

/** 开关存图下拉 */
function toggleSaveDropdown(e) {
    e.stopPropagation();
    if (!saveDropdown) return;
    const isOpen = !saveDropdown.classList.contains('hidden');
    if (isOpen) {
        closeSaveDropdown();
    } else {
        saveDropdown.classList.remove('hidden');
        saveGroup && saveGroup.classList.add('open');
        syncSaveDropdown();
    }
}

function closeSaveDropdown() {
    saveDropdown && saveDropdown.classList.add('hidden');
    saveGroup && saveGroup.classList.remove('open');
}

/**
 * 计算形状列表的逻辑包围盒（含旋转）
 * 使用 shape.getShapeFrame() 以正确处理旋转后的实际边界。
 */
function _computeLogicalBounds(shapes) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    shapes.forEach(s => {
        let f;
        try { f = s.getShapeFrame ? s.getShapeFrame() : null; } catch (_) { f = null; }
        if (f && isFinite(f.x1)) {
            x1 = Math.min(x1, f.x1); y1 = Math.min(y1, f.y1);
            x2 = Math.max(x2, f.x2); y2 = Math.max(y2, f.y2);
        } else {
            x1 = Math.min(x1, s.x);           y1 = Math.min(y1, s.y);
            x2 = Math.max(x2, s.x + s.width); y2 = Math.max(y2, s.y + s.height);
        }
    });
    return {x1, y1, x2, y2};
}

/**
 * 将一个形状绘制到输出 canvas 上。
 * ctx 已应用 ctx.scale(dpr, dpr)，绘制坐标单位为屏幕像素（page.scaleX 已含）。
 */
function _drawShapeOnCanvas(ctx, shape, originX, originY) {
    const parent = shape.drawer?.parent;
    if (!parent) return;
    if (parent.style.visibility === 'hidden' || parent.style.display === 'none') return;

    const pLeft = parseFloat(parent.style.left) || 0;
    const pTop  = parseFloat(parent.style.top)  || 0;
    const pW    = parseFloat(parent.style.width) || 0;
    const pH    = parseFloat(parent.style.height) || 0;

    const dx = pLeft - originX;
    const dy = pTop  - originY;

    ctx.save();
    ctx.globalAlpha = (shape.globalAlpha !== undefined) ? shape.globalAlpha : 1;

    // 旋转
    const deg = shape.rotateDegree || 0;
    if (deg !== 0) {
        const cx = dx + pW / 2;
        const cy = dy + pH / 2;
        ctx.translate(cx, cy);
        ctx.rotate(deg * Math.PI / 180);
        ctx.translate(-cx, -cy);
    }

    // SVG 线形状（line / freeLine）：用 Path2D 直接重播 SVG 路径
    const svgEl = parent.querySelector('svg');
    if (svgEl) {
        const svgLeft = parseFloat(svgEl.style.left) || 0;
        const svgTop  = parseFloat(svgEl.style.top)  || 0;
        ctx.save();
        ctx.translate(dx + svgLeft, dy + svgTop);
        svgEl.querySelectorAll('path').forEach(pathEl => {
            const stroke = pathEl.getAttribute('stroke');
            if (!stroke || stroke === 'none') return; // 跳过 shadow/不可见路径
            const d = pathEl.getAttribute('d');
            if (!d) return;
            const dashArray = pathEl.getAttribute('stroke-dasharray');
            ctx.strokeStyle = stroke;
            ctx.lineWidth   = parseFloat(pathEl.getAttribute('stroke-width')) || 2;
            ctx.lineCap     = pathEl.getAttribute('stroke-linecap')  || 'butt';
            ctx.lineJoin    = pathEl.getAttribute('stroke-linejoin') || 'miter';
            if (dashArray && dashArray !== 'none') {
                ctx.setLineDash(dashArray.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0));
            } else {
                ctx.setLineDash([]);
            }
            ctx.beginPath();
            ctx.stroke(new Path2D(d));
        });
        ctx.restore();
        ctx.restore();
        return;
    }

    // 优先使用 canvas 渲染（canvasGeometryDrawer 系列形状）
    const staticCanvas = parent.querySelector('canvas[id^="static:"]');
    if (staticCanvas && staticCanvas.width > 0 && staticCanvas.height > 0) {
        const cl = parseFloat(staticCanvas.style.left)   || 0;
        const ct = parseFloat(staticCanvas.style.top)    || 0;
        const cw = parseFloat(staticCanvas.style.width)  || staticCanvas.width;
        const ch = parseFloat(staticCanvas.style.height) || staticCanvas.height;
        ctx.drawImage(staticCanvas, dx + cl, dy + ct, cw, ch);
    } else {
        // HTML 形状（rectangleDrawer）— 手动还原背景 + 边框 + 文字
        const scale       = annPage ? annPage.scaleX : 1;
        const backColor   = shape.getBackColor   ? shape.getBackColor()   : (shape.backColor   || '#fff');
        const borderColor = shape.getBorderColor ? shape.getBorderColor() : (shape.borderColor || '#ccc');
        const bw = (shape.borderWidth  || 1.5) * scale;
        const cr = (shape.cornerRadius || 0)   * scale;

        ctx.save();
        ctx.fillStyle   = backColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth   = bw;
        ctx.beginPath();
        if (cr > 0 && ctx.roundRect) {
            ctx.roundRect(dx + bw / 2, dy + bw / 2, pW - bw, pH - bw, cr);
        } else {
            ctx.rect(dx + bw / 2, dy + bw / 2, pW - bw, pH - bw);
        }
        ctx.fill();
        if (bw > 0) ctx.stroke();

        if (shape.text) {
            const fontSize  = Math.round((shape.fontSize || 14) * scale);
            const fontColor = shape.fontColor || '#333';
            ctx.fillStyle    = fontColor;
            ctx.font         = `${fontSize}px sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(shape.text, dx + pW / 2, dy + pH / 2);
        }
        ctx.restore();
    }

    ctx.restore();
}

/** 执行存图，withBg 参数覆盖全局 _saveWithBg（不传则用全局值） */
function savePng(withBg = _saveWithBg) {
    if (!annPage) return;

    // 确定导出形状：有选中则只导出选中，否则全部
    const focused = annPage.getFocusedShapes().filter(s => s.serializable !== false);
    const shapesToExport = focused.length > 0
        ? focused
        : annPage.sm.shapes.filter(s => s.serializable !== false);

    if (!shapesToExport.length) return;

    const PAD = 16;  // 逻辑像素留白
    const bounds = _computeLogicalBounds(shapesToExport);
    if (!isFinite(bounds.x1)) return;

    const lx1 = bounds.x1 - PAD;
    const ly1 = bounds.y1 - PAD;
    const lx2 = bounds.x2 + PAD;
    const ly2 = bounds.y2 + PAD;

    const scale = annPage.scaleX || 1;
    const dpr   = window.devicePixelRatio || 1;
    const outW  = Math.round((lx2 - lx1) * scale);   // 屏幕像素宽
    const outH  = Math.round((ly2 - ly1) * scale);   // 屏幕像素高

    const canvas = document.createElement('canvas');
    canvas.width  = Math.round(outW * dpr);            // 物理像素
    canvas.height = Math.round(outH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);                                // 以下绘制单位：屏幕像素

    if (withBg) {
        ctx.fillStyle = CANVAS_THEMES[currentThemeIndex].canvasBg;
        ctx.fillRect(0, 0, outW, outH);
    }

    // 输出原点在 page.div 内的屏幕坐标偏移
    const originX = (lx1 + annPage.x) * scale;
    const originY = (ly1 + annPage.y) * scale;

    // 按 Z 序绘制
    const sorted = [...shapesToExport].sort((a, b) => {
        const ia = a.getIndex ? a.getIndex() : 0;
        const ib = b.getIndex ? b.getIndex() : 0;
        return ia - ib;
    });
    sorted.forEach(s => _drawShapeOnCanvas(ctx, s, originX, originY));

    // 触发下载
    canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.download = `anna-${Date.now()}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
}

// ─── 键盘快捷键 ───────────────────────────────────────────────────────────────
//
//  引擎 (page.js) 已处理的快捷键（此处不重复，避免双重触发）：
//    Ctrl+Z          撤销
//    Ctrl+Shift+Z    重做
//    Ctrl+A          全选
//    Ctrl+D          复制
//    Ctrl+G          编组（注：若选中矩形形状，rectangle.js 会先拦截为"切换进度条"）
//    Ctrl+L          切换连线模式（仅对 line 形状有效）
//    Ctrl+E          切换关注状态（仅对矩形形状有效）
//    Ctrl+I          循环提示徽章（仅对矩形形状有效）
//    Ctrl+1~9        设置优先级（仅对矩形形状有效）
//    Delete/Backspace 删除
//    Arrow keys      移动
//    Shift+= / Shift+- 缩放
//
//  此处仅注册引擎未覆盖的快捷键：

function bindKeyboard() {
    let _spaceDown = false;

    document.addEventListener('keydown', e => {
        if (document.getElementById('whiteboard-view').classList.contains('hidden')) return;

        // Space 键：切换到画布拖拽模式（不要求 activeElement === body，但排除文本输入）
        if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tag = document.activeElement?.tagName;
            const inText = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
                        || document.activeElement?.isContentEditable;
            if (!inText && !_spaceDown) {
                _spaceDown = true;
                e.preventDefault();
                if (annPage) annPage.operationMode = PAGE_OPERATION_MODE.DRAG;
            }
            return;
        }

        if (document.activeElement !== document.body) return;

        // Ctrl+Y — 重做（引擎只有 Ctrl+Shift+Z，此处补充 Ctrl+Y 惯用写法）
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }

        // Ctrl+0 — 适应屏幕（引擎无此快捷键）
        if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); fitScreen(); return; }

        // V 键切换回选择工具（无修饰键）
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'v') {
            setTool('select'); return;
        }

        // +/- 缩放（引擎使用 Shift+=/-，此处补充无 Shift 写法）
        if (!e.ctrlKey && !e.metaKey && (e.key === '+' || e.key === '=')) setZoom(ZOOM_STEP);
        if (!e.ctrlKey && !e.metaKey && e.key === '-')                    setZoom(-ZOOM_STEP);
    });

    document.addEventListener('keyup', e => {
        if (e.code === 'Space' && _spaceDown) {
            _spaceDown = false;
            if (annPage) annPage.operationMode = PAGE_OPERATION_MODE.SELECTION;
        }
    });
}

// ─── 按钮绑定 ─────────────────────────────────────────────────────────────────

function bindButtons() {
    toolGroup.addEventListener('click', e => {
        const btn = e.target.closest('.tool-btn');
        if (btn && btn.dataset.tool) setTool(btn.dataset.tool);
    });

    document.getElementById('shape-content').addEventListener('click', e => {
        // shape item click
        const btn = e.target.closest('.shape-item');
        if (btn && btn.dataset.tool) { setTool(btn.dataset.tool); return; }

        // group header collapse toggle
        const header = e.target.closest('.shape-group-header');
        if (header) {
            const group = header.closest('.shape-group');
            if (group) group.classList.toggle('collapsed');
        }
    });

    document.getElementById('shape-tabs').addEventListener('click', e => {
        const tab = e.target.closest('.shape-tab');
        if (!tab) return;
        const cat = tab.dataset.cat;
        document.querySelectorAll('.shape-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
        document.querySelectorAll('.shape-category').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
    });

    btnUndo.addEventListener('click',    undo);
    btnRedo.addEventListener('click',    redo);
    btnDelete.addEventListener('click',  deleteSelected);
    btnZoomIn.addEventListener('click',  () => setZoom(ZOOM_STEP));
    btnZoomOut.addEventListener('click', () => setZoom(-ZOOM_STEP));
    btnZoomFit.addEventListener('click', fitScreen);
    btnTheme && btnTheme.addEventListener('click', toggleThemeDropdown);

    // ── 存图按钮绑定 ──
    btnSave && btnSave.addEventListener('click', () => savePng());
    btnSaveDropdown && btnSaveDropdown.addEventListener('click', toggleSaveDropdown);
    saveDropdown && saveDropdown.addEventListener('click', e => {
        const opt = e.target.closest('.save-opt');
        if (!opt) return;
        _saveWithBg = opt.dataset.bg === 'fill';
        syncSaveDropdown();
        closeSaveDropdown();
        savePng(_saveWithBg);
    });

    // 点击下拉区以外时关闭（主题 + 存图）
    document.addEventListener('click', e => {
        if (themePicker && !themePicker.contains(e.target)) closeThemeDropdown();
        if (saveGroup   && !saveGroup.contains(e.target))   closeSaveDropdown();
    });
    // Esc 关闭
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeThemeDropdown(); closeSaveDropdown(); }
    });
    buildThemeDropdown();
}

// ─── 画布平移：滚轮 + 中键拖拽 ───────────────────────────────────────────────

function bindCanvasPan() {
    const wrapper = document.getElementById('canvas-wrapper') || canvasDiv;

    // 滚轮：Ctrl+滚轮 = 缩放，普通滚轮 = 平移，Shift+滚轮 = 水平平移
    wrapper.addEventListener('wheel', e => {
        if (!annPage) return;
        if (e.target.closest?.('[contenteditable]')) return;
        e.preventDefault();

        // 统一 deltaMode 到像素
        let dx = e.deltaX, dy = e.deltaY;
        if (e.deltaMode === 1) { dx *= 24; dy *= 24; }
        else if (e.deltaMode === 2) { dx *= wrapper.clientWidth; dy *= wrapper.clientHeight; }

        if (e.ctrlKey || e.metaKey) {
            // Ctrl + 滚轮 = 缩放（以鼠标位置为中心）
            const delta = dy > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom(delta);
            _positionFollowTrigger();
        } else if (e.shiftKey) {
            // Shift + 滚轮 = 水平平移
            const speed = 1 / (annPage.scaleX || 1);
            annPage.moveTo(annPage.x - dy * speed, annPage.y);
            minimapMarkDirty();
            _positionFollowTrigger();
        } else {
            // 普通滚轮 = 垂直平移（trackpad 双向）
            const speed = 1 / (annPage.scaleX || 1);
            annPage.moveTo(annPage.x - dx * speed, annPage.y - dy * speed);
            minimapMarkDirty();
            _positionFollowTrigger();
        }
    }, { passive: false });

    // 中键拖拽平移（button === 1）
    let _midDrag = false, _midX = 0, _midY = 0;
    wrapper.addEventListener('mousedown', e => {
        if (e.button !== 1 || !annPage) return;
        e.preventDefault();
        _midDrag = true;
        _midX = e.clientX;
        _midY = e.clientY;
        annPage.operationMode = PAGE_OPERATION_MODE.DRAG;
    });
    document.addEventListener('mousemove', e => {
        if (!_midDrag || !annPage) return;
        const scale = annPage.scaleX || 1;
        annPage.moveTo(annPage.x + (e.clientX - _midX) / scale,
                       annPage.y + (e.clientY - _midY) / scale);
        _midX = e.clientX;
        _midY = e.clientY;
        minimapMarkDirty();
        _positionFollowTrigger();
    });
    document.addEventListener('mouseup', e => {
        if (e.button === 1 && _midDrag) {
            _midDrag = false;
            if (annPage) annPage.operationMode = PAGE_OPERATION_MODE.SELECTION;
        }
    });
}

// ─── 跟随菜单触发按钮 ────────────────────────────────────────────────────────

let _followTriggerEl     = null;
let _followTriggerShapes = [];

/**
 * 计算形状旋转后底部中心点的逻辑坐标。
 * 以形状几何中心为旋转轴，将底部中点向量旋转后叠加。
 */
function _rotatedBottomCenter(s) {
    const angle  = ((s.rotateDegree || 0) * Math.PI) / 180;
    const cx     = s.x + s.width  / 2;
    const cy     = s.y + s.height / 2;
    const halfH  = Math.abs(s.height) / 2;
    return {
        x: cx - halfH * Math.sin(angle),
        y: cy + halfH * Math.cos(angle),
    };
}

function _createFollowTrigger() {
    if (_followTriggerEl) return _followTriggerEl;
    const btn = document.createElement('button');
    btn.id = 'anna-follow-trigger';
    btn.title = '操作菜单';
    btn.innerHTML = `<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
        <circle cx="4"  cy="10" r="1.8"/>
        <circle cx="10" cy="10" r="1.8"/>
        <circle cx="16" cy="10" r="1.8"/>
    </svg>`;
    btn.style.cssText = [
        'position:fixed',
        'z-index:10000',
        'display:none',
        'align-items:center',
        'justify-content:center',
        'width:26px',
        'height:26px',
        'border-radius:50%',
        'border:1px solid var(--border2,#343850)',
        'background:var(--surface,#13151f)',
        'color:var(--text-dim,#6b7a9e)',
        'cursor:pointer',
        'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
        'transform:translate(-50%,0)',
        'transition:background 0.1s,color 0.1s',
        'pointer-events:auto',
        'padding:0',
    ].join(';');
    btn.addEventListener('mouseenter', () => {
        btn.style.color      = 'var(--text,#d0d8f0)';
        btn.style.background = 'var(--surface3,#242840)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.color      = 'var(--text-dim,#6b7a9e)';
        btn.style.background = 'var(--surface,#13151f)';
    });
    btn.addEventListener('mousedown', e => e.stopPropagation());
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const shapes = _followTriggerShapes.slice();
        if (shapes.length === 0 || !annPage) return;

        // 记录触发按钮的屏幕位置（菜单稍后将被移至此处）
        const triggerRect = _followTriggerEl.getBoundingClientRect();
        const triggerCX   = triggerRect.left + triggerRect.width / 2;
        const triggerBY   = triggerRect.bottom + 8;

        _hideFollowTrigger();
        contextMenu(annPage, shapes);

        // contextMenu 同步创建 toolbar DOM，rAF 后将其移至三点按钮正下方
        requestAnimationFrame(() => {
            const toolbar = document.getElementById('annaToolBar');
            if (!toolbar) return;

            // 从 canvas 层取出，改为 fixed 定位贴近触发按钮
            toolbar.style.position  = 'fixed';
            toolbar.style.left      = triggerCX + 'px';
            toolbar.style.top       = triggerBY + 'px';
            toolbar.style.bottom    = '';
            toolbar.style.transform = 'translateX(-50%)';
            document.body.appendChild(toolbar);

            // 拦截 destroy，同步移除已搬移的 toolbar DOM
            const ctb = annPage.contextToolbar;
            if (ctb) {
                const origDestroy = ctb.destroy.bind(ctb);
                ctb.destroy = () => {
                    origDestroy();
                    if (toolbar.parentNode === document.body) toolbar.remove();
                    ctb.destroy = origDestroy;
                };
            }
        });
    });
    document.body.appendChild(btn);
    _followTriggerEl = btn;
    return btn;
}

function _positionFollowTrigger() {
    if (!_followTriggerEl || !annPage || !canvasDiv || _followTriggerShapes.length === 0) return;
    try {
        const rect  = canvasDiv.getBoundingClientRect();
        const scale = annPage.scaleX || 1;

        // 对每个 shape 取旋转后底部中心点，找最低（Y最大）那个；X 取平均
        let sumX = 0, maxY = -Infinity, count = 0;
        _followTriggerShapes.forEach(s => {
            try {
                const {x: bx, y: by} = _rotatedBottomCenter(s);
                if (!isFinite(by)) return;
                sumX += bx;
                maxY  = Math.max(maxY, by);
                count++;
            } catch (_) {}
        });
        if (count === 0) return;

        const logCX  = sumX / count;
        const screenX = rect.left + (logCX + annPage.x) * scale;
        const screenY = rect.top  + (maxY  + annPage.y) * scale + 10;
        _followTriggerEl.style.left = screenX + 'px';
        _followTriggerEl.style.top  = screenY + 'px';
    } catch (_) {}
}

function _showFollowTrigger(shapes) {
    _followTriggerShapes = shapes || [];
    if (_followTriggerShapes.length === 0) { _hideFollowTrigger(); return; }
    const btn = _createFollowTrigger();
    _positionFollowTrigger();
    btn.style.display = 'flex';
}

function _hideFollowTrigger() {
    _followTriggerShapes = [];
    if (_followTriggerEl) _followTriggerEl.style.display = 'none';
}

// ─── 缩略图（Minimap）────────────────────────────────────────────────────────

let _minimapCanvas = null;
let _minimapDirty  = true;
let _minimapLoopId = null;
const MINIMAP_W    = 180;
const MINIMAP_H    = 110;
const MINIMAP_PAD  = 24;  // 逻辑坐标外边距（预留空间）

function minimapMarkDirty() { _minimapDirty = true; }

function initMinimap() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;

    _minimapCanvas = document.createElement('canvas');
    _minimapCanvas.id    = 'anna-minimap';
    _minimapCanvas.width  = MINIMAP_W;
    _minimapCanvas.height = MINIMAP_H;
    _minimapCanvas.title  = 'Minimap — 点击导航';
    wrapper.appendChild(_minimapCanvas);

    // 点击/拖拽导航
    let _navDragging = false;
    _minimapCanvas.addEventListener('mousedown', e => {
        e.stopPropagation();
        _navDragging = true;
        _minimapNavigate(e);
    });
    document.addEventListener('mousemove', e => {
        if (_navDragging) _minimapNavigate(e);
    });
    document.addEventListener('mouseup', () => { _navDragging = false; });

    // 启动低频刷新循环（约 20fps）
    let _lastTs = 0;
    const loop = (ts) => {
        _minimapLoopId = requestAnimationFrame(loop);
        if (!document.getElementById('whiteboard-view').classList.contains('hidden')) {
            if (_minimapDirty && ts - _lastTs > 50) {
                _lastTs = ts;
                _minimapDirty = false;
                _minimapDraw();
            }
        }
    };
    _minimapLoopId = requestAnimationFrame(loop);
}

/** 将 minimap 点击/拖拽坐标转换为逻辑坐标并移动视口 */
function _minimapNavigate(e) {
    if (!annPage || !_minimapCanvas) return;
    const rect  = _minimapCanvas.getBoundingClientRect();
    const mx    = e.clientX - rect.left;
    const my    = e.clientY - rect.top;
    const {toLog} = _minimapCalcTransform();
    if (!toLog) return;
    const {lx, ly} = toLog(mx, my);
    // 以点击点为视口中心
    const scale  = annPage.scaleX || 1;
    const vw     = canvasDiv.clientWidth  / scale;
    const vh     = canvasDiv.clientHeight / scale;
    annPage.moveTo(-(lx - vw / 2), -(ly - vh / 2));
    minimapMarkDirty();
}

/**
 * 计算 minimap 到逻辑坐标的双向变换函数（含边距偏移）
 * 返回 { toMap(lx,ly)→{mx,my},  toLog(mx,my)→{lx,ly},  s }
 */
function _minimapCalcTransform() {
    if (!annPage) return {};
    const shapes = annPage.sm.shapes;
    const scale  = annPage.scaleX || 1;

    // 视口逻辑区域
    const vx1 = -annPage.x, vy1 = -annPage.y;
    const vx2 = vx1 + canvasDiv.clientWidth  / scale;
    const vy2 = vy1 + canvasDiv.clientHeight / scale;

    // 所有形状 + 视口的包围盒
    let bx1 = vx1, by1 = vy1, bx2 = vx2, by2 = vy2;
    shapes.forEach(s => {
        try {
            const f = s.getShapeFrame?.() ?? {x1: s.x, y1: s.y, x2: s.x + s.width, y2: s.y + s.height};
            if (!isFinite(f.x1)) return;
            bx1 = Math.min(bx1, f.x1); by1 = Math.min(by1, f.y1);
            bx2 = Math.max(bx2, f.x2); by2 = Math.max(by2, f.y2);
        } catch (_) {}
    });
    bx1 -= MINIMAP_PAD; by1 -= MINIMAP_PAD;
    bx2 += MINIMAP_PAD; by2 += MINIMAP_PAD;

    const worldW = bx2 - bx1 || 1;
    const worldH = by2 - by1 || 1;
    const s = Math.min(MINIMAP_W / worldW, MINIMAP_H / worldH);
    const offX = (MINIMAP_W - worldW * s) / 2;
    const offY = (MINIMAP_H - worldH * s) / 2;

    return {
        s,
        vx1, vy1, vx2, vy2,
        toMap: (lx, ly) => ({ mx: offX + (lx - bx1) * s, my: offY + (ly - by1) * s }),
        toLog: (mx, my) => ({ lx: (mx - offX) / s + bx1, ly: (my - offY) / s + by1 }),
    };
}

function _minimapDraw() {
    if (!_minimapCanvas || !annPage) return;
    const ctx    = _minimapCanvas.getContext('2d');
    const W = MINIMAP_W, H = MINIMAP_H;

    const xf = _minimapCalcTransform();
    if (!xf.toMap) { ctx.clearRect(0, 0, W, H); return; }
    const {toMap, vx1, vy1, vx2, vy2} = xf;

    // 背景
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(12,14,24,0.82)';
    ctx.fillRect(0, 0, W, H);

    // 形状（含旋转 & contentZoom 缩放）
    annPage.sm.shapes.forEach(s => {
        try {
            // line：从 from() 到 to() 画线段
            if (s.type === 'line') {
                const from = s.from?.();
                const to   = s.to?.();
                if (!from || !to) return;
                const {mx: x1, my: y1} = toMap(from.x, from.y);
                const {mx: x2, my: y2} = toMap(to.x,   to.y);
                const bd = s.getBorderColor?.() || s.borderColor || '#7a8499';
                ctx.save();
                ctx.strokeStyle = bd;
                ctx.lineWidth   = 1;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.restore();
                return;
            }

            // freeLine：用包围盒中心画小点表示存在
            if (s.type === 'freeLine') {
                const f = s.getShapeFrame?.() ?? {x1: s.x, y1: s.y, x2: s.x + s.width, y2: s.y + s.height};
                if (!isFinite(f.x1)) return;
                const {mx: cx, my: cy} = toMap((f.x1 + f.x2) / 2, (f.y1 + f.y2) / 2);
                const bd = s.getBorderColor?.() || s.borderColor || '#7a8499';
                const sw = Math.max(2, Math.abs(s.width)  * xf.s);
                const sh = Math.max(2, Math.abs(s.height) * xf.s);
                ctx.save();
                ctx.strokeStyle = bd;
                ctx.lineWidth   = 1;
                ctx.strokeRect(cx - sw / 2, cy - sh / 2, sw, sh);
                ctx.restore();
                return;
            }

            // 用 getShapeFrame 获取视觉包围盒（已含正向 contentZoom 变换）
            const f = s.getShapeFrame?.() ?? {x1: s.x, y1: s.y, x2: s.x + s.width, y2: s.y + s.height};
            if (!isFinite(f.x1)) return;

            // 缩略图中心点 = 视觉包围盒中心
            const {mx: cx, my: cy} = toMap((f.x1 + f.x2) / 2, (f.y1 + f.y2) / 2);

            // 视觉尺寸：父容器的 contentZoom 使子 shape 在视觉上缩放
            const ctn = s.getContainer?.();
            const cz  = (ctn && ctn !== annPage) ? (ctn.contentZoom || 1) : 1;
            const sw  = Math.max(1, Math.abs(s.width)  * cz * xf.s);
            const sh  = Math.max(1, Math.abs(s.height) * cz * xf.s);

            const angle = (s.rotateDegree || 0) * Math.PI / 180;
            const bc = s.getBackColor?.() || s.backColor || '#4a5070';
            const bd = s.getBorderColor?.() || s.borderColor;

            ctx.save();
            ctx.translate(cx, cy);
            if (angle) ctx.rotate(angle);
            ctx.fillStyle = bc;
            ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
            if (bd) {
                ctx.strokeStyle = bd;
                ctx.lineWidth   = 0.5;
                ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
            }
            ctx.restore();
        } catch (_) {}
    });

    // 当前视口矩形（accent 紫色）
    const {mx: vmx, my: vmy} = toMap(vx1, vy1);
    const {mx: vmx2, my: vmy2} = toMap(vx2, vy2);
    const vmw = vmx2 - vmx, vmh = vmy2 - vmy;
    ctx.fillStyle   = 'rgba(124,111,247,0.10)';
    ctx.fillRect(vmx, vmy, vmw, vmh);
    ctx.strokeStyle = 'rgba(124,111,247,0.85)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(vmx, vmy, vmw, vmh);
}

// ─── 导出：白板初始化入口 ─────────────────────────────────────────────────────

export async function initWhiteboard() {
    bindButtons();
    bindKeyboard();

    try {
        const {g} = await initEngine();

        // 属性面板挂载（在引擎就绪后，annGraph 已赋值）
        initPropertiesPanel(propsPanel, annGraph, () => annPage);

        // 画布平移 & 缩略图
        bindCanvasPan();
        initMinimap();

        // 禁用引擎自动弹出跟随工具栏（改为点击下方图标触发）
        annPage.disableContextMenu = true;

        // 引擎内部缩放（Shift+=/-、fillScreen 等）完成后同步 zoomLabel 并刷新缩略图
        const _origZoomed = annPage.zoomed;
        annPage.zoomed = (...args) => {
            _origZoomed?.apply(annPage, args);
            currentZoom = annPage.scaleX || 1;
            syncZoomDisplay(currentZoom);
            minimapMarkDirty();
            _positionFollowTrigger();
        };

        g.addEventListener(EVENT_TYPE.FOCUSED_SHAPES_CHANGE, shapes => {
            const focused = Array.isArray(shapes) ? shapes : (shapes ? [shapes] : []);
            if (focused.length > 0) {
                propsPanel.classList.remove('hidden');
                syncPanelFromShapes(focused);
                _showFollowTrigger(focused);
            } else {
                propsPanel.classList.add('hidden');
                _hideFollowTrigger();
            }
            updateHistoryBtns();
            updateStatusBar();
        });

        g.addEventListener(EVENT_TYPE.SHAPE_ADDED, () => {
            setTool('select');
            updateHistoryBtns();
            updateStatusBar();
            minimapMarkDirty();
        });

        // 粘贴/删除等操作不一定触发 SHAPE_ADDED，通过 PAGE_DIRTY 做兜底
        // 使用 debounce 避免高频操作时状态栏频繁闪烁
        let _statusDebounce = null;
        g.addEventListener(EVENT_TYPE.PAGE_DIRTY, () => {
            clearTimeout(_statusDebounce);
            _statusDebounce = setTimeout(updateStatusBar, 80);
            minimapMarkDirty();
            _positionFollowTrigger();
        });

        annPage.interactDrawer.getInteract().addEventListener('mouseup', () => {
            if (currentTool !== 'select' && annPage.wantedShape && annPage.wantedShape.isEmpty()) {
                currentTool = 'select';
                toolGroup.querySelectorAll('.tool-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tool === 'select');
                });
                document.querySelectorAll('.shape-item').forEach(btn => {
                    btn.classList.remove('active');
                });
                const wrapper = $('canvas-wrapper');
                if (wrapper) wrapper.dataset.cursor = 'default';
                annPage.setCursor && annPage.setCursor();
                annPage.invalidateInteraction && annPage.invalidateInteraction();
                updateHistoryBtns();
                updateStatusBar();
            }
        });

        updateHistoryBtns();
        updateStatusBar();
        setTool('select');
        applyCanvasTheme();

        loadingOverlay.classList.add('hidden');

    } catch (err) {
        console.error('[Anna] 白板初始化失败:', err);
        loadingOverlay.innerHTML = `
            <div style="color:#ff4f6a;font-size:14px">⚠ 引擎初始化失败</div>
            <p style="color:#6b7a9e;font-size:12px;margin-top:8px">${err.message}</p>
        `;
    }
}
