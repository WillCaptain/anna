/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  折线图 — 双系列折线图，展示趋势变化
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    series: [
        { data: [30, 55, 42, 68, 52, 74, 60] },
        { data: [50, 35, 62, 48, 70, 55, 82] },
    ],
    max: 100,
};

const lineChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const SERIES = (d.series ?? DEFAULT.series).map((s, i) => ({
        data:  s.data,
        color: PALETTE[i % PALETTE.length],
    }));
    const MAX = d.max ?? 100;

    const PAD   = { top: 12, right: 10, bottom: 18, left: 14 };
    const plotX = px + PAD.left;
    const plotY = py + PAD.top;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const n     = SERIES[0]?.data?.length ?? 1;
    const stepX = n > 1 ? plotW / (n - 1) : plotW;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    // grid
    context.strokeStyle = hexAlpha(stroke, 0.10);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gy = plotY + plotH * (1 - i / 4);
        context.beginPath();
        context.moveTo(plotX, gy);
        context.lineTo(plotX + plotW, gy);
        context.stroke();
    }

    // axes
    context.strokeStyle = hexAlpha(stroke, 0.35);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY);
    context.lineTo(plotX, plotY + plotH);
    context.lineTo(plotX + plotW, plotY + plotH);
    context.stroke();

    // series
    SERIES.forEach(({ data, color }) => {
        const pts = data.map((v, i) => [plotX + stepX * i, plotY + plotH * (1 - v / MAX)]);

        context.beginPath();
        context.moveTo(pts[0][0], plotY + plotH);
        pts.forEach(([x, y]) => context.lineTo(x, y));
        context.lineTo(pts[pts.length - 1][0], plotY + plotH);
        context.closePath();
        context.fillStyle = hexAlpha(color, 0.12);
        context.fill();

        context.strokeStyle = color;
        context.lineWidth   = 1.8;
        context.beginPath();
        pts.forEach(([x, y], i) => i === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
        context.stroke();

        context.fillStyle = color;
        pts.forEach(([x, y]) => {
            context.beginPath();
            context.arc(x, y, 2.5, 0, Math.PI * 2);
            context.fill();
        });
    });

    context.restore();
});

export const lineChart = makeChart('lineChart', 220, 150, lineChartDrawer, DEFAULT);
