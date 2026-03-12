/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { colorField, rangeField, numberField, selectField, tabField } from './fieldDef.js';
import { PROGRESS_STATUS, INFO_TYPE, LINEMODE } from '../../common/const.js';
import { t } from '../../src/i18n.js';

// ── SVG icons for tab bar ──────────────────────────────────────────────────────
const TAB_ICON = {
    style: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4"/>
        <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity=".45"/>
    </svg>`,
    text: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <path d="M3 4h10M3 8h7M3 12h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    position: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
    </svg>`,
    state: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none">
        <circle cx="8" cy="5.5" r="2" stroke="currentColor" stroke-width="1.3"/>
        <path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`,
};

// ── 枚举值 → 字符串 key 映射 ──────────────────────────────────────────────────
// 引擎将 progressStatus / infoType / lineMode 存为对象（PROGRESS_STATUS.DOING 等），
// 属性面板 select 字段存储字符串 key，需要 getValue 做双向映射。
const progressStatusGetter = raw => raw?.name ?? 'NONE';
const infoTypeGetter        = raw => raw?.name ?? 'none';
const lineModeGetter        = raw => raw?.type ?? 'straight';

/**
 * 所有矩形系形状的默认 displayFields（Tab 布局）。
 *
 * 返回 4 个 tabField：样式 | 文字 | 位置 | 状态。
 * 渲染器检测到全部为 tabField 时切换为水平 Tab 布局。
 */
export const baseDisplayFields = () => [

    // ── Tab 1: 样式 ───────────────────────────────────────────────────────────
    tabField('style', t('prop.tab.style'), [

        colorField('backColor', t('prop.fill'), {
            order: 1,
            onChange: (shapes, value) => {
                shapes.forEach(s => {
                    s.backColor = value;
                    s.mouseInBackColor = value;
                });
            },
        }),

        rangeField('globalAlpha', '', {
            min: 0, max: 1, step: 0.01,
            format: v => Math.round(v * 100) + '%',
            inlineWith: 'backColor',
            order: 2,
        }),

        colorField('borderColor', t('prop.border'), {
            order: 3,
            onChange: (shapes, value) => {
                shapes.forEach(s => {
                    s.borderColor = value;
                    s.mouseInBorderColor = value;
                });
            },
        }),

        rangeField('borderWidth', '', {
            min: 0, max: 10, step: 0.5,
            format: v => Number(v).toFixed(1),
            inlineWith: 'borderColor',
            order: 4,
        }),

        rangeField('cornerRadius', t('prop.radius'), {
            min: 0, max: 60, step: 1,
            format: v => v + 'px',
            order: 5,
        }),

    ], { order: 1, icon: TAB_ICON.style }),

    // ── Tab 2: 文字 ───────────────────────────────────────────────────────────
    tabField('text', t('prop.tab.text'), [

        colorField('fontColor', t('prop.color'), { order: 1 }),

        numberField('fontSize', t('prop.size'), {
            min: 6, max: 200, step: 1,
            inlineWith: 'fontColor',
            order: 2,
        }),

        selectField('hAlign', t('prop.align'), [
            {
                value: 'left',
                label: 'L',
                icon: '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
            },
            {
                value: 'center',
                label: 'C',
                icon: '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 4h12M4 8h8M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
            },
            {
                value: 'right',
                label: 'R',
                icon: '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 4h12M6 8h8M4 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
            },
        ], { style: 'buttons', order: 3 }),

    ], { order: 2, icon: TAB_ICON.text }),

    // ── Tab 3: 位置 ───────────────────────────────────────────────────────────
    tabField('position', t('prop.tab.pos'), [

        numberField('x',      'X', { order: 1, step: 1 }),
        numberField('y',      'Y', { order: 2, step: 1 }),
        numberField('width',  'W', { min: 1, order: 3, step: 1 }),
        numberField('height', 'H', { min: 1, order: 4, step: 1 }),

    ], { order: 3, icon: TAB_ICON.position }),

    // ── Tab 4: 状态 ───────────────────────────────────────────────────────────
    // 对应引擎的 rectangle.js 快捷键：Ctrl+E (关注) / Ctrl+1~9 (优先级) /
    //   Ctrl+I (提示徽章) / Ctrl+G (进度条) / Ctrl+Shift+S (状态)
    tabField('state', t('prop.tab.state'), [

        // 关注（emphasized） — Ctrl+E，高亮光晕动画
        selectField('emphasized', t('prop.follow'), [
            { value: 'false', label: t('opt.off') },
            { value: 'true',  label: t('opt.on') },
        ], {
            style: 'buttons',
            order: 1,
            onChange: (shapes, v) => { shapes.forEach(s => { s.emphasized = v === 'true'; }); },
        }),

        // 优先级（priority）— Ctrl+数字键，0 = 无
        selectField('priority', t('prop.priority'), [
            { value: '0', label: '—' },
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
        ], {
            style: 'buttons',
            order: 2,
            onChange: (shapes, v) => { shapes.forEach(s => { s.priority = Number(v); }); },
        }),

        // 任务状态（progressStatus）— 下拉
        selectField('progressStatus', t('prop.task'), [
            { value: 'NONE',       label: t('opt.none') },
            { value: 'NOTSTARTED', label: t('opt.notStarted') },
            { value: 'DOING',      label: t('opt.doing') },
            { value: 'RUNNING',    label: t('opt.running') },
            { value: 'PAUSE',      label: t('opt.pause') },
            { value: 'COMPLETE',   label: t('opt.complete') },
            { value: 'ERROR',      label: t('opt.error') },
            { value: 'UNKNOWN',    label: t('opt.unknown') },
        ], {
            style: 'dropdown',
            order: 3,
            getValue: progressStatusGetter,
            onChange: (shapes, v) => { shapes.forEach(s => { s.progressStatus = PROGRESS_STATUS[v]; }); },
        }),

        // 提示徽章（infoType）— Ctrl+I，右上角角标
        selectField('infoType', t('prop.badge'), [
            { value: 'none',        label: t('opt.none'),
              icon: '<svg viewBox="0 0 14 14" width="11" height="11" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 1.5" opacity=".5"/></svg>' },
            { value: 'information', label: '?',
              icon: '<svg viewBox="0 0 14 14" width="11" height="11" fill="none"><circle cx="7" cy="7" r="5.5" fill="#4fc3f7" fill-opacity=".2" stroke="#4fc3f7" stroke-width="1.2"/><text x="7" y="10.5" text-anchor="middle" font-size="7" font-weight="700" fill="#4fc3f7">?</text></svg>' },
            { value: 'warning',     label: '!',
              icon: '<svg viewBox="0 0 14 14" width="11" height="11" fill="none"><circle cx="7" cy="7" r="5.5" fill="#ffb74d" fill-opacity=".2" stroke="#ffb74d" stroke-width="1.2"/><text x="7" y="10.5" text-anchor="middle" font-size="8" font-weight="700" fill="#ffb74d">!</text></svg>' },
            { value: 'error',       label: '×',
              icon: '<svg viewBox="0 0 14 14" width="11" height="11" fill="none"><circle cx="7" cy="7" r="5.5" fill="#ff4f6a" fill-opacity=".2" stroke="#ff4f6a" stroke-width="1.2"/><text x="7" y="10.5" text-anchor="middle" font-size="8" font-weight="700" fill="#ff4f6a">×</text></svg>' },
        ], {
            style: 'buttons',
            order: 4,
            getValue: infoTypeGetter,
            onChange: (shapes, v) => { shapes.forEach(s => { s.infoType = INFO_TYPE[v.toUpperCase()]; }); },
        }),

    ], { order: 4, icon: TAB_ICON.state }),

];

/**
 * 仅几何字段（用于线条等无背景的形状）。
 * 单 tab 布局（只有位置 tab）。
 */
export const geometryOnlyFields = () => [
    tabField('position', t('prop.tab.pos'), [
        numberField('x',      'X', { order: 1 }),
        numberField('y',      'Y', { order: 2 }),
        numberField('width',  'W', { min: 1, order: 3 }),
        numberField('height', 'H', { min: 1, order: 4 }),
    ], { order: 1, icon: TAB_ICON.position }),
];

/**
 * 线条形状的 displayFields（样式 + 位置两个 Tab）。
 *
 * 样式 Tab 包含：颜色 / 粗细 / 透明度 / 曲线模式 / 流光效果。
 * 曲线模式对应引擎快捷键 Ctrl+L：直线 → 自动弧 → 折线 → 曲线 → 循环。
 */
export const lineDisplayFields = () => [

    // ── Tab 1: 样式 ───────────────────────────────────────────────────────────
    tabField('style', t('prop.tab.style'), [

        colorField('borderColor', t('prop.color'), {
            order: 1,
            onChange: (shapes, value) => {
                shapes.forEach(s => { s.borderColor = value; });
            },
        }),

        rangeField('borderWidth', '', {
            min: 0.5, max: 12, step: 0.5,
            format: v => Number(v).toFixed(1),
            inlineWith: 'borderColor',
            order: 2,
        }),

        rangeField('globalAlpha', t('prop.alpha'), {
            min: 0, max: 1, step: 0.01,
            format: v => Math.round(v * 100) + '%',
            order: 3,
        }),

        // 曲线模式 — Ctrl+L 循环切换
        selectField('lineMode', t('prop.curve'), [
            {
                value: 'straight',
                label: t('opt.straight'),
                icon: '<svg viewBox="0 0 20 14" width="18" height="10" fill="none"><line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
            },
            {
                value: 'auto_curve',
                label: t('opt.arc'),
                icon: '<svg viewBox="0 0 20 14" width="18" height="10" fill="none"><path d="M2 11 C6 2, 14 2, 18 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
            },
            {
                value: 'broken',
                label: t('opt.broken'),
                icon: '<svg viewBox="0 0 20 14" width="18" height="10" fill="none"><polyline points="2,11 8,3 12,3 18,11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
            },
            {
                value: 'curve',
                label: t('opt.curveLine'),
                icon: '<svg viewBox="0 0 20 14" width="18" height="10" fill="none"><path d="M2 11 C4 2, 10 12, 12 4 S18 2 18 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
            },
        ], {
            style: 'buttons',
            order: 4,
            getValue: lineModeGetter,
            onChange: (shapes, v) => {
                shapes.forEach(s => { s.lineMode = LINEMODE[v.toUpperCase()]; });
            },
        }),

        // 流光效果
        selectField('allowShine', t('prop.shine'), [
            { value: 'false', label: t('opt.off') },
            { value: 'true',  label: t('opt.on') },
        ], {
            style: 'buttons',
            order: 5,
            onChange: (shapes, v) => { shapes.forEach(s => { s.allowShine = v === 'true'; }); },
        }),

    ], { order: 1, icon: TAB_ICON.style }),

    // ── Tab 2: 位置 ───────────────────────────────────────────────────────────
    tabField('position', t('prop.tab.pos'), [
        numberField('x',      'X', { order: 1, step: 1 }),
        numberField('y',      'Y', { order: 2, step: 1 }),
        numberField('width',  'W', { min: 1, order: 3, step: 1 }),
        numberField('height', 'H', { min: 1, order: 4, step: 1 }),
    ], { order: 2, icon: TAB_ICON.position }),

];
