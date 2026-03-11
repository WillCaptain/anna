/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Anna Whiteboard — 白板绘制工作区
 * 初始化 Anna 引擎，挂载画布，绑定工具栏交互
 */

import {graph} from '@anna/core/base/graph.js';
import {EVENT_TYPE} from '@anna/common/const.js';
import {t} from './i18n.js';

// ─── 主题配色方案 ─────────────────────────────────────────────────────────────
const CANVAS_THEMES = [
    {
        id:    'light',
        label: '浅色画布',
        canvasBg:         '#c8c5c0',
        shapeBackColor:   '#ffffff',
        shapeBorderColor: '#a8b2c4',
    },
    {
        id:    'dark',
        label: '深色画布',
        canvasBg:         '#2a2d3a',
        shapeBackColor:   '#3a3d4a',
        shapeBorderColor: '#5a5f78',
    },
    {
        id:    'warm',
        label: '暖白画布',
        canvasBg:         '#f0ece6',
        shapeBackColor:   '#ffffff',
        shapeBorderColor: '#b8a898',
    },
];

let currentThemeIndex = 0;

const THEME = {
    get canvasBg()         { return CANVAS_THEMES[currentThemeIndex].canvasBg; },
    get shapeBackColor()   { return CANVAS_THEMES[currentThemeIndex].shapeBackColor; },
    get shapeBorderColor() { return CANVAS_THEMES[currentThemeIndex].shapeBorderColor; },
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
import * as hexagonMod           from '@anna/plugins/basic/hexagon.js';
import * as octagonMod           from '@anna/plugins/basic/octagon.js';
import * as crossMod             from '@anna/plugins/basic/cross.js';
import * as trapezoidMod         from '@anna/plugins/basic/trapezoid.js';
import * as chevronMod           from '@anna/plugins/basic/chevron.js';
// icon library
import * as securityMod          from '@anna/plugins/icons/security.js';
import * as symbolsMod           from '@anna/plugins/icons/symbols.js';
// plugin shapes — icons
import * as checkmarkMod         from '@anna/plugins/basic/checkmark.js';
import * as xmarkMod             from '@anna/plugins/basic/xmark.js';
import * as databaseMod          from '@anna/plugins/basic/database.js';
import * as phoneMod             from '@anna/plugins/basic/phone.js';
import * as monitorMod           from '@anna/plugins/basic/monitor.js';
import * as tabletMod            from '@anna/plugins/basic/tablet.js';
import * as documentMod          from '@anna/plugins/basic/document.js';
import * as treeMod              from '@anna/plugins/basic/tree.js';
// svg / vector
import * as svgMod              from '@anna/core/shapes/svg.js';
// mind map
import * as mindMod             from '@anna/plugins/mind/mind.js';
import * as topicMod            from '@anna/plugins/mind/topic.js';
import * as subTopicMod         from '@anna/plugins/mind/subTopic.js';

const SHAPE_MODULES = [
    connectorMod, containerMod, rectangleMod, ellipseMod, lineMod,
    freeLineMod, groupMod, triangleMod, diamondMod, parallelogramMod,
    pentagramMod, regularPentMod, roundedCalloutMod,
    rightArrowMod, bottomArrowMod, dovetailArrowMod, leftAndRightArrowMod,
    hexagonMod, octagonMod, crossMod, trapezoidMod, chevronMod,
    checkmarkMod, xmarkMod, databaseMod, phoneMod, monitorMod,
    tabletMod, documentMod, treeMod,
    securityMod, symbolsMod,
    svgMod,
    mindMod, topicMod, subTopicMod,
];

const TOOL_TYPE_MAP = {
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
const zoomLabel      = $('zoom-label');
const statusTool     = $('status-tool');
const statusShapes   = $('status-shapes');
const statusSelected = $('status-selected');
const propsPanel     = $('properties-panel');
// 外观
const propFill       = $('prop-fill');
const propAlpha      = $('prop-alpha');
const propBorder     = $('prop-border');
const propBorderW    = $('prop-border-w');
const propRadius     = $('prop-radius');
const alphaVal       = $('alpha-val');
const borderwVal     = $('borderw-val');
const radiusVal      = $('radius-val');
// 位置与尺寸
const propX          = $('prop-x');
const propY          = $('prop-y');
const propW          = $('prop-w');
const propH          = $('prop-h');
// 文字
const propFontColor  = $('prop-font-color');
const propFontSize   = $('prop-font-size');
const alignBtns      = ['align-left', 'align-center', 'align-right'].map($);

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

    return {g, page: annPage};
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

function getDefaultProperties(type) {
    const base = {
        width: 120, height: 80,
        backColor:    THEME.shapeBackColor,
        borderColor:  THEME.shapeBorderColor,
        borderWidth:  THEME.shapeBorderWidth,
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
    if (type === 'svg')                       return {width: 200, height: 200, backColor: 'transparent', borderWidth: 0};
    if (type === 'mind')                      return {...base, width: 200, height: 100};
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

function setZoom(rate) {
    if (!annPage) return;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, currentZoom + rate));
    const delta   = newZoom - currentZoom;
    currentZoom   = newZoom;
    annPage.zoom(delta);
    zoomLabel.textContent = Math.round(currentZoom * 100) + '%';
}

function fitScreen() {
    if (!annPage) return;
    annPage.fillScreen(true);
    currentZoom = annPage.scaleX || 1;
    zoomLabel.textContent = Math.round(currentZoom * 100) + '%';
}

// ─── 属性面板 ─────────────────────────────────────────────────────────────────

const toHexColor = (color, fallback) =>
    (color && /^#[0-9a-fA-F]{6}$/.test(color)) ? color : (fallback ?? '#888888');

function syncPropsToShape() {
    if (!annPage) return;
    const focused = annPage.getFocusedShapes();
    if (!focused || focused.length === 0) return;

    const fill      = propFill.value;
    const alpha     = parseInt(propAlpha.value) / 100;
    const border    = propBorder.value;
    const bw        = parseFloat(propBorderW.value);
    const radius    = parseInt(propRadius.value);
    const x         = parseInt(propX.value);
    const y         = parseInt(propY.value);
    const w         = parseInt(propW.value);
    const h         = parseInt(propH.value);
    const fontColor = propFontColor.value;
    const fontSize  = parseInt(propFontSize.value);

    annGraph.change(() => {
        focused.forEach(s => {
            s.backColor    = fill;
            s.globalAlpha  = alpha;
            s.borderColor  = border;
            s.borderWidth  = bw;
            s.cornerRadius = radius;
            if (!isNaN(x)) s.x = x;
            if (!isNaN(y)) s.y = y;
            if (!isNaN(w) && w > 0) s.width  = w;
            if (!isNaN(h) && h > 0) s.height = h;
            s.fontColor    = fontColor;
            if (!isNaN(fontSize) && fontSize > 0) s.fontSize = fontSize;
            s.invalidate?.();
        });
    });
}

function syncPropsFromShape(shapes) {
    if (!shapes || shapes.length === 0) return;
    const s = shapes[0];
    // 外观
    propFill.value      = toHexColor(s.backColor,   THEME.shapeBackColor);
    propBorder.value    = toHexColor(s.borderColor, THEME.shapeBorderColor);
    propAlpha.value     = Math.round((s.globalAlpha ?? 1) * 100);
    propBorderW.value   = s.borderWidth   ?? 1;
    propRadius.value    = s.cornerRadius  ?? 4;
    alphaVal.textContent   = propAlpha.value + '%';
    borderwVal.textContent = Number(propBorderW.value).toFixed(1);
    radiusVal.textContent  = propRadius.value;
    // 位置与尺寸
    propX.value = Math.round(s.x ?? 0);
    propY.value = Math.round(s.y ?? 0);
    propW.value = Math.round(s.width  ?? 100);
    propH.value = Math.round(s.height ?? 60);
    // 文字
    propFontColor.value = toHexColor(s.fontColor, '#333333');
    propFontSize.value  = s.fontSize ?? 12;
    // 对齐按钮高亮
    const alignMap = { left: 0, center: 1, right: 2 };
    const alignIdx = alignMap[s.hAlign] ?? 1;
    alignBtns.forEach((btn, i) => btn?.classList.toggle('active', i === alignIdx));
}

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

// ─── 主题切换 ─────────────────────────────────────────────────────────────────

function applyCanvasTheme() {
    const theme = CANVAS_THEMES[currentThemeIndex];
    canvasDiv.style.background = theme.canvasBg;
    if (btnTheme) btnTheme.title = '切换画布主题：' + theme.label;
}

function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % CANVAS_THEMES.length;
    applyCanvasTheme();
}

// ─── 键盘快捷键 ───────────────────────────────────────────────────────────────

function bindKeyboard() {
    document.addEventListener('keydown', e => {
        if (document.getElementById('whiteboard-view').classList.contains('hidden')) return;
        if (document.activeElement !== document.body) return;

        if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
        if (e.ctrlKey && e.shiftKey  && e.key === 'z') { e.preventDefault(); redo(); return; }
        if (e.ctrlKey && e.key === 'y')                { e.preventDefault(); redo(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelected(); return; }
        if (e.ctrlKey && e.key === '0') { e.preventDefault(); fitScreen(); return; }

        if (!e.ctrlKey && !e.altKey) {
            const keyMap = {
                v: 'select', r: 'rectangle', e: 'ellipse',
                t: 'triangle', d: 'diamond', l: 'line', f: 'freeLine',
                p: 'parallelogram', a: 'rightArrow',
            };
            if (keyMap[e.key.toLowerCase()]) { setTool(keyMap[e.key.toLowerCase()]); return; }
        }

        if (e.key === '+' || e.key === '=') setZoom(ZOOM_STEP);
        if (e.key === '-')                  setZoom(-ZOOM_STEP);
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
    btnTheme && btnTheme.addEventListener('click', cycleTheme);

    // 外观
    propFill.addEventListener('input',    syncPropsToShape);
    propBorder.addEventListener('input',  syncPropsToShape);
    propAlpha.addEventListener('input', () => {
        alphaVal.textContent = propAlpha.value + '%';
        syncPropsToShape();
    });
    propBorderW.addEventListener('input', () => {
        borderwVal.textContent = Number(propBorderW.value).toFixed(1);
        syncPropsToShape();
    });
    propRadius.addEventListener('input', () => {
        radiusVal.textContent = propRadius.value;
        syncPropsToShape();
    });
    // 位置与尺寸（失焦时应用，避免打字过程中频繁刷新）
    [propX, propY, propW, propH].forEach(el => {
        el.addEventListener('change', syncPropsToShape);
    });
    // 文字
    propFontColor.addEventListener('input', syncPropsToShape);
    propFontSize.addEventListener('change', syncPropsToShape);
    // 对齐按钮
    const alignValues = ['left', 'center', 'right'];
    alignBtns.forEach((btn, i) => {
        btn?.addEventListener('click', () => {
            if (!annPage) return;
            const focused = annPage.getFocusedShapes();
            if (!focused?.length) return;
            alignBtns.forEach((b, j) => b?.classList.toggle('active', j === i));
            annGraph.change(() => {
                focused.forEach(s => { s.hAlign = alignValues[i]; s.invalidate?.(); });
            });
        });
    });
}

// ─── 导出：白板初始化入口 ─────────────────────────────────────────────────────

export async function initWhiteboard() {
    bindButtons();
    bindKeyboard();

    try {
        const {g} = await initEngine();

        g.addEventListener(EVENT_TYPE.FOCUSED_SHAPES_CHANGE, shapes => {
            const focused = Array.isArray(shapes) ? shapes : (shapes ? [shapes] : []);
            if (focused.length > 0) {
                propsPanel.classList.remove('hidden');
                syncPropsFromShape(focused);
            } else {
                propsPanel.classList.add('hidden');
            }
            updateHistoryBtns();
            updateStatusBar();
        });

        g.addEventListener(EVENT_TYPE.SHAPE_ADDED, () => {
            setTool('select');
            updateHistoryBtns();
            updateStatusBar();
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
