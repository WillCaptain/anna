/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  面积图 — 渐变填充面积，强调数量随时间的累积变化
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    series: [
        { data: [20, 45, 38, 62, 55, 78, 70, 88] },
        { data: [35, 28, 50, 40, 65, 48, 72, 60] },
    ],
    max: 100,
};

const areaChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
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
    const baseY = plotY + plotH;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    context.strokeStyle = hexAlpha(stroke, 0.10);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gy = plotY + plotH * (1 - i / 4);
        context.beginPath();
        context.moveTo(plotX, gy);
        context.lineTo(plotX + plotW, gy);
        context.stroke();
    }

    context.strokeStyle = hexAlpha(stroke, 0.35);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY);
    context.lineTo(plotX, baseY);
    context.lineTo(plotX + plotW, baseY);
    context.stroke();

    [...SERIES].reverse().forEach(({ data, color }) => {
        const pts = data.map((v, i) => [plotX + stepX * i, plotY + plotH * (1 - v / MAX)]);

        const grad = context.createLinearGradient(0, plotY, 0, baseY);
        grad.addColorStop(0,   hexAlpha(color, 0.50));
        grad.addColorStop(0.7, hexAlpha(color, 0.08));
        grad.addColorStop(1,   hexAlpha(color, 0.00));

        context.beginPath();
        context.moveTo(pts[0][0], baseY);
        pts.forEach(([x, y]) => context.lineTo(x, y));
        context.lineTo(pts[pts.length - 1][0], baseY);
        context.closePath();
        context.fillStyle = grad;
        context.fill();

        context.strokeStyle = color;
        context.lineWidth   = 1.8;
        context.beginPath();
        pts.forEach(([x, y], i) => i === 0 ? context.moveTo(x, y) : context.lineTo(x, y));
        context.stroke();
    });

    context.restore();
});

export const areaChart = makeChart('areaChart', 220, 150, areaChartDrawer, DEFAULT);
