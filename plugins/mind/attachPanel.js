/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *
 *  思维导图节点附件面板
 *  支持添加 / 删除 URL 链接，点击直接在新标签页打开
 *--------------------------------------------------------------------------------------------*/

const PANEL_CLASS = 'mind-attach-panel';
const PANEL_STYLES = `
.mind-attach-panel {
  position: fixed;
  z-index: 2000;
  width: 300px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #e0e0e0;
  overflow: hidden;
}
.mind-attach-panel .map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #333;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.mind-attach-panel .map-header-close {
  cursor: pointer;
  font-size: 18px;
  color: #888;
  line-height: 1;
  user-select: none;
}
.mind-attach-panel .map-header-close:hover { color: #fff; }
.mind-attach-panel .map-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}
.mind-attach-panel .map-list:empty::after {
  content: '暂无附件，请添加链接';
  display: block;
  padding: 14px;
  color: #666;
  text-align: center;
}
.mind-attach-panel .map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.mind-attach-panel .map-item:hover { background: #2a2a2a; }
.mind-attach-panel .map-item-icon { font-size: 15px; flex-shrink: 0; }
.mind-attach-panel .map-item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6ab4f5;
  text-decoration: none;
}
.mind-attach-panel .map-item-label:hover { text-decoration: underline; }
.mind-attach-panel .map-item-del {
  flex-shrink: 0;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  padding: 0 2px;
  border-radius: 3px;
  user-select: none;
}
.mind-attach-panel .map-item-del:hover { color: #e05252; background: #2e1e1e; }
.mind-attach-panel .map-add-row {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-top: 1px solid #333;
  flex-shrink: 0;
}
.mind-attach-panel .map-add-input {
  flex: 1;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 5px 9px;
  color: #e0e0e0;
  font-size: 12px;
  outline: none;
  min-width: 0;
}
.mind-attach-panel .map-add-input:focus { border-color: #6ab4f5; }
.mind-attach-panel .map-add-btn {
  background: #0078d4;
  border: none;
  border-radius: 5px;
  padding: 5px 12px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
.mind-attach-panel .map-add-btn:hover { background: #106ebe; }
`;

let styleInjected = false;
const injectStyles = () => {
  if (styleInjected) return;
  const el = document.createElement('style');
  el.id = 'mind-attach-styles';
  el.textContent = PANEL_STYLES;
  document.head.appendChild(el);
  styleInjected = true;
};

/**
 * 关闭所有已打开的附件面板（每次只允许一个打开）
 */
const closeAll = () => {
  document.querySelectorAll(`.${PANEL_CLASS}`).forEach(el => el.remove());
};

/**
 * 将输入字符串规范化为带协议的 URL。
 * 若不含协议头则自动补充 https://
 */
const normalizeUrl = (raw) => {
  const s = raw.trim();
  if (!s) return null;
  try {
    new URL(s);
    return s;
  } catch {
    const withProtocol = `https://${s}`;
    try {
      new URL(withProtocol);
      return withProtocol;
    } catch {
      return null;
    }
  }
};

/**
 * 尝试从 URL 提取简短的显示标签（域名部分）
 */
const labelFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/**
 * 显示附件面板，定位于 topic 节点右侧（或若空间不足则左侧）。
 *
 * @param {object} topic - topic / subTopic shape 对象
 */
export const showAttachPanel = (topic) => {
  injectStyles();
  closeAll();

  // ── 位置计算 ──────────────────────────────────────────────────────────────
  const drawerEl = topic.drawer?.parent;
  const anchorRect = drawerEl ? drawerEl.getBoundingClientRect() : { right: 200, top: 200, left: 200 };
  const panelWidth = 300;
  const margin = 10;

  const panel = document.createElement('div');
  panel.className = PANEL_CLASS;

  // 先挂载再测量高度
  document.body.appendChild(panel);

  const positionPanel = () => {
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    let left = anchorRect.right + margin;
    if (left + panelWidth > vpW) {
      left = anchorRect.left - panelWidth - margin;
    }
    if (left < margin) left = margin;

    let top = anchorRect.top;
    const panelH = panel.offsetHeight;
    if (top + panelH > vpH - margin) {
      top = vpH - panelH - margin;
    }
    if (top < margin) top = margin;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  };

  // ── 渲染函数 ───────────────────────────────────────────────────────────────
  const render = () => {
    const items = topic.attached || [];
    const listHtml = items.map((item, i) => `
      <div class="map-item" data-idx="${i}">
        <span class="map-item-icon">🔗</span>
        <a class="map-item-label" href="${item.url}" target="_blank" rel="noopener noreferrer"
           title="${item.url}">${item.label || labelFromUrl(item.url)}</a>
        <span class="map-item-del" data-del="${i}" title="删除">×</span>
      </div>`).join('');

    panel.innerHTML = `
      <div class="map-header">
        <span>📎 附件与链接</span>
        <span class="map-header-close" id="map-attach-close">×</span>
      </div>
      <div class="map-list">${listHtml}</div>
      <div class="map-add-row">
        <input class="map-add-input" id="map-attach-input"
               type="url" placeholder="粘贴链接 https://..." autocomplete="off" />
        <button class="map-add-btn" id="map-attach-add">添加</button>
      </div>`;

    // ── 事件绑定 ──────────────────────────────────────────────────────────
    panel.querySelector('#map-attach-close').addEventListener('click', () => {
      panel.remove();
    });

    // 删除按钮
    panel.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.del, 10);
        topic.attached.splice(idx, 1);
        topic.invalidateAlone();
        render();
        positionPanel();
      });
    });

    // 添加按钮
    const addItem = () => {
      const input = panel.querySelector('#map-attach-input');
      const url = normalizeUrl(input.value);
      if (!url) {
        input.style.borderColor = '#e05252';
        input.focus();
        setTimeout(() => { input.style.borderColor = ''; }, 1200);
        return;
      }
      if (!topic.attached) topic.attached = [];
      topic.attached.push({ url, label: labelFromUrl(url) });
      topic.invalidateAlone();
      input.value = '';
      render();
      positionPanel();
    };

    panel.querySelector('#map-attach-add').addEventListener('click', addItem);
    panel.querySelector('#map-attach-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addItem();
      if (e.key === 'Escape') panel.remove();
    });

    positionPanel();
    // 自动聚焦输入框
    requestAnimationFrame(() => panel.querySelector('#map-attach-input')?.focus());
  };

  render();

  // ── 点击外部关闭 ───────────────────────────────────────────────────────────
  const onOutsideClick = (e) => {
    if (!panel.contains(e.target)) {
      panel.remove();
      document.removeEventListener('mousedown', onOutsideClick, true);
    }
  };
  // 延迟注册，避免触发面板的当前点击事件
  setTimeout(() => document.addEventListener('mousedown', onOutsideClick, true), 50);
};
