/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2025 Huawei Technologies Co., Ltd. All rights reserved.
 *  This file is a part of the ModelEngine Project.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ALIGN, MIND_ITEM_DIRECTION, MIND_ITEM_STATUS, MIND_MODE, PROGRESS_STATUS } from '../../common/const.js';
import { uuid } from '../../common/util.js';
import { addCommand } from '../../core/history/commands.js';
import { pluginMeta } from '../../core/configuration/pluginMeta.js';
import { rectangle } from '../../core/shapes/rectangle.js';
import { attachedRegion } from './hitRegion.js';
import { showAttachPanel } from './attachPanel.js';

/*
xmind的最初那个主题
通过回车可以增加主题：左右一次展开
self.以移动，带动所有关联的subtopic移动
*/
let topic = (id, x, y, width, height, parent) => {
  let self = rectangle(id, x, y, width, height, parent);
  self.autoWidth = true;
  self.autoHeight = true;
  self.height = 28;
  self.type = "topic";
  self.namespace = "mind";
  self.family = "mind";
  self.text = "Topic";
  self.fontSize = 14;
  self.fontColor = "#333333";
  self.hAlign = ALIGN.MIDDLE;
  self.backColor = "#ffffff";
  self.backAlpha = 0.95;
  self.cornerRadius = 6;
  self.borderColor = "steelblue";
  self.borderWidth = 2;
  self.progressStatus = PROGRESS_STATUS.NONE;
  self.root = self.id;
  self.direction = MIND_ITEM_DIRECTION.RIGHT;
  self.status = MIND_ITEM_STATUS.EXPANDED;
  self.attached = [];//attached or links
  self.containerAllowed = parent => parent.isTypeof('mind');
  self.manageConnectors = () => {
    self.getConnectors().forEach(c => {
      c.refresh();
      c.visible = false;
    })
  };

  const moved = self.moved;
  self.moved = action => {
    if (self.isType("topic") && action) {
      self.place();
    } else {
      moved.call(self);
    }
  };

  const undoRemove = self.undoRemove;
  self.undoRemove = (page, index) => {
    undoRemove.call(self, page, index);
    self.getRoot().place();
    self.getContainer().invalidate();
  };

  const dragTo = self.dragTo;
  self.dragTo = position => {
    const mind = self.getContainer();
    if (mind.autoAlign) {
      if (mind.getShapes(s => s.isType("topic"))[0] === self) {//该mind的第一个topic，移动mind
        mind.dragTo(position);
      } else {
        dragTo.call(self, position);
        self.place();
      }
    } else {
      let shadow = document.getElementById("shadow-" + self.id);
      if (!shadow) {
        shadow = self.drawer.parent.cloneNode(true);
        self.drawer.parent.parentElement.appendChild(shadow);
        shadow.id = "shadow-" + self.id;
      }
      dragTo.call(self, position);
      self.drawer.parent.style.opacity = "0.3";
    }
  };

  const endDrag = self.endDrag;
  self.endDrag = target => {
    endDrag.call(self, target);
    self.place();
    self.getContainer().invalidate();
  }

  const ROW_GAP = 24;
  const COLUMN_GAP = 20;

  self.getRoot = () => self.page.sm.getShapeById(self.root);

  self.getChildren = () => {
    const container = self.getContainer();
    return container ? container.getShapes().filter(s => s.parent === self.id) : [];
  };

  self.getVirtualWidth = () => self.width;

  self.getVirtualHeight = () => self.height;

  self.getRelated = (shapes) => {
    if (!shapes) {
      return [];
    }
    const all = [self];
    shapes.forEach(s => {
      if (s.parent !== self.id) return;
      all.push.apply(all, s.getRelated(shapes));
    })
    return all;
  };

  self.deSerialized = () => {
    if (!self.oldId) {
      return;
    }

    //说明有粘贴
    if (self.isType("topic")) {
      self.root = self.id;
      return;
    }

    const mind = self.getContainer();
    const all = mind.getShapes();
    all.forEach(s => {
      if (!s.oldId) return;
      //处理自己
      s.oldId === self.parent && (self.parent = s.id);
      s.oldId === self.root && (self.root = s.id);
      //处理其他
      s.parent === self.oldId && (s.parent = self.id);
      s.root === self.oldId && (s.root = self.id);
    });

    //先找目前是否有被拷贝过来的parent
    let parent = all.find(s => s.id === self.parent && s.oldId);
    if (parent) {
      self.root = parent.root;
    } else {
      //如果没有parent，找到focused当parent
      parent = all.find(s => s.isFocused && !s.oldId);
      if (parent) {
        self.parent = parent.id;
        self.root = parent.root;
      } else {
        //如果没有找到parent，找到最近的topic当parent
        if (!all.contains(s => s.id === self.parent)) {
          parent = all.orderBy("oldId").find(s => s.isType("topic"));
          if (parent) {
            self.parent = parent.id;
            self.root = parent.root;
          } else {//完全无家可归，转成topic
            self.type = "topic";
            self.root = self.id;
          }
        }
      }
    }

    if (!self.getRoot().oldId) self.getRoot().place();//如果不是整体拷贝，刷新一下
  };

  self.place = (mode) => {
    const shadow = document.getElementById("shadow-" + self.id);
    shadow && shadow.remove();
    const session = uuid();
    if (mode) {
      self[mode](session);
    } else {
      layout(session);
    }
  };

  self.pasted = () => {};

  self.mindRight = (session) => {
    self.direction = MIND_ITEM_DIRECTION.RIGHT;
    layout(session);
  };

  self.mindLeft = (session) => {
    self.direction = MIND_ITEM_DIRECTION.LEFT;
    layout(session);
  };

  self.mindCenter = (session) => {
    self.direction = MIND_ITEM_DIRECTION.CENTER;
    layout(session);
  };

  self.organization = (session) => {
    self.direction = MIND_ITEM_DIRECTION.BOTTOM;
    layout(session);
  };

  const layout = (session) => {
    self[self.direction](self.getChildren(), session);
  };

  self.center = (shapes, session) => {
    let lefts = [], rights = [];
    shapes.forEach((c, index) => {
      index % 2 === 0 ? rights.push(c) : lefts.push(c);
    });
    self.left(lefts, session);
    self.right(rights, session);
  };

  self.left = (shapes, session) => {
    let top = self.y + self.height / 2 - (shapes.sum(s => s.getVirtualHeight(session)) + (shapes.length - 1) * ROW_GAP) / 2;
    shapes.forEach(c => {
      c.moveTo(self.x - COLUMN_GAP - c.width, top + (c.getVirtualHeight(session) - c.height) / 2, () => { });
      top += c.getVirtualHeight(session) + ROW_GAP;
      c.place(MIND_MODE.MINDLEFT);
    });
  };

  self.right = (shapes, session) => {
    let top = self.y + self.height / 2 - (shapes.sum(s => s.getVirtualHeight(session)) + (shapes.length - 1) * ROW_GAP) / 2;
    shapes.forEach(c => {
      c.moveTo(self.x + self.getVirtualWidth(session) + COLUMN_GAP, top + (c.getVirtualHeight(session) - c.height) / 2, () => { });
      top += c.getVirtualHeight(session) + ROW_GAP;
      c.place(MIND_MODE.MINDRIGHT);
    });

  };

  self.bottom = (shapes, session) => {
    let left = self.x + self.width / 2 - (shapes.sum(s => s.getVirtualWidth(session)) + (shapes.length - 1) * COLUMN_GAP) / 2;
    shapes.forEach(c => {
      c.moveTo(left + (c.getVirtualWidth(session) - c.width) / 2, self.y + self.getVirtualHeight(session) + ROW_GAP, () => { });
      left += c.getVirtualWidth(session) + COLUMN_GAP;
      c.place(MIND_MODE.ORG)
    });
  };

  self.drawer.getSnapshot = () => {};

  self.drawOrgConnection = (context, fromx, fromy, tox, toy, color) => {
    let middleY = (fromy + toy) / 2;
    let middleX = (fromx + tox) / 2;
    let r2 = 5;
    if (r2 > Math.abs(fromx - tox) / 2) {
      r2 = Math.abs(fromx - tox) / 2;
    }
    let oldStrokeStyle = context.strokeStyle;
    context.strokeStyle = color;
    if (fromy < toy) {//south
      context.beginPath();
      context.moveTo(fromx, fromy);
      context.lineTo(fromx, middleY - r2);
      context.stroke();
      if (fromx < tox) {//south-east
        context.beginPath();
        context.arc(fromx + r2, middleY - r2, r2, 0.5 * Math.PI, 1 * Math.PI);
        context.moveTo(fromx + r2, middleY)
        context.lineTo(tox - r2, middleY);
        context.stroke();
        context.beginPath();
        context.arc(tox - r2, middleY + r2, r2, 1.5 * Math.PI, 2 * Math.PI);
        context.stroke();
      } else {//north-east
        context.beginPath();
        context.arc(fromx - r2, middleY - r2, r2, 0 * Math.PI, 0.5 * Math.PI);
        context.stroke();
        context.lineTo(tox + r2, middleY);
        context.stroke();
        context.beginPath();
        context.arc(tox + r2, middleY + r2, r2, 1 * Math.PI, 1.5 * Math.PI);
        context.stroke();
      }
      context.beginPath();
      context.moveTo(tox, middleY + r2);
      context.lineTo(tox, toy);
      context.stroke();

    } else {//north (fromy >= toy — uncommon in org charts but handled for completeness)
      context.beginPath();
      context.moveTo(fromx, fromy);
      context.lineTo(middleX + r2, fromy);
      context.stroke();
      context.beginPath();
      context.arc(middleX + r2, fromy - r2, r2, 0.5 * Math.PI, 1 * Math.PI);
      context.lineTo(middleX, toy + r2);
      context.stroke();
      context.beginPath();
      context.arc(middleX - r2, toy + r2, r2, 1.5 * Math.PI, 0 * Math.PI);
      context.stroke();
      context.beginPath();
      context.moveTo(middleX - r2, toy);
      context.lineTo(tox, toy);
      context.stroke();
    }
    context.strokeStyle = oldStrokeStyle;
  };

  self.drawMindConnection = (context, fromx, fromy, tox, toy, color) => {
    let middleX = (fromx + tox) / 2;
    let r2 = 5;
    if (r2 > Math.abs(fromy - toy) / 2) {
      r2 = Math.abs(fromy - toy) / 2;
    }
    let oldStrokeStyle = context.strokeStyle;
    context.strokeStyle = color;
    if (fromx < tox) {//east
      context.beginPath();
      context.moveTo(fromx, fromy);
      context.lineTo(middleX - r2, fromy);
      context.stroke();
      if (fromy < toy) {//south-east
        context.beginPath();
        context.arc(middleX - r2, fromy + r2, r2, 1.5 * Math.PI, 2 * Math.PI);
        context.lineTo(middleX, toy - r2);
        context.stroke();
        context.beginPath();
        context.arc(middleX + r2, toy - r2, r2, 0.5 * Math.PI, 1 * Math.PI);
        context.stroke();
      } else {//north-east
        context.beginPath();
        context.arc(middleX - r2, fromy - r2, r2, 0 * Math.PI, 0.5 * Math.PI);
        context.stroke();
        context.beginPath();
        context.moveTo(middleX, fromy - r2);
        context.lineTo(middleX, toy + r2);
        context.stroke();
        context.beginPath();
        context.arc(middleX + r2, toy + r2, r2, 1 * Math.PI, 1.5 * Math.PI);
        context.stroke();
      }
      context.beginPath();
      context.moveTo(middleX + r2, toy);
      context.lineTo(tox, toy);
      context.stroke();

    } else {//west
      context.beginPath();
      context.moveTo(fromx, fromy);
      context.lineTo(middleX + r2, fromy);
      context.stroke();
      if (fromy < toy) {//south-west
        context.beginPath();
        context.arc(middleX + r2, fromy + r2, r2, 1 * Math.PI, 1.5 * Math.PI);
        context.stroke();
        context.beginPath();
        context.moveTo(middleX, fromy + r2);
        context.lineTo(middleX, toy - r2);
        context.stroke();
        context.beginPath();
        context.arc(middleX - r2, toy - r2, r2, 0 * Math.PI, 0.5 * Math.PI);
        context.stroke();

      } else {//north-west
        context.beginPath();
        context.arc(middleX + r2, fromy - r2, r2, 0.5 * Math.PI, 1 * Math.PI);
        context.lineTo(middleX, toy + r2);
        context.stroke();
        context.beginPath();
        context.arc(middleX - r2, toy + r2, r2, 1.5 * Math.PI, 0 * Math.PI);
        context.stroke();

      }
      context.beginPath();
      context.moveTo(middleX - r2, toy);
      context.lineTo(tox, toy);
      context.stroke();
    }
    context.strokeStyle = oldStrokeStyle;
  };

  self.drawConnection = (context, x, y, mode) => {
    let children = self.getChildren();
    children.forEach(c => {
      c.drawConnection(context, x, y, mode);
      if (mode === MIND_MODE.ORG) {
        let fromx = x + self.x + self.width / 2,
          fromy = y + self.y + self.height,
          tox = x + c.x + c.width / 2,
          toy = y + c.y;
        self.drawOrgConnection(context, fromx, fromy, tox, toy, c.borderColor);
      } else {
        let fromx = x + self.x + self.width,
          fromy = y + self.y + self.height / 2,
          tox = x + c.x,
          toy = y + c.y + c.height / 2;
        if (c.direction === MIND_ITEM_DIRECTION.LEFT) {
          fromx = x + self.x;
          fromy = y + self.y + self.height / 2;
          tox = x + c.x + c.width;
          toy = y + c.y + c.height / 2
        }
        self.drawMindConnection(context, fromx, fromy, tox, toy, c.borderColor);
      }
    });
  };

  self.drawFrame = (context, x, y) => {
    context.roundRect(x + self.x, y + self.y, self.width, self.height, 4, "rgba(222,222,222,0.2)", "lightGray", 1);
  };

  self.keyPressed = e => {
    const validKey =
      (e.keyCode > 47 && e.keyCode < 58) ||  // 0-9
      e.keyCode === 32 || e.keyCode === 13 ||  // space, enter
      (e.keyCode > 64 && e.keyCode < 91) ||   // A-Z
      (e.keyCode > 95 && e.keyCode < 112) ||  // numpad
      (e.keyCode > 185 && e.keyCode < 193) || // ;=,-./`
      (e.keyCode > 218 && e.keyCode < 223);   // [\]'

    if (validKey) {
      self.beginEdit();
      return false;
    }
    return true;
  };

  const render = self.render;
  self.render = () => {
    const width = self.width;
    render.call(self);
    if (width !== self.width) {
      self.place();
      self.getContainer().invalidate();
    }
  };

  const invalidate = self.invalidate;
  self.invalidate = action => {
    if (action && !action.done) {
      const container = self.getContainer();
      if (container) {
        container.getShapes(s => s.isType("topic")).forEach(s => s.place());
        container.invalidateAlone();
      }
      action.done = true;
    }
    invalidate.call(self);
  };

  const invalidateAlone = self.invalidateAlone;
  self.invalidateAlone = () => {
    self.attachedRegion.visible = self.attached.length !== 0;
    invalidateAlone.apply(self);
  };

  self.indexChanged = (before, after) => {
    self.getRoot().place();
    self.getContainer().invalidate();
  };

  self.createTopic = async (type, name) => {
    await pluginMeta.import(type, self.graph);
    const text = name ? name : "Sub Topic " + (self.getContainer().getShapes(s => s.root === self.root).length + 1);
    let sub = self.page.createNew(type, self.x, self.y, undefined, { text }, self.getContainer());
    sub.container = self.container;
    sub.root = self.root;
    return sub;
  };

  const remove = self.remove;
  self.remove = () => {
    const all = [];
    const container = self.getContainer();
    self.getChildren().forEach(c => all.push.apply(all, c.remove()));
    all.push.apply(all, remove.apply(self));
    self.getRoot()?.place();
    container.invalidateAlone();
    return all;
  };

  self.textChanged = (value, preValue) => {
    self.getRoot().place();
    self.getContainer().invalidateAlone();
  };

  let keyPressed = self.keyPressed;
  self.keyPressed = function (e) {
    const container = self.getContainer();
    if (e.code === "Enter") {
      self.createTopic("subTopic").then(sub => {
        self.page.ignoreReact(() => {
          sub.parent = (e.ctrlKey || e.metaKey) ? self.id : (self.parent ?? self.id);
        })
        sub.getRoot().place();
        self.getContainer().invalidateAlone();
        addCommand(self.page, [{ shape: sub }]);
      })
      return false;
    }

    if (e.code.indexOf("ArrowLeft") >= 0) {
      if (self.direction === MIND_ITEM_DIRECTION.RIGHT) {
        self.unSelect();
        self.getParent().select();
      }
      if (self.direction === MIND_ITEM_DIRECTION.LEFT || self.direction === MIND_ITEM_DIRECTION.CENTER) {
        let leftItems = self.getChildren().filter(c => c.direction === MIND_ITEM_DIRECTION.LEFT);
        if (leftItems.length > 0) {
          self.unSelect();
          leftItems[0].select();//根节点：找左侧第一个子节点
        }
      }
      if (self.direction === MIND_ITEM_DIRECTION.BOTTOM) {
        const brothers = self.getParent().getChildren();
        const idx = brothers.indexOf(self);
        if (idx > 0) {
          self.unSelect();
          brothers[idx - 1].select();
        }
      }
      return false;
    }
    if (e.code.indexOf("ArrowRight") >= 0) {
      if (self.direction === MIND_ITEM_DIRECTION.LEFT) {
        self.unSelect();
        self.getParent().select();
      }
      if (self.direction === MIND_ITEM_DIRECTION.RIGHT || self.direction === MIND_ITEM_DIRECTION.CENTER) {
        let rightItems = self.getChildren().filter(c => c.direction === MIND_ITEM_DIRECTION.RIGHT);
        if (rightItems.length > 0) {
          self.unSelect();
          rightItems[0].select();//根节点：找右侧第一个子节点
        }
      }
      if (self.direction === MIND_ITEM_DIRECTION.BOTTOM) {
        const brothers = self.getParent().getChildren();
        const idx = brothers.indexOf(self);
        if (idx < brothers.length - 1) {
          self.unSelect();
          brothers[idx + 1].select();
        }
      }
      return false;
    }

    if (e.code.indexOf("ArrowDown") >= 0) {
      if (self.direction === MIND_ITEM_DIRECTION.BOTTOM) {
        const children = self.getChildren();
        if (children.length > 0) {
          self.unSelect();
          children[0].select();
        }
      } else {
        if (self.parent === undefined) return false;
        const children = self.getParent().getChildren();
        const index = children.indexOf(self);
        if (index < children.length - 1) {
          self.unSelect();
          children[index + 1].select();
        }
      }
      return false;
    }

    if (e.code.indexOf("ArrowUp") >= 0) {
      if (self.parent === undefined) return false;
      if (self.direction === MIND_ITEM_DIRECTION.BOTTOM) {
        const parent = self.getParent();
        if (parent !== self) {
          self.unSelect();
          parent.select();
        }
      } else {
        const children = self.getParent().getChildren();
        const index = children.indexOf(self);
        if (index > 0) {
          self.unSelect();
          children[index - 1].select();
        }
      }
      return false;
    }

    if (e.code === "Escape") {
      container.keyPressed(e);
    }

    if (e.code === "KeyL" && (e.ctrlKey || e.metaKey)) {
      self.showAttached();
    }

    return keyPressed.apply(self, [e]);
  };

  self.showAttached = () => showAttachPanel(self);

  self.attachedRegion = attachedRegion(self, item => (self.commentRegion?.getVisibility() ? 24 : 2), item => -4, () => 18, () => 18);

  return self;
};


export { topic };