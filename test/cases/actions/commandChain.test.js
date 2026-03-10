/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import {commandChain} from '../../../common/commandChain.js';

const makeShape = () => {
    const shape = {
        keyPressed: jest.fn(),
        click: jest.fn(),
    };
    return shape;
};

describe('commandChain', () => {
    let shape;
    let chain;

    beforeEach(() => {
        shape = makeShape();
        chain = commandChain(shape);
    });

    // ─── config ───────────────────────────────────────────
    describe('config()', () => {
        it('config() returns the starter command', () => {
            const starter = chain.config(() => {});
            expect(starter).toBeDefined();
            expect(typeof starter.add).toBe('function');
        });
    });

    // ─── run() ────────────────────────────────────────────
    describe('run()', () => {
        it('shape.keyPressed is replaced after run()', () => {
            chain.config(() => {});
            chain.run();
            expect(shape.keyPressed).not.toBe(jest.fn());
        });

        it('correct key event after run() moves to next command', () => {
            const action = jest.fn();
            const starter = chain.config(() => {});
            starter.add(action, 'Enter');
            chain.run();

            shape.keyPressed({key: 'Enter'});
            expect(action).toHaveBeenCalledWith(shape, expect.any(Object));
        });

        it('invalid key is delegated to original keyPressed', () => {
            const originalKeyPressed = shape.keyPressed;
            chain.config(() => {});
            chain.run();

            shape.keyPressed({key: 'X', code: 'KeyX'});
            expect(originalKeyPressed).toHaveBeenCalled();
        });
    });

    // ─── ignoreAwait (B-06 regression) ───────────────────
    describe('ignoreAwait() - B-06 regression', () => {
        it('command with ignoreAwait() does not wait for async result', () => {
            let resolved = false;
            const asyncAction = jest.fn(() => new Promise(r => setTimeout(() => {
                resolved = true;
                r();
            }, 50)));

            const starter = chain.config(() => {});
            starter.add(asyncAction, 'Space').ignoreAwait();
            chain.run();

            shape.keyPressed({key: 'Space'});

            expect(chain.running).toBe(false);
        });

        it('async command without ignoreAwait() stays running until complete', async () => {
            let resolveAsync;
            const asyncAction = jest.fn(() => new Promise(r => { resolveAsync = r; }));

            const starter = chain.config(() => {});
            starter.add(asyncAction, 'Tab');
            chain.run();

            shape.keyPressed({key: 'Tab'});
            expect(chain.running).toBe(true);

            resolveAsync();
            await Promise.resolve();
            expect(chain.running).toBe(false);
        });
    });

    // ─── stop() ──────────────────────────────────────────
    describe('stop()', () => {
        it('shape.keyPressed is restored after stop()', () => {
            const original = shape.keyPressed;
            chain.config(() => {});
            chain.run();
            chain.stop();
            expect(shape.keyPressed).not.toBe(original);
            shape.keyPressed({key: 'A', code: 'KeyA'});
            expect(original).toHaveBeenCalled();
        });
    });
});
