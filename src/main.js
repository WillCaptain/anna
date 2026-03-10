/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Anna — 主入口
 * 负责路由调度：首页 <-> 各工作区视图
 */

import '@anna/common/extensions/arrayExtension.js';
import '@anna/common/extensions/canvasExtension.js';
import '@anna/common/extensions/stringExtension.js';
import {initWhiteboard} from './whiteboard.js';

// ─── 视图路由 ────────────────────────────────────────────────────────────────

const homeView       = document.getElementById('home-view');
const whiteboardView = document.getElementById('whiteboard-view');

function showView(name) {
    homeView.classList.toggle('hidden', name !== 'home');
    whiteboardView.classList.toggle('hidden', name !== 'whiteboard');
}

function getRoute() {
    const hash = location.hash.replace('#/', '').trim();
    return hash || 'home';
}

function navigate(route) {
    history.pushState(null, '', `#/${route}`);
    renderRoute(route);
}

let whiteboardReady = false;

function renderRoute(route) {
    if (route === 'whiteboard') {
        showView('whiteboard');
        if (!whiteboardReady) {
            whiteboardReady = true;
            initWhiteboard().catch(err => {
                console.error('[Anna] 白板初始化失败:', err);
            });
        }
    } else {
        showView('home');
    }
}

// ─── 首页按钮 ─────────────────────────────────────────────────────────────────

document.getElementById('open-whiteboard').addEventListener('click', () => {
    navigate('whiteboard');
});

document.getElementById('btn-home').addEventListener('click', () => {
    navigate('home');
});

window.addEventListener('popstate', () => {
    renderRoute(getRoute());
});

// ─── 初始路由 ─────────────────────────────────────────────────────────────────
renderRoute(getRoute());
