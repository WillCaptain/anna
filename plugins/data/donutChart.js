/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  环形图 — 饼图变体，中心空白区域可放置关键指标
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    segments: [
        { label: '渠道 A', value: 38 },
        { label: '渠道 B', value: 27 },
        { label: '渠道 C', value: 20 },
        { label: '渠道 D', value: 15 },
    ],
};
const HOLE = 0.52;

const donutChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d        = parseChartData(shape, DEFAULT);
    const SEGMENTS = d.segments ?? DEFAULT.segments;
    const TOTAL    = SEGMENTS.reduce((s, d) => s + d.value, 0);

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const legendW = W * 0.30;
    const chartW  = W - legendW;
    const cx      = px + chartW / 2;
    const cy      = py + H / 2;
    const outerR  = Math.min(chartW, H) / 2 - 8;
    const innerR  = outerR * HOLE;

    context.save();

    let angle = -Math.PI / 2;
    SEGMENTS.forEach(({ value }, i) => {
        const sweep = (value / TOTAL) * Math.PI * 2;
        context.beginPath();
        context.arc(cx, cy, outerR, angle, angle + sweep);
        context.arc(cx, cy, innerR, angle + sweep, angle, true);
        context.closePath();
        context.fillStyle   = PALETTE[i % PALETTE.length];
        context.fill();
        context.strokeStyle = fill;
        context.lineWidth   = 1.2;
        context.stroke();
        angle += sweep;
    });

    context.textAlign    = 'center';
    context.textBaseline = 'middle';
    context.fillStyle    = hexAlpha(stroke, 0.80);
    context.font         = `bold ${Math.round(innerR * 0.48)}px sans-serif`;
    context.fillText('100%', cx, cy - 1);

    const lx    = px + chartW + 4;
    const itemH = H / (SEGMENTS.length + 1);
    context.font = '7.5px sans-serif';
    context.textBaseline = 'middle';
    context.textAlign    = 'left';
    SEGMENTS.forEach(({ label, value }, i) => {
        const ly = py + itemH * (i + 0.8);
        context.fillStyle = PALETTE[i % PALETTE.length];
        context.fillRect(lx, ly - 3.5, 7, 7);
        context.fillStyle = hexAlpha(stroke, 0.70);
        context.fillText(`${Math.round(value / TOTAL * 100)}%`, lx + 10, ly);
    });

    context.restore();
});

export const donutChart = makeChart('donutChart', 200, 150, donutChartDrawer, DEFAULT);
