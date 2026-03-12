/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  散点图 — 展示两个连续变量之间的相关关系
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    series: [
        { points: [[15,72],[24,55],[32,80],[40,65],[52,70],[60,82],[70,60],[80,75],[88,55],[44,88]] },
        { points: [[10,40],[22,30],[35,50],[48,42],[55,60],[65,38],[72,52],[84,44],[90,35],[30,65]] },
    ],
};

const scatterChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const SERIES = (d.series ?? DEFAULT.series).map((s, i) => ({
        points: s.points,
        color:  PALETTE[i % PALETTE.length],
    }));

    const PAD   = { top: 12, right: 12, bottom: 18, left: 16 };
    const plotX = px + PAD.left;
    const plotY = py + PAD.top;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const toX = v => plotX + (v / 100) * plotW;
    const toY = v => plotY + plotH * (1 - v / 100);

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    context.strokeStyle = hexAlpha(stroke, 0.10);
    context.lineWidth   = 0.5;
    for (let i = 1; i <= 4; i++) {
        const gy = plotY + plotH * (1 - i / 4);
        context.beginPath(); context.moveTo(plotX, gy); context.lineTo(plotX + plotW, gy); context.stroke();
        const gx = plotX + plotW * (i / 4);
        context.beginPath(); context.moveTo(gx, plotY); context.lineTo(gx, plotY + plotH); context.stroke();
    }

    context.strokeStyle = hexAlpha(stroke, 0.40);
    context.lineWidth   = 0.8;
    context.beginPath();
    context.moveTo(plotX, plotY);
    context.lineTo(plotX, plotY + plotH);
    context.lineTo(plotX + plotW, plotY + plotH);
    context.stroke();

    SERIES.forEach(({ color, points }) => {
        points.forEach(([x, y]) => {
            context.beginPath();
            context.arc(toX(x), toY(y), 3, 0, Math.PI * 2);
            context.fillStyle   = hexAlpha(color, 0.85);
            context.fill();
            context.strokeStyle = hexAlpha(color, 0.35);
            context.lineWidth   = 0.8;
            context.stroke();
        });
    });

    context.restore();
});

export const scatterChart = makeChart('scatterChart', 220, 150, scatterChartDrawer, DEFAULT);
