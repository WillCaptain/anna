/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import {keyActions} from '../../../core/actions/keyActions.js';

jest.mock('../../../common/const.js', () => ({
    PAGE_MODE: {
        CONFIGURATION: 'configuration',
        DISPLAY: 'display',
    },
}));

const makePage = (mode = 'configuration') => {
    return {
        mode,
        onkeydown: jest.fn(),
        onkeyup: jest.fn(),
        onCopy: jest.fn(() => ({type: 'shape', data: [], cut: jest.fn()})),
        onPaste: jest.fn(),
        getFocusedShapes: jest.fn(() => []),
    };
};

describe('keyActions', () => {
    let page;
    let action;

    beforeEach(() => {
        page = makePage();
        action = keyActions(page);
        // 清除之前可能存在的绑定
        document.page = null;
        document.oncut = null;
        document.oncopy = null;
        document.onpaste = null;
    });

    afterEach(() => {
        document.oncut = null;
        document.oncopy = null;
        document.onpaste = null;
        document.page = null;
    });

    // ─── attachCopyPaste ──────────────────────────────────────────────────────

    describe('attachCopyPaste()', () => {
        it('应将 document.page 设置为当前 page', () => {
            action.attachCopyPaste();
            expect(document.page).toBe(page);
        });

        it('应绑定 document.oncopy / onpaste / oncut', () => {
            action.attachCopyPaste();
            expect(typeof document.oncopy).toBe('function');
            expect(typeof document.onpaste).toBe('function');
            expect(typeof document.oncut).toBe('function');
        });

        it('重复调用时若 document.page 已经是该 page，应跳过绑定', () => {
            document.page = page;
            const spy = jest.spyOn(document, 'addEventListener');
            action.attachCopyPaste();
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });

        it('oncopy 被调用时，若 activeElement 不是 body，应返回 true（不拦截）', () => {
            action.attachCopyPaste();
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();
            // activeElement 现在是 input，不是 body
            const mockEvent = {clipboardData: {setData: jest.fn()}, preventDefault: jest.fn()};
            const result = document.oncopy(mockEvent);
            expect(result).toBe(true);
            input.remove();
        });

        it('onpaste 被调用时，若 activeElement 不是 body，应直接返回', () => {
            action.attachCopyPaste();
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();
            const mockEvent = {clipboardData: {items: []}};
            document.onpaste(mockEvent);
            expect(page.onPaste).not.toHaveBeenCalled();
            input.remove();
        });

        it('onpaste 被调用时，若 activeElement 是 body，应调用 page.onPaste', () => {
            action.attachCopyPaste();
            // jsdom 中 activeElement 默认为 body
            Object.defineProperty(document, 'activeElement', {
                get: () => document.body,
                configurable: true,
            });
            const mockEvent = {clipboardData: {items: []}};
            document.onpaste(mockEvent);
            expect(page.onPaste).toHaveBeenCalledWith(mockEvent);
        });

        it('应通过 addEventListener 绑定 keydown 和 keyup', () => {
            const spy = jest.spyOn(document, 'addEventListener');
            action.attachCopyPaste();
            const calls = spy.mock.calls.map(c => c[0]);
            expect(calls).toContain('keydown');
            expect(calls).toContain('keyup');
            spy.mockRestore();
        });
    });

    // ─── detachCopyPaste ──────────────────────────────────────────────────────

    describe('detachCopyPaste()', () => {
        it('在 CONFIGURATION 模式下应清空事件绑定', () => {
            action.attachCopyPaste();
            action.detachCopyPaste();
            expect(document.oncopy).toBeNull();
            expect(document.onpaste).toBeNull();
            expect(document.oncut).toBeNull();
            expect(document.page).toBeNull();
        });

        it('在非 CONFIGURATION 模式下不应解绑', () => {
            page.mode = 'display';
            action.attachCopyPaste();
            const prevCopy = document.oncopy;
            action.detachCopyPaste();
            expect(document.oncopy).toBe(prevCopy);
        });

        it('应通过 removeEventListener 移除 keydown 和 keyup', () => {
            action.attachCopyPaste();
            const spy = jest.spyOn(document, 'removeEventListener');
            action.detachCopyPaste();
            const calls = spy.mock.calls.map(c => c[0]);
            expect(calls).toContain('keydown');
            expect(calls).toContain('keyup');
            spy.mockRestore();
        });
    });
});
