/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * CKEditor 富文本编辑器桩实现（placeholder）。
 * 生产环境应引入真实的 CKEditor 集成包。
 */
const AnnaEditor = {
    create: async (config, options) => {
        console.warn('[Anna] 富文本编辑器未集成，文字编辑功能不可用。');
        return {
            addSelectionListener: () => {},
            on: () => {},
            keystrokes: {set: () => {}},
            getRootNameByOperation: () => null,
            manuallySelectAll: false,
            destroy: () => {},
        };
    },
};

export default AnnaEditor;
