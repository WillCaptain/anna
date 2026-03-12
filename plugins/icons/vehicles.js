/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  分类：车辆
 *  图标：car, truck, bus, bicycle, motorcycle, airplane, helicopter,
 *        ship, train, rocket, submarine, ambulance, fireEngine,
 *        tractor, sailboat, taxi, scooter, drone, forklift, tank
 *--------------------------------------------------------------------------------------------*/

import {makeIconDrawer, makeIcon} from './_iconBase.js';

// ── Bootstrap Icons SVG 路径渲染辅助（viewBox 16×16）─────────────────────────
function _svgPath16(context, px, py, W, H, bw, d) {
    const sx = W / 16, sy = H / 16;
    context.save();
    context.translate(px, py);
    context.scale(sx, sy);
    context.lineWidth = bw / Math.min(sx, sy);
    const p = new Path2D(d);
    context.fill(p);
    context.stroke(p);
    context.restore();
}

// ── 侧视汽车车身辅助（taxi / ambulance / fireEngine 共用）────────────────────
// wR=轮半径, w1X/w2X=前后轮X, wCY=轮心Y
function _sideCarBody(ctx, px, py, W, H, wR, w1X, w2X, wCY) {
    const bY = wCY - wR * 0.35;
    ctx.beginPath();
    ctx.moveTo(px + W * 0.04, bY);
    ctx.quadraticCurveTo(px + W * 0.07, py + H * 0.54, px + W * 0.18, py + H * 0.40);
    ctx.quadraticCurveTo(px + W * 0.30, py + H * 0.17, px + W * 0.40, py + H * 0.13);
    ctx.lineTo(px + W * 0.62, py + H * 0.13);
    ctx.quadraticCurveTo(px + W * 0.73, py + H * 0.17, px + W * 0.81, py + H * 0.36);
    ctx.quadraticCurveTo(px + W * 0.92, py + H * 0.50, px + W * 0.96, py + H * 0.60);
    ctx.lineTo(px + W * 0.96, bY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 窗户
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(px + W * 0.31, py + H * 0.17);
    ctx.lineTo(px + W * 0.40, py + H * 0.14);
    ctx.lineTo(px + W * 0.61, py + H * 0.14);
    ctx.lineTo(px + W * 0.71, py + H * 0.36);
    ctx.lineTo(px + W * 0.31, py + H * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(px + W * 0.31, py + H * 0.17);
    ctx.lineTo(px + W * 0.40, py + H * 0.14);
    ctx.lineTo(px + W * 0.61, py + H * 0.14);
    ctx.lineTo(px + W * 0.71, py + H * 0.36);
    ctx.lineTo(px + W * 0.31, py + H * 0.36);
    ctx.closePath();
    ctx.stroke();
    // 车轮
    for (const wx of [w1X, w2X]) {
        ctx.beginPath();
        ctx.arc(wx, wCY, wR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(wx, wCY, wR * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

// ══ 路径型图标（Bootstrap Icons 16×16）══════════════════════════════════════

// ── 轿车 (car) — car-front-fill ──────────────────────────────────────────────
const carDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848' +
        'c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413' +
        'c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338' +
        'c-1.292.048-2.745.088-4 .088s-2.708-.04-4-.088V13.5a.5.5 0 0 1-.5.5h-2' +
        'a.5.5 0 0 1-.5-.5v-1.892c-.61-.454-1-1.183-1-1.997v-.413a2.5 2.5 0 0 1 .049-.49' +
        'l.335-1.68c.11-.546.465-1.012.964-1.261a.8.8 0 0 0 .381-.404l.792-1.848Z' +
        'M3 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2m10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2' +
        'M6 8a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2z' +
        'M2.906 5.189a.51.51 0 0 0 .497.731c.91-.073 3.35-.17 4.597-.17s3.688.097 4.597.17' +
        'a.51.51 0 0 0 .497-.731l-.956-1.913A.5.5 0 0 0 11.691 3H4.309a.5.5 0 0 0-.447.276Z'
    ));

// ── 卡车 (truck) — truck-front-fill ──────────────────────────────────────────
const truckDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M3.5 0A2.5 2.5 0 0 0 1 2.5v9c0 .818.393 1.544 1 2v2a.5.5 0 0 0 .5.5h2' +
        'a.5.5 0 0 0 .5-.5V14h6v1.5a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2' +
        'c.607-.456 1-1.182 1-2v-9A2.5 2.5 0 0 0 12.5 0z' +
        'M3 3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3.9c0 .625-.562 1.092-1.17.994' +
        'C10.925 7.747 9.208 7.5 8 7.5s-2.925.247-3.83.394A1.008 1.008 0 0 1 3 6.9z' +
        'm1 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2m8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2' +
        'm-5-2h2a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2'
    ));

// ── 公交车 (bus) — bus-front-fill ─────────────────────────────────────────────
const busDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M16 7a1 1 0 0 1-1 1v3.5c0 .818-.393 1.544-1 2v2a.5.5 0 0 1-.5.5h-2' +
        'a.5.5 0 0 1-.5-.5V14H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2' +
        'a2.5 2.5 0 0 1-1-2V8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1V2.64' +
        'C1 1.452 1.845.408 3.064.268A44 44 0 0 1 8 0c2.1 0 3.792.136 4.936.268' +
        'C14.155.408 15 1.452 15 2.64V4a1 1 0 0 1 1 1z' +
        'M3.552 3.22A43 43 0 0 1 8 3c1.837 0 3.353.107 4.448.22a.5.5 0 0 0 .104-.994' +
        'A44 44 0 0 0 8 2c-1.876 0-3.426.109-4.552.226a.5.5 0 1 0 .104.994' +
        'M8 4c-1.876 0-3.426.109-4.552.226A.5.5 0 0 0 3 4.723v3.554' +
        'a.5.5 0 0 0 .448.497C4.574 8.891 6.124 9 8 9s3.426-.109 4.552-.226' +
        'A.5.5 0 0 0 13 8.277V4.723a.5.5 0 0 0-.448-.497A44 44 0 0 0 8 4' +
        'm-3 7a1 1 0 1 0-2 0 1 1 0 0 0 2 0m8 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0' +
        'm-7 0a1 1 0 0 0 1 1h2a1 1 0 1 0 0-2H7a1 1 0 0 0-1 1'
    ));

// ── 自行车 (bicycle) — Bootstrap bicycle ──────────────────────────────────────
const bicycleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M4 4.5a.5.5 0 0 1 .5-.5H6a.5.5 0 0 1 0 1v.5h4.14l.386-1.158A.5.5 0 0 1 11 4h1' +
        'a.5.5 0 0 1 0 1h-.64l-.311.935.807 1.29a3 3 0 1 1-.848.53l-.508-.812' +
        '-2.076 3.322A.5.5 0 0 1 8 10.5H5.959a3 3 0 1 1-1.815-3.274L5 5.856V5h-.5' +
        'a.5.5 0 0 1-.5-.5m1.5 2.443-.508.814c.5.444.85 1.054.967 1.743h1.139z' +
        'M8 9.057 9.598 6.5H6.402zM4.937 9.5a2 2 0 0 0-.487-.877l-.548.877z' +
        'M3.603 8.092A2 2 0 1 0 4.937 10.5H3a.5.5 0 0 1-.424-.765z' +
        'm7.947.53a2 2 0 1 0 .848-.53l1.026 1.643a.5.5 0 1 1-.848.53z'
    ));

// ── 飞机 (airplane) — airplane-fill ──────────────────────────────────────────
const airplaneDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3' +
        'v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918' +
        '-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318' +
        '-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3' +
        'c0-.568.14-1.271.428-1.849'
    ));

// ── 火车 (train) — train-front-fill ──────────────────────────────────────────
const trainDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M10.621.515C8.647.02 7.353.02 5.38.515c-.924.23-1.982.766-2.78 1.22' +
        'C1.566 2.322 1 3.432 1 4.582V13.5A2.5 2.5 0 0 0 3.5 16h9a2.5 2.5 0 0 0 2.5-2.5' +
        'V4.583c0-1.15-.565-2.26-1.6-2.849-.797-.453-1.855-.988-2.779-1.22Z' +
        'M6.5 2h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1m-2 2h7A1.5 1.5 0 0 1 13 5.5v2' +
        'A1.5 1.5 0 0 1 11.5 9h-7A1.5 1.5 0 0 1 3 7.5v-2A1.5 1.5 0 0 1 4.5 4' +
        'm.5 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0m0 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0' +
        'm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2' +
        'M4 5.5a.5.5 0 0 1 .5-.5h3v3h-3a.5.5 0 0 1-.5-.5zM8.5 8V5h3a.5.5 0 0 1 .5.5v2' +
        'a.5.5 0 0 1-.5.5z'
    ));

// ── 火箭 (rocket) — rocket-fill ──────────────────────────────────────────────
const rocketDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) =>
    _svgPath16(context, px, py, W, H, bw,
        'M10.175 1.991c.81 1.312 1.583 3.43 1.778 6.819l1.5 1.83A2.5 2.5 0 0 1 14 12.202' +
        'V15.5a.5.5 0 0 1-.9.3l-1.125-1.5c-.166-.222-.42-.4-.752-.57' +
        '-.214-.108-.414-.192-.627-.282l-.196-.083C9.7 13.793 8.85 14 8 14' +
        's-1.7-.207-2.4-.635q-.101.044-.198.084c-.211.089-.411.173-.625.281' +
        '-.332.17-.586.348-.752.57L2.9 15.8a.5.5 0 0 1-.9-.3v-3.298' +
        'a2.5 2.5 0 0 1 .548-1.562l.004-.005L4.049 8.81c.197-3.323.969-5.434 1.774-6.756' +
        '.466-.767.94-1.262 1.31-1.57a3.7 3.7 0 0 1 .601-.41A.55.55 0 0 1 8 0' +
        'c.101 0 .17.027.25.064q.056.025.145.075c.118.066.277.167.463.315' +
        '.373.297.85.779 1.317 1.537' +
        'M9.5 6c0-1.105-.672-2-1.5-2s-1.5.895-1.5 2S7.172 8 8 8s1.5-.895 1.5-2' +
        'M8 14.5c.5 0 .999-.046 1.479-.139L8.4 15.8a.5.5 0 0 1-.8 0l-1.079-1.439' +
        'c.48.093.98.139 1.479.139'
    ));

// ══ 手绘型图标 ══════════════════════════════════════════════════════════════

// ── 摩托车 (motorcycle) ───────────────────────────────────────────────────────
// 侧视：两大轮 + 发动机车身 + 座椅 + 车头叉 + 把手
const motorcycleDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.20;
    const wCY = py + H * 0.76;
    const w1X = px + W * 0.22;
    const w2X = px + W * 0.76;

    // 发动机车身
    context.beginPath();
    context.roundRect(px + W * 0.28, py + H * 0.40, W * 0.42, H * 0.24, H * 0.05);
    context.fill();
    context.stroke();

    // 座椅（车身上方）
    context.beginPath();
    context.roundRect(px + W * 0.36, py + H * 0.27, W * 0.32, H * 0.14, H * 0.04);
    context.fill();
    context.stroke();

    // 前叉（从车身前下到前轮）
    context.beginPath();
    context.moveTo(px + W * 0.34, py + H * 0.48);
    context.lineTo(w1X + W * 0.04, wCY - wR * 0.95);
    context.stroke();

    // 把手
    context.beginPath();
    context.moveTo(px + W * 0.31, py + H * 0.31);
    context.lineTo(px + W * 0.46, py + H * 0.31);
    context.stroke();

    // 后摇臂
    context.beginPath();
    context.moveTo(px + W * 0.66, py + H * 0.57);
    context.lineTo(w2X - W * 0.04, wCY - wR * 0.7);
    context.stroke();

    // 车轮（带轮毂镂空）
    for (const wx of [w1X, w2X]) {
        context.beginPath();
        context.arc(wx, wCY, wR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(wx, wCY, wR * 0.52, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
});

// ── 直升机 (helicopter) ──────────────────────────────────────────────────────
// 侧视：泡形机身 + 两片实体旋翼叶 + 尾梁 + 尾旋翼 + 起落架
const helicopterDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const bCX = px + W * 0.36;
    const bCY = py + H * 0.60;

    // 尾梁（锥形，机身右侧延伸）
    context.beginPath();
    context.moveTo(bCX + W * 0.20, bCY - H * 0.14);
    context.lineTo(px + W * 0.97, py + H * 0.36);
    context.lineTo(px + W * 0.97, py + H * 0.50);
    context.lineTo(bCX + W * 0.20, bCY + H * 0.10);
    context.closePath();
    context.fill();
    context.stroke();

    // 机身主体（椭圆）
    context.beginPath();
    context.ellipse(bCX, bCY, W * 0.26, H * 0.22, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 驾驶舱玻璃（前部大窗）
    context.save();
    context.globalAlpha = 0.22;
    context.beginPath();
    context.ellipse(bCX - W * 0.09, bCY - H * 0.04, W * 0.12, H * 0.14, -0.30, 0, Math.PI * 2);
    context.fill();
    context.restore();
    context.beginPath();
    context.ellipse(bCX - W * 0.09, bCY - H * 0.04, W * 0.12, H * 0.14, -0.30, 0, Math.PI * 2);
    context.stroke();

    // 旋翼轴（机身顶到旋翼毂）
    const hubX = bCX + W * 0.02;
    const hubY = py + H * 0.22;
    context.save();
    context.lineWidth = bw * 1.8;
    context.beginPath();
    context.moveTo(bCX, bCY - H * 0.22);
    context.lineTo(hubX, hubY);
    context.stroke();
    context.restore();

    // 主旋翼叶 1（宽扁椭圆，水平）
    context.beginPath();
    context.ellipse(hubX, hubY, W * 0.44, H * 0.038, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 主旋翼叶 2（第二片，旋转约 60°）
    context.save();
    context.translate(hubX, hubY);
    context.rotate(Math.PI * 0.34);
    context.beginPath();
    context.ellipse(0, 0, W * 0.44, H * 0.038, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();

    // 旋翼毂（小圆）
    context.beginPath();
    context.arc(hubX, hubY, W * 0.038, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // 尾旋翼（竖向两叶小椭圆）
    const trX = px + W * 0.96;
    const trY = py + H * 0.38;
    context.beginPath();
    context.ellipse(trX, trY, bw * 1.6, H * 0.10, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.save();
    context.translate(trX, trY);
    context.rotate(Math.PI * 0.45);
    context.beginPath();
    context.ellipse(0, 0, bw * 1.6, H * 0.10, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();

    // 起落架（两根横撑 + 两根纵杆）
    context.beginPath();
    context.moveTo(px + W * 0.12, py + H * 0.88);
    context.lineTo(px + W * 0.58, py + H * 0.88);
    context.stroke();
    for (const sx of [0.18, 0.52]) {
        context.beginPath();
        context.moveTo(px + W * sx, bCY + H * 0.20);
        context.lineTo(px + W * sx, py + H * 0.88);
        context.stroke();
    }
});

// ── 轮船 (ship) ───────────────────────────────────────────────────────────────
// 侧视：梯形船体 + 上层建筑 + 烟囱 + 舷窗
const shipDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    // 船体（梯形底部）
    context.beginPath();
    context.moveTo(px + W * 0.06, py + H * 0.70);
    context.quadraticCurveTo(px + W * 0.02, py + H * 0.82, px + W * 0.12, py + H * 0.90);
    context.lineTo(px + W * 0.88, py + H * 0.90);
    context.quadraticCurveTo(px + W * 0.98, py + H * 0.82, px + W * 0.94, py + H * 0.70);
    context.closePath();
    context.fill();
    context.stroke();

    // 上层建筑
    context.beginPath();
    context.roundRect(px + W * 0.28, py + H * 0.44, W * 0.44, H * 0.26, H * 0.03);
    context.fill();
    context.stroke();

    // 驾驶台（上层建筑顶部）
    context.beginPath();
    context.roundRect(px + W * 0.36, py + H * 0.26, W * 0.28, H * 0.18, H * 0.03);
    context.fill();
    context.stroke();

    // 烟囱
    context.beginPath();
    context.roundRect(px + W * 0.54, py + H * 0.10, W * 0.10, H * 0.18, H * 0.02);
    context.fill();
    context.stroke();

    // 舷窗（三个小圆）
    context.save();
    context.globalAlpha = 0.22;
    for (let i = 0; i < 3; i++) {
        context.beginPath();
        context.arc(px + W * (0.34 + i * 0.12), py + H * 0.57, W * 0.04, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();
    for (let i = 0; i < 3; i++) {
        context.beginPath();
        context.arc(px + W * (0.34 + i * 0.12), py + H * 0.57, W * 0.04, 0, Math.PI * 2);
        context.stroke();
    }
});

// ── 潜水艇 (submarine) ────────────────────────────────────────────────────────
// 侧视：鱼雷形艇体 + 高窄指挥台 + 潜望镜 + 尾翼 + 螺旋桨
const submarineDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const hCX  = px + W * 0.50;
    const hCY  = py + H * 0.65;   // 艇体中心（偏下，给指挥台留空间）
    const hRX  = W  * 0.44;
    const hRY  = H  * 0.16;       // 扁平鱼雷截面
    const hTop = hCY - hRY;       // ≈ H*0.49（艇体顶部）

    // ── 尾部垂直稳定翼（绘制在艇体之前）──
    context.beginPath();
    context.moveTo(hCX + hRX * 0.54, hTop + H * 0.01);
    context.lineTo(hCX + hRX * 0.82, hCY - hRY * 1.80);
    context.lineTo(hCX + hRX * 0.96, hTop + H * 0.02);
    context.closePath();
    context.fill();
    context.stroke();

    // ── 尾部水平稳定翼 ──
    context.beginPath();
    context.moveTo(hCX + hRX * 0.54, hCY + hRY * 0.14);
    context.lineTo(hCX + hRX * 0.82, hCY + hRY * 1.80);
    context.lineTo(hCX + hRX * 0.96, hCY + hRY * 0.30);
    context.closePath();
    context.fill();
    context.stroke();

    // ── 艇体（扁椭圆鱼雷形）──
    context.beginPath();
    context.ellipse(hCX, hCY, hRX, hRY, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // ── 前水平舵（两片，bow planes）──
    for (const s of [-1, 1]) {
        context.beginPath();
        context.moveTo(hCX - hRX * 0.36, hCY + s * hRY * 0.20);
        context.lineTo(hCX - hRX * 0.62, hCY + s * hRY * 1.42);
        context.lineTo(hCX - hRX * 0.18, hCY + s * hRY * 1.20);
        context.closePath();
        context.fill();
        context.stroke();
    }

    // ── 指挥台（高窄梯形，明显突出于艇体顶部）──
    const twCX  = hCX - W * 0.06;
    const twTop = py + H * 0.16;
    context.beginPath();
    context.moveTo(twCX - W * 0.09, hTop + H * 0.008);
    context.lineTo(twCX - W * 0.05, twTop);
    context.lineTo(twCX + W * 0.05, twTop);
    context.lineTo(twCX + W * 0.09, hTop + H * 0.008);
    context.closePath();
    context.fill();
    context.stroke();

    // ── 潜望镜（L 形，末端小圆镜头）──
    context.beginPath();
    context.moveTo(twCX + W * 0.03, twTop);
    context.lineTo(twCX + W * 0.03, py + H * 0.05);
    context.lineTo(twCX + W * 0.17, py + H * 0.05);
    context.stroke();
    context.beginPath();
    context.arc(twCX + W * 0.17, py + H * 0.05, Math.max(bw * 1.8, 2), 0, Math.PI * 2);
    context.fill();

    // ── 螺旋桨（三叶椭圆，围绕艇尾）──
    const prX = hCX + hRX * 0.92;
    const prY = hCY;
    for (const ang of [0.28, 0.28 + Math.PI * 2 / 3, 0.28 + Math.PI * 4 / 3]) {
        context.save();
        context.translate(prX, prY);
        context.rotate(ang);
        context.beginPath();
        context.ellipse(0, -H * 0.086, H * 0.024, H * 0.068, 0.20, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.restore();
    }
});

// ── 救护车 (ambulance) ────────────────────────────────────────────────────────
// 侧视：方形厢式车身 + 医疗十字 + 顶部灯 + 车轮
const ambulanceDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.14;
    const wCY = py + H * 0.86;
    const w1X = px + W * 0.20;
    const w2X = px + W * 0.76;
    const bY  = wCY - wR * 0.38;

    // 厢式车身（平顶方头）
    context.beginPath();
    context.moveTo(px + W * 0.04, bY);
    context.lineTo(px + W * 0.04, py + H * 0.24);
    context.quadraticCurveTo(px + W * 0.04, py + H * 0.16, px + W * 0.12, py + H * 0.16);
    context.lineTo(px + W * 0.96, py + H * 0.16);
    context.lineTo(px + W * 0.96, bY);
    context.closePath();
    context.fill();
    context.stroke();

    // 驾驶室窗
    context.save();
    context.globalAlpha = 0.22;
    context.beginPath();
    context.roundRect(px + W * 0.08, py + H * 0.22, W * 0.18, H * 0.22, H * 0.02);
    context.fill();
    context.restore();
    context.beginPath();
    context.roundRect(px + W * 0.08, py + H * 0.22, W * 0.18, H * 0.22, H * 0.02);
    context.stroke();

    // 医疗十字（车身侧面）
    const cxX = px + W * 0.66;
    const cxY = py + H * 0.36;
    const cxW = W * 0.08;
    const cxH = H * 0.22;
    context.beginPath();
    context.rect(cxX - cxW * 0.5, cxY, cxW, cxH);
    context.fill();
    context.stroke();
    context.beginPath();
    context.rect(cxX - cxW * 1.3, cxY + cxH * 0.35, cxW * 2.6, cxH * 0.30);
    context.fill();
    context.stroke();

    // 顶部警灯
    context.beginPath();
    context.roundRect(px + W * 0.38, py + H * 0.07, W * 0.24, H * 0.09, H * 0.02);
    context.fill();
    context.stroke();

    // 车轮
    for (const wx of [w1X, w2X]) {
        context.beginPath();
        context.arc(wx, wCY, wR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(wx, wCY, wR * 0.48, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
});

// ── 消防车 (fireEngine) ───────────────────────────────────────────────────────
// 侧视：驾驶室 + 长车身 + 顶部梯架 + 车轮
const fireEngineDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.14;
    const wCY = py + H * 0.86;
    const bY  = wCY - wR * 0.38;

    // 驾驶室（前部较高）
    context.beginPath();
    context.moveTo(px + W * 0.03, bY);
    context.lineTo(px + W * 0.03, py + H * 0.22);
    context.quadraticCurveTo(px + W * 0.05, py + H * 0.14, px + W * 0.14, py + H * 0.14);
    context.lineTo(px + W * 0.36, py + H * 0.14);
    context.lineTo(px + W * 0.36, py + H * 0.22);
    context.lineTo(px + W * 0.36, bY);
    context.closePath();
    context.fill();
    context.stroke();

    // 驾驶室窗
    context.save();
    context.globalAlpha = 0.22;
    context.beginPath();
    context.roundRect(px + W * 0.07, py + H * 0.20, W * 0.20, H * 0.22, H * 0.02);
    context.fill();
    context.restore();
    context.beginPath();
    context.roundRect(px + W * 0.07, py + H * 0.20, W * 0.20, H * 0.22, H * 0.02);
    context.stroke();

    // 消防车体（后部低矮）
    context.beginPath();
    context.roundRect(px + W * 0.34, py + H * 0.22, W * 0.62, H * 0.56, H * 0.03);
    context.fill();
    context.stroke();

    // 梯架（顶部：两条平行线）
    const ladY1 = py + H * 0.08;
    const ladY2 = py + H * 0.14;
    context.beginPath();
    context.moveTo(px + W * 0.38, ladY1);
    context.lineTo(px + W * 0.92, ladY1);
    context.moveTo(px + W * 0.38, ladY2);
    context.lineTo(px + W * 0.92, ladY2);
    context.stroke();
    // 梯横档
    for (let i = 0; i < 5; i++) {
        const lx = px + W * (0.42 + i * 0.11);
        context.beginPath();
        context.moveTo(lx, ladY1);
        context.lineTo(lx, ladY2);
        context.stroke();
    }

    // 车轮（三个）
    for (const wx of [px + W * 0.16, px + W * 0.54, px + W * 0.80]) {
        context.beginPath();
        context.arc(wx, wCY, wR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(wx, wCY, wR * 0.48, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
});

// ── 拖拉机 (tractor) ──────────────────────────────────────────────────────────
// 侧视：大后轮 + 小前轮 + 发动机仓 + 驾驶室
const tractorDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const bigR  = H * 0.30;
    const bigCX = px + W * 0.62;
    const bigCY = py + H * 0.68;
    const smlR  = H * 0.16;
    const smlCX = px + W * 0.22;
    const smlCY = py + H * 0.74;

    // 机身/发动机仓
    context.beginPath();
    context.roundRect(px + W * 0.26, py + H * 0.32, W * 0.44, H * 0.32, H * 0.04);
    context.fill();
    context.stroke();

    // 驾驶室（后上方）
    context.beginPath();
    context.roundRect(px + W * 0.52, py + H * 0.18, W * 0.26, H * 0.26, H * 0.04);
    context.fill();
    context.stroke();

    // 驾驶室窗
    context.save();
    context.globalAlpha = 0.22;
    context.beginPath();
    context.roundRect(px + W * 0.55, py + H * 0.21, W * 0.20, H * 0.17, H * 0.03);
    context.fill();
    context.restore();
    context.beginPath();
    context.roundRect(px + W * 0.55, py + H * 0.21, W * 0.20, H * 0.17, H * 0.03);
    context.stroke();

    // 后大轮
    context.beginPath();
    context.arc(bigCX, bigCY, bigR, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(bigCX, bigCY, bigR * 0.50, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';

    // 前小轮
    context.beginPath();
    context.arc(smlCX, smlCY, smlR, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.arc(smlCX, smlCY, smlR * 0.48, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = 'source-over';
});

// ── 帆船 (sailboat) ───────────────────────────────────────────────────────────
// 侧视：船壳 + 桅杆 + 主帆（大三角）+ 前帆（小三角）
const sailboatDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const mX = px + W * 0.45;  // 桅杆X

    // 船壳（弧形底）
    context.beginPath();
    context.moveTo(px + W * 0.08, py + H * 0.76);
    context.quadraticCurveTo(px + W * 0.04, py + H * 0.90, px + W * 0.16, py + H * 0.94);
    context.lineTo(px + W * 0.84, py + H * 0.94);
    context.quadraticCurveTo(px + W * 0.96, py + H * 0.90, px + W * 0.92, py + H * 0.76);
    context.closePath();
    context.fill();
    context.stroke();

    // 甲板线
    context.beginPath();
    context.moveTo(px + W * 0.08, py + H * 0.76);
    context.lineTo(px + W * 0.92, py + H * 0.76);
    context.stroke();

    // 桅杆
    context.beginPath();
    context.moveTo(mX, py + H * 0.76);
    context.lineTo(mX, py + H * 0.06);
    context.stroke();

    // 主帆（大三角，桅杆到右后）
    context.beginPath();
    context.moveTo(mX, py + H * 0.08);
    context.lineTo(mX, py + H * 0.74);
    context.lineTo(px + W * 0.88, py + H * 0.74);
    context.closePath();
    context.save();
    context.globalAlpha = 0.80;
    context.fill();
    context.restore();
    context.stroke();

    // 前帆（小三角，桅杆到船头）
    context.beginPath();
    context.moveTo(mX, py + H * 0.16);
    context.lineTo(mX, py + H * 0.74);
    context.lineTo(px + W * 0.14, py + H * 0.74);
    context.closePath();
    context.save();
    context.globalAlpha = 0.55;
    context.fill();
    context.restore();
    context.stroke();
});

// ── 出租车 (taxi) ─────────────────────────────────────────────────────────────
// 侧视轿车 + 车顶出租车标志灯
const taxiDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.15;
    const wCY = py + H * 0.85;
    const w1X = px + W * 0.23;
    const w2X = px + W * 0.73;
    _sideCarBody(context, px, py, W, H, wR, w1X, w2X, wCY);
    // 出租车顶灯（矩形）
    context.beginPath();
    context.roundRect(px + W * 0.37, py + H * 0.03, W * 0.26, H * 0.10, H * 0.025);
    context.fill();
    context.stroke();
});

// ── 电动车/滑板车 (scooter) ───────────────────────────────────────────────────
// 侧视：踏板车形态，两小轮 + 踏板 + 车把 + 车身
const scooterDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.16;
    const wCY = py + H * 0.82;
    const w1X = px + W * 0.22;
    const w2X = px + W * 0.74;

    // 踏板（水平底板）
    context.beginPath();
    context.roundRect(px + W * 0.18, py + H * 0.58, W * 0.60, H * 0.10, H * 0.03);
    context.fill();
    context.stroke();

    // 前叉立柱（斜向上）
    context.beginPath();
    context.moveTo(px + W * 0.28, py + H * 0.58);
    context.lineTo(px + W * 0.36, py + H * 0.22);
    context.stroke();

    // 车把（T 型）
    context.beginPath();
    context.moveTo(px + W * 0.22, py + H * 0.22);
    context.lineTo(px + W * 0.50, py + H * 0.22);
    context.stroke();

    // 座椅/电池仓（后部）
    context.beginPath();
    context.roundRect(px + W * 0.54, py + H * 0.40, W * 0.28, H * 0.18, H * 0.04);
    context.fill();
    context.stroke();

    // 连接踏板到后轮
    context.beginPath();
    context.moveTo(px + W * 0.74, py + H * 0.58);
    context.lineTo(px + W * 0.78, py + H * 0.68);
    context.stroke();

    // 车轮
    for (const wx of [w1X, w2X]) {
        context.beginPath();
        context.arc(wx, wCY, wR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(wx, wCY, wR * 0.50, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
});

// ── 无人机 (drone) ────────────────────────────────────────────────────────────
// 俯视：十字形机臂 + 四旋翼 + 中央机身
const droneDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const cx  = px + W * 0.50;
    const cy  = py + H * 0.50;
    const armL = W * 0.32;
    const rotR = W * 0.14;

    // 四条机臂（×形）
    const arms = [
        [cx - armL * 0.7, cy - armL * 0.7],
        [cx + armL * 0.7, cy - armL * 0.7],
        [cx + armL * 0.7, cy + armL * 0.7],
        [cx - armL * 0.7, cy + armL * 0.7],
    ];
    for (const [ax, ay] of arms) {
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(ax, ay);
        context.stroke();
    }

    // 旋翼（四个圆）
    for (const [ax, ay] of arms) {
        context.beginPath();
        context.arc(ax, ay, rotR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(ax, ay, rotR * 0.50, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }

    // 中央机身
    context.beginPath();
    context.roundRect(cx - W * 0.14, cy - H * 0.14, W * 0.28, H * 0.28, H * 0.06);
    context.fill();
    context.stroke();

    // 摄像头（底部小圆）
    context.beginPath();
    context.arc(cx, cy + H * 0.06, W * 0.05, 0, Math.PI * 2);
    context.fill();
});

// ── 叉车 (forklift) ───────────────────────────────────────────────────────────
// 侧视：左侧高门架+叉齿 | 右侧紧凑车身+护顶架+配重
const forkliftDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    const wR  = H * 0.12;
    const wCY = py + H * 0.87;
    const bY  = wCY - wR * 0.40;
    const w1X = px + W * 0.40;   // 前轮（在门架下方）
    const w2X = px + W * 0.82;   // 后轮

    // ── 车身（紧凑，右侧偏置）──
    context.beginPath();
    context.roundRect(px + W * 0.32, py + H * 0.42, W * 0.58, bY - py - H * 0.42, H * 0.04);
    context.fill();
    context.stroke();

    // ── 护顶架（Overhead Guard）──
    // 前立柱
    context.beginPath();
    context.moveTo(px + W * 0.36, py + H * 0.42);
    context.lineTo(px + W * 0.36, py + H * 0.14);
    context.stroke();
    // 后立柱
    context.beginPath();
    context.moveTo(px + W * 0.82, py + H * 0.42);
    context.lineTo(px + W * 0.82, py + H * 0.14);
    context.stroke();
    // 顶横梁
    context.beginPath();
    context.moveTo(px + W * 0.36, py + H * 0.14);
    context.lineTo(px + W * 0.82, py + H * 0.14);
    context.stroke();

    // ── 配重（后方弧形凸出）──
    context.beginPath();
    context.arc(px + W * 0.90, py + H * 0.58, H * 0.12, -Math.PI / 2, Math.PI / 2);
    context.fill();
    context.stroke();

    // ── 门架（两条竖轨，左侧明显）──
    const m1X = px + W * 0.18;
    const m2X = px + W * 0.27;
    const mastTop = py + H * 0.08;
    context.beginPath();
    context.moveTo(m1X, mastTop);
    context.lineTo(m1X, bY);
    context.stroke();
    context.beginPath();
    context.moveTo(m2X, mastTop);
    context.lineTo(m2X, bY);
    context.stroke();
    // 门架横档（3 根）
    for (let i = 0; i < 3; i++) {
        const ry = mastTop + (bY - mastTop) * (i * 0.40);
        context.beginPath();
        context.moveTo(m1X, ry);
        context.lineTo(m2X, ry);
        context.stroke();
    }

    // ── 叉齿（两根，粗实线向左伸出）──
    context.save();
    context.lineWidth = bw * 2.2;
    context.lineCap = 'square';
    for (const fy of [0.48, 0.60]) {
        context.beginPath();
        context.moveTo(m1X, py + H * fy);
        context.lineTo(px + W * 0.04, py + H * fy);
        context.stroke();
    }
    context.restore();

    // 叉齿背板（垂直连接两叉齿）
    context.save();
    context.lineWidth = bw * 1.6;
    context.beginPath();
    context.moveTo(m1X, py + H * 0.46);
    context.lineTo(m1X, py + H * 0.62);
    context.stroke();
    context.restore();

    // ── 车轮 ──
    for (const wx of [w1X, w2X]) {
        context.beginPath();
        context.arc(wx, wCY, wR, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(wx, wCY, wR * 0.48, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = 'source-over';
    }
});

// ── 坦克 (tank) ───────────────────────────────────────────────────────────────
// 侧视：履带底盘 + 车体 + 半圆炮塔 + 长炮管（粗，正确 save/restore）
const tankDrawer = makeIconDrawer((context, px, py, W, H, fill, stroke, bw) => {
    // ── 炮管（先画，在装甲板下方）── 注意用 save/restore 控制线宽
    context.save();
    context.lineWidth = bw * 2.8;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(px + W * 0.56, py + H * 0.31);
    context.lineTo(px + W * 0.97, py + H * 0.26);
    context.stroke();
    context.restore();

    // ── 履带（圆角宽矩形）──
    context.beginPath();
    context.roundRect(px + W * 0.04, py + H * 0.60, W * 0.92, H * 0.30, H * 0.10);
    context.fill();
    context.stroke();

    // 履带镂空
    context.globalCompositeOperation = 'destination-out';
    context.beginPath();
    context.roundRect(px + W * 0.10, py + H * 0.66, W * 0.80, H * 0.18, H * 0.07);
    context.fill();
    context.globalCompositeOperation = 'source-over';
    // 重描履带外轮廓
    context.beginPath();
    context.roundRect(px + W * 0.04, py + H * 0.60, W * 0.92, H * 0.30, H * 0.10);
    context.stroke();

    // 负重轮（四个）
    for (let i = 0; i < 4; i++) {
        context.beginPath();
        context.arc(px + W * (0.16 + i * 0.22), py + H * 0.75, W * 0.07, 0, Math.PI * 2);
        context.fill();
        context.stroke();
    }

    // ── 车体上部 ──
    context.beginPath();
    context.roundRect(px + W * 0.08, py + H * 0.40, W * 0.84, H * 0.22, H * 0.04);
    context.fill();
    context.stroke();

    // ── 炮塔（半圆穹顶，弧线向上）──
    const turretCX = px + W * 0.42;
    const turretCY = py + H * 0.41;
    const turretR  = W * 0.26;
    context.beginPath();
    // 从左角到右角经过顶部（顺时针 = 画上半圆 dome）
    context.arc(turretCX, turretCY, turretR, Math.PI, 0, false);
    context.lineTo(turretCX - turretR, turretCY);
    context.closePath();
    context.fill();
    context.stroke();

    // ── 小指挥塔 ──
    context.beginPath();
    context.roundRect(px + W * 0.34, py + H * 0.22, W * 0.12, H * 0.10, H * 0.02);
    context.fill();
    context.stroke();
});

// ══ makeIcon 导出 ══════════════════════════════════════════════════════════════
const car        = makeIcon('car',        90, 90, carDrawer);
const truck      = makeIcon('truck',      90, 90, truckDrawer);
const bus        = makeIcon('bus',        90, 90, busDrawer);
const bicycle    = makeIcon('bicycle',    90, 90, bicycleDrawer);
const motorcycle = makeIcon('motorcycle', 90, 90, motorcycleDrawer);
const airplane   = makeIcon('airplane',   90, 90, airplaneDrawer);
const helicopter = makeIcon('helicopter', 90, 90, helicopterDrawer);
const ship       = makeIcon('ship',       90, 90, shipDrawer);
const train      = makeIcon('train',      90, 90, trainDrawer);
const rocket     = makeIcon('rocket',     90, 90, rocketDrawer);
const submarine  = makeIcon('submarine',  90, 90, submarineDrawer);
const ambulance  = makeIcon('ambulance',  90, 90, ambulanceDrawer);
const fireEngine = makeIcon('fireEngine', 90, 90, fireEngineDrawer);
const tractor    = makeIcon('tractor',    90, 90, tractorDrawer);
const sailboat   = makeIcon('sailboat',   90, 90, sailboatDrawer);
const taxi       = makeIcon('taxi',       90, 90, taxiDrawer);
const scooter    = makeIcon('scooter',    90, 90, scooterDrawer);
const drone      = makeIcon('drone',      90, 90, droneDrawer);
const forklift   = makeIcon('forklift',   90, 90, forkliftDrawer);
const tank       = makeIcon('tank',       90, 90, tankDrawer);

export {
    car, truck, bus, bicycle, motorcycle,
    airplane, helicopter, ship, train, rocket,
    submarine, ambulance, fireEngine, tractor, sailboat,
    taxi, scooter, drone, forklift, tank,
};
