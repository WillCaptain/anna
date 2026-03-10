/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * CKEditor shape 编辑器适配器桩实现（placeholder）。
 * 生产环境应引入真实的 CKEditor 集成包。
 */
export const elsaCKEditor = (shape, editor, editableName) => {
    return {
        editor: {
            addDataListener: () => {},
            getHtml: () => shape.text || '',
        },
        focusEditor: () => {},
        blurEditor: () => {},
        setData: () => {},
        getData: () => shape.text || '',
    };
};
