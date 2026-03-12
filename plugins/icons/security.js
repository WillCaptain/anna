/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  分类：安全与司法
 *  图标：key, padlock, padlockOpen, vault,
 *        shield, gavel, scales, handcuffs, prisonBars,
 *        policeLamp, fingerprint, badge, camera, cctv,
 *        streetLight, alarm
 *--------------------------------------------------------------------------------------------*/

import {makeIconDrawer, makeIcon} from './_iconBase.js';

// ── 钥匙 (key) ─────────────────────────────────────────────────────────────────
// 水平朝右：大环形头部 + 细轴杆 + 3颗高低不同的齿
const keyDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy     = py + H * 0.46;
    const headR  = Math.min(W, H) * 0.30;
    const headCx = px + headR + W * 0.03;
    const holeR  = headR * 0.55;   // 大洞，真正的"钥匙环"外观

    const shaftH  = headR * 0.52;  // 轴杆高度
    const shaftY1 = cy - shaftH / 2;
    const shaftY2 = cy + shaftH / 2;
    const shaftX1 = headCx + headR * 0.82;
    const shaftX2 = px + W - W * 0.03;
    const shaftW  = shaftX2 - shaftX1;

    const tw      = shaftH * 0.88;
    // 三颗不同高度的齿（高、短、中）
    const teeth = [
        { x: shaftX1 + shaftW * 0.22, h: H * 0.20 },
        { x: shaftX1 + shaftW * 0.50, h: H * 0.12 },
        { x: shaftX1 + shaftW * 0.76, h: H * 0.16 },
    ];

    // ── 头部填充 ──
    context.beginPath();
    context.arc(headCx, cy, headR, 0, Math.PI * 2);
    context.fill();

    // ── 中心大镂空 ──
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(headCx, cy, holeR, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';

    // ── 轴杆 ──
    context.beginPath();
    context.rect(shaftX1, shaftY1, shaftW, shaftH);
    context.fill();

    // ── 齿（各自高低不同）──
    for (const { x, h } of teeth) {
        context.beginPath();
        context.rect(x - tw / 2, shaftY2, tw, h);
        context.fill();
    }

    // ── 描边（按绘制顺序覆盖）──
    context.beginPath();
    context.arc(headCx, cy, headR, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(headCx, cy, holeR, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.rect(shaftX1, shaftY1, shaftW, shaftH);
    context.stroke();
    for (const { x, h } of teeth) {
        context.beginPath();
        context.rect(x - tw / 2, shaftY2, tw, h);
        context.stroke();
    }
});

// ── 锁（关）(padlock) ──────────────────────────────────────────────────────────
// 矩形锁体（圆角）+ 闭合 U 型锁扣 + 锁孔（圆 + 矩形槽）
const padlockDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const bodyX  = px + W * 0.12;
    const bodyY  = py + H * 0.42;
    const bodyW  = W  * 0.76;
    const bodyH  = H  * 0.54;
    const bodyR  = bodyW * 0.10;

    const shCx   = px + W  * 0.5;
    const shR    = W  * 0.20;
    const shArcY = py + H  * 0.22;   // 锁扣弧顶中心 y
    const shLX   = shCx - shR;
    const shRX   = shCx + shR;

    const khCx   = px + W  * 0.5;
    const khCy   = bodyY + bodyH * 0.36;
    const khR    = Math.min(W, H) * 0.082;
    const slotW  = khR * 0.80;
    const slotH  = khR * 1.30;

    // ① 锁体填充
    context.beginPath();
    context.roundRect(bodyX, bodyY, bodyW, bodyH, bodyR);
    context.fill();
    context.stroke();

    // ② 锁孔镂空
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(khCx, khCy, khR, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.rect(khCx - slotW / 2, khCy, slotW, slotH);
    context.fill();
    context.globalCompositeOperation = 'source-over';

    // ③ 锁孔轮廓
    context.beginPath();
    context.arc(khCx, khCy, khR, 0, Math.PI * 2);
    context.stroke();
    context.strokeRect(khCx - slotW / 2, khCy, slotW, slotH);

    // ④ U 型锁扣（闭合，两侧进入锁体）
    context.beginPath();
    context.moveTo(shLX, bodyY);
    context.lineTo(shLX, shArcY);
    context.arc(shCx, shArcY, shR, Math.PI, 0, false);  // CW π→3π/2(顶)→0，经过弧顶
    context.lineTo(shRX, bodyY);
    context.stroke();
});

// ── 锁（开）(padlockOpen) ──────────────────────────────────────────────────────
// 与关闭锁相同的锁体 + 锁孔，但右侧锁扣脱开（不插入锁体）
const padlockOpenDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const bodyX  = px + W * 0.12;
    const bodyY  = py + H * 0.42;
    const bodyW  = W  * 0.76;
    const bodyH  = H  * 0.54;
    const bodyR  = bodyW * 0.10;

    const shCx   = px + W  * 0.5;
    const shR    = W  * 0.20;
    const shArcY = py + H  * 0.22;
    const shLX   = shCx - shR;
    const shRX   = shCx + shR;

    const khCx   = px + W  * 0.5;
    const khCy   = bodyY + bodyH * 0.36;
    const khR    = Math.min(W, H) * 0.082;
    const slotW  = khR * 0.80;
    const slotH  = khR * 1.30;

    // ① 锁体填充
    context.beginPath();
    context.roundRect(bodyX, bodyY, bodyW, bodyH, bodyR);
    context.fill();
    context.stroke();

    // ② 锁孔镂空（同关闭锁）
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(khCx, khCy, khR, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.rect(khCx - slotW / 2, khCy, slotW, slotH);
    context.fill();
    context.globalCompositeOperation = 'source-over';

    context.beginPath();
    context.arc(khCx, khCy, khR, 0, Math.PI * 2);
    context.stroke();
    context.strokeRect(khCx - slotW / 2, khCy, slotW, slotH);

    // ③ 锁扣（开启状态）：左侧仍连接锁体，右侧脱开，仅露出半截短桩
    context.beginPath();
    context.moveTo(shLX, bodyY);                          // 左侧进入锁体
    context.lineTo(shLX, shArcY);                         // 左臂上升
    context.arc(shCx, shArcY, shR, Math.PI, 0, false);   // CW π→3π/2(顶)→0，经过弧顶
    context.lineTo(shRX, shArcY + H * 0.12);             // 右臂短桩（未到 bodyY）
    context.stroke();
});

// ── 保险柜 (vault) ─────────────────────────────────────────────────────────────
// 大矩形柜体 + 内凹柜门轮廓 + 圆形表盘（辐射条纹）+ 右侧把手 + 左侧铰链
const vaultDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const bodyR  = Math.min(W, H) * 0.06;

    // ① 柜体
    context.beginPath();
    context.roundRect(px, py, W, H, bodyR);
    context.fill();
    context.stroke();

    // ② 柜门边框（内嵌矩形）
    const dp  = Math.min(W, H) * 0.07;
    context.beginPath();
    context.roundRect(px + dp, py + dp, W - dp * 2, H - dp * 2, bodyR * 0.5);
    context.stroke();

    // ③ 表盘：大圆 + 内圆 + 8 条辐射线
    const dCx = px + W * 0.46;
    const dCy = py + H * 0.46;
    const dR  = Math.min(W, H) * 0.24;
    const dRi = dR * 0.32;

    context.beginPath();
    context.arc(dCx, dCy, dR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.beginPath();
    context.arc(dCx, dCy, dRi, 0, Math.PI * 2);
    context.stroke();

    context.globalAlpha = 0.55;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        context.beginPath();
        context.moveTo(dCx + dRi * Math.cos(a), dCy + dRi * Math.sin(a));
        context.lineTo(dCx + dR  * Math.cos(a), dCy + dR  * Math.sin(a));
        context.stroke();
    }
    context.globalAlpha = 1;

    // ④ 把手（右侧）
    const hW = W * 0.07;
    const hH = H * 0.20;
    const hX = px + W * 0.79;
    const hY = dCy - hH / 2;
    context.beginPath();
    context.roundRect(hX, hY, hW, hH, hW * 0.45);
    context.fill();
    context.stroke();

    // ⑤ 铰链（左侧两个圆）
    const hiR = Math.min(W, H) * 0.04;
    const hiX = px + dp + hiR + W * 0.01;
    [0.28, 0.68].forEach(t => {
        context.beginPath();
        context.arc(hiX, py + H * t, hiR, 0, Math.PI * 2);
        context.stroke();
    });
});

// ── 盾牌 (shield) ──────────────────────────────────────────────────────────────
// 经典盾形：顶部平直、侧面内弧、底部尖头；内部一颗五角星
const shieldDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.5;

    // 盾形外轮廓
    context.beginPath();
    context.moveTo(px + W * 0.05, py + H * 0.04);
    context.lineTo(px + W * 0.95, py + H * 0.04);
    context.quadraticCurveTo(px + W * 0.98, py + H * 0.54, px + W * 0.78, py + H * 0.74);
    context.quadraticCurveTo(px + W * 0.64, py + H * 0.93, cx,             py + H * 0.97);
    context.quadraticCurveTo(px + W * 0.36, py + H * 0.93, px + W * 0.22,  py + H * 0.74);
    context.quadraticCurveTo(px + W * 0.02, py + H * 0.54, px + W * 0.05,  py + H * 0.04);
    context.closePath();
    context.fill();
    context.stroke();

    // 内部五角星
    const starR  = Math.min(W, H) * 0.23;
    const starRi = starR * 0.42;
    const starCy = py + H * 0.46;
    context.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? starR : starRi;
        const x = cx + r * Math.cos(a);
        const y = starCy + r * Math.sin(a);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
});

// ── 法院锤 (gavel) ──────────────────────────────────────────────────────────
// 旋转45°的木槌头 + 斜向手柄 + 底部方形底座
const gavelDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    // 底座（水平横块）
    context.beginPath();
    context.roundRect(px + W * 0.08, py + H * 0.80, W * 0.76, H * 0.14, H * 0.04);
    context.fill();
    context.stroke();

    // 手柄（粗斜线，从槌头延伸到底座方向）
    const prevLw    = context.lineWidth;
    context.lineWidth = Math.max(bw, W * 0.06);
    context.beginPath();
    context.moveTo(px + W * 0.54, py + H * 0.50);
    context.lineTo(px + W * 0.84, py + H * 0.78);
    context.stroke();
    context.lineWidth = prevLw;

    // 槌头（旋转 -38° 的圆角矩形）
    context.save();
    context.translate(px + W * 0.40, py + H * 0.35);
    context.rotate(-Math.PI / 4.7);
    const hw = W * 0.54, hh = H * 0.22;
    context.beginPath();
    context.roundRect(-hw / 2, -hh / 2, hw, hh, hh * 0.28);
    context.fill();
    context.stroke();
    // 槌头中间装饰带
    context.beginPath();
    context.moveTo(-hw * 0.08, -hh / 2);
    context.lineTo(-hw * 0.08,  hh / 2);
    context.moveTo( hw * 0.08, -hh / 2);
    context.lineTo( hw * 0.08,  hh / 2);
    context.globalAlpha = 0.45;
    context.stroke();
    context.globalAlpha = 1;
    context.restore();
});

// ── 法庭天秤 (scales) ─────────────────────────────────────────────────────────
// 中央立柱 + 略微倾斜的横梁 + 两侧悬挂的秤盘
const scalesDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.5;

    // 底座
    context.beginPath();
    context.roundRect(px + W * 0.22, py + H * 0.88, W * 0.56, H * 0.09, H * 0.03);
    context.fill();
    context.stroke();

    // 立柱
    context.beginPath();
    context.moveTo(cx, py + H * 0.14);
    context.lineTo(cx, py + H * 0.88);
    context.stroke();

    // 顶端小圆环
    context.beginPath();
    context.arc(cx, py + H * 0.12, W * 0.05, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 横梁（右侧略低，表示称量状态）
    const beamLX = px + W * 0.10, beamLY = py + H * 0.20;
    const beamRX = px + W * 0.90, beamRY = py + H * 0.24;
    context.beginPath();
    context.moveTo(beamLX, beamLY);
    context.lineTo(beamRX, beamRY);
    context.stroke();

    // 左侧秤盘：对称 V 形链（从梁端点向两侧散开）+ 水平秤盘线
    const lSpread = W * 0.13;
    const lPanY   = py + H * 0.64;
    context.beginPath();
    context.moveTo(beamLX, beamLY);
    context.lineTo(beamLX - lSpread, lPanY);   // 左链
    context.moveTo(beamLX, beamLY);
    context.lineTo(beamLX + lSpread, lPanY);   // 右链
    context.moveTo(beamLX - lSpread, lPanY);
    context.lineTo(beamLX + lSpread, lPanY);   // 水平秤盘线
    context.stroke();

    // 右侧秤盘（位置略低）
    const rSpread = W * 0.13;
    const rPanY   = py + H * 0.70;
    context.beginPath();
    context.moveTo(beamRX, beamRY);
    context.lineTo(beamRX - rSpread, rPanY);
    context.moveTo(beamRX, beamRY);
    context.lineTo(beamRX + rSpread, rPanY);
    context.moveTo(beamRX - rSpread, rPanY);
    context.lineTo(beamRX + rSpread, rPanY);
    context.stroke();
});

// ── 手铐 (handcuffs) ─────────────────────────────────────────────────────────
// 两个腕环（圆形，位于上方）+ 竖向短连杆 + 横向链节（在下方），
// 将腕环与链节分离，避免与眼镜轮廓混淆
const handcuffsDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy     = py + H * 0.50;
    const cR     = Math.min(W, H) * 0.24;   // 手铐外环半径
    const innerR = cR * 0.58;               // 内环半径（留出足够宽度的环）
    const lCx    = px + W * 0.22;
    const rCx    = px + W * 0.78;

    // ── 链条 3 节（先画，在手铐圆环之下）──
    const cLeft  = lCx + cR * 0.88;
    const cRight = rCx - cR * 0.88;
    const span   = cRight - cLeft;
    const lRx    = span / 5.2;
    const lRy    = H * 0.090;
    const linkXs = [
        cLeft  + lRx * 0.9,
        (cLeft + cRight) / 2,
        cRight - lRx * 0.9,
    ];
    for (const lx of linkXs) {
        context.beginPath();
        context.ellipse(lx, cy, lRx, lRy, 0, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }

    // ── 两只手铐圆环（填充+镂空）──
    for (const cx of [lCx, rCx]) {
        // 外环填充
        context.beginPath();
        context.arc(cx, cy, cR, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        // 内镂空
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(cx, cy, innerR, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';

        // 内环描边
        context.beginPath();
        context.arc(cx, cy, innerR, 0, Math.PI * 2);
        context.stroke();
    }

    // ── 锁孔（外侧小圆，表示锁扣位置）──
    const khR = cR * 0.13;
    const offX = cR * 0.68;
    for (const [cx, dir] of [[lCx, -1], [rCx, 1]]) {
        context.save();
        context.globalAlpha = 0.55;
        context.beginPath();
        context.arc(cx + dir * offX, cy, khR, 0, Math.PI * 2);
        context.fill();
        context.restore();
        context.beginPath();
        context.arc(cx + dir * offX, cy, khR, 0, Math.PI * 2);
        context.stroke();
    }
});

// ── 监狱栏杆 (prisonBars) ────────────────────────────────────────────────────
// 5 根竖杆 + 顶部和底部各一个圆角横档
const prisonBarsDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const numBars = 5;
    const barLw   = Math.max(bw * 1.2, W * 0.045);
    const padX    = W * 0.08;
    const topY    = py + H * 0.06;
    const botY    = py + H * 0.94;
    const railH   = H * 0.09;
    const railR   = railH * 0.35;

    // 顶部横档
    context.beginPath();
    context.roundRect(px + padX * 0.5, topY, W - padX, railH, railR);
    context.fill();
    context.stroke();

    // 底部横档
    context.beginPath();
    context.roundRect(px + padX * 0.5, botY - railH, W - padX, railH, railR);
    context.fill();
    context.stroke();

    // 竖杆
    const prevLw = context.lineWidth;
    context.lineWidth = barLw;
    for (let i = 0; i < numBars; i++) {
        const x = px + padX + (W - padX * 2) * (i / (numBars - 1));
        context.beginPath();
        context.moveTo(x, topY + railH);
        context.lineTo(x, botY - railH);
        context.stroke();
    }
    context.lineWidth = prevLw;
});

// ── 法警灯 (policeLamp) ───────────────────────────────────────────────────────
// 圆形灯体（含内环）+ 顶部半圆灯罩 + 4 条放射光线
const policeLampDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx    = px + W * 0.5;
    const bodyX = px + W * 0.15;
    const bodyY = py + H * 0.46;
    const bodyW = W * 0.70;
    const bodyH = H * 0.42;
    const bodyR = bodyH * 0.18;

    // 灯体矩形
    context.beginPath();
    context.roundRect(bodyX, bodyY, bodyW, bodyH, bodyR);
    context.fill();
    context.stroke();

    // 顶部警灯圆弧（红/蓝灯罩）
    const domeR = bodyW * 0.24;
    context.beginPath();
    context.arc(cx, bodyY, domeR, Math.PI, 0);
    context.lineTo(cx + domeR, bodyY);
    context.lineTo(cx - domeR, bodyY);
    context.fill();
    context.stroke();

    // 灯体中央水平条纹（警灯标志）
    const stripeY = bodyY + bodyH * 0.45;
    context.beginPath();
    context.moveTo(bodyX + bodyR, stripeY);
    context.lineTo(bodyX + bodyW - bodyR, stripeY);
    context.globalAlpha = 0.5;
    context.stroke();
    context.globalAlpha = 1;

    // 4 条放射光线（左上、正上、右上 + 左、右）
    const rays = [
        [-0.6, -0.85, -0.9, -1.40],   // 左斜
        [ 0.0, -1.00,  0.0, -1.55],   // 正上
        [ 0.6, -0.85,  0.9, -1.40],   // 右斜
        [-0.9, -0.42, -1.4, -0.62],   // 左平
        [ 0.9, -0.42,  1.4, -0.62],   // 右平
    ];
    const bx = cx, by = bodyY;
    rays.forEach(([x1, y1, x2, y2]) => {
        context.beginPath();
        context.moveTo(bx + x1 * domeR, by + y1 * domeR);
        context.lineTo(bx + x2 * domeR, by + y2 * domeR);
        context.stroke();
    });

    // 底部安装基座
    const baseW = bodyW * 0.50;
    context.beginPath();
    context.roundRect(cx - baseW / 2, bodyY + bodyH, baseW, H * 0.08, H * 0.03);
    context.fill();
    context.stroke();
});

// ── 指纹 (fingerprint) ────────────────────────────────────────────────────────
// 7 条同心弧（底部开口逐渐增大，模拟指纹纹路）
const fingerprintDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.52;
    const lw  = Math.max(bw * 0.85, W * 0.026);
    context.lineWidth = lw;

    // 最内层：小椭圆（完整闭合，模拟指纹中心）
    context.beginPath();
    context.ellipse(cx, cy - H * 0.04, W * 0.055, H * 0.065, 0, 0, Math.PI * 2);
    context.stroke();

    // 向外 6 条渐扩弧（clockwise 从左到右经过顶部，底部缺口逐渐增大）
    for (let i = 0; i < 6; i++) {
        const rx      = W * (0.11 + i * 0.068);
        const ry      = H * (0.12 + i * 0.075);
        const gapFrac = 0.04 + i * 0.015;          // 底部缺口角度（弧度倍数 of π）
        const sa      = Math.PI * (1.0 + gapFrac); // 开始角（略过左侧底部）
        const ea      = Math.PI * (2.0 - gapFrac); // 结束角（略过右侧底部，顺时针到此）
        context.beginPath();
        context.ellipse(cx, cy - H * 0.04, rx, ry, 0, sa, ea, false); // false = clockwise → 经过顶部
        context.stroke();
    }
    context.lineWidth = bw;
});

// ── 警徽 (badge) ──────────────────────────────────────────────────────────────
// 六角星徽章（外轮廓填充）+ 内圆 + 中心点
const badgeDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx     = px + W * 0.5;
    const cy     = py + H * 0.5;
    const outerR = Math.min(W, H) * 0.44;
    const innerR = outerR * 0.44;
    const points = 6;

    // 六角星外形
    context.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.stroke();

    // 内圆
    context.beginPath();
    context.arc(cx, cy, outerR * 0.32, 0, Math.PI * 2);
    context.stroke();

    // 中心点
    context.beginPath();
    context.arc(cx, cy, outerR * 0.10, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 摄像头 (camera) ───────────────────────────────────────────────────────────
// 矩形机身（左窄右宽梯形感）+ 右侧镜头（圆圈）+ 底部安装底座
// ── 相机 (camera) ──────────────────────────────────────────────────────────────
// 横向矩形机身 + 顶部取景器凸包 + 居中大镜头（外环 + 内实圆）+ 左侧闪光灯小方块
const cameraDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    // ① 主机身（横向圆角矩形）
    const bodyX = px + W * 0.04;
    const bodyY = py + H * 0.28;
    const bodyW = W  * 0.92;
    const bodyH = H  * 0.54;
    context.beginPath();
    context.roundRect(bodyX, bodyY, bodyW, bodyH, bodyH * 0.12);
    context.fill();
    context.stroke();

    // ② 顶部取景器凸包（左侧小矩形）
    const vpX = px + W * 0.20;
    const vpW = W  * 0.28;
    const vpH = bodyY - py - H * 0.06;
    context.beginPath();
    context.roundRect(vpX, py + H * 0.06, vpW, vpH, vpH * 0.30);
    context.fill();
    context.stroke();

    // ③ 快门按钮（顶部右侧小圆）
    context.beginPath();
    context.arc(px + W * 0.80, bodyY - H * 0.02, W * 0.050, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ④ 镜头外环
    const lensCx = px + W * 0.56;
    const lensCy = bodyY + bodyH * 0.50;
    const lensR  = H  * 0.20;
    context.beginPath();
    context.arc(lensCx, lensCy, lensR, 0, Math.PI * 2);
    context.stroke();

    // ⑤ 镜头内实圆（光圈）
    context.beginPath();
    context.arc(lensCx, lensCy, lensR * 0.54, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ⑥ 左侧闪光灯（小圆角方块）
    context.beginPath();
    context.roundRect(px + W * 0.09, bodyY + bodyH * 0.20, W * 0.14, bodyH * 0.38, W * 0.025);
    context.fill();
    context.stroke();
});

// ── 监控球机 (cctv) ───────────────────────────────────────────────────────────
// 天花板支架（横条）+ 短连杆 + 球形摄像头（圆形）+ 内部偏心镜头
const cctvDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.5;

    // 天花板安装板
    context.beginPath();
    context.roundRect(px + W * 0.20, py + H * 0.04, W * 0.60, H * 0.11, H * 0.04);
    context.fill();
    context.stroke();

    // 短连杆
    context.beginPath();
    context.roundRect(cx - W * 0.06, py + H * 0.15, W * 0.12, H * 0.14, W * 0.03);
    context.fill();
    context.stroke();

    // 球形摄像头（大圆）
    const domeR = Math.min(W, H) * 0.31;
    const domeCy = py + H * 0.15 + H * 0.14 + domeR;
    context.beginPath();
    context.arc(cx, domeCy, domeR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 偏心镜头（表示朝向）
    const lCx = cx + domeR * 0.18;
    const lCy = domeCy + domeR * 0.10;
    context.beginPath();
    context.arc(lCx, lCy, domeR * 0.40, 0, Math.PI * 2);
    context.stroke();

    // 镜头内圆（瞳孔）
    context.beginPath();
    context.arc(lCx, lCy, domeR * 0.18, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ── 路灯 (streetLight) ───────────────────────────────────────────────────────
// 细立柱（底部稍宽）+ 顶端弯臂 + 灯罩 + 向下三角形光晕
const streetLightDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const poleX    = px + W * 0.36;
    const poleTopY = py + H * 0.10;
    const poleBotY = py + H * 0.94;
    const poleW    = Math.max(bw * 1.4, W * 0.05);

    // 立柱（圆角矩形，底部微宽）
    context.beginPath();
    context.roundRect(poleX - poleW / 2, poleTopY + H * 0.12, poleW, poleBotY - poleTopY - H * 0.12, poleW / 2);
    context.fill();
    context.stroke();

    // 底座
    const baseW = W * 0.26;
    context.beginPath();
    context.roundRect(poleX - baseW / 2, poleBotY - H * 0.06, baseW, H * 0.06, H * 0.02);
    context.fill();
    context.stroke();

    // 顶端弯臂（从柱顶弯向右侧）
    const armEndX = px + W * 0.76;
    context.beginPath();
    context.moveTo(poleX, poleTopY + H * 0.12);
    context.quadraticCurveTo(poleX, poleTopY, armEndX, poleTopY);
    context.lineWidth = Math.max(bw, poleW * 0.85);
    context.stroke();
    context.lineWidth = bw;

    // 灯罩（臂末端的矩形灯具）
    const lampW = W * 0.25;
    const lampH = H * 0.1;
    const lampX = armEndX - lampW / 2;
    const lampY = poleTopY + H * 0.03;
    context.beginPath();
    context.moveTo(armEndX,poleTopY);
    context.lineTo(armEndX,lampY);
    context.stroke();
    context.beginPath();
    context.roundRect(lampX, lampY, lampW, lampH, lampH * 0.30);
    context.fill();
    context.stroke();

    // 向下三角形光晕
    context.globalAlpha = 0.28;
    context.beginPath();
    context.moveTo(lampX + lampW * 0.2, lampY + lampH);
    context.lineTo(lampX + lampW * 0.8, lampY + lampH);
    context.lineTo(armEndX + lampW * 0.55, lampY + lampH + H * 0.20);
    context.lineTo(armEndX - lampW * 0.55, lampY + lampH + H * 0.20);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
});

// ── 报警器 (alarm) ────────────────────────────────────────────────────────────
// 圆形主体（外圈+内圈+中心）+ 两侧各两道弧形声波
const alarmDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.5;
    const cy  = py + H * 0.52;
    const r   = Math.min(W, H) * 0.28;

    // 主体外圆
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 内圆（扬声器网格感）
    context.beginPath();
    context.arc(cx, cy, r * 0.56, 0, Math.PI * 2);
    context.stroke();

    // 中心点
    context.beginPath();
    context.arc(cx, cy, r * 0.20, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 声波（左右各两条弧，向外扩散）
    [1.50, 2.10].forEach(scale => {
        // 左侧声波
        context.beginPath();
        context.arc(cx, cy, r * scale, Math.PI * 0.72, Math.PI * 1.28);
        context.stroke();
        // 右侧声波
        context.beginPath();
        context.arc(cx, cy, r * scale, -Math.PI * 0.28, Math.PI * 0.28);
        context.stroke();
    });

    // 底部安装底座
    context.beginPath();
    context.roundRect(cx - W * 0.18, py + H * 0.82, W * 0.36, H * 0.11, H * 0.04);
    context.fill();
    context.stroke();
});

// ── 导出 ──────────────────────────────────────────────────────────────────────
export const key          = makeIcon('key',          100, 80,  keyDrawer);
export const padlock      = makeIcon('padlock',      80,  100, padlockDrawer);
export const padlockOpen  = makeIcon('padlockOpen',  80,  100, padlockOpenDrawer);
export const vault        = makeIcon('vault',        110, 100, vaultDrawer);
export const shield       = makeIcon('shield',       90,  100, shieldDrawer);
export const gavel        = makeIcon('gavel',        100, 100, gavelDrawer);
export const scales       = makeIcon('scales',       110, 100, scalesDrawer);
export const handcuffs    = makeIcon('handcuffs',    120, 80,  handcuffsDrawer);
export const prisonBars   = makeIcon('prisonBars',   100, 100, prisonBarsDrawer);
export const policeLamp   = makeIcon('policeLamp',   90,  100, policeLampDrawer);
export const fingerprint  = makeIcon('fingerprint',  90,  90,  fingerprintDrawer);
export const badge        = makeIcon('badge',        90,  90,  badgeDrawer);
export const camera       = makeIcon('camera',       110, 90,  cameraDrawer);
export const cctv         = makeIcon('cctv',         90,  110, cctvDrawer);
export const streetLight  = makeIcon('streetLight',  90,  130, streetLightDrawer);
export const alarm        = makeIcon('alarm',        90,  100, alarmDrawer);
