/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 属性面板字段描述符工厂。
 *
 * 每个工厂函数返回一个纯数据对象（field descriptor），描述属性面板如何渲染和操作某个字段。
 *
 * 字段类型（type）:
 *   'color'   — 颜色选择器
 *   'range'   — 滑块（带可选格式化函数）
 *   'number'  — 数字输入框
 *   'select'  — 按钮组 / 下拉选择
 *   'group'   — 折叠分组（包含子字段列表）
 *
 * onChange 签名:
 *   (shapes: Shape[], value: any, graph: Graph) => void
 *   当字段值变化时调用。若未提供，默认行为为 `shapes.forEach(s => s[key] = value)`.
 *   可在此处实现副作用（如同步 mouseIn 颜色等）。
 */

// ─── 基础字段 ───────────────────────────────────────────────────────────────────

/**
 * 颜色选择器字段。
 */
export const colorField = (key, label, opts = {}) => ({
    key,
    label,
    type: 'color',
    order: opts.order ?? 0,
    onChange: opts.onChange ?? null,
    ...opts,
});

/**
 * 滑块字段。
 * @param {Function} opts.format  - (value) => string  显示格式化
 */
export const rangeField = (key, label, opts = {}) => ({
    key,
    label,
    type: 'range',
    min: opts.min ?? 0,
    max: opts.max ?? 100,
    step: opts.step ?? 1,
    format: opts.format ?? (v => String(v)),
    order: opts.order ?? 0,
    onChange: opts.onChange ?? null,
    ...opts,
});

/**
 * 数字输入框字段。
 */
export const numberField = (key, label, opts = {}) => ({
    key,
    label,
    type: 'number',
    min: opts.min ?? null,
    max: opts.max ?? null,
    step: opts.step ?? 1,
    order: opts.order ?? 0,
    onChange: opts.onChange ?? null,
    ...opts,
});

/**
 * 选择 / 按钮组字段。
 * @param {Array}  values        - [{ value, label, icon? }]
 * @param {string} opts.style    - 'buttons'（默认）| 'dropdown'
 */
export const selectField = (key, label, values, opts = {}) => ({
    key,
    label,
    type: 'select',
    values,
    style: opts.style ?? 'buttons',
    order: opts.order ?? 0,
    onChange: opts.onChange ?? null,
    ...opts,
});

// ─── 分组字段 ───────────────────────────────────────────────────────────────────

/**
 * 折叠分组。将多个字段归入一个带标题的区域。
 * @param {string}   id     - 唯一标识（用于 DOM data-group）
 * @param {string}   label  - 标题文字
 * @param {Array}    fields - 子字段描述符数组
 */
export const groupField = (id, label, fields, opts = {}) => ({
    id,
    label,
    type: 'group',
    // 子字段按 order 排序
    fields: [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    order: opts.order ?? 0,
    collapsible: opts.collapsible ?? false,
    ...opts,
});

// ─── 便捷组合 ─────────────────────────────────────────────────────────────────

/**
 * 颜色 + 滑块 复合行（常用于"填充色 / 透明度"）。
 * 返回两个独立字段描述符，由渲染器决定如何排版。
 */
export const colorWithAlpha = (colorKey, alphaKey, label, opts = {}) => [
    colorField(colorKey, label, { order: opts.order ?? 0, onChange: opts.onColorChange ?? null }),
    rangeField(alphaKey, '', {
        min: 0, max: 1, step: 0.01,
        format: v => Math.round(v * 100) + '%',
        order: (opts.order ?? 0) + 0.5,
        inlineWith: colorKey,  // 渲染提示：与上一字段同行
        onChange: opts.onAlphaChange ?? null,
    }),
];
