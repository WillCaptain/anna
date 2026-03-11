/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { colorField, rangeField, numberField, selectField, groupField } from './fieldDef.js';

/**
 * 所有矩形系形状的默认 displayFields。
 *
 * 调用方式：shape.getDisplayFields() 返回此函数的结果。
 * 子类可通过覆盖 getDisplayFields() 来增删字段。
 *
 * 返回值是一个 groupField 数组，每个 group 对应属性面板的一个区域。
 * 渲染器按 group.order 顺序渲染，组内字段按 field.order 顺序排列。
 */
export const baseDisplayFields = () => [

    // ── 1. 位置与尺寸 ──────────────────────────────────────────────────────────
    groupField('geometry', '位置与尺寸', [
        numberField('x', 'X', { order: 1, step: 1 }),
        numberField('y', 'Y', { order: 2, step: 1 }),
        numberField('width',  '宽', { min: 1, order: 3, step: 1 }),
        numberField('height', '高', { min: 1, order: 4, step: 1 }),
    ], { order: 1 }),

    // ── 2. 外观 ────────────────────────────────────────────────────────────────
    groupField('appearance', '外观', [

        colorField('backColor', '填充色', {
            order: 1,
            onChange: (shapes, value) => {
                shapes.forEach(s => {
                    s.backColor = value;
                    // 保持 mouse-in 状态与实际颜色一致
                    s.mouseInBackColor = value;
                });
            },
        }),

        rangeField('globalAlpha', '透明度', {
            min: 0, max: 1, step: 0.01,
            format: v => Math.round(v * 100) + '%',
            inlineWith: 'backColor',   // 与填充色同行显示
            order: 2,
        }),

        colorField('borderColor', '边框色', {
            order: 3,
            onChange: (shapes, value) => {
                shapes.forEach(s => {
                    s.borderColor = value;
                    s.mouseInBorderColor = value;
                });
            },
        }),

        rangeField('borderWidth', '边框宽', {
            min: 0, max: 10, step: 0.5,
            format: v => Number(v).toFixed(1),
            inlineWith: 'borderColor',  // 与边框色同行显示
            order: 4,
        }),

        rangeField('cornerRadius', '圆角', {
            min: 0, max: 60, step: 1,
            format: v => v + 'px',
            order: 5,
        }),

    ], { order: 2 }),

    // ── 3. 文字 ────────────────────────────────────────────────────────────────
    groupField('text', '文字', [

        colorField('fontColor', '颜色', { order: 1 }),

        numberField('fontSize', '大小', {
            min: 6, max: 200, step: 1,
            inlineWith: 'fontColor',   // 与颜色同行
            order: 2,
        }),

        selectField('hAlign', '水平对齐', [
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

    ], { order: 3 }),
];

/**
 * 仅几何字段（用于线条等无背景的形状）。
 */
export const geometryOnlyFields = () => [
    groupField('geometry', '位置与尺寸', [
        numberField('x', 'X', { order: 1 }),
        numberField('y', 'Y', { order: 2 }),
        numberField('width',  '宽', { min: 1, order: 3 }),
        numberField('height', '高', { min: 1, order: 4 }),
    ], { order: 1 }),
];
