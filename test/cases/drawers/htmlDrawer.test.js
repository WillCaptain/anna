/*---------------------------------------------------------------------------------------------
 *  Copyright (c) 2026 12th.ai Studio. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'core-js/stable';
import '../../__mocks__/client.js';
import '../../../common/extensions/arrayExtension.js';
import '../../../common/extensions/stringExtension.js';

jest.mock('../../../core/utils/guideLineUtil.js', () => ({guideLineUtil: jest.fn()}));
jest.mock('../../../core/interaction/hitRegion.js', () => ({}));

const makeShape = (overrides = {}) => ({
    id: 'shape-test',
    x: 10, y: 20, width: 100, height: 50,
    borderWidth: 1,
    borderColor: '#000',
    backColor: '#fff',
    backAlpha: 1,
    globalAlpha: 1,
    fontSize: 14,
    fontColor: '#000',
    fontFace: 'Arial',
    fontStyle: 'normal',
    fontWeight: 'normal',
    hAlign: 'center',
    vAlign: 'center',
    lineHeight: 1.5,
    cornerRadius: 0,
    dashWidth: 0,
    rotateDegree: 0,
    text: 'test',
    hideText: false,
    serializable: true,
    type: 'rectangle',
    page: {
        id: 'p1',
        mode: 'CONFIGURATION',
        x: 0, y: 0, scaleX: 1, scaleY: 1,
    },
    get: jest.fn((key) => overrides[key]),
    getBorderColor: jest.fn(() => '#000'),
    ...overrides,
});

describe('htmlDrawer - unit tests', () => {
    it('basic environment check', () => {
        expect(document).toBeDefined();
        expect(typeof document.createElement).toBe('function');
    });

    it('DOM createElement works correctly', () => {
        const div = document.createElement('div');
        expect(div.tagName).toBe('DIV');
    });
});
