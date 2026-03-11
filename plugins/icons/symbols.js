/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  分类：标志与符号
 *  图标：symbolMale, symbolFemale, droplet, heart, thumbsUp, thumbsDown,
 *        cursorPointer, info, warning, error, question, forbidden,
 *        sparkle, radioactive, recycle, infinity,
 *        questionMark, exclamation, checkCircle, xCircle,
 *        star, wifi, bluetooth, copyright, trademark, registered,
 *        biohazard, peace
 *--------------------------------------------------------------------------------------------*/

import {makeIconDrawer, makeIcon} from './_iconBase.js';

// ── 公共小工具 ────────────────────────────────────────────────────────────────

/** 在 (tx, ty) 处绘制朝向 angle 的填充三角箭头 */
function arrowHead(ctx, tx, ty, angle, size) {
    const c = Math.cos(angle), s = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - c * size + s * size * 0.5, ty - s * size - c * size * 0.5);
    ctx.lineTo(tx - c * size - s * size * 0.5, ty - s * size + c * size * 0.5);
    ctx.closePath();
    ctx.fill();
}

// ── 男标志 (♂) ───────────────────────────────────────────────────────────────
// 圆圈（左下）+ 斜向右上箭头 + 两条小挡针构成箭头端
const symbolMaleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const r   = Math.min(W, H) * 0.30;
    const cx  = px + W * 0.38;
    const cy  = py + H * 0.62;

    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.stroke();

    const ang   = -Math.PI / 4;
    const tipX  = px + W * 0.90;
    const tipY  = py + H * 0.10;
    const baseX = cx + r * Math.cos(ang);
    const baseY = cy + r * Math.sin(ang);

    context.beginPath();
    context.moveTo(baseX, baseY);
    context.lineTo(tipX, tipY);
    context.stroke();

    // arrowHead 用 fill，需显式用描边色填充，否则 backColor 可能透明/白色导致箭头不可见
    context.fillStyle = stroke;
    arrowHead(context, tipX, tipY, ang, Math.max(bw * 2.5, W * 0.06));
});

// ── 女标志 (♀) ───────────────────────────────────────────────────────────────
// 圆圈（上）+ 垂直向下竖线 + 水平横线（十字）
const symbolFemaleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const r    = Math.min(W, H) * 0.30;
    const cx   = px + W * 0.50;
    const cy   = py + H * 0.36;
    const botY = py + H * 0.94;
    const barW = W * 0.28;

    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.moveTo(cx, cy + r);
    context.lineTo(cx, botY);
    context.stroke();

    const barY = cy + r + (botY - cy - r) * 0.52;
    context.beginPath();
    context.moveTo(cx - barW, barY);
    context.lineTo(cx + barW, barY);
    context.stroke();
});

// ── 水滴 (droplet) ────────────────────────────────────────────────────────────
// 上半：两条贝塞尔曲线收成尖顶；下半：正圆弧（半圆），形成标准水滴轮廓
const dropletDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx   = px + W * 0.50;
    const tipY = py + H * 0.06;   // 顶端尖点
    const midY = py + H * 0.58;   // 底部半圆圆心
    const r    = W  * 0.38;       // 半圆半径

    context.beginPath();
    context.moveTo(cx, tipY);
    // 右侧贝塞尔：从尖顶弯曲到半圆右端
    context.bezierCurveTo(cx + W * 0.40, py + H * 0.26, cx + r, midY - H * 0.10, cx + r, midY);
    // 底部半圆：从右 (0) 顺时针到左 (π)，经过最底点
    context.arc(cx, midY, r, 0, Math.PI, false);
    // 左侧贝塞尔：从半圆左端回到尖顶
    context.bezierCurveTo(cx - r, midY - H * 0.10, cx - W * 0.40, py + H * 0.26, cx, tipY);
    context.closePath();
    context.fill();
    context.stroke();
});

// ── 心形 (heart) ──────────────────────────────────────────────────────────────
// 两段贝塞尔曲线拼接成经典心形
const heartDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const tip = py + H * 0.88;  // 底部尖点
    const mid = py + H * 0.38;  // 两乳凸之间凹陷处

    context.beginPath();
    context.moveTo(cx, mid);
    // 右半侧
    context.bezierCurveTo(
        cx + W * 0.04, py + H * 0.22,
        cx + W * 0.46, py + H * 0.12,
        cx + W * 0.46, py + H * 0.38
    );
    context.bezierCurveTo(cx + W * 0.46, py + H * 0.60, cx + W * 0.18, py + H * 0.74, cx, tip);
    // 左半侧（镜像）
    context.bezierCurveTo(cx - W * 0.18, py + H * 0.74, cx - W * 0.46, py + H * 0.60, cx - W * 0.46, py + H * 0.38);
    context.bezierCurveTo(cx - W * 0.46, py + H * 0.12, cx - W * 0.04, py + H * 0.22, cx, mid);
    context.closePath();
    context.fill();
    context.stroke();
});

// ── 赞 (thumbsUp) ────────────────────────────────────────────────────────────
// 拇指（斜向上的圆角矩形）+ 握拳（四格扁矩形）+ 手掌
const thumbsUpDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const fistY = py + H * 0.50;
    const fistH = H * 0.40;
    const fistW = W * 0.58;
    const fistX = px + W * 0.22;
    const bR    = fistH * 0.14;

    // 握拳主体
    context.beginPath();
    context.roundRect(fistX, fistY, fistW, fistH, bR);
    context.fill();
    context.stroke();

    // 四个指节分隔线
    const segW = fistW / 4;
    context.globalAlpha = 0.45;
    for (let i = 1; i < 4; i++) {
        context.beginPath();
        context.moveTo(fistX + segW * i, fistY);
        context.lineTo(fistX + segW * i, fistY + fistH * 0.50);
        context.stroke();
    }
    context.globalAlpha = 1;

    // 拇指（斜向上）
    context.save();
    context.translate(fistX + fistW * 0.14, fistY);
    context.rotate(-Math.PI / 6);
    const tw = fistW * 0.28;
    const th = fistH * 0.72;
    context.beginPath();
    context.roundRect(-tw / 2, -th, tw, th, tw * 0.45);
    context.fill();
    context.stroke();
    context.restore();
});

// ── 踩 (thumbsDown) ──────────────────────────────────────────────────────────
// thumbsUp 翻转版
const thumbsDownDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    context.save();
    context.translate(px + W / 2, py + H / 2);
    context.scale(1, -1);
    context.translate(-px - W / 2, -py - H / 2);

    // 复用 thumbsUp 绘制逻辑
    const fistY = py + H * 0.50;
    const fistH = H * 0.40;
    const fistW = W * 0.58;
    const fistX = px + W * 0.22;
    const bR    = fistH * 0.14;

    context.beginPath();
    context.roundRect(fistX, fistY, fistW, fistH, bR);
    context.fill();
    context.stroke();

    context.globalAlpha = 0.45;
    const segW = fistW / 4;
    for (let i = 1; i < 4; i++) {
        context.beginPath();
        context.moveTo(fistX + segW * i, fistY);
        context.lineTo(fistX + segW * i, fistY + fistH * 0.50);
        context.stroke();
    }
    context.globalAlpha = 1;

    context.save();
    context.translate(fistX + fistW * 0.14, fistY);
    context.rotate(-Math.PI / 6);
    const tw = fistW * 0.28;
    const th = fistH * 0.72;
    context.beginPath();
    context.roundRect(-tw / 2, -th, tw, th, tw * 0.45);
    context.fill();
    context.stroke();
    context.restore();

    context.restore();
});

// ── 手指指向 (cursorPointer) ──────────────────────────────────────────────────
// 食指（高，圆头）+ 3根弯曲手指（短矩形）+ 掌心
const cursorPointerDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const palmX = px + W * 0.14;
    const palmY = py + H * 0.46;
    const palmW = W * 0.72;
    const palmH = H * 0.44;
    const bR    = palmH * 0.14;

    // 掌心
    context.beginPath();
    context.roundRect(palmX, palmY, palmW, palmH, bR);
    context.fill();
    context.stroke();

    // 食指（竖直，靠左）
    const indexW = palmW * 0.22;
    const indexH = H * 0.56;
    const indexX = palmX + palmW * 0.10;
    context.beginPath();
    context.roundRect(indexX, palmY - indexH, indexW, indexH, indexW * 0.5);
    context.fill();
    context.stroke();

    // 中指（次高）
    context.beginPath();
    context.roundRect(indexX + indexW + W * 0.02, palmY - indexH * 0.72, indexW, indexH * 0.72, indexW * 0.5);
    context.fill();
    context.stroke();

    // 无名指（最短）
    context.beginPath();
    context.roundRect(indexX + indexW * 2 + W * 0.04, palmY - indexH * 0.56, indexW, indexH * 0.56, indexW * 0.5);
    context.fill();
    context.stroke();

    // 分隔线
    context.globalAlpha = 0.35;
    for (let i = 1; i < 3; i++) {
        const sx = palmX + palmW * (i * 0.25 + 0.08);
        context.beginPath();
        context.moveTo(sx, palmY);
        context.lineTo(sx, palmY + palmH * 0.45);
        context.stroke();
    }
    context.globalAlpha = 1;
});

// ── Information (info) ────────────────────────────────────────────────────────
// 大圆 + 内部圆点 + 竖线（i）
const infoDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.4, W * 0.055);
    context.lineWidth = lw2;

    // 小圆点（i 的点）
    context.beginPath();
    context.arc(cx, cy - R * 0.36, lw2 * 0.9, 0, Math.PI * 2);
    context.fillStyle = stroke;
    context.fill();

    // 竖线（i 的主体）
    context.strokeStyle = stroke;
    context.beginPath();
    context.moveTo(cx, cy - R * 0.10);
    context.lineTo(cx, cy + R * 0.44);
    context.stroke();

    context.lineWidth = bw;
});

// ── 警告 (warning) ────────────────────────────────────────────────────────────
// 等腰三角形 + 内部感叹号
const warningDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const tip = py + H * 0.04;
    const bot = py + H * 0.96;
    const lX  = px + W * 0.04;
    const rX  = px + W * 0.96;

    context.beginPath();
    context.moveTo(cx, tip);
    context.lineTo(rX, bot);
    context.lineTo(lX, bot);
    context.closePath();
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.3, W * 0.05);
    context.lineWidth = lw2;

    // 感叹号竖线
    context.strokeStyle = stroke;
    context.beginPath();
    context.moveTo(cx, tip + H * 0.26);
    context.lineTo(cx, bot - H * 0.28);
    context.stroke();

    // 感叹号圆点
    context.beginPath();
    context.arc(cx, bot - H * 0.14, lw2 * 0.8, 0, Math.PI * 2);
    context.fillStyle = stroke;
    context.fill();

    context.lineWidth = bw;
});

// ── 错误 (error) ──────────────────────────────────────────────────────────────
// 大圆 + 内部叉（两条对角线）
const errorDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;
    const ir = R * 0.48;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.4, W * 0.06);
    context.lineWidth = lw2;
    context.strokeStyle = stroke;

    context.beginPath();
    context.moveTo(cx - ir, cy - ir);
    context.lineTo(cx + ir, cy + ir);
    context.stroke();
    context.beginPath();
    context.moveTo(cx + ir, cy - ir);
    context.lineTo(cx - ir, cy + ir);
    context.stroke();

    context.lineWidth = bw;
});

// ── 疑问 (question) ───────────────────────────────────────────────────────────
// 大圆 + 内部问号（圆弧+竖线+点）
const questionDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.3, W * 0.055);
    context.lineWidth = lw2;
    context.strokeStyle = stroke;

    const qR = R * 0.32;

    // 问号弧（上半圆 + 竖弧向下）
    context.beginPath();
    context.arc(cx, cy - R * 0.18, qR, Math.PI, Math.PI * 2.0, false);   // 上半圆
    context.arc(cx + qR, cy - R * 0.18, qR, 0, Math.PI * 0.65, false);   // 右侧弯到底
    context.stroke();

    // 竖线段（问号钩延伸）
    const hookEndX = cx + qR * Math.cos(Math.PI * 0.65);
    const hookEndY = cy - R * 0.18 + qR * Math.sin(Math.PI * 0.65);
    context.beginPath();
    context.moveTo(hookEndX, hookEndY);
    context.lineTo(cx, cy + R * 0.10);
    context.stroke();

    // 点
    context.beginPath();
    context.arc(cx, cy + R * 0.36, lw2 * 0.8, 0, Math.PI * 2);
    context.fillStyle = stroke;
    context.fill();

    context.lineWidth = bw;
});

// ── 禁止 (forbidden) ─────────────────────────────────────────────────────────
// 圆形外框 + 左上到右下对角线
const forbiddenDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;
    const lw2 = Math.max(bw * 1.5, W * 0.06);

    context.lineWidth = lw2;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.stroke();

    const a = Math.PI / 4;
    context.beginPath();
    context.moveTo(cx - R * Math.cos(a), cy - R * Math.sin(a));
    context.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    context.stroke();

    context.lineWidth = bw;
});

// ── 火花 (sparkle) ────────────────────────────────────────────────────────────
// 4 条主射线 + 4 条斜向细射线 = 8 线星爆
const sparkleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.50;
    const rL  = Math.min(W, H) * 0.44;  // 主射线长
    const rS  = rL * 0.60;               // 斜射线长
    const lw2 = Math.max(bw * 1.5, W * 0.055);

    context.lineWidth = lw2;

    // 4 条主射线（水平+竖直）
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + rL * Math.cos(a), cy + rL * Math.sin(a));
        context.stroke();
    }

    // 4 条斜射线（45° 偏移）
    context.lineWidth = Math.max(bw, lw2 * 0.65);
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(cx + rS * Math.cos(a), cy + rS * Math.sin(a));
        context.stroke();
    }

    // 中心圆
    context.lineWidth = bw;
    context.beginPath();
    context.arc(cx, cy, rL * 0.14, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 放射性 (radioactive) ──────────────────────────────────────────────────────
// 大圆外框 + 3 个扇形叶片（环形扇区）+ 中心小圆
const radioactiveDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx     = px + W * 0.50;
    const cy     = py + H * 0.50;
    const outerR = Math.min(W, H) * 0.44;
    const innerR = outerR * 0.28;
    const halfA  = Math.PI / 3 * 0.82;  // 每片扇叶半角

    // 外圆框
    context.beginPath();
    context.arc(cx, cy, outerR, 0, Math.PI * 2);
    context.stroke();

    // 3 片扇叶（环形扇区）
    for (let i = 0; i < 3; i++) {
        const mid = (i / 3) * Math.PI * 2 + Math.PI / 6;
        const sa  = mid - halfA;
        const ea  = mid + halfA;

        context.beginPath();
        context.arc(cx, cy, innerR, sa, ea, false);
        context.arc(cx, cy, outerR, ea, sa, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    // 中心小圆（不可辐射区）
    context.beginPath();
    context.arc(cx, cy, innerR * 0.55, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 可循环 (recycle) ──────────────────────────────────────────────────────────
// 三条圆弧（各 60°）+ 每弧末端填充三角箭头
const recycleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W / 2;
    const cy  = py + H / 2;
    const R   = Math.min(W, H) * 0.40;
    const lw2 = Math.max(bw * 1.2, W * 0.055);
    const as  = lw2 * 2.6;  // 箭头尺寸

    context.lineWidth = lw2;

    for (let i = 0; i < 3; i++) {
        context.save();
        context.translate(cx, cy);
        context.rotate(i * Math.PI * 2 / 3);

        const sa = -Math.PI / 3 + 0.24;
        const ea =  Math.PI / 3;

        // 弧线
        context.beginPath();
        context.arc(0, 0, R, sa, ea, false);
        context.stroke();

        // 箭头（在弧末端）
        const tipX  = R * Math.cos(ea);
        const tipY  = R * Math.sin(ea);
        const tang  = { x: -Math.sin(ea), y: Math.cos(ea) };  // 顺时针切线
        const norm  = { x:  Math.cos(ea), y: Math.sin(ea) };  // 外法线

        context.beginPath();
        context.moveTo(tipX, tipY);
        context.lineTo(tipX - tang.x * as + norm.x * as * 0.5, tipY - tang.y * as + norm.y * as * 0.5);
        context.lineTo(tipX - tang.x * as - norm.x * as * 0.5, tipY - tang.y * as - norm.y * as * 0.5);
        context.closePath();
        context.fill();

        context.restore();
    }

    context.lineWidth = bw;
});

// ── 无限 (infinity) ───────────────────────────────────────────────────────────
// 两个相连圆（∞形）使用贝塞尔曲线
const infinityDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy  = py + H * 0.50;
    const cx  = px + W * 0.50;
    const hw  = W * 0.28;   // 半宽
    const r   = H * 0.22;   // 圆弧半径
    const lw2 = Math.max(bw * 1.4, W * 0.055);

    context.lineWidth = lw2;

    // 左圆弧（逆时针小圆，中心在 cx-hw）
    // 右圆弧（顺时针小圆，中心在 cx+hw）
    // 连接成 ∞ 形
    context.beginPath();
    context.moveTo(cx, cy);
    context.bezierCurveTo(cx - hw * 0.4, cy - r * 1.4, cx - hw * 2.0, cy - r * 1.4, cx - hw, cy);
    context.bezierCurveTo(cx - hw * 2.0, cy + r * 1.4, cx - hw * 0.4, cy + r * 1.4, cx, cy);
    context.bezierCurveTo(cx + hw * 0.4, cy - r * 1.4, cx + hw * 2.0, cy - r * 1.4, cx + hw, cy);
    context.bezierCurveTo(cx + hw * 2.0, cy + r * 1.4, cx + hw * 0.4, cy + r * 1.4, cx, cy);
    context.stroke();

    context.lineWidth = bw;
});

// ── 问号 (questionMark) ───────────────────────────────────────────────────────
// 独立大问号（弧 + 竖段 + 圆点）
const questionMarkDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.38;
    const qR  = Math.min(W, H) * 0.30;
    const lw2 = Math.max(bw * 1.6, W * 0.065);

    context.lineWidth = lw2;

    // 问号弧（C形，从左侧绕过顶部到右下角）
    context.beginPath();
    context.arc(cx, cy, qR, Math.PI * 1.05, Math.PI * 1.95, false);  // 左→顶→右
    context.stroke();

    // 右侧向下的弧段（问号钩部分）
    context.beginPath();
    context.arc(cx + qR, cy, qR, Math.PI * 1.95, Math.PI * 0.55, false);
    context.stroke();

    // 连接到竖线
    const hookTipX = cx + qR * (1 + Math.cos(Math.PI * 0.55));
    const hookTipY = cy + qR * Math.sin(Math.PI * 0.55);
    context.beginPath();
    context.moveTo(hookTipX, hookTipY);
    context.lineTo(cx + qR, py + H * 0.72);
    context.stroke();

    // 圆点
    context.lineWidth = bw;
    context.beginPath();
    context.arc(cx + qR * 0.5, py + H * 0.88, lw2 * 0.9, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 感叹号 (exclamation) ─────────────────────────────────────────────────────
// 粗竖矩形 + 底部圆点
const exclamationDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const bw2 = Math.max(bw, W * 0.12);
    const r   = bw2 * 1.1;

    // 竖线
    context.lineWidth = bw2;
    context.beginPath();
    context.moveTo(cx, py + H * 0.06);
    context.lineTo(cx, py + H * 0.68);
    context.stroke();

    // 圆点
    context.lineWidth = bw;
    context.beginPath();
    context.arc(cx, py + H * 0.86, r, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 圆圈勾 (checkCircle) ─────────────────────────────────────────────────────
// 大圆 + 内部 ✓
const checkCircleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.6, W * 0.065);
    context.lineWidth = lw2;
    context.strokeStyle = stroke;

    context.beginPath();
    context.moveTo(cx - R * 0.42, cy + R * 0.02);
    context.lineTo(cx - R * 0.08, cy + R * 0.42);
    context.lineTo(cx + R * 0.44, cy - R * 0.38);
    context.stroke();

    context.lineWidth = bw;
});

// ── 圆圈叉 (xCircle) ─────────────────────────────────────────────────────────
// 大圆 + 内部 ×
const xCircleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;
    const ir = R * 0.44;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    const lw2 = Math.max(bw * 1.5, W * 0.06);
    context.lineWidth = lw2;
    context.strokeStyle = stroke;

    context.beginPath();
    context.moveTo(cx - ir, cy - ir);
    context.lineTo(cx + ir, cy + ir);
    context.stroke();
    context.beginPath();
    context.moveTo(cx + ir, cy - ir);
    context.lineTo(cx - ir, cy + ir);
    context.stroke();

    context.lineWidth = bw;
});

// ── 星星 (star) ───────────────────────────────────────────────────────────────
// 五角星（外顶点 + 内角点交替）
const starDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const rO = Math.min(W, H) * 0.44;
    const rI = rO * 0.42;

    context.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? rO : rI;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.stroke();
});

// ── WiFi 信号 (wifi) ──────────────────────────────────────────────────────────
// 中心圆点 + 3 条弧形（从小到大）
const wifiDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.80;
    const lw2 = Math.max(bw * 1.3, W * 0.055);

    context.lineWidth = lw2;

    // 中心圆点
    context.beginPath();
    context.arc(cx, cy, lw2, 0, Math.PI * 2);
    context.fill();

    // 3 条弧（从下往上，顺时针经过顶部：从 225° 到 315°）
    const sa = Math.PI * 1.25;   // 225°
    const ea = Math.PI * 1.75;   // 315°
    [W * 0.14, W * 0.27, W * 0.42].forEach(r => {
        context.beginPath();
        context.arc(cx, cy, r, sa, ea, false);
        context.stroke();
    });

    context.lineWidth = bw;
});

// ── 蓝牙 (bluetooth) ─────────────────────────────────────────────────────────
// 竖向脊柱 + 上半菱形 + 下半菱形（交叉对角线构成 ᚼ 形）
const bluetoothDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const mcy = py + H * 0.50;   // 中线 y
    const top = py + H * 0.06;
    const bot = py + H * 0.94;
    const hw  = W * 0.24;
    const hh  = H * 0.22;
    const lw2 = Math.max(bw * 1.4, W * 0.055);

    context.lineWidth = lw2;

    // 竖向脊柱
    context.beginPath();
    context.moveTo(cx, top);
    context.lineTo(cx, bot);
    context.stroke();

    // 上半菱形：top → 右上角 → 交叉穿过脊柱到左侧
    context.beginPath();
    context.moveTo(cx,       top);
    context.lineTo(cx + hw,  mcy - hh);
    context.lineTo(cx - hw,  mcy + hh);
    context.stroke();

    // 下半菱形：bot → 右下角 → 交叉穿过脊柱到左侧
    context.beginPath();
    context.moveTo(cx,       bot);
    context.lineTo(cx + hw,  mcy + hh);
    context.lineTo(cx - hw,  mcy - hh);
    context.stroke();

    context.lineWidth = bw;
});

// ── 版权 (copyright ©) ────────────────────────────────────────────────────────
// 大圆 + 内部小 C 弧
const copyrightDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;
    const lw2 = Math.max(bw * 1.5, W * 0.055);

    context.lineWidth = lw2;
    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.stroke();

    // 内部 C 弧（去掉右侧一段）
    const cR = R * 0.56;
    context.beginPath();
    context.arc(cx, cy, cR, Math.PI * 0.30, Math.PI * 1.70, false);
    context.stroke();

    context.lineWidth = bw;
});

// ── 商标 (trademark ™) ────────────────────────────────────────────────────────
// T 字 + M 字（并排）
const trademarkDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const lw2 = Math.max(bw * 1.6, W * 0.065);
    context.lineWidth = lw2;

    const topY = py + H * 0.24;
    const botY = py + H * 0.76;
    const midY = py + H * 0.50;

    // T（左侧）
    const tCx = px + W * 0.28;
    const tHW = W * 0.17;
    context.beginPath();
    context.moveTo(tCx - tHW, topY);
    context.lineTo(tCx + tHW, topY);
    context.stroke();
    context.beginPath();
    context.moveTo(tCx, topY);
    context.lineTo(tCx, botY);
    context.stroke();

    // M（右侧）
    const mL = px + W * 0.52;
    const mR = px + W * 0.92;
    const mW = mR - mL;
    context.beginPath();
    context.moveTo(mL, botY);
    context.lineTo(mL, topY);
    context.lineTo(mL + mW * 0.5, midY);
    context.lineTo(mR, topY);
    context.lineTo(mR, botY);
    context.stroke();

    context.lineWidth = bw;
});

// ── 注册商标 (registered ®) ──────────────────────────────────────────────────
// 大圆 + 内部 R 字形
const registeredDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;
    const cy = py + H * 0.50;
    const R  = Math.min(W, H) * 0.44;
    const lw2 = Math.max(bw * 1.5, W * 0.055);

    context.lineWidth = lw2;

    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.stroke();

    // R 字形
    const rL  = cx - R * 0.30;
    const rT  = cy - R * 0.46;
    const rB  = cy + R * 0.46;
    const rMY = cy - R * 0.06;

    // 竖线
    context.beginPath();
    context.moveTo(rL, rT);
    context.lineTo(rL, rB);
    context.stroke();

    // 上半圆弧（P 字）
    context.beginPath();
    context.arc(rL + R * 0.26, rT + R * 0.22, R * 0.26, Math.PI * 1.5, Math.PI * 0.5, false);
    context.stroke();

    // 斜腿（R 的右下斜线）
    context.beginPath();
    context.moveTo(rL + R * 0.26, rMY);
    context.lineTo(rL + R * 0.58, rB);
    context.stroke();

    context.lineWidth = bw;
});

// ── 生化危险 (biohazard) ─────────────────────────────────────────────────────
// 大外圆 + 三个偏心圆（叶片）+ 中心实心小圆
const biohazardDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx       = px + W * 0.50;
    const cy       = py + H * 0.50;
    const outerR   = Math.min(W, H) * 0.44;
    const lobeR    = outerR * 0.52;
    const lobeOff  = outerR * 0.36;
    const lw2      = Math.max(bw * 1.3, W * 0.05);

    context.lineWidth = lw2;

    // 外圆
    context.beginPath();
    context.arc(cx, cy, outerR, 0, Math.PI * 2);
    context.stroke();

    // 3 个叶片圆（120° 间隔）
    for (let i = 0; i < 3; i++) {
        const a    = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const lcx  = cx + lobeOff * Math.cos(a);
        const lcy  = cy + lobeOff * Math.sin(a);
        context.beginPath();
        context.arc(lcx, lcy, lobeR, 0, Math.PI * 2);
        context.stroke();
    }

    // 中心实心圆
    context.lineWidth = bw;
    context.beginPath();
    context.arc(cx, cy, outerR * 0.15, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 和平 (peace) ──────────────────────────────────────────────────────────────
// 大圆 + 内部和平符号（竖线 + 两条向下斜线 = ☮ 形）
const peaceDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.50;
    const R   = Math.min(W, H) * 0.44;
    const lw2 = Math.max(bw * 1.4, W * 0.055);

    context.lineWidth = lw2;

    // 大圆
    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.stroke();

    // 竖线（从顶到底）
    context.beginPath();
    context.moveTo(cx, cy - R);
    context.lineTo(cx, cy + R);
    context.stroke();

    // 左下斜线（从中心到左下圆边）
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + R * Math.cos(Math.PI * 7 / 6), cy + R * Math.sin(Math.PI * 7 / 6));
    context.stroke();

    // 右下斜线（从中心到右下圆边）
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + R * Math.cos(Math.PI * 11 / 6), cy + R * Math.sin(Math.PI * 11 / 6));
    context.stroke();

    context.lineWidth = bw;
});

// ── 导出 ──────────────────────────────────────────────────────────────────────
export const symbolMale     = makeIcon('symbolMale',     90, 90,  symbolMaleDrawer);
export const symbolFemale   = makeIcon('symbolFemale',   80, 100, symbolFemaleDrawer);
export const droplet        = makeIcon('droplet',        80, 100, dropletDrawer);
export const heart          = makeIcon('heart',          90, 90,  heartDrawer);
export const thumbsUp       = makeIcon('thumbsUp',       80, 90,  thumbsUpDrawer);
export const thumbsDown     = makeIcon('thumbsDown',     80, 90,  thumbsDownDrawer);
export const cursorPointer  = makeIcon('cursorPointer',  80, 100, cursorPointerDrawer);
export const info           = makeIcon('info',           90, 90,  infoDrawer);
export const warning        = makeIcon('warning',        100, 90, warningDrawer);
export const error          = makeIcon('error',          90, 90,  errorDrawer);
export const question       = makeIcon('question',       90, 90,  questionDrawer);
export const forbidden      = makeIcon('forbidden',      90, 90,  forbiddenDrawer);
export const sparkle        = makeIcon('sparkle',        90, 90,  sparkleDrawer);
export const radioactive    = makeIcon('radioactive',    90, 90,  radioactiveDrawer);
export const recycle        = makeIcon('recycle',        90, 90,  recycleDrawer);
export const infinity       = makeIcon('infinity',       110, 80, infinityDrawer);
export const questionMark   = makeIcon('questionMark',   70, 100, questionMarkDrawer);
export const exclamation    = makeIcon('exclamation',    50, 100, exclamationDrawer);
export const checkCircle    = makeIcon('checkCircle',    90, 90,  checkCircleDrawer);
export const xCircle        = makeIcon('xCircle',        90, 90,  xCircleDrawer);
export const star           = makeIcon('star',           90, 90,  starDrawer);
export const wifi           = makeIcon('wifi',           90, 90,  wifiDrawer);
export const bluetooth      = makeIcon('bluetooth',      70, 100, bluetoothDrawer);
export const copyright      = makeIcon('copyright',      90, 90,  copyrightDrawer);
export const trademark      = makeIcon('trademark',      90, 80,  trademarkDrawer);
export const registered     = makeIcon('registered',     90, 90,  registeredDrawer);
export const biohazard      = makeIcon('biohazard',      90, 90,  biohazardDrawer);
export const peace          = makeIcon('peace',          90, 90,  peaceDrawer);
