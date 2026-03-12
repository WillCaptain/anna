/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  数据表格 — 带表头的网格，展示结构化数据
 *--------------------------------------------------------------------------------------------*/

import {makeChartDrawer, makeChart, drawCard, hexAlpha, parseChartData} from './_chartBase.js';

const DEFAULT = {
    cols: ['名称', '数值', '占比'],
    rows: [
        ['产品 A', '1,240', '42%'],
        ['产品 B', '940',   '32%'],
        ['产品 C', '770',   '26%'],
    ],
};

const tableDrawer = makeChartDrawer((context, px, py, W, H, fill, stroke, bw, shape) => {
    const d    = parseChartData(shape, DEFAULT);
    const COLS = d.cols ?? DEFAULT.cols;
    const ROWS = d.rows ?? DEFAULT.rows;

    const PAD   = 8;
    const inner = { x: px + PAD, y: py + PAD, w: W - PAD * 2, h: H - PAD * 2 };

    drawCard(context, px, py, W, H, fill, stroke, bw);

    const totalRows = ROWS.length + 1;
    const rowH      = inner.h / totalRows;
    const colW      = inner.w / COLS.length;

    context.save();
    context.font         = 'bold 9px sans-serif';
    context.textBaseline = 'middle';

    // header row
    context.fillStyle = hexAlpha(stroke, 0.18);
    context.fillRect(inner.x, inner.y, inner.w, rowH);
    context.fillStyle = stroke;
    COLS.forEach((col, c) => {
        context.textAlign = c === 0 ? 'left' : 'right';
        const tx = c === 0 ? inner.x + 4 : inner.x + colW * (c + 1) - 4;
        context.fillText(col, tx, inner.y + rowH / 2);
    });

    // data rows
    context.font = '8px sans-serif';
    ROWS.forEach((row, r) => {
        const ry = inner.y + rowH * (r + 1);
        if (r % 2 === 1) {
            context.fillStyle = hexAlpha(stroke, 0.06);
            context.fillRect(inner.x, ry, inner.w, rowH);
        }
        context.fillStyle = stroke;
        row.forEach((cell, c) => {
            context.textAlign = c === 0 ? 'left' : 'right';
            const tx = c === 0 ? inner.x + 4 : inner.x + colW * (c + 1) - 4;
            context.fillText(String(cell ?? ''), tx, ry + rowH / 2);
        });
    });

    // grid lines
    context.strokeStyle = hexAlpha(stroke, 0.20);
    context.lineWidth   = 0.5;
    for (let r = 1; r <= totalRows - 1; r++) {
        const ly = inner.y + rowH * r;
        context.beginPath(); context.moveTo(inner.x, ly); context.lineTo(inner.x + inner.w, ly); context.stroke();
    }
    for (let c = 1; c < COLS.length; c++) {
        const lx = inner.x + colW * c;
        context.beginPath(); context.moveTo(lx, inner.y); context.lineTo(lx, inner.y + inner.h); context.stroke();
    }

    context.restore();
});

export const table = makeChart('table', 210, 130, tableDrawer, DEFAULT);
