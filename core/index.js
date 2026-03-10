/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import "../common/extensions/arrayExtension.js";
import "../common/extensions/canvasExtension.js";
import "../common/extensions/collectionExtension.js";
import "../common/extensions/dateExtension.js";
import "../common/extensions/stringExtension.js";

// shape相关导出.
export {ANNA} from "./entry/annaEntry.js";
export {graph} from "./base/graph.js";
export {defaultGraph} from "./base/defaultGraph.js";
export {page} from "./base/page.js";
export {shape, cachePool} from "./base/shape.js";
export {rectangle, text} from "./shapes/rectangle.js";
export {container} from "./base/container.js";
export {reference} from "./shapes/reference.js";
export * from "./interaction/hitRegion.js";
export * from "./shapes/line.js";
export {vector} from "./shapes/vector.js";
export * from "./history/commands.js";
export {connector} from "./interaction/connector.js";
export * from "./actions/copyPasteHelper.js"

// drawer相关导出.
export {canvasDrawer} from "./drawers/canvasDrawer.js";
export {containerDrawer} from "./drawers/containerDrawer.js";
export {rectangleDrawer} from "./drawers/rectangleDrawer.js";
export {canvasRectangleDrawer} from "./drawers/rectangleDrawer.js";
export {animationDrawer} from "./drawers/animationDrawer.js";
export {interactDrawer} from "./drawers/interactDrawer.js";
export {svgDrawer} from "./drawers/svgDrawer.js";

// 工具相关导出
export * from "../common/const.js";
export * from "../common/util.js";
export * from "../common/commandChain.js"

// plugins 为外部扩展，不在本仓库内，通过 ANNA.import() 动态加载
