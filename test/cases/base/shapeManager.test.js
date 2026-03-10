/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';
import {shapeManager} from '../../../core/base/shapeManager.js';

jest.mock('../../../core/history/commands.js', () => ({
    shapesIndexChangedCommand: jest.fn(() => ({execute: jest.fn()})),
}));

const mockPage = () => ({
    id: 'page-1',
    getMinIndex: () => 0,
    graph: {collaboration: {invoke: jest.fn()}},
});

const makeShape = (id, index, serializable = true) => ({
    id,
    index,
    serializable,
    invalidateAlone: jest.fn(),
    remove: jest.fn(),
});

describe('shapeManager', () => {
    let page;
    let sm;

    beforeEach(() => {
        page = mockPage();
        sm = shapeManager(page);
    });

    // ─── pushShape ───────────────────────────────────────────
    describe('pushShape', () => {
        it('serializable shape is added to shapes array with correct index', () => {
            const s = makeShape('s1', 0);
            sm.pushShape(s);
            expect(sm.shapes).toContain(s);
            expect(s.index).toBe(0);
        });

        it('non-serializable shape is added to unSerializableShapes', () => {
            const s = makeShape('s1', 0, false);
            sm.pushShape(s);
            expect(sm.unSerializableShapes).toContain(s);
            expect(s.index).toBeGreaterThanOrEqual(500);
        });
    });

    // ─── getShapeById ────────────────────────────────────────
    describe('getShapeById', () => {
        it('finds shape by existing id', () => {
            const s = makeShape('s2', 0);
            sm.pushShape(s);
            expect(sm.getShapeById('s2')).toBe(s);
        });

        it('returns undefined for non-existent id', () => {
            expect(sm.getShapeById('nonexistent')).toBeUndefined();
        });
    });

    // ─── containsById ───────────────────────────────────────
    describe('containsById', () => {
        it('returns true when shape exists', () => {
            const s = makeShape('s3', 0);
            sm.pushShape(s);
            expect(sm.containsById('s3')).toBe(true);
        });

        it('returns false when shape does not exist', () => {
            expect(sm.containsById('missing')).toBe(false);
        });
    });

    // ─── getShapeCount ──────────────────────────────────────
    describe('getShapeCount', () => {
        it('counts only serializable shapes', () => {
            sm.pushShape(makeShape('a', 0));
            sm.pushShape(makeShape('b', 0, false));
            expect(sm.getShapeCount()).toBe(1);
        });
    });

    // ─── clear ──────────────────────────────────────────────
    describe('clear', () => {
        it('shapes and shapeMap are empty after clear', () => {
            sm.pushShape(makeShape('c1', 0));
            sm.pushShape(makeShape('c2', 0, false));
            sm.clear();
            expect(sm.shapes.length).toBe(0);
            expect(sm.unSerializableShapes.length).toBe(0);
            expect(sm.shapeMap.size).toBe(0);
        });
    });

    // ─── getShapeIndex ──────────────────────────────────────
    describe('getShapeIndex', () => {
        it('corrects mismatched index', () => {
            const s = makeShape('d1', 99);
            sm.pushShape(s);
            expect(sm.getShapeIndex(s)).toBe(0);
            expect(s.index).toBe(0);
        });
    });

    // ─── writer.moveTop / moveBottom ────────────────────────
    describe('writer moveTop / moveBottom (B-01 regression)', () => {
        it('moveTop: minIndex calculation for multiple shapes is not NaN', () => {
            const s1 = makeShape('e1', 0);
            const s2 = makeShape('e2', 1);
            const s3 = makeShape('e3', 2);
            sm.pushShape(s1);
            sm.pushShape(s2);
            sm.pushShape(s3);

            sm.updateShapes(w => {
                w.moveTop([s1, s2]);
            });

            expect(sm.shapes[sm.shapes.length - 2].id).toBeDefined();
            expect(sm.shapes[sm.shapes.length - 1].id).toBeDefined();
        });

        it('moveBottom: maxIndex calculation for multiple shapes is not NaN', () => {
            const s1 = makeShape('f1', 0);
            const s2 = makeShape('f2', 1);
            const s3 = makeShape('f3', 2);
            sm.pushShape(s1);
            sm.pushShape(s2);
            sm.pushShape(s3);

            sm.updateShapes(w => {
                w.moveBottom([s2, s3]);
            });

            expect(sm.shapes[0].id).toBeDefined();
            expect(sm.shapes[1].id).toBeDefined();
        });
    });

    // ─── writer.moveUp / moveDown ───────────────────────────
    describe('writer moveUp / moveDown', () => {
        it('moveUp: last shape cannot move further up', () => {
            const s1 = makeShape('g1', 0);
            const s2 = makeShape('g2', 1);
            sm.pushShape(s1);
            sm.pushShape(s2);
            const beforeIndex = s2.index;

            sm.updateShapes(w => w.moveUp([s2]));
            expect(s2.index).toBe(beforeIndex);
        });

        it('moveDown: first shape cannot move further down', () => {
            const s1 = makeShape('h1', 0);
            const s2 = makeShape('h2', 1);
            sm.pushShape(s1);
            sm.pushShape(s2);

            sm.updateShapes(w => w.moveDown([s1]));
            expect(s1.index).toBe(0);
        });
    });
});
