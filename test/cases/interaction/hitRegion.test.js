/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../../common/extensions/arrayExtension.js';

jest.mock('../../../core/history/commands.js', () => ({
    lockCommand: jest.fn(() => ({execute: jest.fn()})),
    priorityCommand: jest.fn(() => ({execute: jest.fn()})),
}));

import {
    countRegion,
    lockRegion,
    priorityRegion,
} from '../../../core/interaction/hitRegion.js';

const makeShape = (overrides = {}) => ({
    id: 'shape-1',
    x: 10, y: 20, width: 100, height: 50,
    borderWidth: 1,
    rotateDegree: 0,
    type: 'rectangle',
    locked: false,
    priority: 0,
    regions: [],
    page: {id: 'page-1', mode: 'CONFIGURATION', graph: {id: 'g1'}},
    get: jest.fn(k => overrides[k]),
    getContainer: jest.fn(() => null),
    addRegion: jest.fn(function(region) { this.regions.push(region); }),
    getVisibility: jest.fn(() => true),
    invalidateAlone: jest.fn(),
    ...overrides,
});

const makeCtx = () => ({
    canvas: {width: 200, height: 100, style: {}},
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    clearRect: jest.fn(),
    scale: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
});

describe('countRegion', () => {
    it('countRegion is created successfully', () => {
        const shape = makeShape();
        const region = countRegion(shape);
        expect(region).toBeDefined();
        expect(typeof region.isType).toBe('function');
    });

    it('isType returns a boolean', () => {
        const shape = makeShape();
        const region = countRegion(shape);
        const result = region.isType('countRegion');
        expect(typeof result).toBe('boolean');
    });
});

describe('lockRegion', () => {
    it('lockRegion is created successfully', () => {
        const shape = makeShape();
        const region = lockRegion(shape);
        expect(region).toBeDefined();
    });

    it('draw method call works without error', () => {
        const shape = makeShape({
            page: {id: 'page-1', mode: 'CONFIGURATION', graph: {id: 'g1'}, scaleX: 1, scaleY: 1},
        });
        const region = lockRegion(shape);
        region.context = makeCtx();
        expect(() => region.draw(10, 20)).not.toThrow();
    });
});

describe('priorityRegion', () => {
    it('priorityRegion is created successfully', () => {
        const shape = makeShape();
        const region = priorityRegion(shape);
        expect(region).toBeDefined();
    });
});
