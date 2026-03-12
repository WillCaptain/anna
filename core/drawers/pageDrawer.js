/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {shapeComment} from '../shapes/rectangle.js';
import {getPixelRatio} from '../../common/util.js';

/**
 * 为page绘制基本图形，包括背景，图标
 * 辉子 2021
 */
const pageDrawer = (page, div, x, y) => {
  function pageContainerId(p) {
    return `pageContainer:${p.id}`;
  }

  let self = {};
  self.type = 'page drawer';
  self.parent = div;
  self.background = page.graph.createDom(page.div, 'div', `background:${page.id}`, page.id);
  self.background.style.width = `${div.clientWidth}px`;
  self.background.style.height = `${div.clientHeight}px`;
  self.background.style.position = 'absolute';
  self.background.style.zIndex = 0;
  div.parentNode.appendChild(self.background);


  self.container = page.graph.createDom(page.div, 'div', pageContainerId(page), page.id);
  self.container.style.width = 'fit-content';
  self.container.style.height = 'fit-content';
  self.container.style.position = 'absolute';
  self.container.style.top = '0';
  self.container.style.left = '0';
  // 坐标公式 calculateX/Y 以左上角为缩放原点推导，必须与此一致
  self.container.style.transformOrigin = '0 0';
  div.appendChild(self.container);
  self.appendChild = child => {
    if (child.parent.parentNode === self.container) {
      return;
    }
    self.container.appendChild(child.parent);
  };

  self.pageIdChange = () => {
    page.graph.setElementId(self.container, pageContainerId(page));
  };

  // ─── LOD 覆盖层 ────────────────────────────────────────────────────────────
  // 所有 LOD >= 2（屏幕 < 8px）的微小形状，统一画在这个全屏 canvas 上，
  // 而不是各自维护独立 canvas（减少 GPU 合成层数）。
  // 长线、大形状不受影响，它们始终走自己的 canvas 路径。
  let _lodCanvas = null;
  let _lodScheduled = false;
  let _prevScaleX = page.scaleX;

  const _getLodCanvas = () => {
    if (!_lodCanvas) {
      _lodCanvas = document.createElement('canvas');
      _lodCanvas.style.cssText =
        'position:absolute;top:0;left:0;pointer-events:none;z-index:4;';
      div.appendChild(_lodCanvas);
    }
    return _lodCanvas;
  };

  self.scheduleLODRedraw = () => {
    if (_lodScheduled) return;
    _lodScheduled = true;
    requestAnimationFrame(() => {
      _lodScheduled = false;
      self.drawLOD();
    });
  };

  self.drawLOD = () => {
    const w = div.clientWidth;
    const h = div.clientHeight;
    if (w === 0 || h === 0) return;
    const canvas = _getLodCanvas();
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    const sx = page.scaleX, sy = page.scaleY;
    const ox = page.x,      oy = page.y;

    page.sm.getShapes(s => {
      if (!s.visible || s.globalAlpha === 0) return false;
      const lod = s.getLODLevel?.() ?? 0;
      return lod >= 2;
    }).forEach(s => {
      const screenX = (s.x + ox) * sx;
      const screenY = (s.y + oy) * sy;
      const screenW = Math.abs(s.width  * sx);
      const screenH = Math.abs(s.height * sy);
      // 视口外的 LOD 形状直接跳过
      if (screenX + screenW < 0 || screenX > w || screenY + screenH < 0 || screenY > h) return;

      const lod = s.getLODLevel();
      ctx.globalAlpha = s.globalAlpha ?? 1;
      if (lod >= 3) {
        // 单点
        ctx.fillStyle = s.getBorderColor?.() || s.getBackColor?.() || '#888';
        ctx.fillRect(screenX + screenW / 2 - 1, screenY + screenH / 2 - 1, 2, 2);
      } else {
        // 简化方块
        ctx.fillStyle   = s.getBackColor?.()   || '#888';
        ctx.strokeStyle = s.getBorderColor?.() || '#666';
        ctx.lineWidth   = 0.5;
        ctx.fillRect(  screenX, screenY, screenW, screenH);
        ctx.strokeRect(screenX, screenY, screenW, screenH);
      }
    });
  };
  // ────────────────────────────────────────────────────────────────────────────

  self.transform = () => {
    const scaleChanged = _prevScaleX !== page.scaleX;
    _prevScaleX = page.scaleX;

    let scale = `scale(${page.scaleX},${page.scaleY})`;
    let translate = ` translate(${page.x}px,${page.y}px)`;
    self.container.style.transform = scale + translate;
    self.drawBackground();
    self.drawRegions();
    page.sm.getShapes().forEach(s => {
      if (s.refresh) {
        s.refresh();
      }
      // 重新检查曾被性能裁剪隐藏的形状（视口剔除 / LOD）
      // 仅 LOD 形状在缩放时需要重检（缩放改变 LOD 等级）
      // 视口裁剪的形状在每次 pan/zoom 后都需要重检
      if (s._hiddenByPerf) {
        s.invalidateAlone?.();
      }
    });
    // LOD 覆盖层跟随 pan/zoom 重绘（形状的屏幕坐标已变）
    self.scheduleLODRedraw();
    // 多选包围框跟随 pan/zoom 重绘
    page.interactDrawer?.groupBox?.draw();
  };

  self.move = () => {
  };

  self.containsBorder = () => true;
  self.reset = () => {
    self.background.style.width = '100%';
    self.background.style.height = '100%';
    self.background.style.overflow = 'hidden';
    self.draw();
  };

  self.drawBackground = () => {
    self.background.style.backgroundColor = page.getBackColor();
    const grid = page.backgroundGrid;
    if (grid && grid !== '') {
      let backgroundImage;
      let backgroundGridSize = page.backgroundGridSize * page.scaleX;
      let backgroundGridMargin = page.backgroundGridMargin * page.scaleX;
      if (backgroundGridMargin === 0) {
        backgroundGridMargin = backgroundGridSize;
      }
      let backgroundSize = `${String(backgroundGridSize)}px ${String(backgroundGridSize)}px`;
      switch (grid) {
        case 'horizontal': {
          backgroundImage = `linear-gradient(to top, transparent ${backgroundGridMargin - 1}px, #88888866 ${backgroundGridMargin}px, transparent ${backgroundGridMargin}px)`;
          break;
        }
        case 'square': {
          backgroundImage = `linear-gradient(to top, transparent ${backgroundGridMargin - 1}px, #88888866 ${backgroundGridMargin}px), linear-gradient(to right, transparent ${backgroundGridMargin - 1}px, #88888866 ${backgroundGridMargin}px)`;
          break;
        }
        case 'point': {
          const pointSize = 1.5 * page.scaleX;
          backgroundImage = `radial-gradient(circle at ${pointSize}px ${pointSize}px, ${page.gridColor} ${pointSize}px, transparent 0)`;
          break;
        }
        default:
          break;
      }
      if (backgroundImage) {
        self.background.style.backgroundSize = backgroundSize;
        self.background.style.backgroundImage = backgroundImage;
      }
      self.background.style.backgroundPosition = `${page.x * page.scaleX}px ${page.y * page.scaleY}px`;
    } else if (page.background && page.background !== '') {
      self.background.style.backgroundSize = '100% 100%';
      self.background.style.backgroundImage = `url(${page.background})`;
    } else {
      self.background.style.backgroundImage = '';
    }
  };

  /**
   * 绘制.
   */
  self.draw = () => {
    self.drawBackground();
    self.drawRegions();
  };

  self.drawRegions = () => {
    const regions = page.regions.filter(r => r.getVisibility());
    for (let i = 0; i < div.childElementCount; i++) {
      const c = div.children[i];
      (!regions.find(r => r.getId() === c.id)) && (c.id.indexOf('region-') >= 0) && (c.style.visibility = 'hidden');
    }
    regions.forEach(r => {
      const canvas = page.graph.createDom(page.div, 'canvas', r.getId(), page.id);
      div.appendChild(canvas);

      canvas.style.position = 'absolute';
      r.context = canvas.getContext('2d');
      r.draw(0, 0);
    });
  };

  let invalidCommentsPool = [];
  let commentCursor = 0;

  self.clear = () => {
    commentCursor = 0;
    invalidCommentsPool = [];
  };

  function setCommentPosition(c) {
    c.drawer.parent.style.transform = `translate(0px, ${c.yCurrent}px)`;
    c.drawer.parent.style.opacity = c.opacity > 1 ? 1 : c.opacity;
  }

  function initComment(c, maxOffsetMap, host, OFFSET, comment) {
    c.yoffset = maxOffsetMap[host.id] + c.height + 1;
    maxOffsetMap[host.id] = c.yoffset;
    c.yTarget = c.yoffset + (host === page ? (-host.y + 30) : host.y);
    c.yCurrent = c.yTarget + OFFSET;
    c.text = comment;
    c.editable = false;
    c.opacity = 0.7;
    c.stage = 'showing';
  }

  function moveComments(showingShapes) {
    showingShapes.forEach(c => {
      if (c.stage === 'showing') {
        c.opacity += 0.002;
        if (c.yCurrent > c.yTarget) {
          c.yCurrent -= 1;
          setCommentPosition(c);
        }
        if (c.opacity >= 1) {
          c.stage = 'disappearing';
        }
      } else {
        c.drawer.parent.style.opacity = c.opacity > 1 ? 1 : c.opacity;
        c.opacity -= 0.1;
        if (c.opacity <= 0) {
          c.visible = false;
          invalidCommentsPool.push(c);
        }
      }
    });
  }

  function createNewComment(host, COMMENT_HEIGHT, maxOffsetMap, OFFSET, comment) {
    let x1 = host === page ? -host.x : host.x;
    let y1 = host === page ? (-host.y + 30) : host.y;
    return page.ignoreReact(() => {
      const c = shapeComment(x1 + 5, y1 + 5, host);
      c.autoWidth = true;
      c.pad = 1;
      c.height = COMMENT_HEIGHT * getPixelRatio();
      c.fontSize = 20 * getPixelRatio();
      c.backColor = 'lightyellow';
      c.minWidth = undefined;
      c.isDisplay = true;
      initComment(c, maxOffsetMap, host, OFFSET, comment);
      return c;
    });
  }

  function reuseComment(maxOffsetMap, host, OFFSET, comment) {
    const c = invalidCommentsPool.pop();
    page.ignoreReact(() => {
      c.visible = true;
      initComment(c, maxOffsetMap, host, OFFSET, comment);
    });
    return c;
  }

  function initCommentOffset(showingShapes, maxOffsetMap, host, COMMENT_HEIGHT) {
    if (showingShapes.length === 0) {
      maxOffsetMap[host.id] = -COMMENT_HEIGHT;
    } else {
      const sameShapeComments = showingShapes.filter(c => c.host === host.id);
      maxOffsetMap[host.id] = sameShapeComments.length === 0 ? -COMMENT_HEIGHT : sameShapeComments.max(c => c.yoffset);
    }
  }

  const MAX_SHOW_COUNT = 20;
  const OFFSET = 50;
  self.drawDynamic = () => {
    if (!page.commentsToShow || page.commentsToShow.length === 0) {
      return;
    }
    let showingShapes = page.sm.getShapes(s => s.isType('shapeComment') && s.visible);
    moveComments(showingShapes);
    showingShapes = showingShapes.filter(s => s.visible);
    let showingCount = showingShapes.length;

    let commentCount = page.commentsToShow ? page.commentsToShow.length : 0;
    if (commentCursor === commentCount) {
      return;
    }
    let maxOffsetMap = {};
    const COMMENT_HEIGHT = 30;
    while (commentCursor < commentCount) {
      let commentWithHost = page.commentsToShow[commentCursor];
      let commentStr = commentWithHost.comment;
      let host = commentWithHost.shape;
      if (commentStr.trim() === '') {
        commentCursor++;
        continue;
      }
      if (showingCount >= MAX_SHOW_COUNT) {
        return;
      }
      if (!maxOffsetMap[host.id]) {
        initCommentOffset(showingShapes, maxOffsetMap, host, COMMENT_HEIGHT);
      }
      if (maxOffsetMap[host.id] > 600) {
        return;
      }

      let comment;
      if (invalidCommentsPool.length === 0) {
        comment = createNewComment(host, COMMENT_HEIGHT, maxOffsetMap, OFFSET, commentStr);
      } else {
        comment = reuseComment(maxOffsetMap, host, OFFSET, commentStr);
      }
      comment.invalidate();
      setCommentPosition(comment);
      commentCursor++;
      showingCount++;
    }
  };
  return self;
};

export {pageDrawer};
