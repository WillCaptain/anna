/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { container } from "../base/container.js";
import { groupDrawer } from "../drawers/groupDrawer.js";
import { computeShapesBounds } from "../../common/util.js";
/**
 *
 * 把一群shape合成一个大shape
 * 里面各shape还可独立活动，group边界动态包裹所有子shape
 * 功能与powerpoint中的group基本一致
 * 辉子 2020-09
 */
const group = (id, x, y, width, height, parent, drawer = groupDrawer) => {
    let self = container(id, x, y, width, height, parent, drawer);
    self.type = "group";
    self.editable = false;
    self.borderWidth = 0;
    self.focusBackColor = self.backColor = "RGBA(255,255,255,0.1)";
    self.borderColor = "silver";
    self.dashWidth = 5;
    self.ifMaskItems = false;
    self.text = "";
    self.groupBorder = 10;
    self.dynamicAddItem = false;
    self.autoAlign = true;
    self.containerFocusFirst = true;

    self.removeDetection("backColor");
    self.removeDetection("dashWidth");

    // Group 不需要的 container 功能：禁用 dock 布局、滚动、动态拖入、内容裁剪
    self.scrollAble       = false;
    self.dynamicAddItem   = false;
    self.ifMaskItems      = false;
    self.autoFit          = false;
    self.arrangeShapes    = () => {};  // 无 dock 排列
    self.scroll           = () => {};  // 无滚动

    self.preResize = self.resize;
    self.resize = (width, height) => {
        if (self.autoAlign) {
            let w1 = self.width;
            let h1 = self.height;
            let rx = width / w1;
            let ry = height / h1;
            self.getShapes().forEach(s => {
                s.moveTo(self.x + (s.x - self.x) * rx, self.y + (s.y - self.y) * ry);
                s.resize(s.width * rx, s.height * ry);
            });
        }
        self.preResize.apply(self, [width, height]);
    };

    self.group = shapes => {
        shapes.forEach(s => {
            self.page.ignoreReact(() => s.container = self.id);
            s.unSelect();
        });
        self.select();
        self.invalidate();
    };
    self.invalidate = () => self.invalidateAlone();

    const invalidateAlone = self.invalidateAlone;
    self.invalidateAlone = () => {
        // 当 group 自身正在被拖动或通过 connector 调整时，跳过 bounds 重算与子形状级联刷新，
        // 避免 effectGroup 链路每帧多次触发 atom setter / DOM 写操作导致的闪烁偏移。
        const isInteracting = self.inDragging || self.mousedownConnector;

        if (!isInteracting) {
            if (self.page.isReady && self.autoAlign) {
                const shapes = self.getShapes().filter(s => {
                    if (!s.visible || s.ignoreAutoFit) return false;
                    // When the container has a family, only include shapes with a matching family.
                    // Shapes with no family (family === "" or undefined) are excluded.
                    if (self.family) return s.family === self.family;
                    return true;
                });
                const b = computeShapesBounds(shapes);
                if (b) {
                    self.x      = b.x1 - self.groupBorder;
                    self.y      = b.y1 - self.groupBorder;
                    self.width  = (b.x2 - b.x1) + self.groupBorder * 2;
                    self.height = (b.y2 - b.y1) + self.groupBorder * 2;
                }
            }
            self.getShapes().forEach(s => s.invalidate());
        }

        invalidateAlone.call(self);
    };

    let keyPressed = self.keyPressed;
    self.keyPressed = e => {
        if ((e.ctrlKey || e.metaKey) && (e.code === "KeyB")) {
            self.break();
            return false;
        }
        return keyPressed.call(self, e);
    }

    //deGroup: ctrl+b
    self.break = (shapesFocus = true) => {
        let shapes = self.getShapes();
        shapes.forEach(s => {
            s.container = self.container;
            if (shapesFocus) {
                s.select();
            }
            s.invalidate();
        });
        self.page.clearAnimations && self.page.clearAnimations(self.getShapes());
        self.remove();
        return shapes;
    };

    // self.addDetection(["isFocused"], (property, value, preValue) => {
    //     if (value) {
    //         (self.borderWidth === 0) && (self.borderWidth = 0.5);//操作group时，协同对方可以group边框，知道你在操作group
    //     } else {
    //         (self.borderWidth === 0.5) && (self.borderWidth = 0);
    //     }

    // });

    /**
     * 重写isFormatted方法.
     * 当group下的所有图形都isFormatted时，group才会isFormatted.
     *
     *
     * @param key 指令的key.
     * @return {boolean} true/false.
     */
    self.isFormatted = (key) => {
        return self.getShapes().every(shape => shape.isFormatted(key));
    }

    /**
     * 重写format方法.
     * 当选中group时，执行指令是对group下的所有shape进行执行.
     *
     * @param key 指令的key.
     * @param value 指令的值.
     */
    self.format = (key, value) => {
        return self.getShapes().forEach(shape => shape.format(key, value));
    }

    /**
     * 重写getFormatValue方法.
     * 当选中group时获取group下的所有shape的值.
     *
     * @param key 指令的key.
     */
    self.getFormatValue = (key) => {
        return self.getShapes().map(shape => shape.getFormatValue(key)).find(v => v !== null && v !== undefined);
    }

    /**
     * 重写获取borderColor的方法.
     * 1、绘制connector时，也会使用到borderColor.
     *
     * @return {*} 边框颜色.
     */
    self.getBorderColor = () => {
        return getAttributeFromPageOrGraph("borderColor");
    }

    /**
     * 获取dashWidth.用于和shape中的get()方法区分开.
     *
     * @return {*} dashWidth的值.
     */
    self.getDashWidth = () => {
        return getAttributeFromPageOrGraph("dashWidth");
    }

    const getAttributeFromPageOrGraph = (field) => {
        let value = self.page === undefined ? undefined : self.page.setting[field];
        if (value === undefined) {
            value = self.graph === undefined ? undefined : self.graph.setting[field];
        }
        return value;
    }

    setDetection(self);
    return self;
};

const setDetection = (group) => {
    group.addDetection(["backColor", "cornerRadius", "dashWidth"], (property, value) => {
        const children = group.getShapes();
        if (children.every(c => c[property] === value)) {
            return;
        }
        children.forEach(c => c[property] = value);
    });
    group.addDetection(["autoAlign"], (property, value) => {
        group.isType("group") && (group.autoAlign = true);
    });

    group.addDetection(["borderColor", "borderWidth", "globalAlpha"], (property, value, preValue) => {
        const children = group.getShapes();
        if (children.every(c => c[property] === value)) {
            return;
        }
        children.forEach(c => {
            c[property] = value;
            c.render();
        });

        group[property] = preValue;
    });
}

export { group };
