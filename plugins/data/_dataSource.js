/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  图表 API 数据源模块
 *
 *  安全模型：
 *    - URL / Method / Path / Headers 模板 → 存储在 shape 属性中（随白板导出）
 *    - 认证令牌（实际值）→ 通过 {{SECRET:NAME}} 占位符引用，仅存储在本设备 localStorage
 *    - 缓存数据 → 存储在本设备 localStorage（按 shape id 索引），不随白板导出
 *
 *  调用方示例：
 *    shape.dataSourceHeaders = '{"Authorization": "Bearer {{SECRET:MY_TOKEN}}"}'
 *    setSecret('MY_TOKEN', 'eyJhbGci...')
 *--------------------------------------------------------------------------------------------*/

// ── 密钥管理（设备本地，不随白板导出）────────────────────────────────────────

const SECRET_PFX = 'anna_secret_';

/** 设置设备本地密钥 */
export function setSecret(name, value) {
    localStorage.setItem(SECRET_PFX + name, value);
}

/** 读取设备本地密钥 */
export function getSecret(name) {
    return localStorage.getItem(SECRET_PFX + name) ?? '';
}

/** 解析 headers 模板，将 {{SECRET:NAME}} 替换为实际密钥值 */
function resolveTemplate(str) {
    return (str || '').replace(/\{\{SECRET:([^}]+)\}\}/g, (_, n) => getSecret(n.trim()));
}

/** 解析 headers JSON 字符串（含密钥替换），失败时返回空对象 */
function parseHeaders(str) {
    const resolved = resolveTemplate((str || '').trim());
    if (!resolved) return {};
    try { return JSON.parse(resolved); } catch { return {}; }
}

// ── JSONPath 提取（支持 dot 路径 + 数组下标）──────────────────────────────────

/**
 * 从对象中按路径提取值。
 * 示例：'result.data[0].items' → obj.result.data[0].items
 */
function extractPath(obj, path) {
    if (!path?.trim()) return obj;
    return path.trim().split('.').reduce((acc, seg) => {
        if (acc == null) return null;
        const m = seg.match(/^([^\[]+)(?:\[(\d+)\])?$/);
        if (!m) return acc[seg];
        const v = acc[m[1]];
        return m[2] != null ? (Array.isArray(v) ? v[parseInt(m[2])] : null) : v;
    }, obj);
}

// ── localStorage 缓存 ─────────────────────────────────────────────────────────

const cKey = id => `anna_ds_c_${id}`;
const tKey = id => `anna_ds_t_${id}`;

/** 读取上次成功缓存的数据（可能为 null） */
export function loadCachedData(shapeId) {
    try {
        const raw = localStorage.getItem(cKey(shapeId));
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveCache(shapeId, data) {
    try {
        localStorage.setItem(cKey(shapeId), JSON.stringify(data));
        localStorage.setItem(tKey(shapeId), String(Date.now()));
    } catch {}
}

/**
 * 返回"上次成功获取"的时间描述，如 "刚刚" / "5 分钟前"。
 * 若从未成功获取，返回 null。
 */
export function getCacheAge(shapeId) {
    const ts = parseInt(localStorage.getItem(tKey(shapeId)) ?? '0', 10);
    if (!ts) return null;
    const mins = Math.round((Date.now() - ts) / 60000);
    if (mins === 0) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.round(mins / 60);
    return `${hrs} 小时前`;
}

// ── 数据拉取 ─────────────────────────────────────────────────────────────────

/**
 * 从 shape.dataSourceUrl 拉取数据。
 *
 * 成功：自动写入 localStorage 缓存，返回 { ok: true, data }
 * 失败：不清除旧缓存，返回 { ok: false, error: string }
 *      → 调用方可继续通过 loadCachedData(shape.id) 使用上次数据
 *
 * @param {object} shape - 含 dataSourceUrl / dataSourceMethod / dataSourcePath /
 *                         dataSourceHeaders / dataSourceBody 属性的 shape 对象
 */
export async function fetchDataSource(shape) {
    const url    = (shape.dataSourceUrl    || '').trim();
    const method = (shape.dataSourceMethod || 'GET').toUpperCase();
    const path   = (shape.dataSourcePath   || '').trim();
    const hdrs   = parseHeaders(shape.dataSourceHeaders || '');

    if (!url) return { ok: false, error: '未配置 URL' };

    try {
        const opts = { method, headers: hdrs };

        if (method === 'POST') {
            const body = (shape.dataSourceBody || '').trim();
            if (body) {
                opts.body = body;
                if (!hdrs['Content-Type'] && !hdrs['content-type']) {
                    opts.headers = { 'Content-Type': 'application/json', ...hdrs };
                }
            }
        }

        const res  = await fetch(url, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data = extractPath(json, path);

        if (data != null) saveCache(shape.id, data);

        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}
