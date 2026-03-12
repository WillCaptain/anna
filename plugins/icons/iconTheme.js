/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  图标渲染主题状态
 *  whiteboard.js 切换主题时更新 iconTheme.mode，
 *  所有图标在下次绘制时自动使用新风格。
 *--------------------------------------------------------------------------------------------*/

/**
 * 全局图标渲染模式。
 *   'flat'         — 默认，使用形状的 backColor / borderColor（灰色系）
 *   'colorful'     — 彩色，每种图标使用预定义语义色，覆盖 shape 本身颜色
 *   'skeuomorphic' — 拟物，使用形状颜色 + 渐变叠加模拟立体光照
 */
export const iconTheme = {
    mode: 'flat',
};

// ─── 彩色主题语义色表 ──────────────────────────────────────────────────────────
const COLORFUL = {
    // ── 安全 / security ───────────────────────────────────────────────────────
    key:          { fill: '#f59e0b', stroke: '#b45309' },
    padlock:      { fill: '#6366f1', stroke: '#4338ca' },
    padlockOpen:  { fill: '#f59e0b', stroke: '#b45309' },
    vault:        { fill: '#475569', stroke: '#1e293b' },
    shield:       { fill: '#3b82f6', stroke: '#1d4ed8' },
    gavel:        { fill: '#8b5cf6', stroke: '#6d28d9' },
    scales:       { fill: '#6366f1', stroke: '#4338ca' },
    handcuffs:    { fill: '#64748b', stroke: '#334155' },
    prisonBars:   { fill: '#64748b', stroke: '#334155' },
    policeLamp:   { fill: '#ef4444', stroke: '#b91c1c' },
    fingerprint:  { fill: '#06b6d4', stroke: '#0e7490' },
    badge:        { fill: '#6366f1', stroke: '#4338ca' },
    camera:       { fill: '#0ea5e9', stroke: '#0369a1' },
    cctv:         { fill: '#0ea5e9', stroke: '#0369a1' },
    streetLight:  { fill: '#f59e0b', stroke: '#b45309' },
    alarm:        { fill: '#ef4444', stroke: '#b91c1c' },
    // ── 符号 / symbols ────────────────────────────────────────────────────────
    symbolMale:   { fill: '#3b82f6', stroke: '#1d4ed8' },
    symbolFemale: { fill: '#ec4899', stroke: '#be185d' },
    droplet:      { fill: '#38bdf8', stroke: '#0284c7' },
    heart:        { fill: '#f43f5e', stroke: '#be123c' },
    thumbsUp:     { fill: '#10b981', stroke: '#047857' },
    thumbsDown:   { fill: '#ef4444', stroke: '#b91c1c' },
    cursorPointer:{ fill: '#8b5cf6', stroke: '#6d28d9' },
    info:         { fill: '#3b82f6', stroke: '#1d4ed8' },
    warning:      { fill: '#f59e0b', stroke: '#b45309' },
    error:        { fill: '#ef4444', stroke: '#b91c1c' },
    question:     { fill: '#8b5cf6', stroke: '#6d28d9' },
    forbidden:    { fill: '#ef4444', stroke: '#b91c1c' },
    sparkle:      { fill: '#fbbf24', stroke: '#d97706' },
    radioactive:  { fill: '#84cc16', stroke: '#4d7c0f' },
    recycle:      { fill: '#10b981', stroke: '#047857' },
    infinity:     { fill: '#6366f1', stroke: '#4338ca' },
    questionMark: { fill: '#8b5cf6', stroke: '#6d28d9' },
    exclamation:  { fill: '#f59e0b', stroke: '#b45309' },
    checkCircle:  { fill: '#10b981', stroke: '#047857' },
    xCircle:      { fill: '#ef4444', stroke: '#b91c1c' },
    star:         { fill: '#fbbf24', stroke: '#d97706' },
    wifi:         { fill: '#0ea5e9', stroke: '#0369a1' },
    bluetooth:    { fill: '#3b82f6', stroke: '#1d4ed8' },
    copyright:    { fill: '#64748b', stroke: '#334155' },
    trademark:    { fill: '#64748b', stroke: '#334155' },
    registered:   { fill: '#64748b', stroke: '#334155' },
    biohazard:    { fill: '#84cc16', stroke: '#4d7c0f' },
    peace:        { fill: '#10b981', stroke: '#047857' },
    // ── 车辆 / vehicles ───────────────────────────────────────────────────────
    car:          { fill: '#3b82f6', stroke: '#1d4ed8' },
    truck:        { fill: '#64748b', stroke: '#334155' },
    bus:          { fill: '#f59e0b', stroke: '#b45309' },
    bicycle:      { fill: '#10b981', stroke: '#047857' },
    motorcycle:   { fill: '#ef4444', stroke: '#b91c1c' },
    airplane:     { fill: '#6366f1', stroke: '#4338ca' },
    helicopter:   { fill: '#0ea5e9', stroke: '#0369a1' },
    ship:         { fill: '#0369a1', stroke: '#075985' },
    train:        { fill: '#6366f1', stroke: '#4338ca' },
    rocket:       { fill: '#f97316', stroke: '#c2410c' },
    submarine:    { fill: '#0369a1', stroke: '#075985' },
    ambulance:    { fill: '#ef4444', stroke: '#b91c1c' },
    fireEngine:   { fill: '#ef4444', stroke: '#b91c1c' },
    tractor:      { fill: '#84cc16', stroke: '#4d7c0f' },
    sailboat:     { fill: '#38bdf8', stroke: '#0284c7' },
    taxi:         { fill: '#fbbf24', stroke: '#d97706' },
    scooter:      { fill: '#10b981', stroke: '#047857' },
    drone:        { fill: '#8b5cf6', stroke: '#6d28d9' },
    forklift:     { fill: '#f59e0b', stroke: '#b45309' },
    tank:         { fill: '#65a30d', stroke: '#3f6212' },
    // ── 虫子 / insects ────────────────────────────────────────────────────────
    butterfly:    { fill: '#d946ef', stroke: '#a21caf' },
    bee:          { fill: '#f59e0b', stroke: '#b45309' },
    ant:          { fill: '#ef4444', stroke: '#b91c1c' },
    beetle:       { fill: '#16a34a', stroke: '#14532d' },
    ladybug:      { fill: '#ef4444', stroke: '#b91c1c' },
    spider:       { fill: '#64748b', stroke: '#1e293b' },
    dragonfly:    { fill: '#06b6d4', stroke: '#0e7490' },
    mosquito:     { fill: '#84cc16', stroke: '#4d7c0f' },
    caterpillar:  { fill: '#10b981', stroke: '#047857' },
    snail:        { fill: '#d97706', stroke: '#92400e' },
};

/**
 * 根据当前 iconTheme.mode 解析图标的 fill / stroke。
 * @param {string} type   — shape.type（图标类型）
 * @param {string} fill   — shape.getBackColor()
 * @param {string} stroke — shape.getBorderColor()
 * @returns {{ fill: string, stroke: string }}
 */
export const resolveIconColors = (type, fill, stroke) => {
    if (iconTheme.mode === 'colorful') {
        const c = COLORFUL[type];
        if (c) return { fill: c.fill, stroke: c.stroke };
    }
    return { fill, stroke };
};
