/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  漏斗图 — 展示流程各阶段的转化/留存比例
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, PALETTE, parseChartData} from './_chartBase.js';

const DEFAULT = {
    stages: [
        { label: '访问',  value: 100 },
        { label: '注册',  value:  72 },
        { label: '激活',  value:  48 },
        { label: '付费',  value:  24 },
        { label: '复购',  value:  10 },
    ],
};

const funnelChartDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d      = parseChartData(shape, DEFAULT);
    const STAGES = d.stages ?? DEFAULT.stages;

    const PAD    = { top: 10, right: 8, bottom: 10, left: 8 };
    const iw     = W - PAD.left - PAD.right;
    const ih     = H - PAD.top  - PAD.bottom;
    const n      = STAGES.length;
    const segH   = ih / n;
    const maxW   = iw * 0.90;
    const minW   = iw * 0.22;
    const maxVal = STAGES[0]?.value ?? 1;

    drawCard(context, px, py, W, H, fill, stroke, bw);

    context.save();

    STAGES.forEach(({ label, value }, i) => {
        const topW = maxW * (i === 0 ? 1 : (STAGES[i - 1].value / maxVal));
        const botW = Math.max(minW, maxW * (value / maxVal));
        const y0   = py + PAD.top + segH * i;
        const y1   = y0 + segH;
        const cx   = px + PAD.left + iw / 2;
        const gapY = 1.5;

        context.beginPath();
        context.moveTo(cx - topW / 2, y0 + gapY);
        context.lineTo(cx + topW / 2, y0 + gapY);
        context.lineTo(cx + botW / 2, y1 - gapY);
        context.lineTo(cx - botW / 2, y1 - gapY);
        context.closePath();
        context.fillStyle = PALETTE[i % PALETTE.length];
        context.fill();

        const midY = (y0 + y1) / 2;
        const midW = (botW + topW) / 2;
        context.fillStyle    = 'rgba(255,255,255,0.92)';
        context.font         = '7.5px sans-serif';
        context.textAlign    = 'center';
        context.textBaseline = 'middle';
        if (midW > 28) context.fillText(`${label} ${value}%`, cx, midY);
    });

    context.restore();
});

export const funnelChart = makeChart('funnelChart', 160, 200, funnelChartDrawer, DEFAULT);
