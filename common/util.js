/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

export const uuid = function (isLong) {
    if (isLong) {
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return id.replaceAll("-", "");
    } else {
        let firstPart = (Math.random() * 46656) | 0;
        let secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    }
};

/**
 * 求点(x, y)绕圆心(cx, cy)旋转degree度之后的点的坐标(x1, y1).
 * 公式为:
 * x1 = (x - cx)cos(degree) - (y - cy)sin(degree) + cx.
 * y1 = (y - cy)cos(degree) + (x - cx)sin(degree) + cy.
 */
export const getRotatedCoordinate = (x, y, cx, cy, degree) => {
    let dx = x - cx;
    let dy = y - cy;
    return {
        x: dx * Math.cos(degree) - dy * Math.sin(degree) + cx, y: dx * Math.sin(degree) + dy * Math.cos(degree) + cy
    };
};

/**
 * 逆变换：将视觉坐标 (x, y) 沿 parent 的祖先链变换回 shape 局部逻辑坐标。
 * 用于命中检测（contains / getMouseOnConnector 等）。
 * 处理顺序：最外层容器 → 最内层容器（outermost first），与渲染管线相反。
 *
 * @param {object} parent - 被测 shape（或容器）
 * @param {number} x      - 输入 X（页面视觉逻辑坐标）
 * @param {number} y      - 输入 Y（页面视觉逻辑坐标）
 */
export const convertPositionWithParents = (parent, x, y) => {
    let parents = [];
    let rotateDegree = 0;
    let hasContentZoom = false;
    let parentVal = parent;
    let isTarget = true;
    while (parentVal !== parentVal.page) {
        rotateDegree += parentVal.rotateDegree;
        if (!isTarget && parentVal.contentZoom && parentVal.contentZoom !== 1) {
            hasContentZoom = true;
        }
        isTarget = false;
        parents.push(parentVal);
        parentVal = parentVal.getContainer();
    }

    if (rotateDegree === 0 && !hasContentZoom) {
        return {x, y};
    }

    let convertPositionWithParent = (parents, x, y) => {
        let xVal = x;
        let yVal = y;
        if (parents.length === 0) {
            return {x: xVal, y: yVal};
        }
        let p = parents[parents.length - 1];
        // 补偿父容器的 scaleX/scaleY（旋转时的缩放变换）
        if (p.scaleX !== undefined) {
            xVal = p.x + ((xVal - p.x) / p.scaleX);
        }
        if (p.scaleY !== undefined) {
            yVal = p.y + ((yVal - p.y) / p.scaleY);
        }
        // 旋转修正（必须先于 contentZoom）
        let degree = p.rotateDegree * Math.PI / 180;
        let cx = p.x + p.width / 2;
        let cy = p.y + p.height / 2;
        let rotated = getRotatedCoordinate(xVal, yVal, cx, cy, -degree);
        xVal = rotated.x;
        yVal = rotated.y;

        // 逆变换 contentZoom：视觉坐标 → 逻辑坐标
        // CSS 视觉位置：visual = p.x + (child.x - p.x - bw) * cz
        // 逆变换：lx = p.x + bw + (visual - p.x) / cz
        // parents.length === 1 时 p 就是被测 shape 本身，不做容器 zoom 变换。
        if (p.contentZoom && p.contentZoom !== 1 && parents.length > 1) {
            const bw = p.borderWidth || 0;
            xVal = p.x + bw + (xVal - p.x) / p.contentZoom;
            yVal = p.y + bw + (yVal - p.y) / p.contentZoom;
        }

        parents.pop();
        return convertPositionWithParent(parents, xVal, yVal);
    };
    return convertPositionWithParent(parents, x, y);
};

/**
 * 正向变换：将 shape 的逻辑坐标 (x, y) 变换为页面视觉坐标。
 * 用于 getShapeFrame（空间索引 & 缩略图）。
 *
 * 关键：嵌套容器时必须从最内层容器向最外层依次应用，与渲染管线一致：
 *   child → innerContainer.contentZoom → innerContainer.rotate/scale
 *        → outerContainer.contentZoom → outerContainer.rotate/scale → page
 *
 * @param {object} parent - 被测 shape（或容器）
 * @param {number} x      - 输入 X（shape 逻辑坐标）
 * @param {number} y      - 输入 Y（shape 逻辑坐标）
 */
export const getVisualPosition = (parent, x, y) => {
    // 收集祖先链：parents[0]=shape, parents[1]=直接容器, ..., parents[n]=最外层容器
    const parents = [];
    let p = parent;
    while (p !== p.page) {
        parents.push(p);
        p = p.getContainer();
    }

    if (parents.length === 0) return {x, y};

    let xVal = x, yVal = y;

    // Step 1：正向应用 shape 自身旋转（+degree，与渲染管线一致）
    // 注意：必须用正角度才能得到正确的视觉坐标；
    // 逆变换（convertPositionWithParents）才使用 -degree。
    const self = parents[0];
    if (self.rotateDegree) {
        const cx = self.x + self.width / 2, cy = self.y + self.height / 2;
        const r = getRotatedCoordinate(xVal, yVal, cx, cy, self.rotateDegree * Math.PI / 180);
        xVal = r.x; yVal = r.y;
    }

    // Step 2：从最内层容器（index 1）到最外层容器（index n）依次正向变换。
    // 渲染管线顺序：contentZoom(内 div scale) → scaleX/Y(外 div scale) → rotation(外 div rotate)。
    // rotation 必须用 +degree（正向），否则与后续 contentZoom 叠加后 AABB 会完全偏移。
    for (let i = 1; i < parents.length; i++) {
        const c = parents[i];
        const bw = c.borderWidth || 0;

        // 正向 contentZoom：logical → visual（CSS inner div scale，origin 0,0）
        if (c.contentZoom && c.contentZoom !== 1) {
            xVal = c.x + (xVal - c.x - bw) * c.contentZoom;
            yVal = c.y + (yVal - c.y - bw) * c.contentZoom;
        }

        // 正向 scaleX/scaleY（CSS outer div scale 部分）
        if (c.scaleX !== undefined && c.scaleX !== 1) {
            xVal = c.x + (xVal - c.x) * c.scaleX;
        }
        if (c.scaleY !== undefined && c.scaleY !== 1) {
            yVal = c.y + (yVal - c.y) * c.scaleY;
        }

        // 正向 rotation（CSS outer div rotate 部分，+degree）
        if (c.rotateDegree) {
            const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
            const r = getRotatedCoordinate(xVal, yVal, cx, cy, c.rotateDegree * Math.PI / 180);
            xVal = r.x; yVal = r.y;
        }
    }

    return {x: xVal, y: yVal};
};

/**
 * 根据形状及其所有祖先容器的累积旋转角度，将 resize connector 的方向映射到
 * 旋转后对应的 CSS cursor 字符串。
 *
 * 仅适用于 8 向 resize 方向（N/NE/E/SE/S/SW/W/NW）；
 * 其他方向（ROTATE/LINE/CLIP 等）返回 undefined，调用方保持原值不变。
 *
 * @param {string} directionKey - DIRECTION 对象的 key 字符串（如 'W', 'NE'）
 * @param {number} totalDeg     - 形状 + 所有祖先容器旋转角度之和（度数）
 * @returns {string|undefined}
 */
const _DIR_CYCLE = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const _DIR_CURSOR = {
    N: 'ns-resize', NE: 'nesw-resize', E: 'ew-resize', SE: 'nwse-resize',
    S: 'ns-resize', SW: 'nesw-resize', W: 'ew-resize', NW: 'nwse-resize',
};
export const getRotatedConnectorCursor = (directionKey, totalDeg) => {
    const idx = _DIR_CYCLE.indexOf(directionKey);
    if (idx === -1) return undefined;
    const steps = Math.round(((totalDeg % 360) + 360) % 360 / 45) % 8;
    return _DIR_CURSOR[_DIR_CYCLE[(idx + steps) % 8]];
};

export const getInteractRect = (rect1, rect2) => {
    let leftX = Math.max(rect1.x, rect2.x);
    let rightX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    let topY = Math.max(rect1.y, rect2.y);
    let bottomY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (leftX < rightX && topY < bottomY) {
        return {x: leftX, y: topY, width: rightX - leftX, height: bottomY - topY};
    } else {
        return null;
    }
}

export const getPixelRatio = (context) => {
  let contextVal = context;
  if (!contextVal) {
    contextVal = document.createElement('canvas').getContext('2d');
    }
    let devicePixelRatio = window.devicePixelRatio || 1;
  let backingStoreRatio = contextVal.webkitBackingStorePixelRatio ||
    contextVal.mozBackingStorePixelRatio ||
    contextVal.msBackingStorePixelRatio ||
    contextVal.oBackingStorePixelRatio ||
    contextVal.backingStorePixelRatio ||
        1;
    return devicePixelRatio / backingStoreRatio;
}

export const pixelRateAdapter = function (context, pageScaleX, pageScaleY, ignorePageScale = false, ignoreHighQuality = false) {
    let canvas = context.canvas;
    const pixelRatio = getPixelRatio(context);

    let ratioX = ignoreHighQuality ? 1 : pixelRatio;
    let ratioY = ignoreHighQuality ? 1 : pixelRatio;
    if (!ignorePageScale) {
        ratioX *= (pageScaleX !== undefined ? pageScaleX : 1);
        ratioY *= (pageScaleY !== undefined ? pageScaleY : 1);
    }

    let oldWidth = canvas.width;
    let oldHeight = canvas.height;

    canvas.width = oldWidth * ratioX;
    canvas.height = oldHeight * ratioY;

    canvas.style.width = oldWidth + "px";
    canvas.style.height = oldHeight + "px";
    context.scale(ratioX, ratioY);
    return {ratioX, ratioY}
};

export const isPointInRect = function (point, rect) {
    try {
        return (point.x >= rect.x && point.x <= (rect.x + rect.width) && point.y >= rect.y && point.y <= (rect.y + rect.height));
    } catch (e) {
        return false;
    }
};

export const isRectInRect = function (rect1, rect2) {
    let point1 = {x: rect1.x, y: rect1.y};
    let point2 = {x: rect1.x, y: rect1.y + rect1.height};
    let point3 = {x: rect1.x + rect1.width, y: rect1.y};
    let point4 = {x: rect1.x + rect1.width, y: rect1.y + rect1.height};
    return isPointInRect(point1, rect2) && isPointInRect(point2, rect2) && isPointInRect(point3, rect2) && isPointInRect(point4, rect2);
};

export const getDistance = function (x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
};

export const closestPoint = function (points1, points2) {
    if (points1.length === 0 || points2.length === 0) {
      return undefined;
    }

    let closest = function (points, point) {
        let i;
        let closest = points[0];
        let distance = getDistance(point.x, point.y, points[0].x, points[0].y);
        for (i = 1; i < points.length; i++) {
            let nextDistance = getDistance(point.x, point.y, points[i].x, points[i].y);
            if (distance > nextDistance) {
                closest = points[i];
                distance = nextDistance;
            }
        }
        return {
            from: closest, to: point, distance: distance
        };
    };
    let cpoint = function (ps) {
        let i;
        let closest = ps[0];
        for (i = 1; i < ps.length; i++) {
            if (closest.distance > ps[i].distance) {
                closest = ps[i];
            }
        }
        return closest;
    };
    let i;
    let closestPoints = [];
    for (i = 0; i < points2.length; i++) {
        closestPoints.push(closest(points1, points2[i]));
    }
    return cpoint(closestPoints);
};

// 画布相对浏览器的原始偏移（与缩放比无关）
export const offsetPosition = function (page) {
    // 全屏状态
    // 全屏时，其父div铺满整个屏幕，因此坐标可直接返回(0, 0).
    if (page.isFullScreen) {
        return {
            x: 0, y: 0
        }
    }

    let top = page.getOffsetTop();
    let left = page.getOffsetLeft();
    let node = page.div.offsetParent;
    while (node !== null) {
        top += node.offsetTop || 0;
        left += node.offsetLeft || 0;
        node = node.offsetParent;
    }

    let parent = page.div.parentNode;
    let scrollTop = 0;
    let scrollLeft = 0;
    while (parent) {
        if (parent.pageYOffset || parent.scrollTop) {
            scrollTop += parent.pageYOffset || parent.scrollTop;
        }
        if (parent.pageXOffset || parent.scrollLeft) {
            scrollLeft += parent.pageXOffset || parent.scrollLeft;
        }
        parent = parent.parentNode;
    }

    top -= scrollTop;
    left -= scrollLeft;
    return {
        x: left, y: top
    }
};

export const position = function (canvas) {
    let offset = function () {
        let top = 0;
        let left = 0;
        let element = canvas;
        do {
            top += element.offsetTop || 0;
            left += element.offsetLeft || 0;
            element = element.offsetParent;
        } while (element);

        let node = canvas.parentNode;
        let scrollTop = 0;
        let scrollLeft = 0;
        do {
            scrollTop += node.scrollTop;
            scrollLeft += node.scrollLeft;
            node = node.parentNode;
        } while (node.tagName.toLowerCase() !== "html");
        left -= scrollLeft;
        top -= scrollTop;
        return {
            x: left, y: top
        }
    };
    return {
        offset: offset, x: 0, y: 0, zoom: 1
    }
};

export const isRectInteractRect = function (rect1, rect2) {
    let r1 = {left: rect1.x, right: rect1.x + rect1.width, top: rect1.y, bottom: rect1.y + rect1.height};
    let r2 = {left: rect2.x, right: rect2.x + rect2.width, top: rect2.y, bottom: rect2.y + rect2.height};
    return !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
};

export const getGridGrabPosition = function (point, graphPage) {
    if (!graphPage.enableGrid) {
        return point;
    }
    let p = {x: 0, y: 0};
    let rate = graphPage.gridSpace / graphPage.scale;
    p.x = Math.round(point.x / rate) * rate;
    p.y = Math.round(point.y / rate) * rate;
    return p;
};

export const sleep = async sleepDuration => {
    await new Promise(r => setTimeout(r, sleepDuration));
};

export const requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

export const isNumeric = (str) => {
    return !isNaN(str) && !isNaN(parseFloat(str))
}

export const getUrlParam = key => {
    return new URL(window.location.href).searchParams.get(key);
}

export const compareAndSet = (obj, key, value, callback) => {
    if (obj[key] === value) {
        return;
    }
    if (callback) {
        callback();
    } else {
        obj[key] = value;
    }
};

export const showDialog = () => {
};

/**
 * 深拷贝一个对象.
 *
 * @param obj 对象.
 * @return {null|any} 返回null或拷贝后的对象.
 */
export const deepClone = (obj) => {
    if (obj === null || obj === undefined || typeof obj !== "object") {
        return null;
    }
    const jsonString = JSON.stringify(obj);
    return JSON.parse(jsonString);
};

// 根据指定条件，求二维数组对象的交集
export const getIntersection = (arrays, condition) => {
    if (arrays.length === 0) {
        return [];
    }
    return arrays.reduce((accumulator, currentArray) => {
        if (currentArray.length === 0) {
            return accumulator;
        }
        return accumulator.filter((item) =>
            currentArray.some(
                (otherItem) => condition && condition(otherItem, item)
            )
        );
    });
};

// 将数组对象按照指定属性分组，并返回二维数组
export const groupBy = (arr, property) => {
    return arr.reduce((accumulator, currentValue) => {
        const key = currentValue[property];
        if (!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(currentValue);
        return accumulator;
    }, {});
};

/**
 * 事件去抖，防止在一次事件循环中，某些方法被执行了多次..
 *
 * @return {{}} 防抖对象.
 */
export const eventDebounce = () => {
    const self = {};
    self.flush = false;

    /**
     * 减少func执行次数.
     *
     * @param event 事件.
     */
    self.debounce = (event) => {
        if (self.flush) {
            return;
        }

        self.flush = true;
        Promise.resolve().then(() => {
            try {
                event();
            } finally {
                self.flush = false;
            }
        });
    };

    return self;
};

/**
 * 获取div元素的可编辑状态
 *
 * @param element div元素
 * @return {string} true/false的字符串
 */
export const getEditStatus = element => {
    // 辅助函数：递归查找 contentEditable 状态
    const _findContentEditableState = el => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) {
            // 如果到达文档根节点或非元素节点，返回 false
            return 'false';
        }
        const editableStatus = el.contentEditable;
        if (editableStatus === 'true' || editableStatus === 'false') {
            return editableStatus;
        } else { // editable为inherit的场景
            // 继续向上查找父元素
            return _findContentEditableState(el.parentElement);
        }
    };

    // 调用辅助函数，从当前元素开始查找
    return _findContentEditableState(element);
};

/**
 * Compute the axis-aligned bounding box (AABB) of a set of shapes.
 * Uses each shape's getShapeFrame() if available, otherwise falls back to
 * {x, y, x+width, y+height}.  Returns {x1, y1, x2, y2} in logical coords,
 * or null when the array is empty.
 *
 * This is the canonical bounds algorithm shared by groupBox and group.
 */
export const computeShapesBounds = (shapes) => {
    if (!shapes || !shapes.length) return null;
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    shapes.forEach(s => {
        const f = s.getShapeFrame
            ? s.getShapeFrame()
            : {x1: s.x, y1: s.y, x2: s.x + s.width, y2: s.y + s.height};
        if (f.x1 < x1) x1 = f.x1;
        if (f.y1 < y1) y1 = f.y1;
        if (f.x2 > x2) x2 = f.x2;
        if (f.y2 > y2) y2 = f.y2;
    });
    return (x1 < Infinity) ? {x1, y1, x2, y2} : null;
};