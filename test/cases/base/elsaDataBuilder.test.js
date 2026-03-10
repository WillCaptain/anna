/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import {graphBuilder} from '../../../core/utils/annaDataBuilder.js';

describe('graphBuilder', () => {
    let builder;

    beforeEach(() => {
        builder = graphBuilder();
    });

    // ─── new graph ────────────────────────────────────────
    describe('new()', () => {
        it('returns a graph object with type and id set', () => {
            const g = builder.new('graph', 'g-001');
            expect(g.type).toBe('graph');
            expect(g.id).toBe('g-001');
            expect(Array.isArray(g.pages)).toBe(true);
        });

        it('properties contain default setting values', () => {
            const g = builder.new('graph', 'g-002');
            expect(g.properties.setting).toBeDefined();
            expect(g.properties.setting.borderWidth).toBe(1);
        });
    });

    // ─── addPage (B-03 regression) ───────────────────────
    describe('addPage() - B-03 regression', () => {
        it('addPage works without ReferenceError on graph type', () => {
            const g = builder.new('graph', 'g-003');
            expect(() => g.addPage('page-1')).not.toThrow();
        });

        it('added page is included in pages array', () => {
            const g = builder.new('graph', 'g-004');
            g.addPage('p-001');
            expect(g.pages.length).toBe(1);
            expect(g.pages[0].id).toBe('p-001');
        });

        it('frame is set on page', () => {
            const g = builder.new('graph', 'g-005');
            const page = g.addPage('p-002');
            expect(page.frame).toBe('p-002');
        });
    });

    // ─── Proxy setter ─────────────────────────────────────
    describe('Proxy setter (B-02 regression)', () => {
        it('type property is set when setType is called', () => {
            const g = builder.new('graph', 'g-006');
            g.setType('newType');
            expect(g.type).toBe('newType');
        });

        it('title property is set when setTitle is called', () => {
            const g = builder.new('graph', 'g-007');
            g.setTitle('My Graph');
            expect(g.title).toBe('My Graph');
        });
    });

    // ─── addShape ─────────────────────────────────────────
    describe('addShape()', () => {
        it('can add shape to page', () => {
            const g = builder.new('graph', 'g-008');
            const page = g.addPage('p-003');
            const shape = page.addShape('rectangle', 's-001');
            expect(page.shapes).toContain(shape);
            expect(shape.properties.type).toBe('rectangle');
        });
    });

    // ─── toData ──────────────────────────────────────────
    describe('toData()', () => {
        it('serializes full graph data to plain object', () => {
            const g = builder.new('graph', 'g-009');
            const page = g.addPage('p-004');
            page.addShape('rectangle', 's-002');
            const data = g.toData();
            expect(data.type).toBe('graph');
            expect(Array.isArray(data.pages)).toBe(true);
            expect(data.pages[0].shapes.length).toBe(1);
        });
    });
});
