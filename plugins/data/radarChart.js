/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  雷达图 — 多维度能力/属性的蜘蛛网展示
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    axes: ['速度','精度','稳定','创新','效率','质量'],
    series: [
        { values: [0.80, 0.65, 0.90, 0.70, 0.85, 0.75] },
        { values: [0.60, 0.80, 0.55, 0.90, 0.65, 0.88] },
    ],
};

const radarChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const AXES   = d.axes   ?? DEFAULT.axes;
    const SERIES = (d.series ?? DEFAULT.series).map((s, i) => ({
        values: s.values,
        color:  PALETTE[i % PALETTE.length],
    }));
    const N = AXES.length;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const cx = px + W / 2;
    const cy = py + H / 2;
    const r  = Math.min(W, H) / 2 - 18;

    const angle = (i) => -Math.PI / 2 + (Math.PI * 2 / N) * i;
    const point = (i, ratio) => [
        cx + Math.cos(angle(i)) * r * ratio,
        cy + Math.sin(angle(i)) * r * ratio,
    ];

    context.save();

    for (let ring = 1; ring <= 4; ring++) {
        const ratio = ring / 4;
        context.beginPath();
        for (let i = 0; i < N; i++) {
            const [x, y] = point(i, ratio);
            i === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
        }
        context.closePath();
        context.strokeStyle = hexAlpha(stroke, 0.14);
        context.lineWidth   = 0.5;
        context.stroke();
    }

    for (let i = 0; i < N; i++) {
        const [x, y] = point(i, 1);
        context.strokeStyle = hexAlpha(stroke, 0.18);
        context.lineWidth   = 0.5;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(x, y);
        context.stroke();
    }

    SERIES.forEach(({ values, color }) => {
        context.beginPath();
        values.forEach((v, i) => {
            const [x, y] = point(i, v);
            i === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
        });
        context.closePath();
        context.fillStyle   = hexAlpha(color, 0.18);
        context.fill();
        context.strokeStyle = color;
        context.lineWidth   = 1.5;
        context.stroke();

        context.fillStyle = color;
        values.forEach((v, i) => {
            const [x, y] = point(i, v);
            context.beginPath();
            context.arc(x, y, 2.5, 0, Math.PI * 2);
            context.fill();
        });
    });

    context.font         = '7px sans-serif';
    context.textBaseline = 'middle';
    context.fillStyle    = hexAlpha(stroke, 0.60);
    for (let i = 0; i < N; i++) {
        const [x, y] = point(i, 1.22);
        const a = angle(i);
        context.textAlign = Math.cos(a) > 0.1 ? 'left' : Math.cos(a) < -0.1 ? 'right' : 'center';
        context.fillText(AXES[i] ?? '', x, y);
    }

    context.restore();
});

export const radarChart = makeChart('radarChart', 200, 180, radarChartDrawer, DEFAULT);
