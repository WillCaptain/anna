/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  饼图 — 展示各类别占比关系
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    slices: [
        { label: 'A', value: 34 },
        { label: 'B', value: 24 },
        { label: 'C', value: 19 },
        { label: 'D', value: 14 },
        { label: 'E', value: 9  },
    ],
};

const pieChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const SLICES = d.slices ?? DEFAULT.slices;
    const TOTAL  = SLICES.reduce((s, d) => s + d.value, 0);

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const legendW = W * 0.28;
    const chartW  = W - legendW;
    const cx      = px + chartW / 2;
    const cy      = py + H / 2;
    const r       = Math.min(chartW, H) / 2 - 10;

    context.save();

    let angle = -Math.PI / 2;
    SLICES.forEach(({ value }, i) => {
        const sweep = (value / TOTAL) * Math.PI * 2;
        context.beginPath();
        context.moveTo(cx, cy);
        context.arc(cx, cy, r, angle, angle + sweep);
        context.closePath();
        context.fillStyle   = PALETTE[i % PALETTE.length];
        context.fill();
        context.strokeStyle = fill;
        context.lineWidth   = 1;
        context.stroke();
        angle += sweep;
    });

    const lx    = px + chartW + 4;
    const itemH = H / (SLICES.length + 1);
    context.font = '7.5px sans-serif';
    context.textBaseline = 'middle';
    context.textAlign    = 'left';
    SLICES.forEach(({ label, value }, i) => {
        const ly = py + itemH * (i + 0.8);
        context.fillStyle = PALETTE[i % PALETTE.length];
        context.fillRect(lx, ly - 4, 7, 7);
        context.fillStyle = hexAlpha(stroke, 0.70);
        context.fillText(`${label} ${Math.round(value / TOTAL * 100)}%`, lx + 10, ly);
    });

    context.restore();
});

export const pieChart = makeChart('pieChart', 200, 150, pieChartDrawer, DEFAULT);
