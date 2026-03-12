/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { pixelRateAdapter } from "../../common/util.js";

/**
 * 循环调度每个shape的动画，驱动由requestAnimation
 * 每个shape.drawAnimation里绘制动画
 * 辉子 2021
 */
const animationDrawer = (graph, page, div) => {
    let self = {};
    self.type = "animation drawer";

    self.reset = () => {
    };

    self.pageIdChange = () => {
    }

    self.draw = () => {
        // 超过 1000 个形状时，动画全部暂停（`page.animate()` 里也做了同样检查）
        if (page.sm.getShapeCount() > (page.animationMaxShapes ?? 1000)) {
            page.drawer.drawDynamic && page.drawer.drawDynamic();
            return;
        }
        // LOD >= 2（屏幕尺寸 < 8px）的形状太小，无需播放动画
        page.sm.getShapes(s => s.enableAnimation && (s.getLODLevel?.() ?? 0) < 2).forEach(s => {
            s.drawer.drawAnimation();
        });
        page.drawer.drawDynamic && page.drawer.drawDynamic();
        if (!page.animationCode) {
            return;
        }
        if (!self.animation) {
            self.animation = graph.createDom(div, "canvas", "animationLayer:" + page.id, page.id);
            // self.animation.id = "animationLayer:" + page.id;
            self.animation.style.position = "absolute";
            self.animation.style.zIndex = 1;
            div.appendChild(self.animation);
        }
        self.animation.width = div.clientWidth;
        self.animation.height = div.clientHeight;
        pixelRateAdapter(self.animation.getContext("2d"), page.scaleX, page.scaleY, page.graph.ignoreHighQuality);

        const context = self.animation.getContext("2d");
        context.clearRect(0, 0, self.animation.width, self.animation.height);
        eval("(" + page.animationCode + ")(context, page);");
    };
    return self;
};

export { animationDrawer };