/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  柱状图 — 垂直分组柱状图，展示分类数据对比
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = { labels: ['一月','二月','三月','四月','五月','六月'], values: [65,82,48,91,57,74], max: 100 };

const barChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const DATA   = d.values  ?? DEFAULT.values;
    const LABELS = d.labels  ?? DEFAULT.labels;
    const MAX    = d.max     ?? 100;

    const PAD  = { top: 12, right: 10, bottom: 20, left: 14 };
    const plotX = px + PAD.left;
    const plotY = py + PAD.top;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const n     = DATA.length;
    const gap   = plotW * 0.12 / (n + 1);
    const barW  = (plotW - gap * (n + 1)) / n;

    context.save();

    // subtle horizontal grid lines
    context.strokeStyle = hexAlpha(stroke, 0.12);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gy = plotY + plotH * (1 - i / 4);
        context.beginPath();
        context.moveTo(plotX, gy);
        context.lineTo(plotX + plotW, gy);
        context.stroke();
    }

    // bars
    DATA.forEach((val, i) => {
        const barH = (val / MAX) * plotH;
        const bx   = plotX + gap * (i + 1) + barW * i;
        const by   = plotY + plotH - barH;
        context.fillStyle = PALETTE[i % PALETTE.length];
        context.beginPath();
        context.roundRect(bx, by, barW, barH, 2);
        context.fill();
    });

    // x-axis
    context.strokeStyle = hexAlpha(stroke, 0.40);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY + plotH);
    context.lineTo(plotX + plotW, plotY + plotH);
    context.stroke();

    // x labels
    context.fillStyle    = hexAlpha(stroke, 0.55);
    context.font         = '7px sans-serif';
    context.textAlign    = 'center';
    context.textBaseline = 'top';
    DATA.forEach((_, i) => {
        const cx = plotX + gap * (i + 1) + barW * i + barW / 2;
        context.fillText(LABELS[i] ?? '', cx, plotY + plotH + 3);
    });

    context.restore();
});

export const barChart = makeChart('barChart', 220, 150, barChartDrawer, DEFAULT);
