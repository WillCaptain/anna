/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  分类：虫子
 *  图标：butterfly, bee, ant, beetle, ladybug, spider, dragonfly, mosquito, caterpillar, snail
 *--------------------------------------------------------------------------------------------*/

import {makeIconDrawer, makeIcon} from './_iconBase.js';

// ── 蝴蝶 (butterfly) ──────────────────────────────────────────────────────────
// 俯视：两对翅膀（上大下小）+ 细长体 + 触角
const butterflyDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx = px + W * 0.50;

    // 上翅（左右对称，较大）
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(cx,               py + H * 0.24);
        context.bezierCurveTo(
            cx + s * W * 0.08, py + H * 0.10,
            cx + s * W * 0.46, py + H * 0.04,
            cx + s * W * 0.46, py + H * 0.22
        );
        context.bezierCurveTo(
            cx + s * W * 0.46, py + H * 0.44,
            cx + s * W * 0.22, py + H * 0.52,
            cx,               py + H * 0.52
        );
        context.closePath();
        context.fill();
        context.stroke();
    }

    // 下翅（左右对称，较小）
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(cx,               py + H * 0.54);
        context.bezierCurveTo(
            cx + s * W * 0.12, py + H * 0.60,
            cx + s * W * 0.42, py + H * 0.76,
            cx + s * W * 0.36, py + H * 0.90
        );
        context.bezierCurveTo(
            cx + s * W * 0.22, py + H * 0.90,
            cx + s * W * 0.10, py + H * 0.74,
            cx,               py + H * 0.78
        );
        context.closePath();
        context.fill();
        context.stroke();
    }

    // 体（细长垂直椭圆）
    context.beginPath();
    context.ellipse(cx, py + H * 0.50, W * 0.05, H * 0.42, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 触角（从头部向上分叉，末端圆点）
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(cx + s * W * 0.02, py + H * 0.10);
        context.quadraticCurveTo(
            cx + s * W * 0.14, py + H * 0.02,
            cx + s * W * 0.22, py + H * 0.04
        );
        context.stroke();
        context.beginPath();
        context.arc(cx + s * W * 0.22, py + H * 0.04, Math.max(bw * 1.8, 1.5), 0, Math.PI * 2);
        context.fill();
    }
});

// ── 蜜蜂 (bee) ────────────────────────────────────────────────────────────────
// 侧视（头在左）：头 + 胸 + 条纹腹部 + 两对翅膀 + 刺针 + 触角 + 折线腿
const beeDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy   = py + H * 0.60;   // 身体中心线
    const hCX  = px + W * 0.11;   // 头部中心
    const hR   = H  * 0.10;
    const thCX = px + W * 0.26;   // 胸部中心
    const thRX = W  * 0.12;
    const thRY = H  * 0.14;
    const abCX = px + W * 0.62;   // 腹部中心
    const abRX = W  * 0.26;
    const abRY = H  * 0.19;

    // ── 翅膀（两对，前翅大，后翅小，半透明）──
    const wingDefs = [
        // [cx, cy偏移, rx, ry, 旋转角]
        [0.44, -0.22, 0.16, 0.18, -0.38],   // 前翅（大，倾斜较多）
        [0.58, -0.15, 0.11, 0.12, -0.25],   // 后翅（小，略平）
    ];
    for (const [ox, oy, rx, ry, ang] of wingDefs) {
        context.save();
        context.globalAlpha = 0.50;
        context.beginPath();
        context.ellipse(px + W * ox, cy + H * oy, W * rx, H * ry, ang, 0, Math.PI * 2);
        context.fill();
        context.restore();
        context.beginPath();
        context.ellipse(px + W * ox, cy + H * oy, W * rx, H * ry, ang, 0, Math.PI * 2);
        context.stroke();
    }

    // ── 胸部（椭圆，连接头与腹）──
    context.beginPath();
    context.ellipse(thCX, cy, thRX, thRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 腹部（横椭圆）──
    context.beginPath();
    context.ellipse(abCX, cy, abRX, abRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 腹部条纹（3条，椭圆内裁剪）──
    context.save();
    context.globalAlpha = 0.28;
    context.lineWidth = H * 0.062;
    for (let i = 0; i < 3; i++) {
        const bx  = px + W * (0.44 + i * 0.12);
        const dx  = (bx - abCX) / abRX;
        if (Math.abs(dx) >= 1) continue;
        const half = abRY * Math.sqrt(1 - dx * dx);
        context.beginPath();
        context.moveTo(bx, cy - half);
        context.lineTo(bx, cy + half);
        context.stroke();
    }
    context.restore();

    // ── 刺针 ──
    context.beginPath();
    context.moveTo(abCX + abRX * 0.94, cy);
    context.lineTo(abCX + abRX + W * 0.06, cy);
    context.stroke();

    // ── 头部 ──
    context.beginPath();
    context.arc(hCX, cy, hR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 触角（从头顶两侧向上分叉）──
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(hCX + s * hR * 0.5, cy - hR * 0.85);
        context.quadraticCurveTo(
            hCX + s * W * 0.06, cy - H * 0.32,
            hCX + s * W * 0.04, cy - H * 0.44
        );
        context.stroke();
        context.beginPath();
        context.arc(hCX + s * W * 0.04, cy - H * 0.44, Math.max(bw * 1.5, 1.5), 0, Math.PI * 2);
        context.fill();
    }

    // ── 腿（3对折线腿，从胸部伸出，前斜/直/后斜）──
    // [根部X偏移, 膝关节X偏移, 膝关节Y偏移, 末端X偏移, 末端Y偏移]（相对于 thCX/cy）
    const legDefs = [
        [-thRX * 0.7,  -W * 0.16,  H * 0.18,  -W * 0.06,  H * 0.36],  // 前腿
        [ 0,            W * 0.00,  H * 0.20,   W * 0.08,  H * 0.38],  // 中腿
        [ thRX * 0.7,   W * 0.14,  H * 0.18,   W * 0.20,  H * 0.36],  // 后腿
    ];
    context.save();
    context.globalAlpha = 0.70;
    for (const [dx0, dkx, dky, dex, dey] of legDefs) {
        context.beginPath();
        context.moveTo(thCX + dx0, cy + thRY * 0.80);
        context.lineTo(thCX + dkx, cy + dky);
        context.lineTo(thCX + dex, cy + dey);
        context.stroke();
    }
    context.restore();
});

// ── 蚂蚁 (ant) ────────────────────────────────────────────────────────────────
// 俯视（头在左）：头 + 胸 + 腹（三椭圆）+ 6条折线腿（严格上下对称）+ 触角
const antDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy  = py + H * 0.50;
    const hCX = px + W * 0.20;
    const tCX = px + W * 0.46;
    const aCX = px + W * 0.72;

    // ── 6条腿（先于身体绘制，严格上下对称）──
    // 每行：[根部X（相对tCX）, 膝关节X（相对tCX）, 末端X（相对tCX）, Y幅度（正值=下方）]
    // 上方腿 Y 取负，下方腿 Y 取正，保证完全对称
    const legRows = [
        [-W*0.06,  -W*0.20,  -W*0.06,  H*0.36],   // 前腿（向前弯，膝偏左）
        [      0,  -W*0.06,   W*0.10,  H*0.38],   // 中腿（向外直伸，末端略右）
        [ W*0.06,   W*0.14,   W*0.28,  H*0.34],   // 后腿（向后弯，膝偏右）
    ];
    context.save();
    context.globalAlpha = 0.85;
    for (const [dx0, dkx, dex, dy] of legRows) {
        for (const s of [-1, 1]) {   // s=-1 上方，s=1 下方
            context.beginPath();
            context.moveTo(tCX + dx0,  cy);             // 根部（胸部中心Y）
            context.lineTo(tCX + dkx,  cy + s * dy * 0.68);  // 膝关节
            context.lineTo(tCX + dex,  cy + s * dy);          // 末端
            context.stroke();
        }
    }
    context.restore();

    // ── 腹部（最大，后方）──
    context.beginPath();
    context.ellipse(aCX, cy, W * 0.22, H * 0.28, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 胸部（小，中间）──
    context.beginPath();
    context.ellipse(tCX, cy, W * 0.09, H * 0.13, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 头部 ──
    context.beginPath();
    context.ellipse(hCX, cy, W * 0.14, H * 0.16, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 触角（从头部左侧向前上方分叉，上下对称）──
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(hCX - W * 0.10, cy + s * H * 0.04);
        context.quadraticCurveTo(
            hCX - W * 0.20, cy + s * H * 0.20,
            hCX - W * 0.28, cy + s * H * 0.28
        );
        context.stroke();
        context.beginPath();
        context.arc(hCX - W * 0.28, cy + s * H * 0.28, Math.max(bw * 1.5, 1.5), 0, Math.PI * 2);
        context.fill();
    }
});

// ── 甲虫 (beetle) ─────────────────────────────────────────────────────────────
// 俯视（竖向，头在上）：鞘翅（大竖椭圆）+ 前胸盾片 + 头 + 6条腿 + 触角
const beetleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx   = px + W * 0.50;   // 身体中心 X
    const elCY = py + H * 0.62;   // 鞘翅中心 Y
    const elRX = W  * 0.28;       // 鞘翅半宽
    const elRY = H  * 0.32;       // 鞘翅半高
    const proY = py + H * 0.24;   // 前胸盾片中心 Y

    // ── 6条腿（先画，3对，左右对称）──
    // [附着Y（绝对值）, 末端X偏移（出体边外）, 末端Y（绝对值）]
    const legRows = [
        [elCY - elRY * 0.44, W * 0.14, elCY - elRY * 0.68],  // 前腿
        [elCY,               W * 0.16, elCY + elRY * 0.08],   // 中腿
        [elCY + elRY * 0.40, W * 0.12, elCY + elRY * 0.64],   // 后腿
    ];
    context.save();
    context.globalAlpha = 0.75;
    for (const [ay, exOff, ty] of legRows) {
        for (const s of [-1, 1]) {
            context.beginPath();
            context.moveTo(cx + s * elRX * 0.88, ay);
            context.lineTo(cx + s * (elRX + exOff), ty);
            context.stroke();
        }
    }
    context.restore();

    // ── 鞘翅（大竖椭圆）──
    context.beginPath();
    context.ellipse(cx, elCY, elRX, elRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 鞘翅中缝线 ──
    context.beginPath();
    context.moveTo(cx, elCY - elRY * 0.92);
    context.lineTo(cx, elCY + elRY * 0.92);
    context.stroke();

    // ── 前胸盾片（pronotum，横椭圆）──
    context.beginPath();
    context.ellipse(cx, proY, W * 0.22, H * 0.10, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 头部（小圆，顶部）──
    context.beginPath();
    context.arc(cx, py + H * 0.10, W * 0.10, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 触角（从头两侧向上展开）──
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(cx + s * W * 0.07, py + H * 0.07);
        context.quadraticCurveTo(
            cx + s * W * 0.20, py + H * 0.01,
            cx + s * W * 0.32, py + H * 0.05
        );
        context.stroke();
        context.beginPath();
        context.arc(cx + s * W * 0.32, py + H * 0.05, Math.max(bw * 1.5, 1.5), 0, Math.PI * 2);
        context.fill();
    }
});

// ── 瓢虫 (ladybug) ────────────────────────────────────────────────────────────
// 俯视：圆体 + 镂空斑点（destination-out）+ 中缝 + 分隔弧 + 小头 + 触角
const ladybugDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.56;
    const R   = Math.min(W, H) * 0.37;
    const hR  = R * 0.21;
    const divY = cy - R * 0.62;

    // ── 体（圆形）──
    context.beginPath();
    context.arc(cx, cy, R, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 背部中缝线 ──
    context.beginPath();
    context.moveTo(cx, divY + H * 0.01);
    context.lineTo(cx, cy + R * 0.93);
    context.stroke();

    // ── 头胸分隔弧 ──
    context.beginPath();
    context.arc(cx, divY, R * 0.70, Math.PI * 0.10, Math.PI * 0.90, false);
    context.stroke();

    // ── 斑点（6个，destination-out 真实镂空，颜色明显）──
    const spotR = R * 0.155;
    const spots = [
        [cx - R * 0.35, cy - R * 0.32],
        [cx + R * 0.35, cy - R * 0.32],
        [cx - R * 0.38, cy + R * 0.06],
        [cx + R * 0.38, cy + R * 0.06],
        [cx - R * 0.32, cy + R * 0.44],
        [cx + R * 0.32, cy + R * 0.44],
    ];
    context.globalCompositeOperation = 'destination-out';
    for (const [sx, sy] of spots) {
        context.beginPath();
        context.arc(sx, sy, spotR, 0, Math.PI * 2);
        context.fill();
    }
    context.globalCompositeOperation = 'source-over';
    for (const [sx, sy] of spots) {
        context.beginPath();
        context.arc(sx, sy, spotR, 0, Math.PI * 2);
        context.stroke();
    }

    // ── 头部（小圆，顶部）──
    context.beginPath();
    context.arc(cx, cy - R, hR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 触角 ──
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(cx + s * hR * 0.5, cy - R - hR * 0.8);
        context.quadraticCurveTo(
            cx + s * W * 0.14, cy - R - H * 0.16,
            cx + s * W * 0.20, cy - R - H * 0.22
        );
        context.stroke();
        context.beginPath();
        context.arc(cx + s * W * 0.20, cy - R - H * 0.22, Math.max(bw * 1.5, 1.5), 0, Math.PI * 2);
        context.fill();
    }
});

// ── 蜘蛛 (spider) ─────────────────────────────────────────────────────────────
// 俯视：卵形腹部（含沙漏纹）+ 头胸部 + 腰节 + 8条折线腿 + 8眼
const spiderDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx   = px + W * 0.50;
    const abCY = py + H * 0.66;
    const abRX = W  * 0.24;
    const abRY = H  * 0.26;
    const thCY = py + H * 0.32;
    const thRX = W  * 0.17;
    const thRY = H  * 0.14;

    // ── 8 条腿（4 对，折线，膝关节清晰）──
    // [根部Xoff, 根部Yoff, 膝Xoff, 膝Yoff, 末Xoff, 末Yoff]（相对cx, thCY）
    const legDefs = [
        [-thRX,  -thRY*0.4,  -W*0.42,  -H*0.24,  -W*0.48,   H*0.04],
        [ thRX,  -thRY*0.4,   W*0.42,  -H*0.24,   W*0.48,   H*0.04],
        [-thRX,   thRY*0.1,  -W*0.46,  -H*0.06,  -W*0.48,   H*0.26],
        [ thRX,   thRY*0.1,   W*0.46,  -H*0.06,   W*0.48,   H*0.26],
        [-thRX,   thRY*0.5,  -W*0.44,   H*0.16,  -W*0.44,   H*0.46],
        [ thRX,   thRY*0.5,   W*0.44,   H*0.16,   W*0.44,   H*0.46],
        [-thRX*0.7, thRY*0.9, -W*0.36,  H*0.34,  -W*0.32,   H*0.60],
        [ thRX*0.7, thRY*0.9,  W*0.36,  H*0.34,   W*0.32,   H*0.60],
    ];
    for (const [dx0, dy0, dkx, dky, dex, dey] of legDefs) {
        context.beginPath();
        context.moveTo(cx + dx0,  thCY + dy0);
        context.lineTo(cx + dkx,  thCY + dky);   // 膝关节
        context.lineTo(cx + dex,  thCY + dey);   // 足尖
        context.stroke();
    }

    // ── 腹部（卵形）──
    context.beginPath();
    context.ellipse(cx, abCY, abRX, abRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 腹部沙漏纹（蜘蛛花纹，上下两个椭圆）──
    context.save();
    context.globalAlpha = 0.28;
    context.beginPath();
    context.ellipse(cx, abCY - abRY * 0.32, abRX * 0.46, abRY * 0.32, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(cx, abCY + abRY * 0.36, abRX * 0.36, abRY * 0.28, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.beginPath();
    context.ellipse(cx, abCY - abRY * 0.32, abRX * 0.46, abRY * 0.32, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(cx, abCY + abRY * 0.36, abRX * 0.36, abRY * 0.28, 0, 0, Math.PI * 2);
    context.stroke();

    // ── 腰节（头胸和腹部之间的细腰）──
    const pedY = (thCY + thRY + abCY - abRY) / 2;
    context.beginPath();
    context.ellipse(cx, pedY, W * 0.046, H * 0.042, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 头胸部 ──
    context.beginPath();
    context.ellipse(cx, thCY, thRX, thRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 8只眼（前排4 + 后排4）──
    const eyeR = Math.max(bw * 1.7, 1.8);
    const eyeFrontY = thCY - thRY * 0.46;
    const eyeBackY  = thCY - thRY * 0.02;
    for (const [ex, ey] of [
        // 前排 4 眼
        [-thRX*0.54, eyeFrontY], [-thRX*0.18, eyeFrontY],
        [ thRX*0.18, eyeFrontY], [ thRX*0.54, eyeFrontY],
        // 后排 4 眼
        [-thRX*0.44, eyeBackY],  [-thRX*0.12, eyeBackY],
        [ thRX*0.12, eyeBackY],  [ thRX*0.44, eyeBackY],
    ]) {
        context.beginPath();
        context.arc(cx + ex, ey, eyeR, 0, Math.PI * 2);
        context.fill();
    }
});

// ── 蜻蜓 (dragonfly) ──────────────────────────────────────────────────────────
// 俯视（水平）：大复眼头 + 胸 + 6段腹部 + 4片宽翅
const dragonflyDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy  = py + H * 0.50;
    const hCX = px + W * 0.14;
    const headR = Math.min(W, H) * 0.12;

    // ── 前翅（上下对称，向前展开）──
    for (const s of [-1, 1]) {
        const wingPath = () => {
            context.beginPath();
            context.moveTo(px + W * 0.34, cy);
            context.bezierCurveTo(
                px + W * 0.28, cy + s * H * 0.10,
                px + W * 0.06, cy + s * H * 0.46,
                px + W * 0.04, cy + s * H * 0.36
            );
            context.bezierCurveTo(
                px + W * 0.06, cy + s * H * 0.18,
                px + W * 0.26, cy + s * H * 0.08,
                px + W * 0.34, cy
            );
            context.closePath();
        };
        context.save(); context.globalAlpha = 0.58;
        wingPath(); context.fill(); context.restore();
        wingPath(); context.stroke();
    }

    // ── 后翅（上下对称，向后展开，略宽）──
    for (const s of [-1, 1]) {
        const wingPath = () => {
            context.beginPath();
            context.moveTo(px + W * 0.44, cy);
            context.bezierCurveTo(
                px + W * 0.48, cy + s * H * 0.12,
                px + W * 0.80, cy + s * H * 0.50,
                px + W * 0.84, cy + s * H * 0.40
            );
            context.bezierCurveTo(
                px + W * 0.82, cy + s * H * 0.16,
                px + W * 0.50, cy + s * H * 0.06,
                px + W * 0.44, cy
            );
            context.closePath();
        };
        context.save(); context.globalAlpha = 0.58;
        wingPath(); context.fill(); context.restore();
        wingPath(); context.stroke();
    }

    // ── 胸部（翅膀根部，短粗矩形）──
    context.beginPath();
    context.roundRect(px + W * 0.28, cy - H * 0.10, W * 0.18, H * 0.20, H * 0.04);
    context.fill();
    context.stroke();

    // ── 腹部（细长，6节）──
    const abCX  = px + W * 0.64;
    const abRX  = W  * 0.32;
    const abRY  = H  * 0.072;
    context.beginPath();
    context.ellipse(abCX, cy, abRX, abRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 腹节横纹（5道）
    context.save();
    context.globalAlpha = 0.26;
    for (let i = 1; i <= 5; i++) {
        const sx = px + W * (0.38 + i * 0.10);
        const dx = (sx - abCX) / abRX;
        if (Math.abs(dx) >= 0.96) continue;
        const half = abRY * Math.sqrt(1 - dx * dx);
        context.beginPath();
        context.moveTo(sx, cy - half);
        context.lineTo(sx, cy + half);
        context.stroke();
    }
    context.restore();

    // ── 头部 ──
    context.beginPath();
    context.arc(hCX, cy, headR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 复眼（上下两个大突出球眼）──
    const eyeR = headR * 0.56;
    for (const s of [-1, 1]) {
        context.save();
        context.globalAlpha = 0.34;
        context.beginPath();
        context.arc(hCX, cy + s * headR * 0.68, eyeR, 0, Math.PI * 2);
        context.fill();
        context.restore();
        context.beginPath();
        context.arc(hCX, cy + s * headR * 0.68, eyeR, 0, Math.PI * 2);
        context.stroke();
    }
});

// ── 蚊子 (mosquito) ───────────────────────────────────────────────────────────
// 侧视：小头 + 弓形细腹 + 长口针 + 两翅 + 细腿
const mosquitoDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const hCX  = px + W * 0.28;
    const hCY  = py + H * 0.38;
    const hR   = Math.min(W, H) * 0.07;

    // 腹部（弓形，从胸部向后下弯）
    context.beginPath();
    context.moveTo(hCX + hR, hCY);
    context.bezierCurveTo(
        px + W * 0.54, py + H * 0.34,
        px + W * 0.80, py + H * 0.40,
        px + W * 0.92, py + H * 0.60
    );
    context.lineWidth = H * 0.08;
    context.stroke();
    context.lineWidth = bw;

    // 翅膀（两片椭圆）
    for (const [ox, oy, rx, ry, ang] of [
        [0.38, -0.20, 0.12, 0.16, -0.25],
        [0.50, -0.16, 0.10, 0.12, -0.15],
    ]) {
        context.save();
        context.globalAlpha = 0.55;
        context.beginPath();
        context.ellipse(px + W * ox, hCY + H * oy, W * rx, H * ry, ang, 0, Math.PI * 2);
        context.fill();
        context.restore();
        context.beginPath();
        context.ellipse(px + W * ox, hCY + H * oy, W * rx, H * ry, ang, 0, Math.PI * 2);
        context.stroke();
    }

    // 口针（长线向前伸出）
    context.beginPath();
    context.moveTo(hCX - hR, hCY + H * 0.02);
    context.lineTo(px + W * 0.03, hCY + H * 0.20);
    context.stroke();

    // 头部
    context.beginPath();
    context.arc(hCX, hCY, hR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 腿（6条细线）
    context.save();
    context.globalAlpha = 0.65;
    for (let i = 0; i < 3; i++) {
        const lx = px + W * (0.32 + i * 0.10);
        const ly = hCY + H * 0.12;
        context.beginPath();
        context.moveTo(lx, ly);
        context.lineTo(lx - W * 0.06, ly + H * 0.30);
        context.stroke();
        context.beginPath();
        context.moveTo(lx, ly);
        context.lineTo(lx + W * 0.04, ly + H * 0.32);
        context.stroke();
    }
    context.restore();

    // 触角（从头顶向上）
    context.beginPath();
    context.moveTo(hCX, hCY - hR);
    context.quadraticCurveTo(hCX - W * 0.06, hCY - H * 0.24, hCX - W * 0.10, hCY - H * 0.30);
    context.stroke();
});

// ── 毛毛虫 (caterpillar) ──────────────────────────────────────────────────────
// 侧视（水平）：5个圆形节段 + 较大头部 + 腿 + 触角
const caterpillarDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cy    = py + H * 0.52;
    const segR  = H * 0.16;
    const headR = H * 0.19;
    const n     = 5;
    // 节段 X 位置（从右往左排，头在最左）
    const segXs = [];
    for (let i = n - 1; i >= 0; i--) {
        segXs.push(px + W * (0.88 - i * 0.14));
    }
    const headX = px + W * 0.14;

    // 腿（每节段下方一对）
    context.save();
    context.globalAlpha = 0.70;
    for (const sx of segXs) {
        for (const s of [-1, 1]) {
            context.beginPath();
            context.moveTo(sx + s * segR * 0.4, cy + segR * 0.92);
            context.lineTo(sx + s * segR * 0.7, cy + segR * 1.50);
            context.stroke();
        }
    }
    context.restore();

    // 节段（从后向前，依次绘制）
    for (const sx of segXs) {
        context.beginPath();
        context.arc(sx, cy, segR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }

    // 头部
    context.beginPath();
    context.arc(headX, cy - H * 0.02, headR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 眼睛
    context.save();
    context.globalAlpha = 0.30;
    context.beginPath();
    context.arc(headX - headR * 0.22, cy - headR * 0.36, headR * 0.26, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.beginPath();
    context.arc(headX - headR * 0.22, cy - headR * 0.36, headR * 0.26, 0, Math.PI * 2);
    context.stroke();

    // 触角
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(headX - headR * 0.20, cy - headR * 0.80);
        context.quadraticCurveTo(
            headX - headR * 0.60, cy - headR * 1.50,
            headX - headR * 0.50 + s * headR * 0.50, cy - headR * 1.80
        );
        context.stroke();
        context.beginPath();
        context.arc(headX - headR * 0.50 + s * headR * 0.50, cy - headR * 1.80,
            Math.max(bw * 1.5, 1.5), 0, Math.PI * 2);
        context.fill();
    }
});

// ── 蜗牛 (snail) ──────────────────────────────────────────────────────────────
// 侧视：参数化对数螺旋壳 + 蛞蝓形软体足 + 两根眼触角
const snailDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const shCX = px + W * 0.62;
    const shCY = py + H * 0.42;
    const shR  = Math.min(W, H) * 0.32;

    // ── 软体足（蛞蝓形，从壳底向左延伸）──
    context.beginPath();
    context.moveTo(shCX - shR * 0.82, shCY + shR * 0.52);   // 壳底上连接
    context.bezierCurveTo(
        px + W * 0.34, py + H * 0.62,
        px + W * 0.14, py + H * 0.64,
        px + W * 0.05, py + H * 0.72    // 头部前端顶
    );
    context.bezierCurveTo(
        px + W * 0.02, py + H * 0.80,
        px + W * 0.08, py + H * 0.88,
        px + W * 0.18, py + H * 0.90    // 腹足底
    );
    context.bezierCurveTo(
        px + W * 0.38, py + H * 0.92,
        px + W * 0.52, py + H * 0.90,
        shCX - shR * 0.80, shCY + shR * 0.80   // 壳底下连接
    );
    context.closePath();
    context.fill();
    context.stroke();

    // ── 壳（填充圆）──
    context.beginPath();
    context.arc(shCX, shCY, shR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 对数螺旋纹（2圈，从外向内）──
    context.save();
    context.globalAlpha = 0.40;
    context.lineWidth = bw * 0.85;
    context.beginPath();
    const turns = 2.0;
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
        const t     = i / steps;
        const r     = shR * 0.88 * Math.pow(0.07, t);   // 对数：外→内
        const theta = Math.PI * 1.25 + t * turns * Math.PI * 2;  // 从左下角开始卷
        const x = shCX + r * Math.cos(theta);
        const y = shCY + r * Math.sin(theta);
        if (i === 0) context.moveTo(x, y);
        else         context.lineTo(x, y);
    }
    context.stroke();
    context.restore();

    // ── 眼触角（两根 V 形触角，末端眼球）──
    const hX = px + W * 0.12;
    const hY = py + H * 0.74;
    for (const s of [-1, 1]) {
        const tipX = hX + s * W * 0.08;
        const tipY = hY - H * 0.26;
        context.beginPath();
        context.moveTo(hX + s * W * 0.01, hY);
        context.quadraticCurveTo(
            hX + s * W * 0.04, hY - H * 0.14,
            tipX, tipY
        );
        context.stroke();
        context.beginPath();
        context.arc(tipX, tipY, Math.max(bw * 2.0, 2.2), 0, Math.PI * 2);
        context.fill();
    }

    // ── 头部（软体前端小圆）──
    context.beginPath();
    context.arc(hX, hY + H * 0.04, H * 0.074, 0, Math.PI * 2);
    context.fill();
    context.stroke();
});

// ══ makeIcon 导出 ══════════════════════════════════════════════════════════════
const butterfly  = makeIcon('butterfly',   90, 90, butterflyDrawer);
const bee        = makeIcon('bee',         90, 90, beeDrawer);
const ant        = makeIcon('ant',         90, 90, antDrawer);
const beetle     = makeIcon('beetle',      90, 90, beetleDrawer);
const ladybug    = makeIcon('ladybug',     90, 90, ladybugDrawer);
const spider     = makeIcon('spider',      90, 90, spiderDrawer);
const dragonfly  = makeIcon('dragonfly',   90, 90, dragonflyDrawer);
const mosquito   = makeIcon('mosquito',    90, 90, mosquitoDrawer);
const caterpillar = makeIcon('caterpillar', 90, 90, caterpillarDrawer);
const snail      = makeIcon('snail',       90, 90, snailDrawer);

export {
    butterfly, bee, ant, beetle, ladybug,
    spider, dragonfly, mosquito, caterpillar, snail,
};
