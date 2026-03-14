/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {canvasRectangleDrawer, rectangleDrawer} from './rectangleDrawer.js';

const _containerDrawer = (shape, div, x, y, baseDrawer) => {
  let self = null;

  self = baseDrawer(shape, div, x, y);
  self.container = self.createElement('div', `wrapper:${shape.id}`);
  self.container.innerHTML = ' ';
  self.container.style.position = 'absolute';
  self.container.style.overflow = 'hidden';
  if (!self.parent.contains(self.container)) {
    self.parent.insertBefore(self.container, self.text);
  }

  const textResize = self.textResize;
  self.textResize = (width, height) => {
    if (shape.hideText) {
      return;
    }
    textResize.call(self, width, height);
    self.text.style.background = shape.headColor;
    self.text.style.height = `${shape.getEditRect().height}px`;
  };

  const drawBorder = self.drawBorder;
  self.drawBorder = () => {
    drawBorder.call(self);
    if (shape.hideText) {
      return;
    }
    self.text.style.borderRadius = '';
    self.text.style.borderTopLeftRadius = self.text.style.borderTopRightRadius = `${shape.cornerRadius}px`;
  };

  let parentResize = self.parentResize;
  self.parentResize = (width, height) => {
    parentResize.call(self, width, height);
    self.parent.style.width = `${width / shape.scaleX}px`;
    self.parent.style.height = `${height / shape.scaleY}px`;
  };

  // Zoom badge: shown in top-right of container's outer div when contentZoom !== 1
  self._czBadge = document.createElement('div');
  self._czBadge.style.cssText = `
    position:absolute;top:4px;right:4px;padding:2px 7px;border-radius:10px;
    background:#7c6ff7;color:#fff;font-size:11px;font-weight:700;
    pointer-events:none;user-select:none;z-index:9;opacity:0;
    transition:opacity 0.2s;white-space:nowrap;
  `;
  self.parent.appendChild(self._czBadge);

  self.containerResize = (width, height) => {
    const bw = shape.borderWidth || 0;
    self.container.style.overflow = shape.ifMaskItems ? 'hidden' : 'visible';
    self.container.style.left = '0px';
    self.container.style.top = '0px';
    self.container.style.width = `${width - 2 * bw}px`;
    self.container.style.height = `${height - 2 * bw}px`;
    // 画中画缩放：只缩放内容 div，不动外框
    const cz = shape.contentZoom || 1;
    self.container.style.transform = cz === 1 ? '' : `scale(${cz})`;
    self.container.style.transformOrigin = '0 0';
    // Update zoom badge
    if (cz === 1) {
      self._czBadge.style.opacity = '0';
    } else {
      self._czBadge.textContent = Math.round(cz * 100) + '%';
      self._czBadge.style.opacity = '1';
    }
  };

  let resize = self.resize;
  self.resize = () => {
    let size = resize.apply(self);
    self.containerResize(size.width, size.height);
    return size;
  };

  let move = self.move;
  self.move = () => {
    let pos = move.apply(self);
    let width = self.parent.clientWidth;
    let height = self.parent.clientHeight;
    let nextX = pos.x - (((1 - shape.scaleX) * width) / 2);
    let nextY = pos.y - (((1 - shape.scaleY) * height) / 2);
    self.parent.style.left = `${nextX}px`;
    self.parent.style.top = `${nextY}px`;
    return {nextX, nextY};
  };

  self.transform = () => {
    const rotate = `rotate(${shape.rotateDegree}deg ) scale(${shape.scaleX},${shape.scaleY})`;
    self.parent.style.transform = (shape.rotateDegree === 0 && shape.scaleX === 1 && shape.scaleY === 1) ? '' : rotate;
    let transform = self.parent.style.transform;
    self.parent.style.webkitTransform = transform;
    self.parent.style.mozTransform = transform;
    self.parent.style.msTransform = transform;
    self.parent.style.oTransform = transform;
    self.parent.style.transform = transform;
  };

  self.appendChild = child => {
    if (self.container !== undefined && child.parent.parentNode !== self.container) {
      self.container.appendChild(child.parent);
    }
  };

  return self;
};

const containerDrawer = (shape, div, x, y) => {
  let drawer = _containerDrawer(shape, div, x, y, rectangleDrawer);
  drawer.type = 'container html drawer';
  return drawer;
};

const canvasContainerDrawer = (shape, div, x, y) => {
  let drawer = _containerDrawer(shape, div, x, y, canvasRectangleDrawer);
  drawer.type = 'container canvas drawer';
  return drawer;
};

const simpleContainerDrawer = (shape, div, x, y) => {
  let self = containerDrawer(shape, div, x, y);
  self.parent.style.overflow = 'hidden';
  self.container.remove();
  self.text.remove();
  self.text = self.createElement('span', `text:${shape.id}`);
  self.parent.appendChild(self.text);
  self.resize = () => {
    let width = Math.abs(shape.width) - 2 * (shape.borderWidth);
    let height = Math.abs(shape.height) - 2 * (shape.borderWidth);
    self.container = self.parent;
    self.parent.style.visibility = shape.getVisibility() ? 'visible' : 'hidden';

    if (self.parent.style.visibility === 'visible') {
      self.parent.id = `${shape.type}:${shape.id}`;
      self.text.textContent = (shape.text === '' || shape.hideText) ? ' ' : shape.text;
      self.parent.style.zIndex = shape.index;
      self.parent.style.width = `${(width - shape.getPadLeft() - shape.getPadRight())}px`;
      self.parent.style.height = `${(height - shape.getPadTop() - shape.getPadBottom())}px`;
      self.parent.style.opacity = shape.globalAlpha;
      self.parent.style.background = shape.getBackColor();
      self.parent.style.opacity = shape.globalAlpha;

      self.parent.style.fontFamily = shape.fontFace;
      self.parent.style.fontSize = `${shape.fontSize}px`;
      self.parent.style.fontWeight = shape.fontWeight;
      self.parent.style.color = shape.getFontColor();
      self.parent.style.textAlign = shape.hAlign;
      self.parent.style.lineHeight = shape.lineHeight;
      self.parent.style.fontStyle = shape.fontStyle;
      self.parent.style.paddingLeft = `${shape.getPadLeft()}px`;
      self.parent.style.paddingRight = `${shape.getPadRight()}px`;
      self.parent.style.paddingTop = `${shape.getPadTop()}px`;
      self.parent.style.paddingBottom = `${shape.getPadBottom()}px`;

      self.parent.style.whiteSpace = 'pre-wrap';
      self.parent.style.wordWrap = 'break-word';
    }
    self.animationResize(width, height);
    return {width: width, height: height};
  };
  return self;
};

export {containerDrawer, canvasContainerDrawer, simpleContainerDrawer};
