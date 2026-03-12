/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 动态属性面板渲染器（Tab 布局版）。
 *
 * 核心思路：
 *   shape.getDisplayFields() → Array<tabField|groupField>
 *   当顶层全为 tabField 时，渲染为水平 Tab 布局。
 *   否则退回原分组平铺布局（向下兼容）。
 *
 * 完全多态：面板内容由 shape 自身决定，whiteboard 无需 if-type 判断。
 */

import { t } from './i18n.js';

// ─── 状态 ─────────────────────────────────────────────────────────────────────

let _panel        = null;   // aside#properties-panel
let _graph        = null;   // annGraph
let _getPage      = null;   // () => annPage
let _shapes       = [];
let _fieldSig     = '';
let _activeTab    = null;   // 当前激活的 tab id
let _disposers    = [];
let _conditionals = [];     // [{el, key, value}] — visibleWhen 条件行注册表

// ─── 初始化 ───────────────────────────────────────────────────────────────────

export function initPropertiesPanel(panelEl, graph, getPage) {
    _panel   = panelEl;
    _graph   = graph;
    _getPage = getPage;
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

export function syncPanelFromShapes(shapes) {
    _shapes = shapes ?? [];
    if (_shapes.length === 0) return;

    const primary = _shapes[0];
    const fields  = primary.getDisplayFields?.() ?? [];

    const sig = _computeSig(fields);
    if (sig !== _fieldSig) {
        _buildPanel(fields);
        _fieldSig = sig;
    }

    _updateValues(fields, primary);
}

// ─── 内部：DOM 构建 ───────────────────────────────────────────────────────────

function _computeSig(fields) {
    return fields.map(f => f.id ?? f.key).join('|');
}

function _buildPanel(fields) {
    _disposers.forEach(fn => fn());
    _disposers    = [];
    _conditionals = [];

    _panel.innerHTML = '';

    const isTabs = fields.length > 0 && fields.every(f => f.type === 'tab');

    if (isTabs) {
        _buildTabLayout(fields);
    } else {
        // fallback: flat group layout
        const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        sorted.forEach(f => {
            if (f.type === 'group') _renderGroup(f, _panel);
        });
    }
}

// ── Tab 布局 ──────────────────────────────────────────────────────────────────

function _buildTabLayout(tabs) {
    const sorted = [...tabs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Tab bar
    const bar = document.createElement('div');
    bar.className = 'prop-tab-bar';
    _panel.appendChild(bar);

    // Content container
    const body = document.createElement('div');
    body.className = 'prop-tab-body';
    _panel.appendChild(body);

    // Restore last active tab or default to first
    const defaultTab = _activeTab && sorted.find(t => t.id === _activeTab)
        ? _activeTab
        : sorted[0]?.id;

    sorted.forEach(tab => {
        // Tab button
        const btn = document.createElement('button');
        btn.className = 'prop-tab-btn';
        btn.dataset.tab = tab.id;
        btn.title = tab.label;
        btn.innerHTML = (tab.icon ?? '') +
            `<span class="prop-tab-label">${tab.label}</span>`;
        bar.appendChild(btn);

        // Tab pane
        const pane = document.createElement('div');
        pane.className = 'prop-tab-pane';
        pane.dataset.tab = tab.id;
        body.appendChild(pane);

        // Render pane contents
        const paneFields = [...tab.fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        _renderFieldList(paneFields, pane);

        // Tab click
        const handler = () => _activateTab(tab.id, bar, body);
        btn.addEventListener('click', handler);
        _disposers.push(() => btn.removeEventListener('click', handler));
    });

    _activateTab(defaultTab, bar, body);

    // Apply initial conditional visibility
    if (_shapes[0]) _updateConditionals(_shapes[0]);
}

function _activateTab(tabId, bar, body) {
    _activeTab = tabId;
    bar.querySelectorAll('.prop-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
    });
    body.querySelectorAll('.prop-tab-pane').forEach(p => {
        p.classList.toggle('active', p.dataset.tab === tabId);
    });
}

// ── Group layout (legacy / fallback) ─────────────────────────────────────────

function _renderGroup(groupDef, container) {
    const section = document.createElement('div');
    section.className = 'prop-section';
    section.dataset.group = groupDef.id;

    const hd = document.createElement('div');
    hd.className = 'prop-section-hd';
    hd.textContent = groupDef.label;
    section.appendChild(hd);

    _renderFieldList(groupDef.fields, section);
    container.appendChild(section);
}

// ─── 字段列表渲染（供 tab pane 和 group section 共用） ────────────────────────

function _renderFieldList(fields, container) {
    fields.forEach((field, idx, arr) => {
        if (field.type === 'group') {
            // nested group inside a tab — render as section without header
            _renderFieldList(field.fields, container);
            return;
        }
        // inlineWith: merge this field into the previous field's row
        const prev = arr[idx - 1];
        if (field.inlineWith && prev && field.inlineWith === prev.key) {
            const lastRow = container.querySelector(`.prop-row[data-key="${prev.key}"]`);
            if (lastRow) { _appendFieldControl(field, lastRow); return; }
        }
        _renderFieldRow(field, container);
    });
}

function _renderFieldRow(field, container) {
    // action fields get their own full-width row (no label column)
    if (field.type === 'action') {
        const row = document.createElement('div');
        row.className = 'prop-row prop-row-action';
        if (field.key) row.dataset.key = field.key;
        if (field.visibleWhen) {
            _conditionals.push({ el: row, key: field.visibleWhen.key, value: field.visibleWhen.value });
        }
        _makeActionControl(field, row);
        container.appendChild(row);
        return;
    }

    const row = document.createElement('div');
    row.className = 'prop-row';
    if (field.key) row.dataset.key = field.key;

    // Register visibleWhen condition
    if (field.visibleWhen) {
        _conditionals.push({ el: row, key: field.visibleWhen.key, value: field.visibleWhen.value });
    }

    if (field.label) {
        const lbl = document.createElement('span');
        lbl.className = 'prop-lbl';
        lbl.textContent = field.label;
        row.appendChild(lbl);
    }

    const ctrl = document.createElement('div');
    ctrl.className = 'prop-ctrl';
    row.appendChild(ctrl);

    if (field.type === 'color') {
        row.className += ' prop-row-color';
        _makeColorControl(field, ctrl);
    } else {
        _appendFieldControl(field, ctrl);
    }

    container.appendChild(row);
}

// ─── 控件渲染 ─────────────────────────────────────────────────────────────────

function _appendFieldControl(field, container) {
    switch (field.type) {
        case 'color':    _makeColorControl(field, container);    break;
        case 'range':    _makeRangeControl(field, container);    break;
        case 'number':   _makeNumberControl(field, container);   break;
        case 'select':   _makeSelectControl(field, container);   break;
        case 'textarea': _makeTextareaControl(field, container); break;
        case 'input':    _makeInputControl(field, container);    break;
    }
}

function _makeColorControl(field, container) {
    const input = document.createElement('input');
    input.type  = 'color';
    input.id    = `prop-${field.key}`;
    input.dataset.fieldKey = field.key;
    input.className = 'prop-color';
    const handler = () => _applyValue(field, input.value);
    input.addEventListener('input', handler);
    _disposers.push(() => input.removeEventListener('input', handler));
    container.appendChild(input);
}

function _makeRangeControl(field, container) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-range-wrap';

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

    wrap.appendChild(input);
    wrap.appendChild(valSpan);
    container.appendChild(wrap);
}

function _makeNumberControl(field, container) {
    // Position tab: x/y/w/h use compact 2-col grid
    const isPos = ['x', 'y', 'width', 'height'].includes(field.key);

    if (isPos) {
        // Find or create the 2-col pair container
        let pair = container.lastElementChild;
        const needNew = !pair || !pair.classList.contains('prop-pos-pair') ||
            pair.children.length >= 2;
        if (needNew) {
            pair = document.createElement('div');
            pair.className = 'prop-pos-pair';
            container.appendChild(pair);
        }
        const cell = document.createElement('div');
        cell.className = 'prop-pos-cell';
        const lbl = document.createElement('span');
        lbl.className = 'prop-pos-lbl';
        lbl.textContent = field.label;
        cell.appendChild(lbl);
        cell.appendChild(_createNumberInput(field));
        pair.appendChild(cell);
        return;
    }

    container.appendChild(_createNumberInput(field));
}

function _createNumberInput(field) {
    const input = document.createElement('input');
    input.type  = 'number';
    input.className = ['x','y','width','height'].includes(field.key)
        ? 'prop-num-pos' : 'prop-num';
    input.id    = `prop-${field.key}`;
    if (field.min != null) input.min = String(field.min);
    if (field.max != null) input.max = String(field.max);
    input.step  = String(field.step ?? 1);
    input.dataset.fieldKey = field.key;

    const handler = () => {
        const v = parseFloat(input.value);
        if (isNaN(v)) return;
        _applyValue(field, v);
    };
    input.addEventListener('change', handler);
    _disposers.push(() => input.removeEventListener('change', handler));
    return input;
}

function _makeSelectControl(field, container) {
    if (field.style === 'buttons') {
        const row = document.createElement('div');
        row.className = 'prop-align-row';
        field.values.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'prop-align-btn';
            btn.title = opt.label;
            btn.dataset.value  = opt.value;
            btn.dataset.fieldKey = field.key;
            btn.innerHTML = opt.icon ?? opt.label;
            const handler = () => {
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

function _makeTextareaControl(field, container) {
    const ta = document.createElement('textarea');
    ta.className     = 'prop-textarea';
    ta.id            = `prop-${field.key}`;
    ta.dataset.fieldKey = field.key;
    ta.rows          = field.rows ?? 5;
    ta.placeholder   = field.placeholder ?? '';
    ta.spellcheck    = false;

    const handler = () => _applyValue(field, ta.value);
    ta.addEventListener('change', handler);
    _disposers.push(() => ta.removeEventListener('change', handler));
    container.appendChild(ta);
}

function _makeInputControl(field, container) {
    const input = document.createElement('input');
    input.type        = 'text';
    input.className   = 'prop-input';
    input.id          = `prop-${field.key}`;
    input.dataset.fieldKey = field.key;
    input.placeholder = field.placeholder ?? '';
    input.spellcheck  = false;

    const handler = () => _applyValue(field, input.value);
    input.addEventListener('change', handler);
    _disposers.push(() => input.removeEventListener('change', handler));
    container.appendChild(input);
}

function _makeActionControl(field, container) {
    const wrap = document.createElement('div');
    wrap.className = 'prop-action-row';

    const btn = document.createElement('button');
    btn.className   = 'prop-action-btn';
    btn.textContent = field.btnLabel ?? t('action.run');

    const statusEl = document.createElement('span');
    statusEl.className = 'prop-action-status';
    statusEl.dataset.actionStatus = field.key;
    statusEl.textContent = t('action.notFetched');

    const handler = async () => {
        if (!_shapes.length) return;
        btn.disabled    = true;
        btn.textContent = t('action.fetching');
        statusEl.textContent = t('action.fetching');

        if (field.onClick) {
            await field.onClick(_shapes, _graph);
        }

        btn.disabled    = false;
        btn.textContent = field.btnLabel ?? t('action.run');

        // Re-sync values to refresh status text from shape._dsStatus
        const primary = _shapes[0];
        if (primary) {
            const fields = primary.getDisplayFields?.() ?? [];
            _updateValues(fields, primary);
        }
    };
    btn.addEventListener('click', handler);
    _disposers.push(() => btn.removeEventListener('click', handler));

    wrap.appendChild(btn);
    wrap.appendChild(statusEl);
    container.appendChild(wrap);
}

// ─── 值更新（shape → 控件） ───────────────────────────────────────────────────

function _updateValues(fields, shape) {
    fields.forEach(f => {
        if (f.type === 'tab' || f.type === 'group') {
            f.fields.forEach(sub => _updateSingleField(sub, shape));
        } else {
            _updateSingleField(f, shape);
        }
    });
    _updateConditionals(shape);
}

/** 根据 visibleWhen 条件更新行的可见性 */
function _updateConditionals(shape) {
    if (!shape) return;
    _conditionals.forEach(({ el, key, value }) => {
        const match = String(shape[key] ?? '') === String(value);
        el.classList.toggle('prop-row--hidden', !match);
    });
}

function _updateSingleField(field, shape) {
    if (field.type === 'group') {
        field.fields?.forEach(sub => _updateSingleField(sub, shape));
        return;
    }

    // action field: update status span only
    if (field.type === 'action') {
        if (!field.statusKey) return;
        const statusEl = _panel.querySelector(`[data-action-status="${field.key}"]`);
        if (statusEl) statusEl.textContent = shape[field.statusKey] ?? t('action.notFetched');
        return;
    }

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
            // getValue maps an object value (e.g. PROGRESS_STATUS enum) to the string key used in data-value
            const displayVal = field.getValue ? field.getValue(raw) : String(raw);
            _panel.querySelectorAll(`[data-field-key="${field.key}"]`).forEach(el => {
                if (el.tagName === 'SELECT') {
                    if (document.activeElement !== el) el.value = displayVal;
                } else {
                    el.classList.toggle('active', el.dataset.value === displayVal);
                }
            });
            break;
        }
        case 'textarea':
        case 'input': {
            if (document.activeElement !== el) el.value = String(raw ?? '');
            break;
        }
    }
}

// ─── 值应用（控件 → shape） ───────────────────────────────────────────────────

function _applyValue(field, value) {
    if (!_shapes.length || !_graph) return;
    _graph.change(() => {
        if (field.onChange) {
            field.onChange(_shapes, value, _graph);
        } else {
            _shapes.forEach(s => { s[field.key] = value; });
        }
        _shapes.forEach(s => s.invalidate?.());
    });
    // Immediately update conditional visibility (e.g. switching manual ↔ api)
    if (_shapes[0]) _updateConditionals(_shapes[0]);
}

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function _toHex(color) {
    if (!color || typeof color !== 'string') return null;
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        return ctx.fillStyle;
    } catch { return null; }
}
