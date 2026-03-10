/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import {JSDOM, VirtualConsole} from "jsdom"
const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => {
    // resolve 'Could not parse CSS stylesheet' issue.
});
const dom = new JSDOM(``, {virtualConsole});
global.document = dom.window.document
global.window = dom.window
global.CanvasRenderingContext2D = class {};