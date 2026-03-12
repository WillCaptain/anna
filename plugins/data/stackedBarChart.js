/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  堆叠柱状图 — 展示各分组内多系列的组成与总量
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    groups:  ['Q1','Q2','Q3','Q4'],
    series:  [
        { label: '产品线A', values: [30, 40, 25, 35] },
        { label: '产品线B', values: [25, 20, 35, 28] },
        { label: '产品线C', values: [15, 22, 18, 20] },
    ],
    max: 100,
};

const stackedBarChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const GROUPS = d.groups ?? DEFAULT.groups;
    const SERIES = (d.series ?? DEFAULT.series).map((s, i) => ({
        ...s, color: PALETTE[i % PALETTE.length],
    }));
    const MAX = d.max ?? 100;

    const PAD   = { top: 12, right: 10, bottom: 22, left: 14 };
    const plotX = px + PAD.left;
    const plotY = py + PAD.top;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;
    const n     = GROUPS.length;
    const gap   = plotW * 0.12 / (n + 1);
    const barW  = (plotW - gap * (n + 1)) / n;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    context.strokeStyle = hexAlpha(stroke, 0.10);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gy = plotY + plotH * (1 - i / 4);
        context.beginPath();
        context.moveTo(plotX, gy); context.lineTo(plotX + plotW, gy); context.stroke();
    }

    for (let gi = 0; gi < n; gi++) {
        const bx = plotX + gap * (gi + 1) + barW * gi;
        let stackY = plotY + plotH;

        SERIES.forEach(({ values, color }, si) => {
            const segH = (values[gi] / MAX) * plotH;
            stackY -= segH;
            context.fillStyle = color;
            context.beginPath();
            if (si === SERIES.length - 1) {
                context.roundRect(bx, stackY, barW, segH, [2, 2, 0, 0]);
            } else {
                context.rect(bx, stackY, barW, segH);
            }
            context.fill();
            context.strokeStyle = hexAlpha(fill, 0.50);
            context.lineWidth   = 0.5;
            context.beginPath();
            context.moveTo(bx, stackY + segH); context.lineTo(bx + barW, stackY + segH); context.stroke();
        });
    }

    context.strokeStyle = hexAlpha(stroke, 0.40);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY + plotH); context.lineTo(plotX + plotW, plotY + plotH); context.stroke();

    context.fillStyle    = hexAlpha(stroke, 0.55);
    context.font         = '7.5px sans-serif';
    context.textAlign    = 'center';
    context.textBaseline = 'top';
    for (let gi = 0; gi < n; gi++) {
        const cx = plotX + gap * (gi + 1) + barW * gi + barW / 2;
        context.fillText(GROUPS[gi] ?? '', cx, plotY + plotH + 4);
    }

    const step = plotW / SERIES.length;
    context.font  = '6.5px sans-serif';
    SERIES.forEach(({ label, color }, i) => {
        const lx = plotX + step * i;
        const ly = py + H - PAD.bottom + 12;
        context.fillStyle = color;
        context.fillRect(lx, ly, 7, 7);
        context.fillStyle = hexAlpha(stroke, 0.55);
        context.textAlign = 'left';
        context.fillText(label, lx + 9, ly + 3.5);
    });

    context.restore();
});

export const stackedBarChart = makeChart('stackedBarChart', 220, 160, stackedBarChartDrawer, DEFAULT);
