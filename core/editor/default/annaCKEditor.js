/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * CKEditor shape 编辑器适配器。
 *
 * 当未集成真实 CKEditor 时，作为功能性降级实现：
 *   - render / unmount 直接操作 shape.drawer.text 的 innerHTML
 *   - 数据监听、焦点、占位符等依赖 CKEditor 的能力保留为空操作
 *
 * 生产环境引入真实 CKEditor 集成包后，替换本文件即可。
 */
export const annaCKEditor = (shape, editor, editableName) => {
    const getTextEl = () => shape.drawer?.text ?? null;

    const listeners = {};

    return {
        editor: {
            addDataListener: (name, cb) => {
                listeners[name] = cb;
            },
            getHtml: () => getTextEl()?.innerHTML ?? shape.text ?? '',
        },

        unmount: () => {
            const el = getTextEl();
            if (el) el.innerHTML = '';
        },

        render: (html) => {
            const el = getTextEl();
            if (el) el.innerHTML = typeof html === 'string' ? html : '';
        },

        focus: () => {},

        setPlaceholder: () => {},

        focusEditor: () => {},
        blurEditor:  () => {},

        setData: (data) => {
            const el = getTextEl();
            if (el) el.innerHTML = typeof data === 'string' ? data : '';
        },

        getData: () => getTextEl()?.innerHTML ?? shape.text ?? '',
    };
};
