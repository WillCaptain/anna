/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../__mocks__/client.js';
import '../../../common/extensions/arrayExtension.js';

jest.mock('../../../core/shapes/rectangle.js', () => ({
    rectangle: jest.fn((id, x, y, w, h, parent, drawer) => {
        const self = {
            id, x, y, width: w, height: h, type: 'rectangle',
            page: parent,
            get: jest.fn(key => self[key]),
            headColor: '#333',
            backColor: '#fff',
            opacity: 0.5,
            direction: 1,
        };
        return self;
    }),
}));

jest.mock('../../../core/shapes/vector.js', () => ({
    vector: jest.fn((id, x, y, w, h, parent) => {
        const self = {
            id, x, y, width: w, height: h, type: 'vector',
            page: parent,
            get: jest.fn(key => self[key]),
            headColor: '#333',
            backColor: '#fff',
            opacity: 0.5,
            direction: 1,
        };
        return self;
    }),
}));

import {icon} from '../../../core/shapes/icon.js';

const makeCtx = () => ({
    beginPath: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    createRadialGradient: jest.fn(() => ({addColorStop: jest.fn()})),
    globalAlpha: 1,
});

const mockPage = {id: 'page-test', x: 0, y: 0, width: 800, height: 600};

describe('icon', () => {
    let ctx;

    beforeEach(() => {
        ctx = makeCtx();
    });

    // ─── drawStatic (B-04 regression) ───────────────────
    describe('drawStatic() - B-04 eval removal regression', () => {
        it('plane icon draws without ReferenceError', () => {
            const s = icon('i1', 10, 20, 64, 64, mockPage);
            s.iconName = 'plane';
            expect(() => s.drawStatic(ctx, 10, 20, 64, 64)).not.toThrow();
        });

        it('train icon draws without ReferenceError', () => {
            const s = icon('i2', 10, 20, 64, 64, mockPage);
            s.iconName = 'train';
            expect(() => s.drawStatic(ctx, 10, 20, 64, 64)).not.toThrow();
        });

        it('unknown icon name is silently ignored', () => {
            const s = icon('i3', 10, 20, 64, 64, mockPage);
            s.iconName = 'nonExistent';
            expect(() => s.drawStatic(ctx, 10, 20, 64, 64)).not.toThrow();
        });
    });

    // ─── drawDynamic ─────────────────────────────────────
    describe('drawDynamic()', () => {
        it('star icon dynamic drawing works without ReferenceError', () => {
            const s = icon('i4', 10, 20, 64, 64, mockPage);
            s.iconName = 'star';
            s.opacity = 0.5;
            s.direction = 1;
            expect(() => s.drawDynamic(ctx, 64, 64)).not.toThrow();
        });

        it('icon without dynamic handler is silently ignored', () => {
            const s = icon('i5', 10, 20, 64, 64, mockPage);
            s.iconName = 'plane';
            expect(() => s.drawDynamic(ctx, 64, 64)).not.toThrow();
        });
    });

    // ─── Default Properties ───────────────────────────────
    describe('icon default properties', () => {
        it('type is icon', () => {
            const s = icon('i6', 0, 0, 64, 64, mockPage);
            expect(s.type).toBe('icon');
        });

        it('default iconName is plane', () => {
            const s = icon('i7', 0, 0, 64, 64, mockPage);
            expect(s.iconName).toBe('plane');
        });

        it('editable is false', () => {
            const s = icon('i8', 0, 0, 64, 64, mockPage);
            expect(s.editable).toBe(false);
        });
    });
});
