/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';
import {connector} from '../../../core/interaction/connector.js';

const makeShape = (overrides = {}) => ({
    id: 's1',
    x: 10, y: 20, width: 100, height: 50,
    rotateDegree: 0,
    borderWidth: 1,
    type: 'rectangle',
    connectors: [],
    page: {id: 'p1', mode: 'CONFIGURATION', graph: {setting: {focusBorderColor: '#0080ff'}}},
    getContainer: jest.fn(() => ({x: 0, y: 0, dockMode: 0})),
    get: jest.fn(k => overrides[k]),
    getFrame: jest.fn(() => ({x: 0, y: 0, width: 100, height: 50})),
    invalidateAlone: jest.fn(),
    ...overrides,
});

describe('connector', () => {
    let shape;
    let c;

    beforeEach(() => {
        shape = makeShape();
        c = connector(
            shape,
            () => shape.x + shape.width / 2,
            () => shape.y + shape.height / 2,
            () => 'e',
        );
    });

    // ─── Creation ─────────────────────────────────────────
    describe('creation', () => {
        it('connector object is created', () => {
            expect(c).toBeDefined();
        });

        it('required properties exist', () => {
            expect(c).toHaveProperty('x');
            expect(c).toHaveProperty('y');
            expect(typeof c.move).toBe('function');
        });
    });

    // ─── move ─────────────────────────────────────────────
    describe('move()', () => {
        it('move does nothing when enable is false', () => {
            c.enable = false;
            const prevX = c.x;
            c.move(50, 60);
            expect(c.x).toBe(prevX);
        });
    });

    // ─── draw ─────────────────────────────────────────────
    describe('draw()', () => {
        it('draw returns without error when context is null', () => {
            expect(() => c.draw(null, 10, 20, 100, 50)).not.toThrow();
        });
    });
});
