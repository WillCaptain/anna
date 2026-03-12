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
import {t, isZh} from './i18n.js';

// ─── 用户系统（与 12th.ai 主站共享同一 localStorage key） ────────────────────
const AUTH_KEY = 'playground_auth';
function getAuth()   { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } }
function setAuth(v)  { localStorage.setItem(AUTH_KEY, JSON.stringify(v)); }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }

function syncAuthUI() {
    const auth    = getAuth();
    const chip    = document.getElementById('anna-user-chip');
    const chipName = document.getElementById('anna-chip-name');
    const loginBtn = document.getElementById('anna-btn-login');
    if (auth && auth.username) {
        chipName.textContent = auth.username;
        chip.classList.remove('hidden');
        loginBtn.classList.add('hidden');
    } else {
        chip.classList.add('hidden');
        loginBtn.classList.remove('hidden');
    }
}

async function authAction(action) {
    const u = document.getElementById('anna-auth-username').value.trim();
    const p = document.getElementById('anna-auth-password').value.trim();
    const errEl = document.getElementById('anna-auth-error');
    if (!u || !p) { errEl.textContent = t('auth.err1'); return; }
    errEl.textContent = '';
    try {
        const r = await fetch(`/api/auth/${action}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p}),
        });
        const d = await r.json();
        if (!r.ok) { errEl.textContent = d.error || t('auth.err2'); return; }
        setAuth({username: d.username, token: d.token});
        document.getElementById('anna-auth-modal').classList.add('hidden');
        syncAuthUI();
    } catch { errEl.textContent = t('auth.err3'); }
}

function initAuth() {
    const modal    = document.getElementById('anna-auth-modal');
    const loginBtn = document.getElementById('anna-btn-login');
    const closeBtn = document.getElementById('anna-auth-close');
    const cancelBtn = document.getElementById('anna-auth-cancel');
    const logoutBtn = document.getElementById('anna-btn-logout');
    const registerBtn = document.getElementById('anna-auth-register');
    const loginConfirmBtn = document.getElementById('anna-auth-login');

    loginBtn.addEventListener('click', () => {
        document.getElementById('anna-auth-username').value = '';
        document.getElementById('anna-auth-password').value = '';
        document.getElementById('anna-auth-error').textContent = '';
        modal.classList.remove('hidden');
        document.getElementById('anna-auth-username').focus();
    });
    closeBtn.addEventListener('click',  () => modal.classList.add('hidden'));
    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });

    registerBtn.addEventListener('click',     () => authAction('register'));
    loginConfirmBtn.addEventListener('click', () => authAction('login'));
    document.getElementById('anna-auth-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') authAction('login');
    });

    logoutBtn.addEventListener('click', async () => {
        const auth = getAuth();
        if (auth?.token) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {Authorization: `Bearer ${auth.token}`},
            }).catch(() => {});
        }
        clearAuth();
        syncAuthUI();
    });

    syncAuthUI();
}

// ─── 国际化：非中文环境替换所有 data-i18n 文本 ───────────────────────────────
function applyI18n() {
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const text = t(el.dataset.i18n);
        if (text && text !== el.dataset.i18n) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const text = t(el.dataset.i18nTitle);
        if (text && text !== el.dataset.i18nTitle) el.title = text;
    });
}
applyI18n();

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
initAuth();
