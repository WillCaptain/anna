/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  条形图（水平） — 横向条形，适合长标签分类对比
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    items: [
        { label: '北京', value: 88 },
        { label: '上海', value: 75 },
        { label: '广州', value: 63 },
        { label: '成都', value: 54 },
        { label: '武汉', value: 42 },
    ],
    max: 100,
};

const hbarChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d     = parseChartData(shape, DEFAULT);
    const DATA  = d.items ?? DEFAULT.items;
    const MAX   = d.max   ?? 100;

    const PAD   = { top: 10, right: 12, bottom: 10, left: 36 };
    const plotX = px + PAD.left;
    const plotY = py + PAD.top;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;
    const n     = DATA.length;
    const gap   = plotH * 0.12 / (n + 1);
    const barH  = (plotH - gap * (n + 1)) / n;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    context.strokeStyle = hexAlpha(stroke, 0.10);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gx = plotX + plotW * (i / 4);
        context.beginPath(); context.moveTo(gx, plotY); context.lineTo(gx, plotY + plotH); context.stroke();
    }

    DATA.forEach(({ label, value }, i) => {
        const barW = (value / MAX) * plotW;
        const by   = plotY + gap * (i + 1) + barH * i;
        context.fillStyle = PALETTE[i % PALETTE.length];
        context.beginPath();
        context.roundRect(plotX, by, barW, barH, [0, 2, 2, 0]);
        context.fill();

        context.fillStyle    = hexAlpha(stroke, 0.60);
        context.font         = '7px sans-serif';
        context.textBaseline = 'middle';
        context.textAlign    = 'left';
        context.fillText(value, plotX + barW + 3, by + barH / 2);
    });

    context.strokeStyle = hexAlpha(stroke, 0.40);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY); context.lineTo(plotX, plotY + plotH); context.stroke();

    context.fillStyle    = hexAlpha(stroke, 0.60);
    context.font         = '8px sans-serif';
    context.textAlign    = 'right';
    context.textBaseline = 'middle';
    DATA.forEach(({ label }, i) => {
        const cy = plotY + gap * (i + 1) + barH * i + barH / 2;
        context.fillText(label, plotX - 4, cy);
    });

    context.restore();
});

export const hbarChart = makeChart('hbarChart', 220, 150, hbarChartDrawer, DEFAULT);
