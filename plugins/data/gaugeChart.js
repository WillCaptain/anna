/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  仪表盘 — 半圆弧刻度盘，展示单一 KPI 值
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, hexAlpha, parseChartData} from './_chartBase.js';

// Semantic zone colors — intentionally fixed (not PALETTE)
const ZONES = [
    { from: 0.00, to: 0.33, color: '#ef5350' }, // danger
    { from: 0.33, to: 0.66, color: '#ffb74d' }, // warning
    { from: 0.66, to: 1.00, color: '#81c784' }, // good
];
const DEFAULT = { value: 0.68 };
const SWEEP = Math.PI;

const gaugeChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d     = parseChartData(shape, DEFAULT);
    const VALUE = Math.min(1, Math.max(0, d.value ?? 0.68));

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const cx    = px + W / 2;
    const cy    = py + H * 0.70;
    const outerR = Math.min(W / 2 - 10, H * 0.68);
    const trackW = outerR * 0.26;
    const innerR = outerR - trackW;

    context.save();

    context.beginPath();
    context.arc(cx, cy, outerR, Math.PI, 0, false);
    context.arc(cx, cy, innerR, 0, Math.PI, true);
    context.closePath();
    context.fillStyle = hexAlpha(stroke, 0.10);
    context.fill();

    ZONES.forEach(({ from, to, color }) => {
        const a0 = Math.PI + from * SWEEP;
        const a1 = Math.PI + to   * SWEEP;
        context.beginPath();
        context.arc(cx, cy, outerR, a0, a1, false);
        context.arc(cx, cy, innerR, a1, a0, true);
        context.closePath();
        context.fillStyle = color;
        context.fill();
    });

    const needleA = Math.PI + VALUE * SWEEP;
    const needleR = outerR * 0.92;
    const pivotR  = trackW * 0.48;

    context.save();
    context.translate(cx, cy);
    context.rotate(needleA);
    context.fillStyle = hexAlpha(stroke, 0.85);
    context.beginPath();
    context.moveTo(needleR, 0);
    context.lineTo(-pivotR * 0.6,  pivotR * 0.4);
    context.lineTo(-pivotR * 0.6, -pivotR * 0.4);
    context.closePath();
    context.fill();
    context.restore();

    context.beginPath();
    context.arc(cx, cy, pivotR * 0.9, 0, Math.PI * 2);
    context.fillStyle   = hexAlpha(stroke, 0.70);
    context.fill();

    context.textAlign    = 'center';
    context.textBaseline = 'top';
    context.fillStyle    = hexAlpha(stroke, 0.85);
    context.font         = `bold ${Math.round(outerR * 0.28)}px sans-serif`;
    context.fillText(`${Math.round(VALUE * 100)}%`, cx, cy + pivotR + 3);

    context.font         = '7px sans-serif';
    context.fillStyle    = hexAlpha(stroke, 0.45);
    context.textBaseline = 'middle';
    const tickR = outerR + 8;
    context.textAlign = 'center';
    context.fillText('0',   cx - tickR, cy + 2);
    context.fillText('100', cx + tickR, cy + 2);

    context.restore();
});

export const gaugeChart = makeChart('gaugeChart', 220, 150, gaugeChartDrawer, DEFAULT);
