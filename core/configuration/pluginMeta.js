/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

const pluginMeta = (() => {
    const plugins = {};
    const self = {};
    self.add = (path, shapes) => {
        plugins[path] = shapes;
    };
    self.exists = (shape, graph) => {
        return graph.plugins[shape] !== undefined;
    }
    self.import = async (shape, graph) => {
        if (self.exists(shape, graph)) {
            return;
        }
        for (let p in plugins) {
            if (plugins[p].contains(s => s === shape)) {
                await graph.dynamicImport(p);
            }
        }
    };
    self.importBatch = async (shapes, graph) => {
        shapes.forEach(async s => {
            await self.import(s, graph);
        })
    }
    return self;
})();

// 需要持久化
pluginMeta.add("../plugins/mind/mind.js", ["mind"]);
pluginMeta.add("../plugins/mind/topic.js", ["topic"]);
pluginMeta.add("../plugins/mind/subTopic.js", ["subTopic"]);
pluginMeta.add("../plugins/dynamicForm/form.js", ["htmlDiv", "form", "htmlTable", "htmlLabel", "htmlText", "htmlInput", "htmlHr", "htmlComobox",
    "htmlRadioBox", "htmlListBox", "htmlCheckBox", "tab", "tabPage", "tree", "treeNode"]);
pluginMeta.add("../plugins/officeCommon/freeShape.js", ["freeShape"]);


export {pluginMeta};