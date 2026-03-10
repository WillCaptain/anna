/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';

jest.mock('../../../core/history/commands.js', () => ({
    addCommand: jest.fn(),
    layoutCommand: jest.fn(() => ({execute: jest.fn()})),
    positionCommand: jest.fn(() => ({execute: jest.fn()})),
}));

import {annaWriter} from '../../../core/base/writer.js';
import {addCommand, layoutCommand, positionCommand} from '../../../core/history/commands.js';

const makeShape = (overrides = {}) => ({
    id: 'shape-1',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    invalidateAlone: jest.fn(),
    initConnectors: jest.fn(),
    ...overrides,
});

const makePage = (shapes = []) => {
    const page = {
        id: 'page-1',
        type: 'page',
        createNew: jest.fn((type, x, y, _, props) => makeShape({type, x, y})),
        getFocusedShapes: jest.fn(() => []),
        sm: {updateShapes: jest.fn()},
    };
    return page;
};

const makeGraph = (page) => ({
    id: 'graph-1',
    activePage: page,
    pages: [page],
    addPage: jest.fn(),
    changePageIndex: jest.fn(),
    getPageIndex: jest.fn(() => 0),
    deletePages: jest.fn(),
    setProperty: jest.fn(),
    change: jest.fn(fn => fn()),
    collaboration: {invoke: jest.fn()},
});

describe('annaWriter', () => {
    let page;
    let graph;
    let writer;

    beforeEach(() => {
        jest.clearAllMocks();
        page = makePage();
        graph = makeGraph(page);
        writer = annaWriter(graph);
    });

    // ─── newShapes ────────────────────────────────────────
    describe('newShapes()', () => {
        it('returns empty result when given empty array', () => {
            const result = writer.newShapes([]);
            expect(result).toEqual([]);
            expect(addCommand).not.toHaveBeenCalled();
        });

        it('creates shapes from valid shape data', () => {
            const result = writer.newShapes([
                {type: 'rectangle', properties: {x: 10, y: 20}},
            ]);
            expect(result.length).toBe(1);
            expect(addCommand).toHaveBeenCalledTimes(1);
        });

        it('items without type are filtered out (B-11 regression)', () => {
            const result = writer.newShapes([
                {properties: {x: 0, y: 0}},
                {type: 'rectangle', properties: {x: 10, y: 10}},
            ]);
            expect(result.length).toBe(1);
            const call = addCommand.mock.calls[0];
            const shapeArgs = call[1];
            expect(shapeArgs.every(a => a.shape !== undefined)).toBe(true);
        });

        it('items without properties are filtered out (B-11 regression)', () => {
            const result = writer.newShapes([
                {type: 'rectangle'},
                {type: 'ellipse', properties: {x: 0, y: 0}},
            ]);
            expect(result.length).toBe(1);
        });
    });

    // ─── setShapeAttributes ──────────────────────────────
    describe('setShapeAttributes()', () => {
        it('does nothing when shape is null', () => {
            writer.setShapeAttributes(null, {width: 200});
            expect(layoutCommand).not.toHaveBeenCalled();
        });

        it('executes layoutCommand on valid shape', () => {
            const s = makeShape();
            writer.setShapeAttributes(s, {width: 200});
            expect(layoutCommand).toHaveBeenCalled();
        });
    });

    // ─── setShapePosition ────────────────────────────────
    describe('setShapePosition()', () => {
        it('does nothing when shape is null', () => {
            writer.setShapePosition(null, {x: 0, y: 0});
            expect(positionCommand).not.toHaveBeenCalled();
        });

        it('command is not executed when position is unchanged', () => {
            const s = makeShape({x: 10, y: 20});
            writer.setShapePosition(s, {x: 10, y: 20});
            expect(positionCommand).not.toHaveBeenCalled();
        });

        it('executes positionCommand when position changes', () => {
            const s = makeShape({x: 10, y: 20});
            writer.setShapePosition(s, {x: 50, y: 80});
            expect(positionCommand).toHaveBeenCalled();
        });
    });

    // ─── deletePages ─────────────────────────────────────
    describe('deletePages()', () => {
        it('does not call graph.deletePages when given empty array', () => {
            writer.deletePages([]);
            expect(graph.deletePages).not.toHaveBeenCalled();
        });

        it('calls graph.deletePages with valid pageIds', () => {
            writer.deletePages(['p1', 'p2']);
            expect(graph.deletePages).toHaveBeenCalledWith(['p1', 'p2']);
        });
    });
});
