/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MIND_MODE, MIND_ITEM_DIRECTION, MIND_ITEM_STATUS } from '../../common/const.js';
import { group } from '../../core/shapes/group.js';
import { canvasContainerDrawer } from '../../core/drawers/containerDrawer.js';
import { isPointInRect } from '../../common/util.js';
import { layoutCommand, shapesIndexChangedCommand, transactionCommand } from '../../core/history/commands.js';

/**
 * xmind graph
 */
const mind = (id, x, y, width, height, parent) => {
  const WIDTH = 200, HEIGHT = 100;
  const self = group(id, x, y, width, height, parent, canvasContainerDrawer);
  self.type = "mind";
  self.namespace = "mind";
  self.family = "mind";
  self.pad = 0;
  self.text = "mind diagram"
  self.dashWidth = 6;
  self.borderWidth = 1;
  self.fontColor = "gray";
  self.borderColor = self.focusBorderColor = "steelblue";
  self.width = WIDTH;
  self.height = HEIGHT;
  self.mode = MIND_MODE.MIND;
  self.groupBorder = 20;
  self.backAlpha = 0.02;
  self.ifMaskItems = true;
  delete self.containerFocusFirst;
  self.gotoShape = {
    shape: null, x: 0, y: 0, takeEffect: () => {
    }, source: null
  };
  self.autoAlign = true;
  self.gotoShape.moveTo = (x, y) => {
    if (!self.gotoShape.shape) return;
    const offset = 2;
    const shape = self.gotoShape.shape;
    const source = self.gotoShape.source;
    const refresh = (source, shape) => {
      source.getRoot().place();
      shape.root !== source.root && shape.getRoot().place();
    }
    const shapeIndexChangeCommand = (shape, before, after) => {
      const arg = { shape };
      arg.preIndex = before
      arg.index = after
      return shapesIndexChangedCommand(self.page, [arg]);
    }
    const appendChild = () => {
      self.gotoShape.takeEffect = () => {
        // source.parent = shape.id;
        // source.root = shape.root;
        // shape.status = MIND_ITEM_STATUS.EXPANDED;
        layoutCommand(self.page, [{ shape: source, parent: shape.id, root: shape.root }, { shape, status: MIND_ITEM_STATUS.EXPANDED }]).execute();
        refresh(source, shape);
      }
    };
    const appendBefore = () => {
      self.gotoShape.takeEffect = () => {
        // source.parent = shape.parent;
        // source.root = shape.root;
        const c1 = layoutCommand(self.page, [{ shape: source, parent: shape.parent, root: shape.root }]);
        const preIndex = source.index;
        let index = shape.index;
        if (index > preIndex) {
          index--;
        }
        const c2 = shapeIndexChangeCommand(source, preIndex, index);
        transactionCommand(self.page, [c1, c2]).execute();
        refresh(source, shape);
      };
    };
    const appendAfter = () => {
      self.gotoShape.takeEffect = () => {
        // source.parent = shape.parent;
        // source.root = shape.root;
        const c1 = layoutCommand(self.page, [{ shape: source, parent: shape.parent, root: shape.root }]);
        const preIndex = source.index;
        let index = shape.index;
        if (index < preIndex) {
          index++;
        }
        const c2 = shapeIndexChangeCommand(source, preIndex, index);
        transactionCommand(self.page, [c1, c2]).execute();
        refresh(source, shape);
      };
    };
    if (shape.isType("topic")) {
      self.gotoShape.x = shape.x + shape.width + offset;
      self.gotoShape.y = shape.y;
      appendChild();
      return;
    }
    if (x > shape.x + shape.width * 0.7 && (shape.direction === MIND_ITEM_DIRECTION.RIGHT || shape.direction === MIND_ITEM_DIRECTION.BOTTOM)) {
      self.gotoShape.x = shape.x + shape.width + offset;
      self.gotoShape.y = shape.y;
      (shape.direction === MIND_ITEM_DIRECTION.BOTTOM) ? appendAfter() : appendChild();
      return;
    }
    if (x < shape.x + shape.width * 0.3 && (shape.direction === MIND_ITEM_DIRECTION.LEFT || shape.direction === MIND_ITEM_DIRECTION.BOTTOM)) {
      self.gotoShape.x = shape.x - source.width - offset;
      self.gotoShape.y = shape.y;
      (shape.direction === MIND_ITEM_DIRECTION.BOTTOM) ? appendBefore() : appendChild();
      return;
    }

    if (y < shape.y + shape.height / 2 && (shape.direction !== MIND_ITEM_DIRECTION.BOTTOM)) {
      self.gotoShape.x = shape.x;
      self.gotoShape.y = shape.y - offset - source.height;
      appendBefore();
      return;
    }
    if (y > shape.y + shape.height / 2) {
      self.gotoShape.x = shape.x;
      self.gotoShape.y = shape.y + shape.height + offset;
      shape.direction === MIND_ITEM_DIRECTION.BOTTOM ? appendChild() : appendAfter();
      return;
    }
  }
  self.getAuthor = () => self.graph.session.name;

  self.manageConnectors = () => {
    self.getConnectors().forEach(c => {
      c.refresh();
      if (c.type === "rotate") return;
      c.visible = !self.autoAlign;
    })
  }

  self.childAllowed = child => !child.isTypeof("mind");
  self.initialize = args => {
    //默认加topic
    let t = self.page.createNew("topic", x + WIDTH / 2 - 60, y + HEIGHT / 2 - 15, self.id + "$", {container: self.id, text: "Topic"}, self);
  };

  const reset = self.reset;
  self.reset = () => {
    //reset.call(self);
    self.invalidate();
  };

  self.shapeAdded = (newShape) => {
    newShape.getRoot?.()?.place();
    self.invalidateAlone();
  };

  let drawStatic = self.drawer.drawStatic;
  self.drawer.drawStatic = (context, x, y) => {
    drawStatic.apply(self.drawer, [context, x, y]);
    let shapes = self.getShapes().filter(s => s.visible);
    //draw the connection lines between items with context in mind (not page, not items)
    shapes.filter(s => s.isType('topic')).forEach(s => s.drawConnection(context, x - self.x, y - self.y, self.mode));
    self.gotoShape.shape && self.gotoShape.shape.drawFrame(context, x - self.x, y - self.y);
  };

  self.drawer.containsBack = (x, y) => isPointInRect({ x, y }, self);

  let onMouseMove = self.onMouseMove;
  self.onMouseMove = position => {
    onMouseMove.apply(self, [position]);
    self.gotoShape.shape = self.gotoShape.source = null;
  };

  let keyPressed = self.keyPressed;
  self.keyPressed = e => {
    if (e.code === "KeyM" && (e.ctrlKey || e.metaKey)) {
      switch (self.mode) {
        case MIND_MODE.MIND:
          self.mode = MIND_MODE.MINDRIGHT;
          break;
        case MIND_MODE.MINDRIGHT:
          self.mode = MIND_MODE.MINDLEFT;
          break;
        case MIND_MODE.MINDLEFT:
          self.mode = MIND_MODE.ORG;
          break;
        default:
          self.mode = MIND_MODE.MIND;
          break;
      }
      // self.arrangeShapes();
      self.getShapes(s => s.isType('topic')).forEach(s => s.place(self.mode));
      self.invalidate();
      return false;
    }
    // if (e.code === "Escape") {
    //     self.attached.topic = null;
    // }
    return keyPressed.apply(self, [e]);
  };

  return self;
};


export { mind };