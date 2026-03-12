/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * 基于 contenteditable 的原生文字编辑器。
 *
 * 实现 Anna 编辑器接口，不依赖任何第三方富文本库。
 * 支持 PPT 风格的双击进入文字编辑：
 *   - render()  → 写入 innerHTML，不改变 contenteditable 状态（用于展示）
 *   - focus()   → 开启 contenteditable，可选择是否真正聚焦并移动光标
 *   - unmount() → 关闭 contenteditable，退出编辑态
 *
 * 格式化通过 document.execCommand 实现（bold / italic / underline 等）。
 * 文字变更通过 input 事件实时同步回 shape.text。
 */
export const nativeTextEditor = (shape) => {
    const getEl = () => shape.drawer?.text ?? null;

    const dataListeners = {};
    let _inputHandler = null;
    let _keydownHandler = null;

    const installInputListener = () => {
        const el = getEl();
        if (!el || _inputHandler) return;
        _inputHandler = () => {
            const data = el.innerHTML;
            Object.values(dataListeners).forEach(fn => fn(null, data, false));
        };
        el.addEventListener('input', _inputHandler);
    };

    const installKeydownListener = (el) => {
        if (_keydownHandler) return;
        _keydownHandler = (e) => {
            const ctrl = e.ctrlKey || e.metaKey;
            if (!ctrl) return;
            if (!e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                shape.page?.graph?.getHistory?.()?.undo?.();
            } else if ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y') {
                e.preventDefault();
                shape.page?.graph?.getHistory?.()?.redo?.();
            }
        };
        el.addEventListener('keydown', _keydownHandler);
    };

    const self = {
        /** CKEditor 兼容层：数据事件总线 */
        editor: {
            addDataListener: (name, cb) => {
                dataListeners[name] = cb;
                installInputListener();
            },
            getHtml: () => getEl()?.innerHTML ?? '',
        },

        /**
         * 写入 HTML 内容（展示模式，不改变 contenteditable）。
         */
        render: (html) => {
            const el = getEl();
            if (!el) return;
            el.innerHTML = typeof html === 'string' ? html : '';
        },

        /**
         * 通过 textInnerHtml 缓存渲染（等价于 render）。
         */
        renderByInnerHtml: (html) => {
            const el = getEl();
            if (!el) return;
            el.innerHTML = typeof html === 'string' ? html : '';
        },

        /**
         * 退出编辑态：关闭 contenteditable，移除键盘监听。
         * 不清空 innerHTML，文字继续显示。
         */
        unmount: () => {
            const el = getEl();
            if (!el) return;
            el.contentEditable = 'false';
            el.style.cursor = '';
            if (_keydownHandler) {
                el.removeEventListener('keydown', _keydownHandler);
                _keydownHandler = null;
            }
        },

        /**
         * 进入编辑态：开启 contenteditable，安装键盘拦截。
         * @param {boolean} autoFocus 是否真正聚焦并将光标移到末尾
         */
        focus: (autoFocus = true) => {
            const el = getEl();
            if (!el) return;
            el.contentEditable = 'true';
            el.style.outline = 'none';
            el.style.cursor = 'text';
            installKeydownListener(el);
            if (autoFocus) {
                el.focus();
                try {
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                } catch (_) {
                    // 跨域 iframe 等边界情况下忽略
                }
            }
        },

        setPlaceholder: (text) => {
            const el = getEl();
            if (el) el.dataset.placeholder = String(text);
        },

        isFocused: () => document.activeElement === getEl(),

        /**
         * 内联格式化，通过 execCommand 实现。
         * key: bold | italic | underline | strikethrough | foreColor | backColor | fontName | fontSize
         */
        format: (key, value) => {
            const cmdMap = {
                bold:          ['bold',              null],
                italic:        ['italic',            null],
                underline:     ['underline',         null],
                strikethrough: ['strikeThrough',     null],
                foreColor:     ['foreColor',         value],
                backColor:     ['hiliteColor',       value],
                fontName:      ['fontName',          value],
                fontSize:      ['fontSize',          value],
            };
            const entry = cmdMap[key];
            if (entry) {
                document.execCommand(entry[0], false, entry[1]);
            }
        },

        getFormatValue: (key) => {
            const stateKeys = { bold: 'bold', italic: 'italic', underline: 'underline', strikethrough: 'strikeThrough' };
            const cmd = stateKeys[key];
            return cmd ? document.queryCommandState(cmd) : null;
        },

        getHtml:        () => getEl()?.innerHTML ?? '',
        getTextString:  () => getEl()?.textContent ?? '',
        getData:        () => getEl()?.innerHTML ?? '',
        setData:        (html) => {
            const el = getEl();
            if (el) el.innerHTML = typeof html === 'string' ? html : '';
        },

        focusEditor: () => getEl()?.focus(),
        blurEditor:  () => getEl()?.blur(),

        /**
         * 销毁编辑器：退出编辑态并移除所有事件监听。
         */
        destroy: () => {
            self.unmount();
            const el = getEl();
            if (el && _inputHandler) {
                el.removeEventListener('input', _inputHandler);
                _inputHandler = null;
            }
            Object.keys(dataListeners).forEach(k => delete dataListeners[k]);
        },
    };

    return self;
};
