/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Anna Whiteboard — 白板绘制工作区
 * 初始化 Anna 引擎，挂载画布，绑定工具栏交互
 */

import {graph} from '@anna/core/base/graph.js';
import {EVENT_TYPE} from '@anna/common/const.js';

// ─── 形状模块（静态导入，避免动态路径问题）───────────────────────────────────
import * as connectorMod      from '@anna/core/interaction/connector.js';
import * as containerMod      from '@anna/core/base/container.js';
import * as rectangleMod      from '@anna/core/shapes/rectangle.js';
import * as ellipseMod        from '@anna/core/shapes/ellipse.js';
import * as lineMod           from '@anna/core/shapes/line.js';
import * as freeLineMod       from '@anna/core/shapes/freeLine.js';
import * as groupMod          from '@anna/core/shapes/group.js';
import * as triangleMod       from '@anna/core/shapes/geometry/triangle.js';
import * as diamondMod        from '@anna/core/shapes/geometry/diamond.js';
import * as parallelogramMod  from '@anna/core/shapes/geometry/parallelogram.js';
import * as pentagramMod      from '@anna/core/shapes/geometry/pentagram.js';
import * as regularPentMod    from '@anna/core/shapes/geometry/regularPentagonal.js';
import * as roundedCalloutMod from '@anna/core/shapes/geometry/roundedRectangleCallout.js';
import * as rightArrowMod     from '@anna/core/shapes/arrows/rightArrow.js';
import * as bottomArrowMod    from '@anna/core/shapes/arrows/bottomArrow.js';

const SHAPE_MODULES = [
    connectorMod, containerMod, rectangleMod, ellipseMod, lineMod,
    freeLineMod, groupMod, triangleMod, diamondMod, parallelogramMod,
    pentagramMod, regularPentMod, roundedCalloutMod, rightArrowMod, bottomArrowMod,
];

const TOOL_TYPE_MAP = {
    rectangle:        'rectangle',
    ellipse:          'ellipse',
    triangle:         'triangle',
    diamond:          'diamond',
    parallelogram:    'parallelogram',
    pentagram:        'pentagram',
    roundedCallout:   'roundedRectangleCallout',
    regularPentagonal:'regularPentagonal',
    line:             'line',
    freeLine:         'freeLine',
    rightArrow:       'rightArrow',
    bottomArrow:      'bottomArrow',
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
// tool-group is now only the select button in toolbar; shape items are in left panel
const toolGroup      = $('tool-group');
const btnUndo        = $('btn-undo');
const btnRedo        = $('btn-redo');
const btnDelete      = $('btn-delete');
const btnZoomIn      = $('btn-zoom-in');
const btnZoomOut     = $('btn-zoom-out');
const btnZoomFit     = $('btn-zoom-fit');
const zoomLabel      = $('zoom-label');
const statusTool     = $('status-tool');
const statusShapes   = $('status-shapes');
const statusSelected = $('status-selected');
const propsPanel     = $('properties-panel');
const propFill       = $('prop-fill');
const propAlpha      = $('prop-alpha');
const propBorder     = $('prop-border');
const propBorderW    = $('prop-border-w');
const alphaVal       = $('alpha-val');
const borderwVal     = $('borderw-val');

// ─── 引擎初始化 ───────────────────────────────────────────────────────────────

async function initEngine() {
    // 创建 Graph（不使用 defaultGraph，避免 CKEditor 依赖）
    const g = graph(canvasDiv, 'Anna Whiteboard');
    annGraph = g;

    g.login({name: 'User', id: 'anna-user'});
    g.collaboration.mute = true;
    g.enableText = false;

    // 注册所有形状插件
    for (const mod of SHAPE_MODULES) {
        await g.dynamicImportStatement(() => Promise.resolve(mod));
    }

    if (g.loadConfig) g.loadConfig();

    // addPage 同步创建第一页并挂载到画布，返回 Page 对象
    annPage = g.addPage('Page 1', undefined, canvasDiv);

    return {g, page: annPage};
}

// ─── 工具切换 ─────────────────────────────────────────────────────────────────

function setTool(tool) {
    currentTool = tool;

    // Highlight select button in toolbar
    toolGroup.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Highlight shape items in left panel
    document.querySelectorAll('.shape-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    const wrapper = $('canvas-wrapper');
    if (wrapper) {
        wrapper.dataset.cursor = (tool === 'select') ? 'default' : 'crosshair';
    }

    if (annPage) {
        if (tool === 'select') {
            // wantedShape.clear() sets type='' so isEmpty() returns true
            // Using want(null) would set type=null, isEmpty() returns false (null !== '')
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
        backColor: '#ffffff',
        borderColor: '#4f7bff',
        borderWidth: 1.5,
        globalAlpha: 1,
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
    if (type === 'line')                      return {};
    if (type === 'freeLine')                  return {borderColor: '#4f7bff', borderWidth: 2};
    return base;
}

// ─── 操作：撤销 / 重做 / 删除 ────────────────────────────────────────────────

function undo() {
    if (!annGraph) return;
    const h = annGraph.getHistory();
    if (h && h.canUndo()) {
        h.undo();
        updateHistoryBtns();
        updateStatusBar();
    }
}

function redo() {
    if (!annGraph) return;
    const h = annGraph.getHistory();
    if (h && h.canRedo()) {
        h.redo();
        updateHistoryBtns();
        updateStatusBar();
    }
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

function syncPropsToShape() {
    if (!annPage) return;
    const focused = annPage.getFocusedShapes();
    if (!focused || focused.length === 0) return;

    const fill   = propFill.value;
    const alpha  = parseInt(propAlpha.value) / 100;
    const border = propBorder.value;
    const bw     = parseFloat(propBorderW.value);

    annGraph.change(() => {
        focused.forEach(s => {
            s.backColor   = fill;
            s.globalAlpha = alpha;
            s.borderColor = border;
            s.borderWidth = bw;
            s.invalidate && s.invalidate();
        });
    });
}

/** <input type="color"> only accepts #rrggbb; fall back to a default for named / transparent colors */
const toHexColor = (color, fallback) =>
    (color && /^#[0-9a-fA-F]{6}$/.test(color)) ? color : fallback;

function syncPropsFromShape(shapes) {
    if (!shapes || shapes.length === 0) return;
    const s = shapes[0];
    propFill.value    = toHexColor(s.backColor,   '#ffffff');
    propBorder.value  = toHexColor(s.borderColor, '#4f7bff');
    propAlpha.value   = Math.round((s.globalAlpha ?? 1) * 100);
    propBorderW.value = s.borderWidth  ?? 1;
    alphaVal.textContent   = propAlpha.value + '%';
    borderwVal.textContent = propBorderW.value;
}

// ─── 状态栏 ───────────────────────────────────────────────────────────────────

function updateStatusBar() {
    const toolNames = {
        select: '选择', rectangle: '矩形', ellipse: '椭圆',
        triangle: '三角形', diamond: '菱形', parallelogram: '平行四边形',
        pentagram: '五角星', roundedCallout: '气泡框', regularPentagonal: '五边形',
        line: '连线', freeLine: '画笔', rightArrow: '右箭头', bottomArrow: '下箭头',
    };
    statusTool.textContent = '工具: ' + (toolNames[currentTool] || currentTool);

    if (annPage) {
        const all     = annPage.sm?.getShapes() || [];
        const focused = annPage.getFocusedShapes() || [];
        statusShapes.textContent   = all.length + ' 个形状';
        statusSelected.textContent = focused.length ? `已选中 ${focused.length} 个` : '未选中';
        btnDelete.disabled = focused.length === 0;
    }
}

// ─── 键盘快捷键 ───────────────────────────────────────────────────────────────

function bindKeyboard() {
    document.addEventListener('keydown', e => {
        // 只在白板视图激活时响应
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
    // Toolbar select button
    toolGroup.addEventListener('click', e => {
        const btn = e.target.closest('.tool-btn');
        if (btn && btn.dataset.tool) setTool(btn.dataset.tool);
    });

    // Left panel shape items
    document.getElementById('shape-content').addEventListener('click', e => {
        const btn = e.target.closest('.shape-item');
        if (btn && btn.dataset.tool) setTool(btn.dataset.tool);
    });

    // Left panel category tabs
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

    propAlpha.addEventListener('input', () => {
        alphaVal.textContent = propAlpha.value + '%';
        syncPropsToShape();
    });
    propBorderW.addEventListener('input', () => {
        borderwVal.textContent = propBorderW.value;
        syncPropsToShape();
    });
    propFill.addEventListener('change',   syncPropsToShape);
    propBorder.addEventListener('change', syncPropsToShape);
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

        // SHAPE_ADDED 仅在粘贴时触发；对于 wantedShape 放置，监听 sensor mouseup 检测工具重置
        g.addEventListener(EVENT_TYPE.SHAPE_ADDED, () => {
            setTool('select');
            updateHistoryBtns();
            updateStatusBar();
        });

        // 当用户通过工具栏点击/拖拽放置形状后，wantedShape 会被引擎清除（isEmpty=true）；
        // 此时切回选择工具，并强制刷新光标与状态
        annPage.interactDrawer.getInteract().addEventListener('mouseup', () => {
            if (currentTool !== 'select' && annPage.wantedShape && annPage.wantedShape.isEmpty()) {
                // Reset tool to select without calling setTool() to avoid want(null) bug
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

        loadingOverlay.classList.add('hidden');

    } catch (err) {
        console.error('[Anna] 白板初始化失败:', err);
        loadingOverlay.innerHTML = `
            <div style="color:#ff4f6a;font-size:14px">⚠ 引擎初始化失败</div>
            <p style="color:#6b7a9e;font-size:12px;margin-top:8px">${err.message}</p>
        `;
    }
}
