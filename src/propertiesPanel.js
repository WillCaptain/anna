/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 动态属性面板渲染器。
 *
 * 核心思路：
 *   shape.getDisplayFields() → Array<groupField>
 *   渲染器读取字段描述符（meta）→ 创建对应 DOM 控件 → 绑定双向同步
 *
 * 完全多态：面板内容由 shape 自身决定，whiteboard 不需要 if-type 判断。
 */

// ─── 状态 ─────────────────────────────────────────────────────────────────────

let _panel        = null;   // aside#properties-panel
let _graph        = null;   // annGraph，用于 change() 包裹
let _getPage      = null;   // () => annPage
let _shapes       = [];     // 当前选中的 shape 列表
let _fieldSig     = '';     // 上次渲染的字段结构签名（避免重复 build DOM）
let _disposers    = [];     // 事件监听器清理函数列表

// ─── 初始化 ───────────────────────────────────────────────────────────────────

/**
 * 挂载面板。在 whiteboard 初始化后调用一次。
 * @param {HTMLElement}  panelEl  - aside#properties-panel
 * @param {object}       graph    - annGraph
 * @param {Function}     getPage  - () => annPage
 */
export function initPropertiesPanel(panelEl, graph, getPage) {
    _panel   = panelEl;
    _graph   = graph;
    _getPage = getPage;
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 当 focusedShapes 变化时由 whiteboard 调用。
 * @param {Shape[]} shapes
 */
export function syncPanelFromShapes(shapes) {
    _shapes = shapes ?? [];
    if (_shapes.length === 0) return;

    const primary = _shapes[0];
    const fields  = primary.getDisplayFields?.() ?? [];

    // 字段结构签名：只在 shape 类型切换时重建 DOM
    const sig = _computeSig(fields);
    if (sig !== _fieldSig) {
        _buildPanel(fields);
        _fieldSig = sig;
    }

    // 每次选中都从 shape 读最新值更新控件
    _updateValues(fields, primary);
}

// ─── 内部：DOM 构建 ───────────────────────────────────────────────────────────

function _computeSig(fields) {
    return fields.map(f => f.id ?? f.key).join('|');
}

function _buildPanel(fields) {
    // 清理旧监听器
    _disposers.forEach(fn => fn());
    _disposers = [];

    // 清空面板（保留 h3 标题节点）
    const title = _panel.querySelector('h3');
    _panel.innerHTML = '';
    if (title) _panel.appendChild(title.cloneNode(true));

    // 按 order 渲染分组
    const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sorted.forEach(f => {
        if (f.type === 'group') _renderGroup(f, _panel);
    });
}

function _renderGroup(groupDef, container) {
    const section = document.createElement('div');
    section.className = 'prop-section';
    section.dataset.group = groupDef.id;

    const hd = document.createElement('div');
    hd.className = 'prop-section-hd';
    hd.textContent = groupDef.label;
    if (groupDef.collapsible) {
        hd.classList.add('collapsible');
        hd.addEventListener('click', () => section.classList.toggle('collapsed'));
    }
    section.appendChild(hd);

    // 子字段已在 groupField 工厂中排序，直接遍历
    let lastColorKey = null;  // 用于 inlineWith 配对
    groupDef.fields.forEach((field, idx, arr) => {
        // inlineWith 字段与前一个字段合并成同一行
        const prev = arr[idx - 1];
        const inlineWithPrev = field.inlineWith && prev && field.inlineWith === prev.key;
        if (inlineWithPrev) {
            // 追加到上一个字段的 color-picker-row 中
            const lastRow = section.querySelector(`.color-picker-row[data-key="${prev.key}"]`);
            if (lastRow) {
                _appendFieldControl(field, lastRow);
                return;
            }
        }
        _renderFieldRow(field, section);
    });

    container.appendChild(section);
}

function _renderFieldRow(field, container) {
    if (field.type === 'number' && field.inlineWith === undefined) {
        // 数字字段检查是否需要 2 列布局（geometry 组的 x/y 或 w/h）
        // 渲染为独立行，由 CSS grid 决定布局
    }

    const div = document.createElement('div');
    div.className = 'prop-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    div.appendChild(label);

    if (field.type === 'color') {
        const row = document.createElement('div');
        row.className = 'color-picker-row';
        row.dataset.key = field.key;
        _appendFieldControl(field, row);
        div.appendChild(row);
    } else {
        _appendFieldControl(field, div);
    }

    container.appendChild(div);
}

// ─── 内部：控件渲染 ──────────────────────────────────────────────────────────

function _appendFieldControl(field, container) {
    switch (field.type) {
        case 'color':   _makeColorControl(field, container);  break;
        case 'range':   _makeRangeControl(field, container);  break;
        case 'number':  _makeNumberControl(field, container); break;
        case 'select':  _makeSelectControl(field, container); break;
    }
}

// — 颜色选择器 ─────────────────────────────────────────────────────────────────

function _makeColorControl(field, container) {
    const input = document.createElement('input');
    input.type  = 'color';
    input.id    = `prop-${field.key}`;
    input.dataset.fieldKey = field.key;

    const handler = () => _applyValue(field, input.value);
    input.addEventListener('input', handler);
    _disposers.push(() => input.removeEventListener('input', handler));

    container.appendChild(input);
}

// — 滑块 ───────────────────────────────────────────────────────────────────────

function _makeRangeControl(field, container) {
    const input = document.createElement('input');
    input.type  = 'range';
    input.min   = String(field.min ?? 0);
    input.max   = String(field.max ?? 100);
    input.step  = String(field.step ?? 1);
    input.id    = `prop-${field.key}`;
    input.dataset.fieldKey = field.key;

    const valSpan = document.createElement('span');
    valSpan.className = 'prop-val';
    valSpan.id = `prop-${field.key}-val`;

    const handler = () => {
        const raw = parseFloat(input.value);
        valSpan.textContent = (field.format ?? (v => v))(raw);
        _applyValue(field, raw);
    };
    input.addEventListener('input', handler);
    _disposers.push(() => input.removeEventListener('input', handler));

    container.appendChild(input);
    container.appendChild(valSpan);
}

// — 数字输入框 ─────────────────────────────────────────────────────────────────

function _makeNumberControl(field, container) {
    // geometry 组的 x/y/w/h：以 2 列 grid 布局渲染
    const isGeo = ['x', 'y', 'width', 'height'].includes(field.key);

    if (isGeo) {
        // 找或创建 2 列容器
        let row2 = container.lastElementChild;
        const needNewRow = !row2 || !row2.classList.contains('prop-row2') ||
            row2.children.length >= 2;
        if (needNewRow) {
            row2 = document.createElement('div');
            row2.className = 'prop-row2';
            container.appendChild(row2);
        }

        const cell = document.createElement('div');
        cell.className = 'prop-field';
        const lbl = document.createElement('label');
        lbl.textContent = field.label;
        const input = _createNumberInput(field);
        cell.appendChild(lbl);
        cell.appendChild(input);
        row2.appendChild(cell);
        return;
    }

    const input = _createNumberInput(field);
    container.appendChild(input);
}

function _createNumberInput(field) {
    const input = document.createElement('input');
    input.type  = 'number';
    input.className = ['x','y','width','height'].includes(field.key) ? 'prop-num' : 'prop-num-sm';
    input.id    = `prop-${field.key}`;
    if (field.min != null) input.min = String(field.min);
    if (field.max != null) input.max = String(field.max);
    input.step  = String(field.step ?? 1);
    input.dataset.fieldKey = field.key;

    // change（失焦提交）避免打字过程中频繁刷新
    const handler = () => {
        const v = parseFloat(input.value);
        if (isNaN(v)) return;
        _applyValue(field, v);
    };
    input.addEventListener('change', handler);
    _disposers.push(() => input.removeEventListener('change', handler));
    return input;
}

// — 选择 / 按钮组 ───────────────────────────────────────────────────────────────

function _makeSelectControl(field, container) {
    if (field.style === 'buttons') {
        const row = document.createElement('div');
        row.className = 'prop-align-row';

        field.values.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'prop-align-btn';
            btn.title = opt.label;
            btn.dataset.value = opt.value;
            btn.dataset.fieldKey = field.key;
            btn.innerHTML = opt.icon ?? opt.label;

            const handler = () => {
                // 更新激活状态
                row.querySelectorAll('.prop-align-btn').forEach(b =>
                    b.classList.toggle('active', b === btn));
                _applyValue(field, opt.value);
            };
            btn.addEventListener('click', handler);
            _disposers.push(() => btn.removeEventListener('click', handler));
            row.appendChild(btn);
        });
        container.appendChild(row);
    } else {
        // dropdown（未来扩展）
        const sel = document.createElement('select');
        sel.className = 'prop-select';
        sel.id = `prop-${field.key}`;
        field.values.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            sel.appendChild(o);
        });
        const handler = () => _applyValue(field, sel.value);
        sel.addEventListener('change', handler);
        _disposers.push(() => sel.removeEventListener('change', handler));
        container.appendChild(sel);
    }
}

// ─── 内部：值更新（shape → 控件）─────────────────────────────────────────────

function _updateValues(fields, shape) {
    const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sorted.forEach(f => {
        if (f.type === 'group') {
            f.fields.forEach(sub => _updateSingleField(sub, shape));
        } else {
            _updateSingleField(f, shape);
        }
    });
}

function _updateSingleField(field, shape) {
    const el = _panel.querySelector(`[data-field-key="${field.key}"]`);
    if (!el) return;

    const raw = shape[field.key];
    if (raw == null) return;

    switch (field.type) {
        case 'color': {
            const hex = _toHex(raw);
            if (hex) el.value = hex;
            break;
        }
        case 'range': {
            el.value = String(raw);
            const valEl = _panel.querySelector(`#prop-${field.key}-val`);
            if (valEl) valEl.textContent = (field.format ?? (v => v))(raw);
            break;
        }
        case 'number': {
            el.value = String(Math.round(raw));
            break;
        }
        case 'select': {
            // 按钮组：高亮当前值
            _panel.querySelectorAll(`[data-field-key="${field.key}"]`).forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === String(raw));
            });
            break;
        }
    }
}

// ─── 内部：值应用（控件 → shape）─────────────────────────────────────────────

function _applyValue(field, value) {
    if (!_shapes.length || !_graph) return;

    _graph.change(() => {
        if (field.onChange) {
            // 字段自定义处理：接收全部选中 shapes
            field.onChange(_shapes, value, _graph);
        } else {
            _shapes.forEach(s => { s[field.key] = value; });
        }
        _shapes.forEach(s => s.invalidate?.());
    });
}

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function _toHex(color) {
    if (!color || typeof color !== 'string') return null;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    // 把命名色转 hex（通过 canvas 2d 上下文）
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        return ctx.fillStyle; // 浏览器会转为 #rrggbb
    } catch {
        return null;
    }
}
